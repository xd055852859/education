<script setup lang="ts">
import concernTab from "./concernTab.vue";
import Header from "@/components/header.vue";
import Keyword from "@/components/keyword.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
const { agentKey } = storeToRefs(appStore.agentStore);
const keywordTab = ref<string>("care");
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const archivedNum = ref<number>(0);
const keywordNum = ref<number>(0);
const setKeyword = (word, wordKey) => {
  keyword.value = word;
  keywordKey.value = wordKey;
};
const getData = async () => {
  let dataRes = (await api.request.get("study/keyword/summary", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    archivedNum.value = dataRes.data.archivedNum;
    keywordNum.value = dataRes.data.keywordNum;
  }
};
const addNum = (num) => {
  archivedNum.value = archivedNum.value - num;
  keywordNum.value = keywordNum.value + num;
};
watchEffect(() => {
  getData();
});
</script>
<template>
  <div class="keyword">
    <Header :title="'关注点'" :backPath="'/home'" />

    <!-- class="study-audio" -->
    <!-- <video autoPlay controls ref="audioRef">
      <source :src="audioSrc" type="audio/mpeg" />
    </video> -->
    <div class="keyword-container">
      <div class="keyword-left">
        <el-tabs v-model="keywordTab">
          <el-tab-pane name="care" :label="`关注点(${keywordNum})`">
            <concernTab
              @setKeyword="setKeyword"
              @addNum="addNum"
              :keyword="keyword"
              :keywordTab="keywordTab"
            />
          </el-tab-pane>
          <el-tab-pane name="uncare" :label="`归档(${archivedNum})`">
            <concernTab
              @setKeyword="setKeyword"
              @addNum="addNum"
              :keyword="keyword"
              :keywordTab="keywordTab"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
      <Keyword :keyword="keyword" :keywordKey="keywordKey" @setKeyword="keyword = ''"/>
    </div>
  </div>
</template>
<style scoped lang="scss">
.keyword {
  width: 100vw;
  height: 100vh;
  align-content: flex-start;
  @include p-number(34px, 0px);
  @include flex(center, center, wrap);
  .keyword-container {
    width: 100vw;
    height: calc(100vh - 120px);
    margin-top: 25px;
    padding: 0px 119px 0px 78px;
    box-sizing: border-box;
    @include flex(space-between, center, null);
    .keyword-left {
      min-width: 1120px;
      flex: 1;
      height: 100%;
    }
  }
}
</style>
<style></style>
