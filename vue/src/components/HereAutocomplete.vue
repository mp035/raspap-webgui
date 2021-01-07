<template>
  <v-autocomplete
    v-model="model.values.address_search"
    :items="items"
    :loading="isLoading"
    :search-input.sync="search"
    item-text="Description"
    item-value="id"
    label="Address Search"
    :prepend-icon="prependIcon"
    placeholder="Just start typing the address here."
    return-object
    @change="itemSelected"
  ></v-autocomplete>
</template>

<script>
import geoFunctions from "../mixins/geo-functions";

export default {
  mixins: [geoFunctions],
  data: () => ({
    descriptionLimit: 60,
    entries: [],
    isLoading: false,
    queuedSearch: "",
    search: null,
  }),
  props: {
    model: Object,
    prependIcon: {
      type: String,
      default: "mdi-database-search",
    },
    updateAddressFields: false,
  },
  computed: {
    items() {
      return this.entries.map((entry) => {
        let Description = entry.title;
        Description =
          Description.length > this.descriptionLimit
            ? Description.slice(0, this.descriptionLimit) + "..."
            : Description;

        return Object.assign({}, entry, { Description });
      });
    },
  },
  methods: {
    itemSelected(evt) {
      // a here maps location was selected, so
      // do a lookup by id to get the details
      // if required.

      if (this.updateAddressFields) {
        this.getMapToken().then((token) => {
          let headers = {
            Authorization: "Bearer " + token,
            Accept: "application/json",
          };

          var options = {
            method: "GET",
            headers: headers,
          };

          this.isLoading = true;

          fetch(
            `https://lookup.search.hereapi.com/v1/lookup?id=${encodeURI(
              evt.id
            )}`,
            options
          )
            .then((res) => res.json())
            .then((res) => {
              let l = res.address;
              this.model.values.city = l.district ? l.district : l.city;
              //this.model.values.country = l.Countr;
              //this.model.values.district = l.District;
              //this.model.values.house_number = l.HouseNumber;
              //this.model.values.street = l.Street;
              this.model.values.address =
                (l.houseNumber ? l.houseNumber + " " : "") + l.street;
              this.model.values.postcode = l.postalCode;
              this.model.values.state = l.state;
              this.model.values.longitude = res.position.lng;
              this.model.values.latitude = res.position.lat;
              this.$emit("update:address_search", {
                id: res.id,
                longitude: res.position.lng,
                latitude: res.position.lat,
              });
            })
            .catch((err) => {
              console.log(err);
            })
            .finally(() => {
              this.isLoading = false;
            });
        });
      } else {
        // if we don't need to update the address of the form,
        // then just emit an event with latitude, longitude and id.
        this.$emit("update:address_search", {
          id: evt.id,
          longitude: evt.position.lng,
          latitude: evt.position.lat,
        });

        // also fill the available details in on the model,
        // note that we use "location_id" instead of "id"
        // to prevent collisions with the database id on
        // the form (if present)
        this.model.values.longitude = evt.position.lng;
        this.model.values.latitude = evt.position.lat;
        this.model.values.location_id = evt.id;
      }
      // ------------------------------------------------------------------------------------------------------
    },
    doSearch(val) {
      // val is empty
      if (!val) return;

      // val is too short to match
      if (val.length < 5) return;

      // Items have already been requested
      if (this.isLoading) {
        this.queuedSearch = val; // this function will be called again with queuedSearch as the value.
        return;
      }

      // replace spaces with "+" symbols (I think this is api specific)
      let uriVal = val.replace(/\s+/g, "+");
      // endode as uri
      uriVal = encodeURI(uriVal);

      this.getMapToken().then((token) => {
        let headers = {
          Authorization: "Bearer " + token,
          Accept: "application/json",
        };

        var options = {
          method: "GET",
          headers: headers,
        };

        this.isLoading = true;

        // default location to the center of Australia AUS if no data is available
        // KEEP text AUS Australia here in comments in case we need to internationalise.
        //let lat = this.model.values.latitude || -25.2744;
        //let lon = this.model.values.longitude || 133.7751;
        // go closer to the eastern sea board:
        let lat = this.model.values.latitude || -30.0;
        let lon = this.model.values.longitude || 150.0;

        // Lazily load input items
        // the geocode endpoint works, but is slower, and does not allow for location hinting.
        //fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${uriVal}`, options)
        fetch(
          `https://geocode.search.hereapi.com/v1/autosuggest?at=${encodeURI(
            lat + "," + lon
          )}&q=${uriVal}`,
          options
        )
          .then((res) => res.json())
          .then((res) => {
            if (res.items.length) {
              this.entries = res.items;
            } else {
              console.log(res);
            }

            return;

            // if there is exactly 1 entry in the autocomplete results,
            // and it is perfect quality then treat it as selected
            if (this.entries.length == 1) {
              const q = this.entries[0].MatchQuality;
              if (
                q.Country === 1 &&
                q.District === 1 &&
                q.HouseNumber === 1 &&
                q.PostalCode === 1 &&
                q.State === 1 &&
                q.Street.length === 1 &&
                q.Street[0] === 1
              ) {
                this.itemSelected(this.entries[0]);
              }
            }
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            this.isLoading = false;
            // add another call to this function to the event queue
            // if a search has come in since we started.
            if (this.queuedSearch != "") {
              window.setTimeout(this.doSearch(this.queuedSearch), 0);
              this.queuedSearch = "";
            }
          });
      });
    },
  },
  watch: {
    search(newVal) {
      this.doSearch(newVal);
    },
  },
};
</script>
