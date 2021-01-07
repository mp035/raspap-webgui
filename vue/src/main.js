import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;

Vue.component('navbar', require('./components/Navbar').default);
//Vue.component('m-form', require('./components/ApiForm.vue').default);
Vue.component('m-checkbox', require('./components/CheckBox.vue').default);
Vue.component('m-combobox', require('./components/ComboBox.vue').default);
Vue.component('m-textinput', require('./components/TextInput.vue').default);
//Vue.component('m-datepicker', require('./components/DatePicker.vue').default);
Vue.component('m-textarea', require('./components/TextArea.vue').default);
Vue.component('m-password', require('./components/PasswordInput.vue').default);
Vue.component('m-submit', require('./components/SubmitButton.vue').default);
Vue.component('m-menu', require('./components/Menu.vue').default);
Vue.component('m-menubutton', require('./components/MenuButton.vue').default);
Vue.component('m-item', require('./components/MenuItem.vue').default);
Vue.component('m-errorbox', require('./components/ErrorBox').default);
// Vue.component('resource-view', require('./components/ResourceView').default);
// Vue.component('resource-cards', require('./components/ResourceCards').default);


new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
