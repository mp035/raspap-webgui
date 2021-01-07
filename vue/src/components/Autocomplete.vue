<template>
  <v-autocomplete
    v-model="model.values[name]"
    :items="items"
    :loading="isLoading"
    @update:search-input="onSearch"
    :search-input="model.values[modelTextField]"
    :label="label"
    :prepend-icon="prependIcon"
    :rules="model.rules[name] ? model.rules[name](model) : []"
    placeholder="Start typing to search..."
    return-object
    @change="itemSelected"
    :error-messages="model.validation[name]"
  ></v-autocomplete>
</template>

<script>
import apiRequest from "../mixins/api-request";

export default {
  mixins: [apiRequest],
  data: () => ({
    descriptionLimit: 60,
    entries: {},
    queuedSearch: "",
    isLoading: false,
    search: null
  }),
  props: {
    model: Object,
    modelTextField: String,
    prependIcon: {
      type: String,
      default: "mdi-database-search"
    },
    label: String,
    name: String,
    endpoint: Array, // the api endpoint for autocomplete info
    params: {
      // any required endpoint route params (not query params)
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    minLength: {
      type: Number,
      default: 3
    }
  },
  computed: {
    items() {
      if (
        Object.keys(this.entries).length == 0 &&
        this.model.values[this.name] &&
        this.model.values[this.modelTextField]
      ) {
        return [
          {
            value: this.model.values[this.name],
            text: this.model.values[this.modelTextField]
          }
        ];
      }

      return Object.keys(this.entries).map(key => {
        let text = this.entries[key];
        text =
          text.length > this.descriptionLimit
            ? text.slice(0, this.descriptionLimit) + "..."
            : text;

        return { text, value: key };
      });
    }
  },
  methods: {
    itemSelected(evt) {
      Vue.set(this.model.values, this.name, evt.value);
      Vue.set(this.model.values, this.modelTextField, evt.text);
    },
    onSearch(val) {
      if (val === null || val === this.model.values[this.modelTextField]) {
        // if the search value is the same as the selected value,
        // or is null,
        // do nothing.
        return;
      }

      Vue.set(this.model.values, this.name, null);
      Vue.set(this.model.values, this.modelTextField, val);

      // val is empty
      if (!val) return;

      // val is too short to match
      if (val.length < this.minLength) return;

      // Items have already been requested,
      // so queue the newest value and
      // this function will schedule another search after
      // the last search finishes.
      if (this.isLoading) {
        this.queuedSearch = val;
        return;
      }

      this.isLoading = true;

      this.apiRequest(this.endpoint, this.params, { autocomplete: val })
        .then(r => {
          if (this.statusOk(r.status)) {
            if (Object.keys(r.body).length) {
              this.entries = r.body;
            } else {
              this.entries = {};
            }
          } else {
            this.showError(
              "(" +
                r.status +
                ") " +
                (r.body.message ||
                  "Unsupported autocomplete response from server.")
            );
          }
        })
        .catch(err => {
          console.error(err);
        })
        .finally(() => {
          this.isLoading = false;
          // add another call to this function to the event queue
          // if a search has come in since we started.
          if (this.queuedSearch != "") {
            window.setTimeout(this.onSearch(this.queuedSearch), 0);
            this.queuedSearch = "";
          }
        });
    }
  }
};
</script>
