<template>
  <nav>
    <v-app-bar app color="primary">
      <!--v-app-bar-nav-icon
        class="secondary--text text--darken-3"
        @click="showDrawer = !showDrawer"
      ></v-app-bar-nav-icon-->
      <v-btn class="white--text" v-if="showBackButton" icon @click="goBack()" style="margin-right:5px;">
        <v-icon large >mdi-arrow-left-circle</v-icon>
      </v-btn>
      <v-btn class="white--text" v-if="showRefreshButton" icon @click="refresh()" style="margin-right:5px;">
        <v-icon large>mdi-refresh-circle</v-icon>
      </v-btn>
      <slot>
        <v-toolbar-title class="text-uppercase white--text">
          <span class="font-weight-light">Smart</span>
          <span class="font-weight-medium">Node</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
      </slot>
      <template v-if="loggedIn">
        <m-menubutton
          v-if="$route.name != 'home'"
          icon="mdi-home"
          @click="$router.push('/home')"
        >Home</m-menubutton>
        <m-item icon="mdi-exit-to-app" @click="signOut">Sign Out</m-item>

      </template>
    </v-app-bar>

    <v-dialog v-model="showDialog" width="500">
      <v-card>
        <v-card-title
          class="text-center pa-4"
          :class="dialogError ? 'error white--text' : 'primary secondary--text text--darken-3'"
        >
          <v-row justify="center">
            <span class="text-uppercase text-center font-weight-light">
              <span class="font-weight-medium">Log Out</span>
            </span>
          </v-row>
        </v-card-title>

        <v-card-text class="mt-4 mb-0 pb-0 text-center">{{dialogText}}</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :color="dialogError?'error':'primary'"
            class="mb"
            :class="dialogError ? 'white--text' : 'secondary--text text--darken-3'"
            @click="navigateWelcome"
          >Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </nav>
</template>

<script>
//import apiMixin from "../mixins/api-request";
//import apiQueries from "../mixins/api-endpoints";

export default {
  //mixins: [apiMixin, apiQueries],
  props: {
    showDrawer: {
      type: Boolean,
      default: null
    },
    showBackButton: {
      type: Boolean,
      default: true
    },
    showRefreshButton: {
      type: Boolean,
      default: true
    },
    showOfflineBackButton: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showDialog: false,
      dialogError: false,
      dialogText: "You Should Never See This Text!",
    };
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    refresh(){
      window.location.reload();
    },
    signOut(evt) {
      console.log(evt);
      /*
      this.apiRequest(this.apiEndpoints.logout)
        .then(r => {
          console.log(r);
          this.dialogError = true;

          if (r.status >= 200 && r.status <= 299) {
            this.dialogError = false;
            this.dialogText = r.body.data.message;
            window.setTimeout(this.navigateWelcome, 5000);
            this.clearToken();
          } else if (r.status == 401) {
            //already logged out (unauthenticated)
            this.dialogError = false;
            this.dialogText = `Already logged out (${r.body.message}).`;
            window.setTimeout(this.navigateWelcome, 5000);
            this.clearToken();
          } else {
            this.dialogText =
              "(" +
              r.status +
              ") " +
              (r.body.message || "Unsupported response from server.");
          }

          this.showDialog = true;
          return r;
        })
        .catch(err => {
          console.log(err);
          return err;
        });
        */
    },
    navigateWelcome() {
      this.showDialog = false; // in case we end up navigating back to this page via guards.
      console.log(this.dialogError, this.$route.path);
      if (
        !(
          this.dialogError ||
          this.$route.path == "/" ||
          this.$route.path == "/register"
        )
      )
        this.$router.push("/");
    },
    reload() {
      window.location.reload();
    }
  },
  watch: {
  },
  computed: {
  }
};
</script>

<style></style>
