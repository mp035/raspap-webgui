<template>
  <v-app class="bgImage">
    <m-errorbox ref="errorBox"></m-errorbox>

    <navbar :show-refresh-button="false">
      <v-toolbar-title class="white--text">
        <span
          class="font-weight-medium"
        >Admin </span>
        <span
          class="font-weight-light"
        > (Wifi) Interface Settings</span>
      </v-toolbar-title>
    </navbar>
    <v-content class="secondary--text text--darken-2">
      <v-container fluid class="fill-height d-flex justify-space-around flex-wrap">

        <h1> Admin Page </h1>


      </v-container>
    </v-content>
  </v-app>
</template>

<script>
//import apiEndpoints from "../mixins/api-endpoints";
//import apiRequest from "../mixins/api-request";

export default {
  //mixins: [apiEndpoints, apiRequest],
  data() {
    //let userData = this.loadToken(); // can not access computed properties in data() so load the token manually.
    let drawerItems = [
      {
        title: "Local Internet",
        icon: "mdi-wifi",
        availableOffline: true,
        action: () => {
          this.$router.push("local");
        }
      },
      {
        title: "Cellular",
        icon: "mdi-signal",
        availableOffline: true,
        action: () => {
          this.$router.push("cellular");
        }
      },

      {
        title: "Admin",
        icon: "mdi-cellphone-wireless",
        availableOffline: false,
        action: () => {
          this.$router.push("admin");
        }
      },
      /*
      {
        title: "Add Device",
        icon: "mdi-eight-track",
        groupIcon: "mdi-plus",
        availableOffline: false,
        action: () => {
          this.$router.push("add_device");
        }
      },
      {
        title: "Search Logs",

        icon: "mdi-map-search",
        availableOffline: false,
        action: () => {
          this.$router.push("search_logs");
        }
      },
      {
        title: "Users",
        icon: "mdi-account",
        availableOffline: false,
        action: () => {
          this.$router.push("users");
        }
      },
      {
        title: "Groups",
        icon: "mdi-account-group",
        availableOffline: false,
        action: () => {
          this.$router.push("groups");
        }
      }
      */
    ];
    
    return { drawerItems };
  },
  created() {
    //this.pollCloudServer();
  },
  methods: {
    showError(message) {
      this.$refs.errorBox.showError(message);
    },
    /*
    pollCloudServer() {
      // just polls the myDevices endpoint to check whether we are online.
      // only re-run the polling loop whilst we are on the same route.
      if (this.$router.currentRoute.name == "home") {
        this.apiRequest(this.apiEndpoints.myDevices).finally(r => {
          setTimeout(this.pollCloudServer, 10000);
        });
      }
    }
    */
  }
};
</script>

<style>
.homeCard {
  width: 150px;
  height: 150px;
  margin: 20px;
}

.unavailable {
  opacity: 0.2;
  cursor: not-allowed;
}
</style>
