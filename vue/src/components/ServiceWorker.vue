<template>
  <v-snackbar v-model="$store.state.serviceWorkerUpdateAvailable" :absolute="true" top :timeout="0">
    <span v-if="serviceWorkerReloadTime == 0">
    An update to Logger.Software is available. Click OK to reload.
    <v-btn @click="updateAndReload">OK</v-btn>
    </span>
    <div v-else class="text-center">
      Reloading in {{serviceWorkerReloadTime}} second(s)
    </div>
  </v-snackbar>
</template>

<script>
import { Workbox, messageSW } from "workbox-window";
export default {
  data:function(){
    return {
      serviceWorkerReloadTime:0
    };
  },
  methods: {
    reloadNow(){
      window.location.reload();
    },
    updateAndReload() {
      console.log("UpdateAndReload!!!");

      // don't clear the toast, rely on timeout if the page doesn't relod.
      //this.$store.commit('serviceWorkerUpdateReset');

      let registration = this.$store.state.workBoxRegistration;

      if (registration && registration.waiting) {
        // Send a message to the waiting service worker,
        // instructing it to activate.
        console.log("registration.waiting.");

        messageSW(registration.waiting, { type: "SKIP_WAITING" });
      }

      // if the page doesn't reload in 30 seconds, then force a reload.
      // the user is expecting it, so it should always happen.
      window.setTimeout(()=>{
        console.log("Service Worker Reload Timeout!")
        window.location.reload();
      }, 30000);

      // give the user a countdown.
      this.serviceWorkerReloadTime = 30;
      window.setInterval(() => {
        if (this.serviceWorkerReloadTime > 1){
          this.serviceWorkerReloadTime -= 1;
        }
      }, 1000);

    }
  }
};

</script>
