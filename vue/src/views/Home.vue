<template>
  <v-app class="bgImage">
    <m-errorbox ref="errorBox"></m-errorbox>
    <navbar :show-back-button="false" :show-refresh-button="false">
      <v-avatar class="mr-7">
        <v-img src="/img/logo_white.svg"></v-img>
      </v-avatar>
      <v-toolbar-title class="white--text">
        <span
          class="font-weight-light"
        >Smart</span>
        <span
          class="font-weight-medium"
        >Node</span>
      </v-toolbar-title>
    </navbar>
    <v-content class="secondary--text text--darken-2">
      <v-container fluid class="fill-height d-flex justify-space-around flex-wrap">
        <v-card
          v-for="(v, k) in drawerItems"
          :key="k"
          class="pa-2 primary secondary--text text--darken-3 homeCard"
          :class="{unavailable:false}"
          tile
          link
          @click="
            () => {
              if (v.action) v.action(v);
            }
          "
        >
          <v-card-title class="justify-center">
            <v-avatar class="white"  size="76">
              <v-avatar class="secondary lighten-5" size="70">
                <v-icon large class="display-2">{{ v.icon }}</v-icon>
              </v-avatar>
            </v-avatar>
          </v-card-title>
          <v-card-text class="justify-center text-center subtitle-1 white--text">{{ v.title }}</v-card-text>
          <v-avatar
            v-if="v.groupIcon"
            class="white"
            size="44"
            style="position:absolute;top:17px;left:17px;border-bottom-left-radius:50%;border-bottom-right-radius:50%;"
          >
            <v-avatar class="secondary lighten-5" size="38">
              <v-icon>{{ v.groupIcon }}</v-icon>
            </v-avatar>
          </v-avatar>
        </v-card>
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
