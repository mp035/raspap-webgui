<template>
  <v-card>
    <m-errorbox ref="errorBox"></m-errorbox>
    <v-card-text v-if="showCreateForm">
      <v-row align="center">
        <v-col sm="auto">
          <v-btn outlined color="primary" type="button" @click="showCreateForm = !showCreateForm">
            <v-icon left>mdi-arrow-left</v-icon>
            Close
          </v-btn>
        </v-col>
        <v-col>
          <h2 class="text-uppercase">Create New {{ collection.meta.collection_name }}</h2>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-else>
      <form @submit.prevent="onSearchClick">
        <v-row align="end" justify="start">
          <v-col md="6" lg="3">
            <v-text-field
              v-model="search"
              label="Search"
              single-line
              hide-details
              clearable
              @click:clear="onSearchClear"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-btn outlined color="primary" type="submit">
              Search
              <v-icon right>mdi-magnify</v-icon>
            </v-btn>
          </v-col>
          <v-col v-if="createEndpoint !== null" style="text-align:right;">
            <v-btn outlined color="primary" type="button" @click="showCreateForm = true">
              New
              <v-icon right>mdi-plus-circle</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </form>
    </v-card-text>

    <v-card-text v-if="showCreateForm" v-show="!displaySuccess">
      <m-form
        v-slot="{model}"
        :query="createEndpoint"
        :rules="validationRules"
        :modelSrc="defaultModel"
        @success="onCreateSuccess"
        @success-complete="onCreateSuccessComplete"
        @cancel="showCreateForm = false"
        class="ma-5"
        lazy-validation
      >
        <slot name="create-form" v-bind:model="model">
          <!-- form components for the create form can be placed here.
          They work the same as controls in the apiform-->
        </slot>

        <v-row>
          <m-submit label="Create" :model="model"></m-submit>
          <v-btn text color="primary" class="mb-3" @click="model.onFormCancel()">Cancel</v-btn>
        </v-row>
      </m-form>
    </v-card-text>
    <v-card-text v-if="showCreateForm && displaySuccess">
      <v-list-item one-line>
        <v-list-item-avatar color="primary" left>
          <v-icon size="24">mdi-check-bold</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>New {{ collection.meta.collection_name }} Successfully Created!</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>

    <v-card-text v-show="!showCreateForm">
      <v-data-table
        :headers="collection.meta.headers"
        :items="collection.data"
        :server-items-length="collection.meta.total"
        :loading="collection.loading"
        :page="collection.meta.current_page"
        @update:page="onPageChange"
        :items-per-page="collection.meta.per_page"
        @update:items-per-page="onItemsPerPageChange"
        :footer-props="{ itemsPerPageOptions: [10,15,30,50,100] }"
        @click:row="onRowClicked"
        show-expand
        single-expand
        :expanded="expandedRows"
      >

        <template v-slot:item.data-table-expand="{isExpanded}">
          <v-icon size="48" :color="displayDelete ? 'error' : 'primary'" v-if="isExpanded">mdi-arrow-right-bold</v-icon>
          <v-icon v-else>{{expandIcon}}</v-icon>
        </template>

        <template v-if="(deleteEndpoint !== null) || (updateEndpoint != null)" v-slot:expanded-item="{ headers, item }">
          <td :colspan="headers.length" v-if="displaySuccess">
            <v-list-item one-line>
              <v-list-item-avatar color="primary" size="36" left>
                <v-icon size="24">mdi-check-bold</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>Update Success</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </td>
          <td :colspan="headers.length" v-else-if="displayDelete">
            <v-list-item one-line>
              <v-list-item-avatar color="error" size="36" left>
                <v-icon size="24">mdi-help</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>Are you sure you want to delete this {{collection.meta.collection_name}}?</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                  <v-btn color="error" class="ml-3" @click="onFormDelete(item.id)">Delete It</v-btn>
              </v-list-item-action>
              <v-list-item-action>
                  <v-btn class="ml-3" @click="displayDelete = false; expandedRows = [];">Cancel</v-btn>
              </v-list-item-action>

            </v-list-item>
          </td>
          <td :colspan="headers.length" v-if="updateEndpoint !== null" v-show="!(displaySuccess || displayDelete)">
            <m-form
              v-slot="{model}"
              :query="updateEndpoint"
              :params="[item.id]"
              :rules="validationRules"
              :modelSrc="item"
              @success="onUpdateSuccess"
              @success-complete="onUpdateSuccessComplete"
              @cancel="onFormCancel"
              class="ma-5"
              lazy-validation
            >
              <slot name="update-form" v-bind:model="model">
                <!-- form components for the update form can be placed here.
                They work the same as controls in the apiform-->
              </slot>

              <v-row>
                <v-col>
                  <m-submit :label="updateButtonText" :model="model"></m-submit>
                  <v-btn class="mb-3 ml-3" @click="model.onFormCancel()">Cancel</v-btn>
                </v-col>
                <v-col v-if="deleteEndpoint !== null" class="text-right">
                  <v-btn color="error" class="mb-3" @click="displayDelete = true"><v-icon left>mdi-trash-can</v-icon> Delete {{ collection.meta.collection_name }}</v-btn>
                </v-col>
              </v-row>
            </m-form>
          </td>
          <td :colspan="headers.length" v-else-if="(deleteEndpoint !== null) && !displayDelete">
            <v-list-item>
              <v-list-item-action>
                <v-btn color="error" @click="displayDelete = true"><v-icon left>mdi-trash-can</v-icon> Delete {{ collection.meta.collection_name }}</v-btn>
              </v-list-item-action>
            </v-list-item>
          </td>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
import apiRequest from "../mixins/api-request";
import apiEndpoints from "../mixins/api-endpoints";
import formatDate from "../mixins/format-date";

export default {
  mixins: [apiRequest, apiEndpoints, formatDate],
  props: {
    validationRules: {type:Object, default:()=>{}},
    createEndpoint: {type:Array, default:null},
    updateEndpoint: {type:Array, default:null},
    indexEndpoint: Array,
    deleteEndpoint: {type:Array, default:null},
    prepareModel: Function,
    defaultModel: {
      type: Object,
      default: function() {
        return {};
      }
    },
    expandIcon:{type:String, default:'mdi-pencil-circle'},
    updateButtonText:{type:String, default:'Update'}
    /*
    collectionName: {
      type: String,
      default: "Item"
    }
    */
  },
  data() {
    return {
      collection: {
        data: [],
        meta: {
          curent_page: 1,
          last_page: 1,
          headers: [],
          per_page: 10,
          collection_name:"Item",
        },
        loading: true
      },
      search: "",
      expandedRows: [],
      displaySuccess: false,
      displayDelete: false,
      newItem: {
        /*
        user_name: "Mark Pointing New Group",
        email:"newuser@newgroup.org",
        group_name:"New Group Test",
        description:"Description for new group.",
        billing_email: "billing@newgroup.org",
        active: true,
        */
      },
      showCreateForm: false
    };
  },
  mounted() {
    this.loadCollection(
      this.collection.meta.per_page,
      this.collection.meta.current_page
    );
  },
  methods: {
    showError(message) {
      this.$refs.errorBox.showError(message);
    },
    onPageChange(newPage) {
      this.loadCollection(this.collection.meta.per_page, newPage);
    },
    onItemsPerPageChange(itemsPerPage) {
      this.loadCollection(itemsPerPage, 1);
    },
    onSearchClick() {
      this.loadCollection(this.collection.meta.per_page, 1);
    },
    onSearchClear() {
      this.search = "";
      this.loadCollection(this.collection.meta.per_page, 1);
    },
    onRowClicked(row) {
      if (this.expandedRows[0] == row) {
        this.expandedRows = [];
      } else {
        this.expandedRows = [row];
      }
      this.displayDelete = false;
      this.displaySuccess = false;
    },
    onCreateSuccess(body) {
      this.displaySuccess = true;
      Vue.set(this, "collection", body);
      this.collection.data.forEach((value, index) => {
        this.prepareModel(value);
      });
      this.collection.meta.per_page = parseInt(this.collection.meta.per_page);
      this.collection.meta.current_page = parseInt(
        this.collection.meta.current_page
      );
    },
    onCreateSuccessComplete(body) {
      this.displaySuccess = false;
      this.showCreateForm = false;
      this.$emit("create-success-complete", body)
    },
    onUpdateSuccess(body) {
      let newItem = body.data;
      this.displaySuccess = true;
      this.prepareModel(newItem);
      let index = this.collection.data.findIndex(val => val.id == newItem.id);
      if (index >= 0) {
        Vue.set(this.collection.data, index, newItem);
      }
      this.$emit("update-success", body)
    },
    onUpdateSuccessComplete(body) {
      this.expandedRows = [];
      this.displaySuccess = false;
      this.$emit("update-success-complete", body)
    },
    onFormCancel(evt) {
      this.expandedRows = [];
    },
    onFormDelete(id) {
      this.loadCollection(
        this.collection.meta.per_page,
        this.collection.meta.current_page,
        id
      );
    },

    // IMPORTANT!!! setting the itemIdToDelete Parameter will create a delete
    // request instead of an index request
    loadCollection(itemsPerPage, pageNumber, itemIdToDelete) {
      this.collection.loading = true;
      this.expandedRows = [];
      this.displaySuccess = false;
      this.displayDelete = false;

      var queryParams = {
        per_page: itemsPerPage,
        page: pageNumber
      };

      console.log("this.search", this.search);
      if (this.search) {
        queryParams.search_term = this.search;
      }

      let endpoint = this.indexEndpoint;
      if (itemIdToDelete != null) {
        endpoint = this.deleteEndpoint;
      }

      this.apiRequest(endpoint, itemIdToDelete, queryParams)
        .then(r => {
          if (this.statusOk(r.status)) {
            Vue.set(this, "collection", r.body);
            this.collection.data.forEach((value, index) => {
              this.prepareModel(value);
            });
            this.collection.meta.per_page = parseInt(
              this.collection.meta.per_page
            );
            this.collection.meta.current_page = parseInt(
              this.collection.meta.current_page
            );
          } else {
            this.showError("Error fetching data from server");
            console.error(
              "Error fetching data from server: ",
              r.body.message ||
                `No Error Message Returned! (Status ${r.status})`
            );
          }
        })
        .catch(err => console.error(err));
    }
  }
};
</script>
