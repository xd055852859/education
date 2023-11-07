import { authStore } from "@/store/auth";
import { commonStore } from "@/store/common";
import { agentStore } from "@/store/agent";
import { lessonStore } from "@/store/lesson";
import { createPinia } from "pinia";
export interface IAppStore {
  authStore: ReturnType<typeof authStore>;
  commonStore: ReturnType<typeof commonStore>;
  agentStore: ReturnType<typeof agentStore>;
  lessonStore: ReturnType<typeof lessonStore>;
}

const appStore: IAppStore = {} as IAppStore;
/**
 * 注册app状态库
 */

export const registerStore = () => {
  appStore.authStore = authStore();
  appStore.commonStore = commonStore();
  appStore.agentStore = agentStore();
  appStore.lessonStore = lessonStore();
};

export default appStore;
