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
import { is_mobile } from "@/services/util";
const props = defineProps<{
  tab: string;
}>();
const { deviceType } = storeToRefs(appStore.commonStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const keywordTab = ref<string>("");
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const keywordIndex = ref<number>(-1);
const archivedNum = ref<number>(0);
const keywordNum = ref<number>(0);
const masterNum = ref<number>(0);
const expandState = ref<boolean>(false);
const page = ref<number>(1);
const total = ref<number>(0);
const keywordList = ref<any>([]);
const keywordVisible = computed(
  () => keyword.value !== "" && deviceType.value === "phone"
);
onMounted(() => {
  keywordTab.value = props.tab;
  //@ts-ignore
  expandState.value = localStorage.getItem("expandState") === "true";
});
const setKeyword = (word, wordKey, wordIndex) => {
  keyword.value = word;
  keywordKey.value = wordKey;
  keywordIndex.value = wordIndex;
};
const getNumData = async () => {
  let dataRes = (await api.request.get("study/keyword/summary", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    archivedNum.value = dataRes.data.archivedNum;
    keywordNum.value = dataRes.data.keywordNum;
    masterNum.value = dataRes.data.masterNum;
  }
};
const addNum = (num, type?: string) => {
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
    isArchived: keywordTab.value === "care",
    status: keywordTab.value === "master" ? 0 : 1,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    if (page.value === 1) {
      keywordList.value = [];
    }
    dataRes.data.forEach((item, index) => {
      if (item.note) {
        item.note = item.note.replace(/\n/g, "<br/>");
      }
      item.expandState = false;
      item.sentence = item.sentence.map((sentenceItem, sentenceIndex) => {
        let reg = new RegExp(`${item.keyword}`, "g");
        sentenceItem = Array.isArray(sentenceItem)
          ? sentenceItem.join("")
          : sentenceItem;
        if (!Array.isArray(sentenceItem.sentence)) {
          sentenceItem.sentence = sentenceItem.sentence
            .replace(reg, `#${item.keyword}#`)
            .split("#");
        }
        return sentenceItem;
      });
    });
    keywordList.value.push(...dataRes.data);
    total.value = dataRes.total as number;
  }
};

const archiveKeyword = async (e, item, index, type, toType) => {
  if (type !== "master") {
    let dataRes = (await api.request.patch("study/keyword/archive", {
      keywordKey: item._key,
      isArchived: type === "uncare",
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      // ElMessage.success("归档成功");
      ElMessage.success(type === "uncare" ? "标记熟词成功" : "标记生词成功");
      addNum(type === "uncare" ? -1 : 1);
      keywordList.value.splice(index, 1);
    }
  } else {
    let dataRes = (await api.request.patch("study/keyword/status", {
      agentKey: agentKey.value,
      keywordKey: item._key,
      status: 1,
      isArchived: toType === "care",
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      ElMessage.success(toType === "care" ? "转入熟词成功" : "转入生词成功");
      masterNum.value = masterNum.value - 1;
      if (toType === "care") {
        archivedNum.value = archivedNum.value + 1;
      } else {
        keywordNum.value = keywordNum.value + 1;
      }
      keywordList.value.splice(index, 1);
    }
  }
  // if (!is_mobile()) {
  //   let uncareDom = document.getElementById(type);
  //   let left = e.pageX - e.target.offsetWidth / 2;
  //   let top = e.pageY - e.target.offsetWidth / 2;

  //   let targetLeft = uncareDom?.offsetLeft as number;
  //   let targetTop = uncareDom?.offsetTop as number;
  //   let targetWidth = uncareDom?.offsetWidth as number;
  //   let targetHeight = uncareDom?.offsetHeight as number;
  //   let bar = document.createElement("div");
  //   let img = document.createElement("img");
  //   img.src = `/common/care.svg`;
  //   bar.appendChild(img);
  //   bar.className = "fly-div";
  //   bar.style.left = left + "px";
  //   bar.style.top = top + "px";
  //   bar.style.transition =
  //     "left 1s linear, top 1s cubic-bezier(0,0.87,0.36,0.8)";
  //   document.body.appendChild(bar);
  //   // 添加动画属性
  //   let timer = setTimeout(() => {
  //     bar.style.left = targetLeft + targetWidth / 2 + "px";
  //     bar.style.top = targetTop + targetHeight * 2 + "px";
  //   }, 0);

  //   // /**
  //   //  * 动画结束后，删除自己
  //   //  */
  //   bar.ontransitionend = function () {
  //     // this.remove();

  //     if (document.body.contains(bar)) {
  //       document.body.removeChild(bar);
  //     }
  //     clearTimeout(timer);
  //   };
  // }
};
const deleteKeyword = async (item, index) => {
  let dataRes = (await api.request.patch("study/keyword/status", {
    agentKey: agentKey.value,
    keywordKey: item._key,
    status: 0,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    ElMessage.success("搞定!");
    if (keywordTab.value === "uncare") {
      keywordNum.value = keywordNum.value - 1;
      masterNum.value = masterNum.value + 1;
    } else if (keywordTab.value === "care") {
      archivedNum.value = archivedNum.value - 1;
      masterNum.value = masterNum.value + 1;
    }
    keywordList.value.splice(index, 1);
  }
};
const chooseWord = (word, wordKey, wordIndex) => {
  setKeyword(word, wordKey, wordIndex);
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
const changeExpand = () => {
  expandState.value = !expandState.value;
  localStorage.setItem("expandState", expandState.value + "");
};
const reloadData = (key: string, note: string) => {
  keywordList.value[keywordIndex.value].note = note;
};
watch(keywordTab, () => {
  page.value === 1;
  keyword.value = "";
  keywordKey.value = "";
  keywordIndex.value = -1;
});
watchEffect(() => {
  if (keywordTab.value && agentKey.value) {
    getNumData();
    getData();
  }
});
</script>
<template>
  <div class="keyword" :class="{ 'keyword-phone': deviceType === 'phone' }">
    <!-- class="study-audio" -->
    <!-- <video autoPlay controls ref="audioRef">
      <source :src="audioSrc" type="audio/mpeg" />
    </video> -->
    <div class="keyword-container">
      <div class="keyword-left">
        <Header :title="'词库'" :backPath="'/home'" />
        <div class="keyword-tab">
          <div
            class="keyword-tab-item"
            :class="{
              'keyword-tab-choose': keywordTab === 'uncare',
              'keyword-tab-first': keywordTab === 'uncare',
            }"
            style="padding-right: 16%"
            @click="keywordTab = 'uncare'"
            id="uncare"
          >
            <img
              :src="
                keywordTab === 'uncare'
                  ? '/overview/logo1.svg'
                  : '/overview/unlogo1.svg'
              "
              alt=""
              style="margin-right: 5px"
            />

            {{ `生词库 (${keywordNum})` }}
          </div>
          <div
            class="keyword-tab-item keyword-tab-second"
            :class="{ 'keyword-tab-choose': keywordTab === 'care' }"
            :style="
              keywordTab === 'care'
                ? {
                    backgroundImage: `url('/common/careBg.png')`,
                    color: '#ff5660',
                  }
                : {
                    backgroundImage: `url('/common/uncareBg.png')`,
                    backgroundColor: 'transparent',
                  }
            "
            @click="keywordTab = 'care'"
            id="care"
          >
            <img
              :src="
                keywordTab === 'care'
                  ? '/overview/logo2.svg'
                  : '/overview/unlogo2.svg'
              "
              alt=""
              style="margin-right: 5px"
            />
            {{ `熟词库 (${archivedNum})` }}
          </div>
          <div
            class="keyword-tab-item"
            :class="{
              'keyword-tab-choose': keywordTab === 'master',
              'keyword-tab-third': keywordTab === 'master',
            }"
            style="padding-left: 16%"
            @click="keywordTab = 'master'"
          >
            <img
              :src="
                keywordTab === 'master'
                  ? '/overview/logo4.svg'
                  : '/overview/unlogo4.svg'
              "
              alt=""
              style="margin-right: 5px"
            />
            {{ `搞定(${masterNum})` }}
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
            @click="
              chooseWord(item.keyword, item._key, index);
              item.expandState = !item.expandState;
            "
          >
            <div class="concernItem-box-title">
              {{ item.keyword }}
              <div class="dp--center">
                <div
                  class="concernItem-box-img"
                  v-if="
                    keywordTab === 'care' && !(expandState || item.expandState)
                  "
                  @click.stop="
                    archiveKeyword($event, item, index, keywordTab, 'care')
                  "
                  style="
                    background: linear-gradient(
                      233deg,
                      #56b9ff 22%,
                      #5478fa 79%
                    );
                  "
                >
                  <FontIcon
                    iconName="jiantou1"
                    :iconStyle="{
                      marginRight: '5px',
                      fontSize: '8px',
                      color: '#fff',
                    }"
                  />
                  生词
                </div>
                <div
                  class="concernItem-box-img"
                  v-if="keywordTab !== 'care'"
                  @click.stop="
                    archiveKeyword($event, item, index, keywordTab, 'care')
                  "
                  style="
                    margin-left: 10px;
                    background: linear-gradient(
                      233deg,
                      #ffa48d 22%,
                      #ff5660 79%
                    );
                  "
                >
                  <FontIcon
                    iconName="jiantou1"
                    :iconStyle="{
                      marginRight: '5px',
                      fontSize: '8px',
                      color: '#fff',
                    }"
                  />
                  熟词
                </div>
                <div
                  class="concernItem-box-img"
                  style="
                    margin-left: 10px;
                    background: linear-gradient(
                      233deg,
                      #efc73a 22%,
                      #ffa73e 79%
                    );
                  "
                  v-if="keywordTab === 'care'"
                  @click.stop="deleteKeyword(item, index)"
                >
                  <img src="/common/keyLogo.svg" alt="" />
                  搞定
                </div>
              </div>
            </div>
            <template v-if="expandState || item.expandState">
              <div
                class="concernItem-box-subtitle"
                v-for="(sentenceItem, sentenceIndex) in item.sentence"
                :key="`sentence${sentenceIndex}`"
              >
                <span
                  v-for="(wordItem, wordIndex) in sentenceItem.sentence"
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
                <div class="concernItem-box-resource">
                  From {{ sentenceItem.resourceName }} -
                  {{ sentenceItem.mediaName }}
                </div>
              </div>
              <!-- <div
                v-if="item.note"
                class="concernItem-box-content"
                style="padding-top: 0px; padding-bottom: 0px"
              ></div> -->
              <div
                class="concernItem-box-content"
                v-if="item.note"
                v-html="`笔记：<br/>${item.note}`"
              ></div>
              <div
                class="concernItem-box-button"
                v-if="keywordTab === 'care'"
                @click.stop="
                  archiveKeyword($event, item, index, keywordTab, 'uncare')
                "
              >
                设为生词
              </div>
            </template>
          </div>
        </div>
        <div
          class="keyword-expand icon-point dp-center-center"
          @click="changeExpand"
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
        @reloadData="reloadData"
        v-if="deviceType === 'pc'"
      />
      <el-drawer
        v-model="keywordVisible"
        direction="rtl"
        size="80%"
        :with-header="false"
        :append-to-body="true"
        @close="(keyword = ''), (keywordKey = '')"
      >
        <Keyword
          :keyword="keyword"
          :keywordKey="keywordKey"
          @setKeyword="keyword = ''"
          type="outer"
          @reloadData="reloadData"
        />
      </el-drawer>
    </div>
  </div>
</template>
<style scoped lang="scss">
.keyword {
  width: 100vw;
  height: 100%;
  align-content: flex-start;
  padding: 0px 0px 34px 0px;
  box-sizing: border-box;
  @include flex(center, center, wrap);
  background-color: #f9f9f9;

  .keyword-container {
    width: 100vw;
    height: 100%;
    @include flex(center, center, null);

    .keyword-left {
      flex: 1;
      height: 100%;
      position: relative;
      z-index: 1;
      align-content: flex-start;
      @include flex(center, center, wrap);
      .keyword-tab {
        width: 90%;
        height: 46px;
        position: relative;
        z-index: 1;
        padding: 0px 25px;
        box-sizing: border-box;
        margin-bottom: 20px;
        @include flex(space-between, center, null);

        .keyword-tab-item {
          width: 50%;
          height: 46px;
          font-size: 16px;
          color: #919191;
          line-height: 46px;
          text-align: center;
          box-sizing: border-box;
          background-color: #fff;
          cursor: pointer;
          @include flex(center, center, null);
          img {
            width: 19px;
            height: 19px;
          }
        }

        .keyword-tab-choose {
          height: 45px;
          line-height: 45px;
          img {
            width: 25px;
            height: 25px;
          }
        }
        .keyword-tab-first {
          color: #5478fb;
          background-color: #ebeefc;
        }
        .keyword-tab-second {
          width: 40%;
          position: absolute;
          z-index: 2;
          top: 0px;
          left: 31%;
          background-position: center center;
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }
        .keyword-tab-third {
          padding-left: 7%;
          box-sizing: border-box;
          color: #eb930c;
          background-color: #ffecd2;
        }
        img {
          width: 25px;
          height: 25px;
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
        width: 90%;
        height: calc(100% - 150px);
        padding: 10px 15px 10px 27px;
        box-sizing: border-box;
        @include scroll();

        .concernItem-box {
          background: #fff;
          // border-radius: 12px;
          margin-bottom: 22px;
          box-shadow: 0px 2px 5px 0px rgba(178, 178, 178, 0.5);
          position: relative;
          z-index: 1;
          padding: 14px 28px 28px 35px;
          box-sizing: border-box;
          // @include p-number(14px, 28px);

          .concernItem-box-title {
            width: 100%;
            height: 32px;
            font-size: 30px;
            font-weight: 900;
            line-height: 32px;
            margin-bottom: 6px;
            color: #4d57ff;
            @include flex(space-between, center, null);

            .concernItem-box-img {
              width: 85px;
              height: 35px;
              border-radius: 14px;
              font-size: 14px;
              color: #ffffff;
              cursor: pointer;
              @include flex(center, center, null);
              img {
                width: 20px;
                height: 20px;
                margin-right: 5px;
              }
            }

            .concernItem-box-icon {
              width: 30px;
              height: 30px;
              @include flex(center, center, null);

              img {
                width: 100%;
                height: 100%;
              }
            }
          }

          .concernItem-box-subtitle {
            width: 100%;
            font-size: 20px;
            color: #333333;
            line-height: 32px;
          }
          .concernItem-box-resource {
            width: 100%;
            height: 20px;
            font-size: 16px;
            color: #999999;
            line-height: 20px;
            margin: 10px 0px;
          }
          .concernItem-box-content {
            font-size: 16px;
            line-height: 28px;
            white-space: pre-wrap;
            color: #4d57ff;
            @include p-number(10px, 10px);
          }
          .concernItem-box-button {
            position: absolute;
            z-index: 2;
            right: 30px;
            bottom: 15px;
            font-size: 16px;
            color: #999999;
            cursor: pointer;
          }
          &:hover {
            box-shadow: 0px 2px 10px 0px rgba(78, 78, 78, 0.5);
          }
        }
      }
    }
  }
}
.keyword-phone {
  .keyword-container {
    .keyword-left {
      .keyword-tab {
        height: 46px;
        .keyword-tab-second {
          width: 33%;
          height: 100%;
          left: 33%;
          background-size: 100% 100%;
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
