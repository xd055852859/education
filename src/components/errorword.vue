<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import { MoreFilled, Close } from "@element-plus/icons-vue";
import api from "@/services/api";
import IframeView from "@/components/iframeView.vue";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import _ from "lodash";
import { storeToRefs } from "pinia";
import KeywordItem from "./keywordItem.vue";
import FontIcon from "./fontIcon.vue";
const dayjs: any = inject("dayjs");
const { deviceType } = storeToRefs(appStore.commonStore);
const props = defineProps<{
  errorVisible: boolean;
  errorKey: string;
  type: string;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const memo = ref<string>("");
const original = ref<string>("");
const translation = ref<string>("");
const noteVisible = ref<boolean>(false);
const getData = async () => {
  if (props.type === "original"||props.type === "translation") {
    let dataRes = (await api.request.get("section/detail", {
      sectionKey: props.errorKey,
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      original.value = dataRes.data.original;
      translation.value = dataRes.data.translation;
    }
  } else {
    let dataRes = (await api.request.get("caption/detail", {
      captionKey: props.errorKey,
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      original.value = dataRes.data.original;
      translation.value = dataRes.data.translation;
    }
  }
};

const saveMemo = async () => {
  let obj: any = { memo: memo.value };
  if (props.type === "original") {
    obj.sectionKey = props.errorKey;
  } else {
    obj.captionKey = props.errorKey;
  }
  let noteRes = (await api.request.post("caption/error", {
    ...obj,
  })) as ResultProps;
  if (noteRes.msg === "OK") {
    ElMessage.success("保存纠错内容成功");
    memo.value = "";
    noteVisible.value = true;
  }
};
watchEffect(() => {
  if (props.errorVisible) {
    getData();
  }
});
</script>
<template>
  <div
    class="data-right"
    v-if="errorVisible"
    :style="deviceType === 'phone' ? { width: '40%' } : {}"
  >
    <div class="data-right-title dp-space-center">正文</div>
    <div class="data-right-content">
      <div>{{ original }}</div>
      <el-divider border-style="dashed" v-if="translation && original" />
      <div>{{ translation }}</div>
    </div>

    <div
      class="data-right-button"
      :style="
        noteVisible
          ? { boxShadow: '0px 2px 9px 0px rgba(178, 178, 178, 0.5)' }
          : {}
      "
    >
      <div
        class="dp-center-center icon-point"
        v-if="noteVisible"
        @click="noteVisible = false"
      >
        <FontIcon iconName="zhankai" :iconStyle="{ color: '#333' }" />
      </div>
      <div class="data-right-note" v-if="noteVisible">
        <el-input
          v-model="memo"
          :rows="10"
          type="textarea"
          placeholder="输入纠错内容"
        />
        <!-- <el-button
        type="primary"
        round
        class="note-button"
        size="small"
        @click="saveNote"
        >保存</el-button
      > -->
      </div>
      <div class="dp-center-center">
        <el-button
          type="primary"
          round
          class="left-button"
          @click="noteVisible ? saveMemo() : (noteVisible = true)"
          >{{ noteVisible ? "保存" : "纠错" }}</el-button
        >
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.data-right {
  width: 523px;
  height: 100%;
  padding: 25px 10px 10px 10px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  background-color: #fff;
  border-radius: 14px;
  // box-shadow: 0px 2px 9px 0px rgba(178, 178, 178, 0.5);
  @include scroll();
  .data-right-title {
    width: 100%;
    height: 40px;
    font-size: 32px;
    font-family: DIN Black, DIN Black-Black;
    font-weight: 900;
    line-height: 40px;
    padding: 0px 20px 0px 10px;
    box-sizing: border-box;
  }
  .data-right-content {
    width: 100%;
    height: calc(100% - 120px);
    margin: 10px 0px;
    padding: 10px 15px;
    box-sizing: border-box;
    font-size: 22px;
    font-family: PingFang SC, PingFang SC-Regular;
    text-align: left;
    color: #333333;
    line-height: 45px;
    text-indent: 2em;
    @include scroll();
  }

  .data-right-button {
    width: 100%;
    padding: 0px 50px 30px 50px;
    background-color: #fff;
    box-sizing: border-box;
    position: absolute;
    z-index: 2;
    bottom: 0px;
    left: 0px;

    .data-right-note {
      width: 100%;
      margin-bottom: 18px;
    }

    .left-button {
      width: 246px;
      height: 38px;
    }

    .right-button {
      width: 150px;
      height: 38px;
    }
  }
}
</style>
<style lang="scss"></style>
