<template>
  <resource-cards
    v-if="$store.state.networkAvailable"
    :empty-message="userId ? logCollection.meta.user_name + ' does not have any logs in the cloud.' : 'You do not currently have any logs in the cloud. Open a local file, or upload data from a logger.'"
    error-message="Error loading logs from the server"
    :prepare-item="prepareLogInfo"
    :index-endpoint="apiEndpoints.myLogs"
    :index-route-args="userId && [userId]"
    :collection="logCollection"
    @update:collection="$emit('update:logCollection', $event)"
  >
    <template v-slot:default="{item}">
      <v-card class="ma-3" @click="openLog(item.id)">
        <v-list-item three-line>
          <v-list-item-avatar size="24" left>
                  <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                      <v-icon v-on="on">mdi-dots-vertical</v-icon>
                    </template>
                    <v-list>
                      <v-list-item @click="$router.push('/loginfo/' + item.id)">
                        <v-list-item-title>
                          <v-icon left>mdi-information-outline</v-icon>Log Info
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="$router.push('/create_link/' + item.id)">
                        <v-list-item-title>
                          <v-icon left>mdi-share-variant</v-icon>Create Shareable Link
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="downloadLog(item.id)">
                        <v-list-item-title>
                          <v-icon left>mdi-cloud-download</v-icon>Download to File
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="deleteLog(item.id)">
                        <v-list-item-title>
                          <v-icon left>mdi-trash-can</v-icon>Delete Log
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-if="item.address || item.city">{{item.address}}, {{item.city}}</v-list-item-title>
            <v-list-item-title v-else>{{item.filename}}</v-list-item-title>
            <v-list-item-subtitle
              v-if="item.state || item.postcode"
            >{{item.state}}, {{item.postcode}}</v-list-item-subtitle>

            <v-list-item-subtitle>{{dateOnly(item.started_at)}} {{item.chart_type}}</v-list-item-subtitle>
            <v-list-item-subtitle>
              Duration:
              <span v-if="item.duration.days">{{item.duration.days}}d</span>
              <span v-if="item.duration.hours || item.duration.days">{{item.duration.hours}}h</span>
              {{item.duration.minutes}}m
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-avatar color="primary" size="62" right>
            <v-icon size="40">mdi-file-cloud</v-icon>
          </v-list-item-avatar>

          <!--v-list-item-avatar color="primary" size="62" right>
                                            <v-img src="/img/gecko-icon_gray.png"></v-img>
          </v-list-item-avatar-->
        </v-list-item>
      </v-card>
    </template>
  </resource-cards>
  <v-row v-else>
<v-col class="text-center">
  <v-chip class="ma-2" color="warning text--secondary" light>
        <v-icon left>mdi-server-network-off</v-icon>Log file cloud storage is not available offline
  </v-chip>
</v-col>
  </v-row>
</template>

<script>
import apiRequestMixin from "../mixins/api-request";
import apiEndpointsMixin from "../mixins/api-endpoints";
import formatDateMixin from "../mixins/format-date";
import fileDownload from "js-file-download"; // not a mixin.

export default {
  mixins: [apiEndpointsMixin, apiRequestMixin, formatDateMixin],
  props: {
    userId: { type: Number, default: null },
    logCollection: { type: Object, default: null }
  },
  methods: {
    prepareLogInfo(value) {
      let durationMin = Math.floor((value.ended_at - value.started_at) / 60);
      value.started_at = new Date(value.started_at * 1000);
      value.ended_at = new Date(value.ended_at * 1000);
      Vue.set(value, "duration", {
        // provided for user information.
        days: Math.floor(durationMin / (24 * 60)),
        hours: Math.floor(durationMin / 60) % 24,
        minutes: durationMin % 60
      });
    },
    openLog(id) {
      if ((this.$store.state.log || {}).id != id) {
        // when there is already log data in the store, the browser slows down
        // trying to load the old log, before switching to the new one, so
        // clear the old log prior to attempting to load a new one
        this.$store.commit("setLog", null);
      }
      this.$router.push("/log/" + id);
    },
    downloadLog(logId){
      console.log("Downloading log ID: " + logId);
      this.apiRequest(this.apiEndpoints.logs, logId, null, {
        Accept: "application/octet-stream"
      }).then(r => {
        if (this.checkStatus(r, "Error getting file from server.")) {
          let fileContent =  r.body;
            fileDownload(r.body, "LogFile_" + logId + ".gecko");
        }
      }).catch(() => {
        // if there is an error loading the log (perhaps a bad bookmark, or not logged in) just redirect
        // to the home page
        this.$router.replace('/');
      });
    }
  }
};
</script>
