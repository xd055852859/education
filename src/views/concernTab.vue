<script setup lang="ts">
import concernItem from "@/components/concernItem.vue";
import FontIcon from "@/components/fontIcon.vue";
import Header from "@/components/header.vue";
import Keyword from "@/components/keyword.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
const props = defineProps<{
  keyword: string;
  keywordTab: string;
}>();
const emits = defineEmits<{
  (e: "setKeyword", word: string, wordKey: string): void;
  (e: "addNum", num: number): void;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const page = ref<number>(1);
const total = ref<number>(0);
const keywordList = ref<any>([]);
const getData = async () => {
  let dataRes = (await api.request.get("study/keyword", {
    agentKey: agentKey.value,
    page: page.value,
    limit: 30,
    isArchived: props.keywordTab === "uncare",
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    if (page.value === 1) {
      keywordList.value = [];
    }
    dataRes.data.forEach((item) => {
      if (item.note) {
        item.note = item.note.replace(/\n/g, "<br/>");
      }
      item.sentence = item.sentence.map((sentenceItem) => {
        let reg = new RegExp(`${item.keyword}`, "g");
        sentenceItem = Array.isArray(sentenceItem)
          ? sentenceItem.join("")
          : sentenceItem;
        sentenceItem = sentenceItem
          .replace(reg, `#${item.keyword}#`)
          .split("#");
        return sentenceItem;
      });
    });
    keywordList.value.push(...dataRes.data);
    total.value = dataRes.total as number;
  }
};

const archiveKeyword = async (key, index, isArchived) => {
  let dataRes = (await api.request.patch("study/keyword/archive", {
    keywordKey: key,
    isArchived: isArchived,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    ElMessage.success(`${isArchived ? "归档" : "关注"}成功`);
    emits("addNum", isArchived ? -1 : 1);
    keywordList.value.splice(index, 1);
  }
};
const chooseWord = (word, wordKey) => {
  console.log(word);
  emits("setKeyword", word, wordKey);
};
const scrollKeyword = (e) => {
  //文档内容实际高度（包括超出视窗的溢出部分）
  let scrollHeight = e.target.scrollHeight;
  //滚动条滚动距离
  let scrollTop = e.target.scrollTop;
  //窗口可视范围高度
  let height = e.target.clientHeight;
  if (
    height + scrollTop >= scrollHeight &&
    keywordList.value.length < total.value
  ) {
    page.value++;
  }
};
watch(
  () => props.keywordTab,
  () => {
    page.value === 1;
  }
);
watchEffect(() => {
  getData();
});
</script>
<template>
  <div
    class="keyword-box"
    v-if="keywordList.length > 0"
    @scroll="scrollKeyword"
  >
    <div
      v-for="(item, index) in keywordList"
      :key="`keyword${item._key}`"
      class="concernItem-box"
    >
      <div class="concernItem-box-title">
        {{ item.keyword }}
        <div
          v-if="keywordTab === 'uncare'"
          class="concernItem-box-icon icon-point"
          @click="archiveKeyword(item._key, index, false)"
        >
          <FontIcon iconName="a-xin-kongxin2" />
        </div>
        <div
          @click="archiveKeyword(item._key, index, true)"
          class="concernItem-box-icon icon-point"
          v-else
        >
          <FontIcon
            iconName="a-xin-tianchong2"
            :iconStyle="{ color: '#4D57FF' }"
          />
        </div>
      </div>
      <div
        class="concernItem-box-subtitle"
        v-for="(sentenceItem, sentenceIndex) in item.sentence"
        :key="`sentence${sentenceIndex}`"
      >
        <span
          v-for="(wordItem, wordIndex) in sentenceItem"
          :key="`word${wordIndex}`"
          @click="
            wordItem === item.keyword ? chooseWord(wordItem, item._key) : ''
          "
          :style="
            wordItem === item.keyword
              ? {
                  background: keyword === wordItem ? '#ffe3b5' : '#c2c4f6',
                  padding: '2px 0px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }
              : {}
          "
        >
          {{ wordItem }}
        </span>
      </div>
      <div
        class="concernItem-box-content"
        v-if="item.note"
        v-html="item.note"
      ></div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.keyword-box {
  width: 100%;
  height: calc(100vh - 190px);
  @include scroll();

  .concernItem-box {
    background: #f2f4fb;
    border-radius: 12px;
    margin-bottom: 20px;
    @include p-number(14px, 28px);
    .concernItem-box-title {
      width: 100%;
      height: 32px;
      font-size: 30px;
      font-family: DIN Black, DIN Black-Black;
      font-weight: 900;
      line-height: 32px;
      margin-bottom: 6px;
      @include flex(space-between, center, null);
      .concernItem-box-icon {
        display: none;
      }
      &:hover {
        .concernItem-box-icon {
          @include flex(center, center, null);
        }
      }
    }
    .concernItem-box-subtitle {
      width: 100%;
      font-size: 18px;
      color: #333333;
      line-height: 32px;
      margin-bottom: 5px;
    }
    .concernItem-box-content {
      background: #ffffff;
      font-size: 16px;
      line-height: 28px;
      white-space: pre-wrap;
      @include p-number(10px, 10px);
    }
  }
}
</style>
<style></style>
