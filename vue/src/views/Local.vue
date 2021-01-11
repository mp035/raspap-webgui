<template>
  <v-app class="bgImage">
    <m-errorbox ref="errorBox"></m-errorbox>

    <navbar :show-refresh-button="false">
      <v-toolbar-title class="white--text">
        <span
          class="font-weight-medium"
        >Local </span>
        <span
          class="font-weight-light"
        > Internet Connection (Wifi)</span>
      </v-toolbar-title>
    </navbar>
    <v-content class="secondary--text text--darken-2">
      <v-container fluid class="fill-height d-flex justify-space-around flex-wrap">

        <div>
          <v-layout v-if="networks.length" wrap align-content-start>
            <v-flex v-for="(item, index) in networks" :key="index" xs6 sm6 md4 lg3>
              <v-card class="ma-3">
                  <v-list-item three-line>
                    <v-list-item-avatar size="24" left>
                      <v-menu offset-y>
                        <template v-slot:activator="{ on }">
                          <v-icon v-on="on">mdi-trash-can</v-icon>
                        </template>
                        <v-list>
                          <v-list-item @click="console.log('deleteclick')">
                            <v-list-item-title>
                              <v-icon left class="red--text">mdi-alert-circle</v-icon>Remove from My Devices
                            </v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>{{item.SSID}}</v-list-item-title>
                      <v-list-item-subtitle v-if="item.online">ONLINE</v-list-item-subtitle>
                      <v-list-item-subtitle v-else>OFFLINE</v-list-item-subtitle>
                      <!-- eslint-disable-next-line -->
                      <v-list-item-subtitle>{{ item.last_contact.getFullYear() < 2001 ? "Never been online" : "Last Seen " + fullDateTime(item.last_contact)}}</v-list-item-subtitle>
                      <v-list-item-subtitle
                        v-if="lastDeviceLocation[index] && lastDeviceLocation[index].address"
                      >{{ lastDeviceLocation[index].address }}</v-list-item-subtitle>
                    </v-list-item-content>

                    <v-list-item-avatar
                      :color="item.online ? 'primary' : 'secondary'"
                      size="62"
                      right
                    >
                      <v-icon v-if="item.online" size="40">mdi-access-point-network</v-icon>
                      <v-icon v-else size="40">mdi-access-point-network-off</v-icon>
                    </v-list-item-avatar>
                  </v-list-item>
                </v-card>
            </v-flex>
          </v-layout>
          <v-row v-else>
            <v-col justify="center" align="center">
              <div v-if="initialLoad" class="text-center">
                <h2 class="primary--text">
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

      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import apiRequest from "../mixins/api-request";

export default {
  mixins: [apiRequest],
  data() {
    //let userData = this.loadToken(); // can not access computed properties in data() so load the token manually.
    return {
      networks:[],
      initialLoad : true,
      loadError : false,
      errorMessage : null,
      loadingMessage: "Fetching Wifi Network List..."
    };
  },
  created() {
    this.getNetworks();
  },
  methods: {
    showError(message) {
      this.$refs.errorBox.showError(message);
    },
    getNetworks() {
      this.apiRequest("GET", "list_aps.php").then(r => {
        console.log(r);
        this.networks = r.body.networks;
        console.log(this.networks);
        console.log(this.networks.length);
      });
    }
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
