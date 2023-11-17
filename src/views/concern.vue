<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
import { Delete } from "@element-plus/icons-vue";
import Header from "@/components/header.vue";
import Keyword from "@/components/keyword.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";
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
const page = ref<number>(1);
const total = ref<number>(0);
const keywordList = ref<any>([]);
onMounted(() => {
  keywordTab.value = props.tab;
});
const setKeyword = (word, wordKey) => {
  keyword.value = word;
  keywordKey.value = wordKey;
};
const getNumData = async () => {
  let dataRes = (await api.request.get("study/keyword/summary", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    archivedNum.value = dataRes.data.archivedNum;
    keywordNum.value = dataRes.data.keywordNum;
  }
};
const addNum = (num, type?: string) => {
  console.log(num, type);
  if (type === "uncare") {
    archivedNum.value = archivedNum.value + num;
  } else if (type === "care") {
    keywordNum.value = keywordNum.value + num;
  } else {
    archivedNum.value = archivedNum.value - num;
    keywordNum.value = keywordNum.value + num;
  }
};

const getData = async () => {
  let dataRes = (await api.request.get("study/keyword", {
    agentKey: agentKey.value,
    page: page.value,
    limit: 30,
    isArchived: keywordTab.value === "uncare",
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    if (page.value === 1) {
      keywordList.value = [];
    }
    dataRes.data.forEach((item) => {
      if (item.note) {
        item.note = item.note.replace(/\n/g, "<br/>");
      }
      item.expandState = false;
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

const archiveKeyword = async (e, key, index) => {
  let dataRes = (await api.request.patch("study/keyword/archive", {
    keywordKey: key,
    isArchived: true,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    // ElMessage.success("归档成功");
    addNum(-1);
    keywordList.value.splice(index, 1);
  }
  let uncareDom = document.getElementById("dest");
  let left = e.pageX - e.target.offsetWidth / 2;
  let top = e.pageY - e.target.offsetWidth / 2;

  let targetLeft = uncareDom?.offsetLeft as number;
  let targetTop = uncareDom?.offsetTop as number;
  let targetWidth = uncareDom?.offsetWidth as number;
  let targetHeight = uncareDom?.offsetHeight as number;
  let bar = document.createElement("div");
  let img = document.createElement("img");
  img.src = "/common/fly.svg";
  bar.appendChild(img);
  bar.className = "fly-div";
  bar.style.left = left + "px";
  bar.style.top = top + "px";
  bar.style.transition =
    "left 1.5s linear, top 1.5s cubic-bezier(0.5, -0.5, 1, 1)";
  document.body.appendChild(bar);
  // 添加动画属性
  let timer = setTimeout(() => {
    bar.style.left = targetLeft + targetWidth / 2 + "px";
    bar.style.top = targetTop + targetHeight * 2 + "px";
  }, 0);

  // /**
  //  * 动画结束后，删除自己
  //  */
  bar.ontransitionend = function () {
    // this.remove();

    if (document.body.contains(bar)) {
      document.body.removeChild(bar);
    }
    clearTimeout(timer);
  };
};
const deleteKeyword = async (key, index) => {
  ElMessageBox.confirm("是否删除该关键字", "删除关键字", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  }).then(async () => {
    let dataRes = (await api.request.delete("study/keyword", {
      agentKey: agentKey.value,
      keywordKey: key,
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      ElMessage.success("删除关键字成功");
      addNum(-1, keywordTab.value);
      keywordList.value.splice(index, 1);
    }
  });
};
const chooseWord = (word, wordKey) => {
  console.log(word);
  setKeyword(word, wordKey);
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
watch(keywordTab, () => {
  page.value === 1;
});
watchEffect(() => {
  getNumData();
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
        <div class="keyword-tab">
          <div
            class="keyword-tab-item"
            :class="{ 'keyword-tab-choose': keywordTab === 'care' }"
            @click="keywordTab = 'care'"
          >
            {{ `关注点(${keywordNum})` }}
          </div>
          <div
            class="keyword-tab-item"
            :class="{ 'keyword-tab-choose': keywordTab === 'uncare' }"
            @click="keywordTab = 'uncare'"
            id="dest"
          >
            {{ `归档(${archivedNum})` }}
          </div>
        </div>
        <div
          class="keyword-box"
          v-if="keywordList.length > 0"
          @scroll="scrollKeyword"
        >
          <div
            v-for="(item, index) in keywordList"
            :key="`keyword${item._key}`"
            class="concernItem-box"
            @click="chooseWord(item.keyword, item._key)"
          >
            <div class="concernItem-box-title">
              <div class="dp--center">
                {{ item.keyword }}
                <div
                  class="concernItem-box-img"
                  v-if="expandState"
                  @click.stop="archiveKeyword($event, item._key, index)"
                >
                  <img src="/common/fly.svg" alt="" />
                </div>
              </div>
              <div class="dp-center-center" v-if="expandState">
                <div
                  class="concernItem-box-icon icon-point"
                  style="margin-left: 10px"
                  @click="deleteKeyword(item._key, index)"
                >
                  <el-icon :size="16" color="#b3b3b3"><Delete /></el-icon>
                </div>
              </div>
            </div>
            <template v-if="expandState">
              <div
                class="concernItem-box-subtitle"
                v-for="(sentenceItem, sentenceIndex) in item.sentence"
                :key="`sentence${sentenceIndex}`"
              >
                <span
                  v-for="(wordItem, wordIndex) in sentenceItem"
                  :key="`word${wordIndex}`"
                  :style="
                    wordItem === item.keyword
                      ? {
                          background: '#e8e9ff',
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
            </template>
          </div>
        </div>
        <div
          class="keyword-expand icon-point dp-center-center"
          @click="expandState = !expandState"
        >
          {{ expandState ? "详细模式" : "简洁模式" }}
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
        type="outer"
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
      .keyword-tab {
        width: 100%;
        height: 50px;
        @include flex(flex-start, center, null);
        .keyword-tab-item {
          width: 50%;
          height: 50px;
          font-size: 16px;
          color: #919191;
          line-height: 50px;
          text-align: center;
          cursor: pointer;
        }
        .keyword-tab-choose {
          height: 45px;
          font-size: 20px;
          color: #000000;
          line-height: 45px;
        }
      }
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
      .keyword-box {
        width: 100%;
        height: calc(100vh - 190px);
        padding: 10px 15px 10px 27px;
        box-sizing: border-box;
        @include scroll();

        .concernItem-box {
          background: #fff;
          border-radius: 12px;
          margin-bottom: 22px;
          box-shadow: 0px 2px 5px 0px rgba(178, 178, 178, 0.5);
          @include p-number(14px, 28px);
          .concernItem-box-title {
            width: 100%;
            height: 32px;
            font-size: 30px;
            font-family: DIN Black, DIN Black-Black;
            font-weight: 900;
            line-height: 32px;
            margin-bottom: 6px;
            color: #4d57ff;
            @include flex(space-between, center, null);
            .concernItem-box-img {
              width: 26px;
              height: 26px;
              margin-left: 16px;
              overflow: hidden;
              cursor: pointer;
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
            .concernItem-box-icon {
              @include flex(center, center, null);
            }
          }
          .concernItem-box-subtitle {
            width: 100%;
            font-size: 18px;
            color: #333333;
            line-height: 32px;
          }
          .concernItem-box-content {
            font-size: 16px;
            line-height: 28px;
            white-space: pre-wrap;
            color: #4d57ff;
            @include p-number(10px, 10px);
          }
          &:hover {
            box-shadow: 0px 2px 10px 0px rgba(78, 78, 78, 0.5);
          }
        }
      }
    }
  }
}
</style>
<style>
.fly-div {
  width: 40px;
  height: 40px;
  position: fixed;
  z-index: 10;
}
.fly-div img {
  width: 100%;
  height: 100%;
}
</style>
