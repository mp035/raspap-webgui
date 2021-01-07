<template>
  <div v-if="files.length || usbLoading">
    <v-row>
      <v-col>
        <h2 class="text-center text-uppercase">Files on Connected USB Logger</h2>
      </v-col>
    </v-row>
    <v-row>
    <v-layout wrap align-content-start>
      <v-flex v-for="(log, index) in files" :key="index" xs6 sm6 md4 lg3>
        <v-card class="ma-3" @click="openLog(log)">
          <v-list-item three-line>
            <v-list-item-avatar size="24" left>
              <v-icon>mdi-information-outline</v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-if="log.addressLabel">{{log.addressLabel}}</v-list-item-title>
              <v-list-item-subtitle>Start: {{new Date(log.started_at).toLocaleString()}}</v-list-item-subtitle>
              <v-list-item-subtitle
                v-if="! log.addressLabel"
              >End: {{new Date(log.ended_at).toLocaleString()}}</v-list-item-subtitle>
              <v-list-item-subtitle>
                Duration:
                <span v-if="log.duration.days">{{log.duration.days}}d</span>
                <span v-if="log.duration.hours">{{log.duration.hours}}h</span>
                {{log.duration.minutes}}m
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-avatar color="primary" size="62" right>
              <v-icon size="40">mdi-usb</v-icon>
            </v-list-item-avatar>
          </v-list-item>
        </v-card>
      </v-flex>

      <v-flex v-if="usbLoading" xs6 sm6 md4 lg3>
        <v-card class="ma-3">
          <v-list-item three-line>
            <v-list-item-content v-if="usbFileReadSize == 0">
              <v-list-item-title>Loading...</v-list-item-title>
              <v-list-item-subtitle>Searching for files</v-list-item-subtitle>
              <v-list-item-subtitle>on attached logger...</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-content v-else>
              <v-list-item-title>Loading file number {{usbFileReadNumber}}</v-list-item-title>
              <v-list-item-subtitle>from attached logger</v-list-item-subtitle>
              <v-list-item-subtitle>{{(usbFileReadSize < 1024*1024) ? ((usbFileReadSize/1024).toFixed(0)+"KB") : ((usbFileReadSize/1024/1024).toFixed(2)+"MB") }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-avatar size="62" right>
              <v-progress-circular size="58" indeterminate color="primary"></v-progress-circular>
            </v-list-item-avatar>
          </v-list-item>
        </v-card>
      </v-flex>

      <v-flex v-if="loggerHasMore && ! usbLoading" xs6 sm6 md4 lg3>
        <v-card class="ma-3" @click="loadFiles()">
          <v-list-item three-line>
            <v-list-item-content>
              <v-list-item-title>Load More</v-list-item-title>
              <v-list-item-subtitle>files from the attached logger</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-avatar size="62" right>
              <v-icon size="40">mdi-download</v-icon>
            </v-list-item-avatar>
          </v-list-item>
        </v-card>
      </v-flex>
    </v-layout>
    </v-row>

    <v-row>
    <v-divider></v-divider>
    </v-row>
  </div>
</template>

<script>
import usbRequest from "../mixins/usb-request";
import geoFunctions from "../mixins/geo-functions";

export default {
  mixins: [usbRequest, geoFunctions],
  data() {
    return {
      files: [],
      usbLoading: false,
      loggerHasMore: false,
      fileRange: null
    };
  },
  props: {
    device: {
      type: String
    }
  },
  methods: {
    openLog(log) {
      log.id = 0;
      this.$store.commit("setLog", log);
      this.$router.push("/log/0");
    },
    async loadFiles() {
      this.$emit("loadingStarted");
      this.usbLoading = true;
      if (this.fileRange == null) {
        this.fileRange = await this.usbGetFileRange({ device: this.device });
        console.log("File Range: ", this.fileRange);
      }
      let startFile = this.fileRange[1];
      if (this.files.length) {
        startFile = this.files[this.files.length - 1].file_number - 1;
      }
      //let startFile = this.fileRange[1] - this.files.length;
      if (
        startFile < this.fileRange[0] ||
        this.fileNumberIsInvalid(this.fileRange[0])
      ) {
        // no files left to load
        this.loggerHasMore = false; // just make sure it's set.
      } else {
        let numToLoad = this.files.length > 0 ? 8 : 3;
        let endStop = this.fileRange[1] - this.files.length - numToLoad;
        if (endStop < this.fileRange[0]) {
          endStop = this.fileRange[0] - 1;
          this.loggerHasMore = false;
        } else {
          this.loggerHasMore = true;
        }

        for (let i = startFile; i > endStop; i--) {
          let file = await this.usbGetLogFile(i, { device: this.device });
          if (file != false && file.started_at !== false) {
            if (file.latitude && file.longitude) {
              this.getAddress(file.latitude, file.longitude).then(address => {
                Vue.set(file, "addressLabel", address);
              });
            }

            this.files.push(file);
          } else {
            // the file number does not contain a useful file, so add another
            // file to the range to replace it.
            if (endStop > this.fileRange[0] - 1) {
              endStop -= 1;
            }
          }
        }
      }
      this.usbLoading = false;
      this.$emit("loadingComplete");
    }
  },
  mounted() {
    if (this.device) {
      this.files = [];
      this.fileRange = null;
      this.loadFiles();
    }
  },
  watch: {
    device(newVal, oldVal) {
      this.files = [];
      this.fileRange = null;
      this.loadFiles();
    }
  }
};
</script>

<style>
</style>
