import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "login",
    component: () => import("@/views/login/index.vue"),
    children: [],
  },
  {
    path: "/home",
    name: "home",
    component: () => import("@/views/home.vue"),
    redirect: "/home/overview",
    children: [
      {
        path: "overview",
        name: "overview",
        component: () => import("@/views/overview.vue"),
        children: [],
      },
      {
        path: "center",
        name: "center",
        component: () => import("@/views/lesson/center.vue"),
        children: [],
      },
      {
        path: "concern",
        name: "concern",
        component: () => import("@/views/concern.vue"),
        children: [],
      },
      {
        path: "calendar",
        name: "calendar",
        component: () => import("@/views/calendar.vue"),
        children: [], 
      },
      {
        path: "note",
        name: "note",
        component: () => import("@/views/note.vue"),
        children: [],
      },
      {
        path: "study/:lessonKey",
        name: "study",
        component: () => import("@/views/lesson/study.vue"),
        children: [],
        props: true,
      },
    ],
  },
  {
    path: "/preview/:lessonKey",
    name: "preview",
    component: () => import("@/views/preview.vue"),
    children: [],
    props: true,
  },
  {
    path: "/test",
    name: "test",
    component: () => import("@/views/test.vue"),
    children: [],
  },
];
const routerHistory = createWebHashHistory();
const router = createRouter({
  history: routerHistory,
  routes,
});
//全局后置守卫
router.afterEach((to, from, failure) => {
  if (window.parent != window.self && from.fullPath !== "/") {
    window.parent.postMessage({ url: location.href }, "*");
    localStorage.setItem("url", to.fullPath);
  }
});
export default router;
