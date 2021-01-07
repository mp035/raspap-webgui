<template>
  <div>
    <v-pagination
      v-if="collectionModel.meta.last_page > 1"
      v-model="collectionModel.meta.current_page"
      :length="collectionModel.meta.last_page"
      :total-visible="11"
      @input="onPageClick"
    ></v-pagination>

    <v-layout v-if="collectionModel.data.length" wrap align-content-start>
      <v-flex v-for="(item, index) in collectionModel.data" :key="item.id" xs6 sm6 md4 lg3>
        <slot
          name="default"
          v-bind:item="item"
          v-bind:index="index"
          v-bind:delete-item="deleteItem"
        ></slot>
      </v-flex>
    </v-layout>
    <v-row v-else>
      <v-col justify="center" align="center">
        <div v-if="initialLoad" class="text-center">
          <h2>
            <v-progress-circular indeterminate></v-progress-circular>
            {{loadingMessage}}
          </h2>
        </div>
        <h2 v-else-if="loadError" class="error--text">
          <v-icon color="error">mdi-alert</v-icon>
          {{errorMessage}}
        </h2>
        <h2 v-else class="secondary--text text--lighten-1">{{emptyMessage}}</h2>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import apiRequestMixin from "../mixins/api-request";
import apiEndpointsMixin from "../mixins/api-endpoints";

export default {
  mixins: [apiEndpointsMixin, apiRequestMixin],
  props: {
    emptyMessage: {
      type: String,
      default: "There is nothing in the collection."
    },
    errorMessage: {
      type: String,
      default: "Error loading data from server"
    },
    loadingMessage: {
      type: String,
      default: "Loading..."
    },
    indexEndpoint: Array,
    indexRouteArgs: { type: Array, default: null },
    deleteEndpoint: { type: Array, default: null },
    prepareItem: {
      type: Function,
      default: (val, idx) => {}
    },
    pollingInterval: {
      type: Number,
      default: 0
    },
    collection: {
      type: Object,
      default: null,
    }
  },
  data() {
    return {
      collectionModel:{
          data: [],
          meta: {
            curent_page: 1,
            last_page: 1,
            per_page:12,
          }
        },
      initialLoad: true,
      loadError: false,
      currentRoute: null
    };
  },
  methods: {
    onPageClick() {
      this.initialLoad = true;
      this.collectionModel.data = [];
      this.loadCollection(
        { page: this.collectionModel.meta.current_page, per_page: this.collectionModel.meta.per_page },
        this.indexEndpoint,
        this.indexRouteArgs
      );
    },
    loadCollection(
      optQueryParams,
      optEndpoint = this.indexEndpoint,
      optRouteArgs = null
    ) {
      var collectionPromise;
      if (optQueryParams != null) {
        collectionPromise = this.apiRequest(
          optEndpoint,
          optRouteArgs,
          optQueryParams
        );
      } else {
        collectionPromise = this.apiRequest(optEndpoint, optRouteArgs);
      }
      return collectionPromise
        .then(r => {
          if (!this.checkStatus(r, this.errorMessage)) {
            this.loadError = true;
          } else {
            this.loadError = false;
            this.initialLoad = false;

            this.collectionModel = r.body;
            this.collectionModel.data.forEach((value, index) => {
              this.prepareItem(value, index);
            });
            this.$emit("update:collection", this.collectionModel);
          }
        })
        .catch(() => {
          this.loadError = true;
        });
    },
    pollCollection() {
      // only re-run the polling loop whilst we are on the same route.
      if (this.$router.currentRoute.name == this.currentRoute) {
        this.loadCollection(
          { page: this.collectionModel.meta.current_page, per_page: this.collectionModel.meta.per_page },
          this.indexEndpoint,
          this.indexRouteArgs
        ).then(() => {
          setTimeout(this.pollCollection, this.pollingInterval);
        });
      }
    },
    deleteItem(item) {
      item = item.id || item; // if the argument has an id attribute, use it, otherwise assume we have been passed the id.
      return this.loadCollection({ per_page: this.collectionModel.meta.per_page }, this.deleteEndpoint, item);
    }
  },
  created() {
    this.currentRoute = this.$router.currentRoute.name;
    this.loadCollection({ per_page: this.collectionModel.meta.per_page }, this.indexEndpoint, this.indexRouteArgs).then(
      () => {
        if (this.pollingInterval > 0) {
          setTimeout(this.pollCollection, this.pollingInterval);
        }
      }
    );
  },
  watch:{
    collection(newVal){
      Vue.set(this, 'collectionModel', JSON.parse(JSON.stringify(this.collection)));
    },
  }
};
</script>
