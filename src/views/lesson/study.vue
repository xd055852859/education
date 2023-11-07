<script setup lang="ts">
import Header from "@/components/header.vue";
import FontIcon from "@/components/fontIcon.vue";
import Keyword from "@/components/keyword.vue";
import IframeView from "@/components/iframeView.vue";
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
const translation = ref<string>("");
const oldOriginal = ref<string>("");
const oldTranslation = ref<string>("");
const originalList = ref<any>([]);
const translationList = ref<any>([]);
const originalTextList = ref<any>([]);
const translationTextList = ref<any>([]);
const mediaList = ref<any>([]);
const captionsList = ref<any>([]);
const mediaSrc = ref<string>("");
const audioSrc = ref<string>("");
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
const setStudyTime = () => {};
const getMedia = async () => {
  let mediaRes = (await api.request.get("media", {
    resourceKey: props.lessonKey,
  })) as ResultProps;
  if (mediaRes.msg === "OK") {
    mediaList.value = mediaRes.data;
    mediaIndex.value = 0;
  }
};
const getCaption = async (key) => {
  let list: any = [];
  let obj: any = {};
  let captionaRes = (await api.request.get("caption", {
    mediaKey: key,
  })) as ResultProps;
  if (captionaRes.msg === "OK") {
    captionsList.value = captionaRes.data;
    captionaRes.data.forEach((item, index) => {
      item.original = item.original.replace(/\n/g, "");
      if (item.translation) {
        item.translation = item.translation.replace(/\n/g, "");
      }
      originalList.value[index] = {
        _key: item._key,
        text: item.original.match(/\b\w+\b/g),
      };
      list.push(...item.original.match(/\b\w+\b/g));
      // translationList.value[index] = {
      //   _key: item._key,
      //   text: item.translation,
      // };
      translationList.value[index] = item.translation;
      // cnOriginal.value = new RegExp("[\u4E00-\u9FA5]+").test(item.original);
      // if (cnOriginal.value) {
      //   openText(item.original, (list) => {
      //     originalList.value[index] = { _key: item._key, text: list[0] };
      //   });
      //   if (/[a-zA-Z]+/.test(item.translation)) {
      //     translationList.value[index] = {
      //       _key: item._key,
      //       text: item.translation.match(/\b\w+\b/g),
      //     };
      //   } else {
      //     openText(item.translation, (list) => {
      //       translationList.value[index] = { _key: item._key, text: list[0] };
      //     });
      //   }
      // } else {
      //   openText(item.translation, (list) => {
      //     console.log(list);
      //     translationList.value[index] = { _key: item._key, text: list[0] };
      //   });
      //   if (/[a-zA-Z]+/.test(item.original)) {
      //     originalList.value[index] = {
      //       _key: item._key,
      //       text: item.original.match(/\b\w+\b/g),
      //     };
      //   } else {
      //     openText(item.original, (list) => {
      //       originalList.value[index] = { _key: item._key, text: list[0] };
      //     });
      //   }
      // }
    });
  }
  list.forEach((item) => {
    obj[item] = {
      name: item,
      value: obj[item] ? obj[item].value + 1 : 1,
    };
  });
  console.log(obj);
  textList.value = Object.values(obj);
  console.log(textList.value);
};
const openText = async (text, callback) => {
  let textRes = (await api.request.get(
    "",
    {
      text: text,
    },
    false,
    "http://dictdata.qingtime.cn/getWords"
  )) as ResultProps;
  if (textRes.msg === "OK") {
    callback(textRes.data);
  }
};
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
        original.value = item.original;
        translation.value = item.translation;
        chooseIndex.value = index;
        sentenceKey.value = item._key;
      }
    });

    if (!captionsState.value) {
      original.value = "";
      translation.value = "";
      oldOriginal.value = "";
      oldTranslation.value = "";
      chooseIndex.value = -1;
    } else {
      if (oldOriginal.value !== original.value) {
        originalTextList.value = original.value.match(/\b\w+\b/g);
      }
      if (oldTranslation.value !== translation.value) {
        translationTextList.value = translation.value;
      }

      // if (oldOriginal.value !== original.value) {
      //   if (cnOriginal.value || !/[a-zA-Z]+/.test(original.value)) {
      //     openText(original.value, (list) => {
      //       originalTextList.value = list[0];
      //     });
      //   } else {
      //     originalTextList.value = original.value.match(/\b\w+\b/g);
      //   }
      // }
      // if (oldTranslation.value !== translation.value) {
      //   if (cnOriginal.value || /[a-zA-Z]+/.test(translation.value)) {
      //     translationTextList.value = translation.value.match(/\b\w+\b/g);
      //   } else {
      //     openText(translation.value, (list) => {
      //       translationTextList.value = list[0];
      //     });
      //   }
      // }
    }
    oldOriginal.value = original.value;
    oldTranslation.value = translation.value;
    lastTime.value = parseInt(ev.target.currentTime);
  }
};
const onCanplay = (ev) => {
  console.log(ev, "可以播放");
};
const readText = async (text) => {
  // console.log(`https://api.oick.cn/txt/apiz.php?text=${text}&spd=5`)
  audioSrc.value = `https://api.vvhan.com/api/song.php?txt=${text}&per=5`; //通过audio对象加入音频
  if (audioRef.value) {
    audioRef.value.play();
  }
  if (videoRef.value) {
    videoRef.value.pause();
  }
};
const chooseSentence = (key, text, index) => {
  if (key) {
    sentenceKey.value = key;
  } else {
    sentenceIndex.value = index;
  }
  keyIndex.value = -1;
  readText(text.join(""));
};
const chooseWord = async (word, index, text?: string[]) => {
  keyword.value = word;
  keyIndex.value = index;
  let obj: any = {
    agentKey: agentKey.value,
    keyword: word,
    type: word.length === 1 ? 1 : 2,
  };
  if (text) {
    obj.mediaKey = mediaList.value[mediaIndex.value]._key;
    obj.sentence = text.join("");
  } else {
    obj.captionKey = sentenceKey.value;
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
    if (newInfo.mediaType === "pdf") {
      studyTab.value = "article";
      mediaContnet.value = mediaList.value[newIndex].content.split("\n");

      mediaContnet.value.forEach((item, index) => {
        console.log(item);
        if (item) {
          cnOriginal.value = new RegExp("[\u4E00-\u9FA5]+").test(item);
          articleList.value[index] = {
            text: item.match(/\b\w+\b/g),
          };
          // console.log(cnOriginal.value);
          // if (cnOriginal.value) {
          //   openText(item, (list) => {
          //     articleList.value[index] = { text: list[0] };
          //   });
          // } else {
          //   if (/[a-zA-Z]+/.test(item)) {
          //     articleList.value[index] = {
          //       text: item.match(/\b\w+\b/g),
          //     };
          //   } else {
          //     openText(item, (list) => {
          //       articleList.value[index] = { text: list[0] };
          //     });
          //   }
          // }
        }
      });
    } else {
      studyTab.value = "original";
      if (audioRef.value) {
        audioRef.value.pause();
      }
      if (videoRef.value) {
        videoRef.value.pause();
      }
      mediaSrc.value = mediaList.value[newIndex].url;
      getCaption(mediaList.value[newIndex]._key);
    }
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
          <el-tab-pane
            name="article"
            label="文章"
            v-if="lessonInfo.mediaType === 'pdf'"
          >
            <div class="study-box" v-if="articleList.length > 0">
              <div
                v-for="(item, index) in articleList"
                :key="`article${index}`"
                class="text-item"
                :style="
                  item && sentenceKey === item._key ? { color: '#4D57FF' } : {}
                "
                @click="
                  item && sentenceKey === item._key
                    ? ''
                    : chooseSentence('', item.text, index)
                "
              >
                <template v-if="item?.text">
                  <span
                    v-for="(textItem, textIndex) in item.text"
                    :key="`articleText${textIndex}`"
                    @click="chooseWord(textItem, textIndex, item.text)"
                    :style="
                      sentenceIndex === index && textIndex === keyIndex
                        ? {
                            backgroundColor: '#4D57FF',
                            padding: '2px 0px',
                            boxSizing: 'border-box',
                          }
                        : {}
                    "
                    >{{ textItem }}{{ cnOriginal ? "" : " " }}</span
                  >
                  <!-- <span
                    v-for="(wordItem, wordIndex) in textItem"
                    :key="`originalWord${item._key}`"
                  >
                    {{ wordItem }}
                  </span> -->
                </template>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane
            name="original"
            label="原文"
            v-if="lessonInfo.mediaType !== 'pdf'"
          >
            <div class="study-box" v-if="originalList.length > 0">
              <div
                v-for="(item, index) in originalList"
                :key="`original${index}`"
                class="text-item"
                :style="
                  item && sentenceKey === item._key ? { color: '#4D57FF' } : {}
                "
                @click="chooseSentence(item._key, item.text, index)"
              >
                <template v-if="item?.text">
                  <span
                    v-for="(textItem, textIndex) in item.text"
                    :key="`originalText${textIndex}`"
                    @click="
                      sentenceKey === item._key
                        ? chooseWord(textItem, textIndex)
                        : null
                    "
                    :style="
                      keyword === textItem
                        ? {
                            color: '#333333',
                            background: '#ffe3b5',
                            padding: '2px 0px',
                            boxSizing: 'border-box',
                          }
                        : {}
                    "
                    >{{ textItem }}{{ cnOriginal ? "" : " " }}</span
                  >
                  <!-- <span
                    v-for="(wordItem, wordIndex) in textItem"
                    :key="`originalWord${item._key}`"
                  >
                    {{ wordItem }}
                  </span> -->
                </template>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane name="cloud" label="词频"> </el-tab-pane>
          <el-tab-pane
            name="translation"
            label="译文"
            v-if="lessonInfo.mediaType !== 'pdf'"
          >
            <div class="study-box" v-if="translationList.length > 0">
              <div
                v-for="(item, index) in translationList"
                :key="`translation${index}`"
                class="text-item icon-point"
                :style="
                  item && sentenceKey === item._key ? { color: '#4D57FF' } : {}
                "
                @click="chooseSentence(item._key, item.text, index)"
              >
                <!--  @click="
                      sentenceKey === item._key
                        ? chooseWord(textItem, textIndex)
                        : null
                    "
                    :style="
                      sentenceKey === item._key && textIndex === keyIndex
                        ? {
                            color: '#fff',
                            backgroundColor: '#4D57FF',
                            padding: '10px',
                            boxSizing: 'border-box',
                          }
                        : {}
                    " 
                <template v-if="item?.text">
                  <span
                    v-for="(textItem, textIndex) in item.text"
                    :key="`translationText${textIndex}`"
                    >{{ textItem }}{{ cnOriginal ? " " : "" }}</span
                  >
                   <span
                    v-for="(wordItem, wordIndex) in textItem"
                    :key="`translationWord${item._key}`"
                  >
                    {{ wordItem }}
                  </span> 
                </template>-->
                {{ item }}
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
                    v-for="(item, index) in originalTextList"
                    :key="`originalCaption${index}`"
                    @click="chooseWord(item, index, item.text)"
                    :style="
                      keyword === item && index === keyIndex
                        ? {
                            color: '#333333',
                            background: '#ffe3b5',
                            padding: '2px 4px',
                            boxSizing: 'border-box',
                          }
                        : {}
                    "
                  >
                    {{ item }}{{ cnOriginal ? "" : " " }}
                  </span>
                </div>
                <div class="study-translation">
                  <span
                    v-for="(item, index) in translationTextList"
                    :key="`translationCaption${index}`"
                  >
                    {{ item }}{{ cnOriginal ? " " : "" }}
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
                  v-for="(item, index) in originalList"
                  :key="`caption${index}`"
                  class="text-item"
                  :style="{
                    color: chooseIndex === index ? '#4D57FF' : '#333',
                  }"
                >
                  <div v-if="item?.text" class="study-original">
                    <span
                      v-for="(textItem, textIndex) in item.text"
                      :key="`originalCaption${textIndex}`"
                      >{{ textItem }}{{ cnOriginal ? "" : " " }}</span
                    >
                  </div>
                  <div v-if="item?.text" class="study-translation">
                    <span
                      v-for="(textItem, textIndex) in translationList[index]
                        ?.text"
                      :key="`translationCaption${textIndex}`"
                      >{{ textItem }}{{ cnOriginal ? " " : "" }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="study-audio">
                <videoPlay
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
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="study-cloud" v-if="studyTab==='cloud'" style="top:54px;">
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

    <div
      class="study-note-button"
      @click="clickNode"
      :style="
        noteVisible
          ? { top: '6px', right: '70px' }
          : { top: '30px', right: '30px' }
      "
    >
      <FontIcon iconName="biji" />
    </div>
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
        @include scroll();
        .text-item {
          width: 100%;
          font-size: 26px;
          color: #333333;
          line-height: 55px;
          margin-bottom: 10px;
          text-indent: 2em;
          // padding: 10px;
          // box-sizing: border-box;
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
        }
        .study-audio {
          width: 100%;
          height: 110px;
        }
        .study-caption {
          width: 100%;
          height: 165px;
          background-color: #161620;
          color: #fff;
          @include p-number(20px, 45px);
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
          height: calc(100% - 110px);
          background: #fff;
          color: #333;
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
