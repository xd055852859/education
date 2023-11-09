<script setup lang="ts">
import Header from "@/components/header.vue";
import FontIcon from "@/components/fontIcon.vue";
import Keyword from "@/components/keyword.vue";
import IframeView from "@/components/iframeView.vue";
import AudioPlayer from "@/components/audioPlayer.vue";
import "vue3-video-play/dist/style.css";
import { videoPlay } from "vue3-video-play";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import Timeline3d from "@/components/timeline3d.vue";
import _ from "lodash";
import WordChart from "@/components/chart/wordChart.vue";
const { token } = storeToRefs(appStore.authStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const { lessonKey, lessonInfo } = storeToRefs(appStore.lessonStore);
const { setLessonKey } = appStore.lessonStore;
const props = defineProps<{
  lessonKey: string;
}>();
const studyTab = ref<string>("original");
const articleList = ref<any>([]);
const cnOriginal = ref<boolean>(false);
const original = ref<string>("");
const oldOriginal = ref<string>("");

const originalList = ref<any>([]);
const translationList = ref<any>([]);
const originalTextList = ref<any>([]);
const translationTextList = ref<any>([]);
const mediaList = ref<any>([]);
const captionsList = ref<any>([]);
const captionsTextList = ref<any>([]);
const mediaSrc = ref<string>("");
const audioSrc = ref<string>("");
const audioIndex = ref<number>(-1);
const mediaContnet = ref<any>([]);
const captionsState = ref<boolean>(false);
const lastTime = ref<number>(0);
const mediaIndex = ref<number>(-1);
const sentenceKey = ref<string>("");
const sentenceIndex = ref<number>(-1);
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const keyIndex = ref<number>(-1);
const audioRef = ref<any>(null);
const videoRef = ref<any>(null);
const studyInterval = ref<any>(null);
const chooseIndex = ref<number>(-1);
const noteVisible = ref<boolean>(false);
const noteUrl = ref<string>("");
const textList = ref<any>([]);
const studyAudioRef = ref<any>(null);
onMounted(() => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
  // videoRef.value.pause();
  setLessonKey(props.lessonKey);
  getMedia();
});
onUnmounted(() => {
  if (studyInterval.value) {
    clearInterval(studyInterval.value);
  }
});
const getMedia = async () => {
  let mediaRes = (await api.request.get("media", {
    resourceKey: props.lessonKey,
  })) as ResultProps;
  if (mediaRes.msg === "OK") {
    mediaList.value = mediaRes.data;
    mediaIndex.value = 0;
  }
};
const getArticleList = async (key) => {
  let list: any = [];
  let obj: any = {};
  let articleRes = (await api.request.get("section", {
    mediaKey: key,
  })) as ResultProps;
  if (articleRes.msg === "OK") {
    articleList.value = articleRes.data.map((item) => {
      item.original = item.original.match(/\b\w+\b/g);
      list.push(...item.original);
      return item;
    });
    list.forEach((item) => {
      obj[item] = {
        name: item,
        value: obj[item] ? obj[item].value + 1 : 1,
      };
    });
    textList.value = Object.values(obj);
  }
};
const getCaption = async (key) => {
  let captionaRes = (await api.request.get("caption", {
    mediaKey: key,
  })) as ResultProps;
  if (captionaRes.msg === "OK") {
    captionsList.value = captionaRes.data.map((item, index) => {
      item.original = item.original.replace(/\n/g, "").match(/\b\w+\b/g);
      return item;
    });
    console.log(captionsList.value);
  }
};
// const openText = async (text, callback) => {
//   let textRes = (await api.request.get(
//     "",
//     {
//       text: text,
//     },
//     false,
//     "http://dictdata.qingtime.cn/getWords"
//   )) as ResultProps;
//   if (textRes.msg === "OK") {
//     callback(textRes.data);
//   }
// };
//video
const onPlay = (ev) => {
  audioRef.value.pause();
};
const onPause = (ev) => {
  console.log(ev, "暂停");
};

const onTimeupdate = async (ev) => {
  if (lastTime.value !== parseInt(ev.target.currentTime)) {
    let currentTime = ev.target.currentTime * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item, index) => {
      if (item.startTime < currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        captionsTextList.value = item.original;
        keyIndex.value = index;
        sentenceKey.value = item._key;
      }
    });

    if (!captionsState.value) {
      captionsTextList.value = [];
      keyIndex.value = -1;
    }
    lastTime.value = parseInt(ev.target.currentTime);
  }
};
const onCanplay = (ev) => {
  console.log(ev, "可以播放");
};
const audioTimeupdate = (time) => {
  if (lastTime.value !== parseInt(time)) {
    let currentTime = time * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item, index) => {
      if (item.startTime < currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        audioIndex.value = index;
        sentenceKey.value = item._key;
      }
    });

    // if (!captionsState.value) {
    //   console.log("????")
    //   audioIndex.value = -1;
    //   sentenceKey.value = "";
    // }
    if (studyAudioRef.value) {
      let divDomList: any = document.getElementsByClassName(
        "study-audio-caption"
      );
      let textDomList: any = divDomList[0].getElementsByClassName("text-item");

      console.log(textDomList[audioIndex.value].offsetTop);
      if (
        textDomList[audioIndex.value].offsetTop >
        divDomList[0].offsetHeight / 2
      ) {
        divDomList[0].scrollTo({
          top:
            textDomList[audioIndex.value].offsetTop -
            divDomList[0].offsetHeight / 2,
          behavior: "smooth",
        });
      }
    }
    lastTime.value = parseInt(time);
  }
};
const changeAudioIndex = (type) => {
  if (type === "last") {
    audioIndex.value = audioIndex.value === 0 ? 0 : audioIndex.value - 1;
  } else {
    console.log(captionsList.value.length);
    console.log(audioIndex.value);
    audioIndex.value =
      captionsList.value.length - 1 === audioIndex.value
        ? audioIndex.value
        : audioIndex.value + 1;
  }
  console.log(audioIndex.value);
  sentenceKey.value = captionsList.value[audioIndex.value]._key;
  clickAudio(captionsList.value[audioIndex.value].startTime);
};

const clickAudio = (time, type?: string) => {
  let currentTime = time / 1000;
  console.log(currentTime);
  studyAudioRef.value.handleTimeChange(currentTime, type);
};
const reloadAudio = (time, index) => {
  if (time * 1000 >= captionsList.value[index].endTime) {
    audioIndex.value = index;
    sentenceKey.value = captionsList.value[index]._key;
    clickAudio(captionsList.value[index].startTime);
  }
};
const chooseWord = async (word, index, type: string, key: string) => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
  keyword.value = word;
  keyIndex.value = index;

  let obj: any = {
    agentKey: agentKey.value,
    keyword: word,
    // type: word.length === 1 ? 1 : 2,
    type: 1,
  };
  sentenceKey.value = key;
  if (type === "section") {
    obj.sectionKey = key;
  } else {
    console.log(type, key);
    obj.captionKey = key;
  }
  let wordRes = (await api.request.post("study/keyword", {
    ...obj,
  })) as ResultProps;
  if (wordRes.msg === "OK") {
    keywordKey.value = wordRes.data._key;
  }
};
const clickNode = () => {
  noteVisible.value = !noteVisible.value;
  if (noteVisible.value) {
    const getApi = api.API_URL + "study/note/detail";
    const getParams = `{"agentKey": "${agentKey.value}","resourceKey": "${props.lessonKey}" }`;
    const patchApi = api.API_URL + "study/note";
    const uptokenApi = api.API_URL + "account/qiniuToken";
    const uptokenParams = `{"target": "cdn-feisuo"}`;
    noteUrl.value = `https://mind.qingtime.cn/?token=${token.value}&getDataApi={"url":"${getApi}","params":${getParams},"docDataName":"content"}&patchDataApi={"url":"${patchApi}","params":${getParams},"docDataName":"note"}&getUptokenApi={"url":"${uptokenApi}","params":${uptokenParams}}&isEdit=2&hideHead=1`;
  }
};
watch([mediaIndex, lessonInfo], ([newIndex, newInfo]) => {
  // audioRef.value.pause();
  // videoRef.value.pause();
  if (newInfo && mediaList.value.length > 0) {
    if (audioRef.value) {
      audioRef.value.pause();
    }
    if (videoRef.value) {
      videoRef.value.pause();
    }
    mediaSrc.value = mediaList.value[newIndex].url;
    if (newInfo.mediaType !== "pdf") {
      getCaption(mediaList.value[newIndex]._key);
    }
    getArticleList(mediaList.value[newIndex]._key);
    if (studyInterval.value) {
      clearInterval(studyInterval.value);
    }
    //1分钟一次
    studyInterval.value = setInterval(() => {
      api.request.post("study/log", {
        agentKey: agentKey.value,
        mediaKey: mediaList.value[newIndex]._key,
      });
    }, 60000);
  }
});
watch(studyTab, (newTab) => {
  if (audioRef.value) {
    audioRef.value.pause();
  }
  if (videoRef.value) {
    videoRef.value.pause();
  }
  sentenceKey.value = "";
  keyIndex.value = -1;
});
</script>
<template>
  <div class="study" v-if="lessonInfo">
    <Header :title="lessonInfo.name" :backPath="'/home'">
      <template #icon>
        <el-dropdown>
          <div class="icon-point" style="margin-right: 8px">
            <FontIcon iconName="liebiao" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                @click="mediaIndex = index"
                v-for="(item, index) in mediaList"
                :key="`media${item._key}`"
                >{{ item.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </Header>
    <!-- class="study-audio" -->
    <!-- <video autoPlay controls ref="audioRef">
      <source :src="audioSrc" type="audio/mpeg" />
    </video> -->
    <audio
      :src="audioSrc"
      ref="audioRef"
      controls
      autoplay
      class="study-read"
    ></audio>
    <div class="study-container">
      <div class="study-left">
        <el-tabs v-model="studyTab">
          <el-tab-pane name="original" label="原文">
            <div class="study-box" v-if="articleList.length > 0">
              <div
                v-for="(item, index) in articleList"
                :key="`original${index}`"
                class="text-item"
                :style="sentenceKey === item._key ? { color: '#4D57FF' } : {}"
              >
                <div style="width: 2em"></div>
                <span
                  v-for="(textItem, textIndex) in item.original"
                  :key="`originalText${textIndex}`"
                  @click="chooseWord(textItem, textIndex, 'section', item._key)"
                  :style="
                    keyword === textItem
                      ? {
                          color: '#333333',
                          background: '#ffe3b5',
                          padding: '2px 4px',
                          boxSizing: 'border-box',
                        }
                      : { padding: '2px 4px', boxSizing: 'border-box' }
                  "
                  >{{ textItem }}</span
                >
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane name="cloud" label="词频"> </el-tab-pane>
          <el-tab-pane name="translation" label="译文">
            <div
              class="study-box"
              v-if="articleList.length > 0"
              style="text-indent: 2em"
            >
              <div
                v-for="(item, index) in articleList"
                :key="`translation${index}`"
                class="text-item icon-point"
                :style="
                  item && sentenceKey === item._key ? { color: '#4D57FF' } : {}
                "
              >
                {{ item.translation }}
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane
            name="video"
            label="视频"
            v-if="lessonInfo.mediaType === 'video'"
          >
            <div class="study-box">
              <videoPlay
                id="captionsVideo"
                ref="videoRef"
                :title="lessonInfo.name"
                :poster="lessonInfo.icon"
                width="100%"
                :src="mediaSrc"
                @play="onPlay"
                @pause="onPause"
                @timeupdate="onTimeupdate"
                @canplay="onCanplay"
                crossOrigin="Anonymous"
                background=" #000000"
                class="study-video"
                :autoPlay="false"
                :control="false"
              />

              <!-- <div
                  v-for="(item, index) in originalList"
                  :key="`originalCaption${index}`"
                  class="text-item"
                  :style="
                    item && sentenceKey === item._key
                      ? { color: '#4D57FF' }
                      : {}
                  "
                  @click="sentenceKey = item._key"
                >
                  <template v-if="item?.text">
                    <span
                      v-for="(textItem, textIndex) in item.text"
                      :key="`originalCaptionText${textIndex}`"
                      @click="
                        sentenceKey === item._key
                          ? chooseWord(textItem, textIndex)
                          : null
                      "
                      :style="
                        sentenceKey === item._key && textIndex === keyIndex
                          ? {
                              color: '#333333',
                              background: '#ffe3b5',
                              padding: '2px 4px',
                              boxSizing: 'border-box',
                            }
                          : {}
                      "
                      >{{ textItem }}{{ cnOriginal ? "" : " " }}</span
                    >
               <span
                    v-for="(wordItem, wordIndex) in textItem"
                    :key="`originalWord${item._key}`"
                  >
                    {{ wordItem }}
                  </span> 
                  </template>
                </div> -->
              <div class="study-caption">
                <div class="study-original">
                  <span
                    v-for="(item, index) in captionsTextList"
                    :key="`originalCaption${index}`"
                    @click="chooseWord(item, index, 'caption', item._key)"
                    :style="
                      keyword === item && index === keyIndex
                        ? {
                            color: '#333333',
                            background: '#ffe3b5',
                            padding: '2px 4px',
                            boxSizing: 'border-box',
                          }
                        : { padding: '2px 4px', boxSizing: 'border-box' }
                    "
                  >
                    {{ item }}
                  </span>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane
            name="audio"
            label="音频"
            v-if="lessonInfo.mediaType === 'audio'"
          >
            <div class="study-box">
              <div class="study-caption study-audio-caption">
                <div
                  v-for="(item, index) in captionsList"
                  :key="`caption${index}`"
                  class="text-item"
                  style="padding-left: 10px"
                >
                  <FontIcon
                    iconName="a-bofang1"
                    customClassName="study-audio-icon"
                    :iconStyle="{ fontSize: '12px', color: '#4D57FF' }"
                    v-if="index === audioIndex"
                  />
                  <div
                    class="study-original"
                    :style="
                      sentenceKey === item._key ? { color: '#4D57FF' } : {}
                    "
                    @click="clickAudio(item.startTime, 'out')"
                  >
                    <span
                      v-for="(textItem, textIndex) in item.original"
                      :key="`originalCaption${textIndex}`"
                      @click="
                        chooseWord(textItem, textIndex, 'caption', item._key)
                      "
                      :style="
                        keyword === textItem && textIndex === keyIndex
                          ? {
                              color: '#333333',
                              background: '#ffe3b5',
                              padding: '2px 4px',
                              boxSizing: 'border-box',
                            }
                          : { padding: '2px 4px', boxSizing: 'border-box' }
                      "
                      >{{ textItem }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="study-audio" v-if="lessonInfo">
                <AudioPlayer
                  :src="mediaSrc"
                  :title="lessonInfo.name"
                  :cover="lessonInfo.cover"
                  :audioIndex="audioIndex"
                  @audioTimeupdate="audioTimeupdate"
                  @changeAudioIndex="changeAudioIndex"
                  @reloadAudio="reloadAudio"
                  ref="studyAudioRef"
                />
                <!-- <videoPlay
                  id="captionsVideo"
                  ref="videoRef"
                  :title="lessonInfo.name"
                  :poster="lessonInfo.icon"
                  width="100%"
                  height="100%"
                  :src="mediaSrc"
                  @play="onPlay"
                  @pause="onPause"
                  @timeupdate="onTimeupdate"
                  @canplay="onCanplay"
                  crossOrigin="Anonymous"
                  background=" #000000"
                  :autoPlay="false"
                /> -->
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="study-cloud" v-if="studyTab === 'cloud'" style="top: 54px">
          <WordChart
            :chartData="textList"
            :wordId="'study-word'"
            v-if="textList.length > 0"
          />
        </div>
      </div>
      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
      />
      <!-- <div class=""></div> -->
    </div>
    <div class="study-note-tree" v-if="noteVisible">
      <IframeView :url="noteUrl" />
    </div>

    <!-- <div
      class="study-note-button"
      @click="clickNode"
      :style="
        noteVisible
          ? { top: '6px', right: '70px' }
          : { top: '30px', right: '30px' }
      "
    >
      <FontIcon iconName="biji" />
    </div> -->
  </div>
</template>
<style scoped lang="scss">
.study {
  width: 100vw;
  height: 100vh;
  align-content: flex-start;
  @include p-number(34px, 0px);
  @include flex(center, center, wrap);
  .study-container {
    width: 100vw;
    height: calc(100vh - 120px);
    margin-top: 25px;
    padding: 0px 119px 0px 78px;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    @include flex(space-between, center, null);
    .study-left {
      min-width: 1120px;
      flex: 1;
      height: 100%;
      position: relative;
      z-index: 1;
      .study-box {
        width: 100%;
        height: calc(100vh - 190px);
        font-family: "Kaiti SC", "STKaiti", "Arial", sans-serif;
        padding: 10px;
        // text-indent: 2em;
        box-sizing: border-box;
        @include scroll();

        .text-item {
          width: 100%;
          font-size: 26px;
          color: #333333;
          line-height: 55px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          // word-wrap: break-word;
          // word-break: normal;
          @include flex(flex-start, center, wrap);
          &:hover {
            color: $commonColor;
          }
          span {
            &:hover {
              cursor: pointer;
              color: #fff;
              background-color: $commonColor;
              padding: 10px 0px;
              box-sizing: border-box;
            }
          }
        }
        .study-video {
          width: 100%;
          height: calc(100% - 165px);
          padding: 0px;
        }
        .study-audio {
          width: 100%;
          height: 100px;
          padding: 0px;
        }
        .study-caption {
          width: 100%;
          height: 165px;
          background-color: #161620;
          color: #fff;
          text-indent: 0em;
          // @include p-number(20px, 0px);
          @include scroll();
          .study-original {
            width: 100%;
            font-size: 24px;
            line-height: 28px;
            text-align: left;
            margin-bottom: 6px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;
            > span {
              cursor: pointer;
              // @include p-number(0px, 5px);
              &:hover {
                padding: 2px 0px;
                box-sizing: border-box;
                background-color: $commonColor;
              }
            }
          }
          .study-translation {
            width: 100%;
            font-size: 18px;
            line-height: 22px;
            text-align: left;
            word-break: break-all;
            // text-indent: 3.1em;
          }
        }
        .study-audio-caption {
          height: calc(100% - 100px);
          background: #fff;
          color: #333;
          .study-audio-icon {
            width: 55px;
            height: 55px;
            position: absolute;
            z-index: 2;
            left: 0px;
            top: -8px;
            // @include flex(center, center, null);
          }
          .text-item {
            &:hover {
              color: #333;
            }
          }
        }
      }
      .study-cloud {
        width: 100%;
        height: calc(100vh - 190px);
        position: absolute;
        z-index: 1;
        left: 0px;
      }
    }
  }

  .study-read {
    opacity: 1;
    position: fixed;
    z-index: -1;
    top: -100px;
    left: 0px;
  }
  .study-note-tree {
    width: 100vw;
    height: 100vh;
    position: fixed;
    z-index: 3;
    top: 0px;
    right: 0px;
    cursor: pointer;
  }
  .study-note-button {
    position: fixed;
    z-index: 4;
    cursor: pointer;
  }
}
</style>
<style>
/* .d-control-progress{
  height:40px !important;
}*/
</style>
