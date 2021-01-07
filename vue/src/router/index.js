import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Local from "../views/Local.vue";
import Cellular from "../views/Cellular.vue";
import Admin from "../views/Admin.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/local",
    name: "Local",
    component: Local 
  },
  {
    path: "/cellular",
    name: "Cellular",
    component: Cellular 
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin 
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
