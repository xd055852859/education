<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
import concernTab from "./concernTab.vue";
import Header from "@/components/header.vue";
import Keyword from "@/components/keyword.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
const props = defineProps<{
  tab: string;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const keywordTab = ref<string>("care");
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const archivedNum = ref<number>(0);
const keywordNum = ref<number>(0);
const expandState = ref<boolean>(false);
onMounted(() => {
  keywordTab.value = props.tab;
});
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
const addNum = (num, type?: string) => {
  if (type === "care") {
    archivedNum.value = archivedNum.value + num;
  } else if (type === "uncare") {
    keywordNum.value = keywordNum.value + num;
  } else {
    archivedNum.value = archivedNum.value - num;
    keywordNum.value = keywordNum.value + num;
  }
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
              :expandState="expandState"
            />
          </el-tab-pane>
          <el-tab-pane name="uncare" :label="`归档(${archivedNum})`">
            <concernTab
              @setKeyword="setKeyword"
              @addNum="addNum"
              :keyword="keyword"
              :keywordTab="keywordTab"
              :expandState="expandState"
            />
          </el-tab-pane>
        </el-tabs>
        <div
          class="keyword-expand icon-point dp-center-center"
          @click="expandState = !expandState"
        >
          简介模式
          <FontIcon
            :iconName="expandState ? 'shouqi' : 'zhankai'"
            :iconStyle="{ color: '#666', fontSize: '14px', marginLeft: '5px' }"
          />
        </div>
      </div>
      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
      />
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
      position: relative;
      z-index: 1;
      .keyword-expand {
        height: 22px;
        font-size: 16px;
        color: #666666;
        line-height: 22px;
        position: absolute;
        z-index: 2;
        top: 15px;
        right: 10px;
      }
    }
  }
}
</style>
<style></style>
