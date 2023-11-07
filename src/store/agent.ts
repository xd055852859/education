import { ref } from "vue";
import { defineStore } from "pinia";

import api from "@/services/api";
import { ResultProps } from "@/interface/Common";
import { Agent, AgentInfo, AgentMember } from "@/interface/Agent";
import { authStore } from "./auth";
// 使用setup模式定义
export const agentStore = defineStore(
  "agentStore",
  () => {
    const agentKey = ref<string>("");
    const agentList = ref<Agent[]>([]);
    const agentMemberList = ref<AgentMember[]>([]);
    const agentInfo = ref<AgentInfo | null>(null);
    const agentRole = ref<number>(5);

    const setAgentKey = (newKey) => {
      agentKey.value = newKey;
      localStorage.setItem("agentKey", newKey);
    };
    const getAgentList = async () => {
      let agentRes = (await api.request.get("agent")) as ResultProps;
      if (agentRes.msg === "OK") {
        agentList.value = agentRes.data;
      }
    };
    const setAgentList = async (newList) => {
      agentList.value = newList;
    };

    const getAgentMemberList = async () => {
      let memberRes = (await api.request.get("agentMember", {
        agentKey: agentKey.value,
      })) as ResultProps;
      if (memberRes.msg === "OK") {
        agentMemberList.value = memberRes.data;
      }
    };
    const setAgentMemberList = (newList) => {
      agentMemberList.value = newList;
    };
    const getAgentInfo = async (newKey) => {
      let agentRes = (await api.request.get("agent/detail", {
        agentKey: newKey,
      })) as ResultProps;
      if (agentRes.msg === "OK") {
        agentInfo.value = agentRes.data;
        agentRole.value = agentRes.data.role;
      } else if (agentRes.status === 202) {
        agentKey.value = authStore().user?.mainAgentKey as string;
        localStorage.removeItem("agentKey");
      }
    };
    const setAgentInfo = (newDetail) => {
      agentInfo.value = newDetail;
    };
    watch(agentKey, (newKey) => {
      if (newKey) {
        getAgentInfo(newKey);
      }
    });
    return {
      agentKey,
      setAgentKey,
      agentRole,
      agentInfo,
      setAgentInfo,
      getAgentInfo,
      agentList,
      setAgentList,
      getAgentList,
      agentMemberList,
      setAgentMemberList,
      getAgentMemberList,
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
