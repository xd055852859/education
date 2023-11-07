import { ref } from "vue";
import { defineStore } from "pinia";

import api from "@/services/api";
import { ResultProps } from "@/interface/Common";
import { Agent, AgentInfo, AgentMember } from "@/interface/Agent";
import { agentStore } from "./agent";
// 使用setup模式定义
export const lessonStore = defineStore(
  "lessonStore",
  () => {
    const tagKey = ref<string>("");
    const lessonKey = ref<string>("");
    const lessonInfo = ref<any>(null);
    const setTagKey = (newKey) => {
      tagKey.value = newKey;
    };
    const setLessonKey = (newKey) => {
      lessonKey.value = newKey;
    };
    const getLessonInfo = async (newKey) => {
      let lessonRes = (await api.request.get("resource/detail", {
        agentKey: agentStore().agentKey,
        resourceKey: newKey,
      })) as ResultProps;
      if (lessonRes.msg === "OK") {
        lessonInfo.value = lessonRes.data;
      }
    };
    const setLessonInfo = (newDetail) => {
      lessonInfo.value = newDetail;
    };
    watch(
      [() => agentStore().agentKey, lessonKey],
      ([newAgentKey, newLessonKey]) => {
        if (newAgentKey && newLessonKey) {
          getLessonInfo(newLessonKey);
        }
      }
    );
    return {
      tagKey,
      setTagKey,
      lessonKey,
      setLessonKey,
      lessonInfo,
      setLessonInfo,
    };
  }
  // {
  //   persist: {
  //     // storage: window.sessionStorage,
  //     // 部分持久化状态的点符号路径数组，[]意味着没有状态被持久化(默认为undefined，持久化整个状态)
  //     // paths: ['nested.data'],
  //   },
  // }
);
