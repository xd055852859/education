import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { registerStore } from "@/store";
import router from "@/router";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import weekday from "dayjs/plugin/weekday";
import dayjs from "dayjs";
import ElementPlus from "element-plus";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "./styles/common/index.scss";
import "./styles/element/index.scss";
import "element-plus/dist/index.css";
import "amfe-flexible/index.js";
const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
dayjs.extend(weekday);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale("zh-cn");
app.provide("dayjs", dayjs);
pinia.use(({ store }) => {
  const initialState = JSON.parse(JSON.stringify(store.$state));
  store.$reset = () => {
    store.$state = JSON.parse(JSON.stringify(initialState));
  };
});
app
  .use(router)
  .use(ElementPlus, {
    locale: zhCn,
  })
  .use(pinia);
registerStore();
app.mount("#app");
