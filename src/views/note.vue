<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import IframeView from "@/components/iframeView.vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
const dayjs: any = inject("dayjs");
const { token } = storeToRefs(appStore.authStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const noteList = ref<any>([]);
const noteIndex = ref<number>(-1);
const noteKey = ref<string>("");
const noteUrl = ref<string>("");
const page = ref<number>(1);
const total = ref<number>(0);

const getData = async () => {
  const dataRes = (await api.request.get("study/note", {
    agentKey: agentKey.value,
    page: page.value,
    limit: 30,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    noteList.value = [...noteList.value, ...dataRes.data];
    total.value = dataRes.total as number;
    noteIndex.value = 0;
  }
};
const scrollNote = (e) => {
  //文档内容实际高度（包括超出视窗的溢出部分）
  let scrollHeight = e.target.scrollHeight;
  //滚动条滚动距离
  let scrollTop = e.target.scrollTop;
  //窗口可视范围高度
  let height = e.target.clientHeight;
  if (
    height + scrollTop >= scrollHeight &&
    noteList.value.length < total.value
  ) {
    page.value++;
  }
};
watch(noteIndex, (newIndex) => {
  noteKey.value = noteList.value[newIndex]._key;
  const getApi = api.API_URL + "study/note/detail";
  const getParams = `{"agentKey": "${agentKey.value}","resourceKey": "${noteList.value[newIndex].resourceKey}" }`;
  const patchApi = api.API_URL + "study/note";
  const uptokenApi = api.API_URL + "account/qiniuToken";
  const uptokenParams = `{"target": "cdn-feisuo"}`;
  noteUrl.value = `https://mind.qingtime.cn/?token=${token.value}&getDataApi={"url":"${getApi}","params":${getParams},"docDataName":"content"}&patchDataApi={"url":"${patchApi}","params":${getParams},"docDataName":"note"}&getUptokenApi={"url":"${uptokenApi}","params":${uptokenParams}}&isEdit=2&hideHead=1`;
});
watchEffect(() => {
  getData();
});
</script>
<template>
  <div class="note">
    <div class="note-left">
      <div class="note-left-header">
        <div @click="$router.push('/home')" class="note-header-back">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        学习笔记
      </div>
      <div class="note-left-container" @scroll="scrollNote">
        <div
          class="note-left-item"
          v-for="(item, index) in noteList"
          :key="`note${item._key}`"
          @click="noteIndex = index"
          :style="noteIndex === index ? { background: '#4d57ff' } : {}"
        >
          <div
            class="note-item-top single-to-long"
            :style="noteIndex === index ? { color: '#fff' } : {}"
          >
            {{ item.resourceName }}
          </div>
          <div
            class="note-item-bottom"
            :style="noteIndex === index ? { color: '#fff' } : {}"
          >
            {{ dayjs(item.createTime).fromNow() }}
          </div>
        </div>
      </div>
    </div>
    <div class="note-right">
      <IframeView :url="noteUrl" />
    </div>
  </div>
</template>
<style scoped lang="scss">
.note {
  width: 100vw;
  height: 100vh;
  @include flex(space-between, center, null);
  .note-left {
    width: 240px;
    height: 100vh;
    padding: 10px 15px 10px 25px;
    box-sizing: border-box;
    background: #f8f9ff;
    @include p-number(10px, 25px);
    .note-left-header {
      width: 100%;
      height: 30px;
      margin: 10px 0px;
      font-size: 24px;
      font-weight: 500;
      color: #000000;
      @include flex(flex-start, center, null);
      .note-header-back {
        margin-right: 10px;
        cursor: pointer;
        @include flex(flex-start, center, null);
      }
    }
    .note-left-container {
      width: 100%;
      height: calc(100% - 50px);
      padding-left: 4px;
      box-sizing: border-box;
      .note-left-item {
        width: 100%;
        height: 75px;
        margin-bottom:5px;
        border-radius: 4px;
        padding: 10px 12px;
        box-sizing: border-box;
        align-content: center;
        cursor: pointer;
        @include flex(flex-start, center, wrap);
        .note-item-top {
          width: 100%;
          height: 30px;
          font-size: 18px;
          color: #000000;
          line-height: 25px;
          margin-bottom: 5px;
        }
        .note-item-bottom {
          width: 100%;
          height: 17px;
          font-size: 14px;
          color: #999999;
          line-height: 17px;
        }
        &:hover {
          background: #4d57ff;
          .note-item-top {
            color: #ffffff;
          }
          .note-item-bottom {
            color: #ffffff;
          }
        }
      }
    }
  }
  .note-right {
    width: calc(100vw - 240px);
    height: 100vh;
  }
}
</style>
<style></style>
