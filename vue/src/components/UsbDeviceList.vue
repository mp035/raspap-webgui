<template>
  <v-flex full-width>
    <v-row v-if="! usbOk" fill-height justify="center" align="center">
      <v-col justify="center" align="center">
        <h3 class="secondary--text text--lighten-1">
          <v-icon left class="secondary--text text--lighten-1">mdi-alert-circle</v-icon>You do not have the Logger USB driver installed. You can not see devices connected by USB. <router-link to="/drivers">Click Here </router-link> to see if a driver is available for your platform.
        </h3>
      </v-col>
    </v-row>
    <template v-else-if="usbDevices.length">
      <v-row>
        <v-col>
          <h2 class="text-center text-uppercase">USB Connected Devices</h2>
        </v-col>
      </v-row>
      <v-row>

        <v-layout wrap align-content-start>
          <v-flex v-for="device in usbDevices" :key="device.id" xs6 sm6 md4 lg3>
            <v-card class="ma-3" @click="openUsbDevice(device.id)">
              <v-list-item three-line>
                <v-list-item-avatar v-if="userData.permissions.includes('create_devices')" size="24" left>
                  <router-link
                    :to="'/usbdevicetest/' + device.id"
                    @click.native="$event.stopImmediatePropagation()"
                    style="text-decoration:none;"
                  >
                    <v-icon>mdi-progress-wrench</v-icon>
                  </router-link>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{device.id}}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-avatar color="primary" size="62" right>
                  <v-icon size="40">mdi-usb-port</v-icon>
                </v-list-item-avatar>
              </v-list-item>
            </v-card>
          </v-flex>
        </v-layout>
      </v-row>
      <v-row>
        <v-divider></v-divider>
      </v-row>
    </template>
    <v-row v-else fill-height justify="center" align="center">
      <v-col justify="center" align="center">
        <h3>You do not currently have any usb devices connected. Plug a logger into the USB port to see it here.</h3>
      </v-col>
    </v-row>
  </v-flex>
</template>

<script>
import usbRequestMixin from "../mixins/usb-request";
import apiRequestMixin from "../mixins/api-request";
import apiEndpointsMixin from "../mixins/api-endpoints";
import formatDateMixin from "../mixins/format-date";

export default {
  mixins: [
    usbRequestMixin,
    apiRequestMixin,
    apiEndpointsMixin,
    formatDateMixin
  ],
  data() {
    return {
      usbDevices: [],
      currentRoute: ""
    };
  },
  created() {
    this.currentRoute = this.$router.currentRoute.name;
    this.usbOk = false; // default to false because failed usb transactions take a long time, but good ones are instant. So when the page loads, the status will appear correct.
    this.pollUsbServer();
  },
  methods: {
    showError(message) {
      // errors can occur after the page has been navigated away from.
      if (this.$refs.errorBox) {
        this.$refs.errorBox.showError(message);
      }
    },
    openUsbDevice(id) {
      this.$router.push("/usbdevice/" + id);
    },
    async pollUsbServer() {
      let devices = await this.usbListDevices();
      if (devices !== false) {
        this.usbDevices = devices;
      }

      // only re-run the polling loop whilst we are on the original route.
      if (this.$router.currentRoute.name == this.currentRoute) {
        if (this.usbOk) {
          setTimeout(this.pollUsbServer, 1000);
        } else {
          // poll slower if we don't have a usb
          // server running.  Prevents so many
          // console errors.
          setTimeout(this.pollUsbServer, 15000);
        }
      }
    }
  }
};
</script>
