<script setup lang="ts">
import Header from "@/components/header.vue";
import FontIcon from "@/components/fontIcon.vue";
import Keyword from "@/components/keyword.vue";
import ErrorWord from "@/components/errorword.vue";
import IframeView from "@/components/iframeView.vue";
import AudioPlayer from "@/components/audioPlayer.vue";
import { OnClickOutside } from "@vueuse/components";
import "vue3-video-play/dist/style.css";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { storeToRefs } from "pinia";
import _ from "lodash";
import WordChart from "@/components/chart/wordChart.vue";
import VideoPlayer from "@/components/videoPlayer.vue";
import { is_mobile, textPoint } from "@/services/util";
const { token } = storeToRefs(appStore.authStore);
const { agentKey, agentInfo } = storeToRefs(appStore.agentStore);
const { deviceType } = storeToRefs(appStore.commonStore);
const { lessonKey, lessonInfo } = storeToRefs(appStore.lessonStore);
const { setLessonKey } = appStore.lessonStore;
const { setMusicSrc } = appStore.commonStore;
const { setAgentInfo } = appStore.agentStore;

const props = defineProps<{
  lessonKey: string;
}>();
const studyTab = ref<string>("original");
const articleList = ref<any>([]);
const mediaList = ref<any>([]);
const captionsList = ref<any>([]);
const captionObj = ref<any>(null);
const mediaSrc = ref<string>("");
const audioSrc = ref<string>("");
const mediaListIndex = ref<number>(-1);
const captionsState = ref<boolean>(false);
const currentTime = ref<number>(0);
const lastTime = ref<number>(0);
const mediaIndex = ref<number>(-1);
const sentenceKey = ref<string>("");
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const keyIndex = ref<number>(-1);
const audioRef = ref<any>(null);
const videoRef = ref<any>(null);
const studyInterval = ref<any>(null);
const noteVisible = ref<boolean>(false);
const noteUrl = ref<string>("");
const textList = ref<any>([]);
const studyMediaRef = ref<any>(null);
const reloadState = ref<boolean>(true);
const changeIndex = ref<number>(-1);
const errorVisible = ref<boolean>(false);
const errorKey = ref<string>("");
const keywordVisible = computed(
  () => keyword.value !== "" && deviceType.value === "phone"
);
onBeforeUnmount(() => {
  if (studyMediaRef.value && lessonInfo.value.mediaType === "video") {
    api.request.post("caption/playLog", {
      captionKey: captionObj.value._key,
      agentKey: agentKey.value,
      time: parseInt(currentTime.value + ""),
    });
  }
  if (studyInterval.value) {
    clearInterval(studyInterval.value);
  }
});
onMounted(() => {
  setLessonKey(props.lessonKey);
});
const getMedia = async () => {
  let mediaRes = (await api.request.get("media", {
    agentKey: agentKey.value,
    resourceKey: props.lessonKey,
  })) as ResultProps;
  if (mediaRes.msg === "OK") {
    mediaList.value = mediaRes.data;
    if (mediaRes.playMedia) {
      let index = _.findIndex(mediaList.value, { _key: mediaRes.playMedia });
      mediaListIndex.value = index !== -1 ? index : 0;
    } else {
      mediaListIndex.value = 0;
    }
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
      if (item.originalArr) {
        item.originalArr.forEach((item) => {
          if (textPoint(item) && isNaN(item)) {
            list.push(item.toLowerCase());
          }
        });
        return item;
      }
    });

    list.forEach((item) => {
      obj[item] = {
        name: item,
        value: obj[item] ? obj[item].value + 1 : 1,
      };
    });

    textList.value = [...new Set(Object.values(obj))];
  }
};
const getCaption = async (key) => {
  let captionaRes = (await api.request.get("caption", {
    mediaKey: key,
  })) as ResultProps;
  if (captionaRes.msg === "OK") {
    captionsList.value = captionaRes.data;
    if (studyMediaRef.value && lessonInfo.value.mediaType === "video") {
      sentenceKey.value = mediaList.value[mediaListIndex.value]?.captionKey
        ? mediaList.value[mediaListIndex.value].captionKey
        : "";
      currentTime.value = mediaList.value[mediaListIndex.value]?.time
        ? mediaList.value[mediaListIndex.value].time
        : 0;
      console.log(currentTime.value);
      clickMedia(currentTime.value);
    }
  }
};
const videoTimeupdate = (time, type?: string) => {
  currentTime.value = time * 1000;
  if (lastTime.value <= parseInt(time) || type) {
    let currentTime = time * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item, index) => {
      if (item.startTime <= currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        captionObj.value = item;
        mediaIndex.value = index;
        sentenceKey.value = item._key;
        // console.log(captionObj.value);
      }
    });
    lastTime.value = parseInt(time);
  }
};
const audioTimeupdate = (time, type?: string) => {
  currentTime.value = time * 1000;
  if (lastTime.value <= parseInt(time) || type) {
    let currentTime = time * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item, index) => {
      if (item.startTime < currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        mediaIndex.value = index;
        sentenceKey.value = item._key;
      }
    });
    if (studyMediaRef.value) {
      let divDomList: any = document.getElementsByClassName(
        "study-audio-caption"
      );
      let textDomList: any = divDomList[0].getElementsByClassName("text-item");

      if (
        textDomList[mediaIndex.value] &&
        textDomList[mediaIndex.value].offsetTop > divDomList[0].offsetHeight / 2
      ) {
        divDomList[0].scrollTo({
          top:
            textDomList[mediaIndex.value].offsetTop -
            divDomList[0].offsetHeight / 2,
          behavior: "smooth",
        });
      }
    }
    lastTime.value = parseInt(time);
  }
};

const changeMediaIndex = (type) => {
  if (type === "last") {
    mediaIndex.value = mediaIndex.value === 0 ? 0 : mediaIndex.value - 1;
  } else {
    mediaIndex.value =
      captionsList.value.length - 1 === mediaIndex.value
        ? mediaIndex.value
        : mediaIndex.value + 1;
  }
  sentenceKey.value = captionsList.value[mediaIndex.value]._key;
  currentTime.value = captionsList.value[mediaIndex.value].startTime;
  clickMedia(
    captionsList.value[mediaIndex.value].startTime,
    "outer",
    sentenceKey.value,
    mediaIndex.value
  );
  if (studyTab.value === "video") {
    videoTimeupdate(currentTime.value / 1000, "change");
  } else {
    audioTimeupdate(currentTime.value / 1000, "change");
  }
};

const clickMedia = (time, type?: string, key?: string, index?: number) => {
  let currentTime = time / 1000;
  if (key && type) {
    sentenceKey.value = key;
  }
  studyMediaRef.value.handleTimeChange(currentTime, type, index);
};
const reloadMedia = (time, index) => {
  if (
    captionsList.value[index] &&
    time * 1000 >= captionsList.value[index].endTime
  ) {
    mediaIndex.value = index;
    sentenceKey.value = captionsList.value[index]._key;
    currentTime.value = captionsList.value[index].startTime;
    clickMedia(captionsList.value[index].startTime);
  }
};
const chooseWord = async (word, index, type: string, key?: string) => {
  errorKey.value = "";
  errorVisible.value = false;
  keyword.value = word;
  keyIndex.value = index;
  setMusicSrc("/music/click.mp3");
  // if (studyMediaRef.value) {
  //   studyMediaRef.value.pauseMedia();
  // }
  if (type !== "cloud" && key) {
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
      obj.captionKey = key;
    }
    let wordRes = (await api.request.post("study/keyword", {
      ...obj,
    })) as ResultProps;
    if (wordRes.msg === "OK") {
      keywordKey.value = wordRes.data._key;
    }
  }
};
const clearMedia = () => {
  captionObj.value = null;
  captionsState.value = false;
  lastTime.value = 0;
  mediaIndex.value = -1;
  keyword.value = "";
  keywordKey.value = "";
  keyIndex.value = -1;
  reloadState.value = true;
  if (studyMediaRef.value) {
    studyMediaRef.value.handleTimeChange(0, "out");
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
const loadNext = () => {
  mediaListIndex.value = mediaListIndex.value + 1;
  console.log(mediaListIndex.value);
  if (mediaListIndex.value < mediaList.value.length) {
    api.request.patch("subscribe/playRecord", {
      agentKey: agentKey.value,
      mediaKey: mediaList.value[mediaListIndex.value]._key,
    });
  }
};
const changeShowTranslation = async () => {
  if (agentInfo.value) {
    let config = {
      ...agentInfo.value.config,
      showTranslation: !agentInfo.value.config.showTranslation,
    };
    let userRes = (await api.request.patch("agent", {
      agentKey: agentKey.value,
      config: config.value,
    })) as ResultProps;
    if (userRes.msg === "OK") {
      setAgentInfo({
        ...agentInfo.value,
        config: config,
      });
    }
  }
};

const toggleError = (key?: string) => {
  if (key) {
    errorVisible.value = true;
    errorKey.value = key;
    keyword.value = "";
    keywordKey.value = "";
  } else {
    errorVisible.value = false;
    errorKey.value = "";
  }
  keyword.value = "";
  keywordKey.value = "";
};
watchEffect(() => {
  if (agentKey.value) {
    getMedia();
  }
});
watch([mediaListIndex, lessonInfo], ([newIndex, newInfo]) => {
  // audioRef.value.pause();
  // videoRef.value.pause();
  articleList.value = [];
  if (newInfo && mediaList.value.length > 0) {
    if (newInfo.mediaType === "video") {
      studyTab.value = "video";
    } else if (newInfo.mediaType === "audio") {
      studyTab.value = "audio";
    } else {
      studyTab.value = "original";
    }
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
    clearMedia();
    if (studyMediaRef.value && newInfo.mediaType === "audio") {
      let divDomList: any = document.getElementsByClassName(
        "study-audio-caption"
      );
      divDomList[0].scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (studyInterval.value) {
      clearInterval(studyInterval.value);
    }
    //1分钟一次
    studyInterval.value = setInterval(() => {
      if (
        studyTab.value === "video" &&
        studyMediaRef.value &&
        captionObj.value
      ) {
        api.request.post("caption/playLog", {
          captionKey: captionObj.value._key,
          agentKey: agentKey.value,
          time: parseInt(currentTime.value + ""),
        });
      }
      api.request.post("study/log", {
        agentKey: agentKey.value,
        mediaKey: mediaList.value[newIndex]._key,
      });
    }, 60000);
  }
});
watch([studyTab, studyMediaRef], ([newTab, newRef], [oldTab, oldRef]) => {
  keyIndex.value = -1;
  keyword.value = "";
  keywordKey.value = "";
  changeIndex.value = -1;
  errorKey.value = "";
  errorVisible.value = false;
  if (newRef && lessonInfo.value.mediaType === "video" && newTab === "video") {
    clickMedia(currentTime.value);
  }
  if (newTab !== "video" && oldTab === "video") {
    api.request.post("caption/playLog", {
      captionKey: captionObj.value._key,
      agentKey: agentKey.value,
      time: parseInt(currentTime.value + ""),
    });
  }
  // else {
  //   sentenceKey.value = "";
  // }
});
</script>
<template>
  <div
    class="study"
    v-if="lessonInfo"
    @click="changeIndex = -1"
    :style="studyTab === 'video' ? { background: '#000' } : {}"
    :class="{ 'study-phone': deviceType === 'phone' }"
  >
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
      <div
        class="study-left"
        :class="{ 'study-left-keyword': keyword || errorVisible }"
        :style="
          deviceType === 'phone' && (keyword || errorVisible)
            ? { width: '60%' }
            : {}
        "
      >
        <Header
          :title="''"
          :backPath="'/home'"
          :color="studyTab === 'video' ? '#fff' : '#333'"
          :type="deviceType"
        >
          <template #icon>
            <el-dropdown
              max-height="300px"
              :trigger="is_mobile() ? 'click' : 'hover'"
            >
              <div class="icon-point dp--center">
                <FontIcon
                  iconName="liebiao"
                  style="margin-right: 8px"
                  :style="studyTab === 'video' ? { color: '#fff' } : {}"
                />
                <div :style="studyTab === 'video' ? { color: '#fff' } : {}">
                  {{ mediaList[mediaListIndex]?.name }}
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    @click="
                      mediaListIndex = index;
                      api.request.patch('subscribe/playRecord', {
                        agentKey: agentKey,
                        mediaKey: item._key,
                      });
                    "
                    v-for="(item, index) in mediaList"
                    :key="`media${item._key}`"
                    :style="
                      mediaListIndex === index
                        ? { backgroundColor: '#edeeff', color: '#4d57ff' }
                        : {}
                    "
                    >{{ item.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template #button>
            <div class="study-tab">
              <div
                class="study-tab-item"
                :class="{ 'study-tab-choose': studyTab === 'video' }"
                @click="studyTab = 'video'"
                :style="studyTab === 'video' ? { color: '#fff' } : {}"
                v-if="lessonInfo.mediaType === 'video'"
              >
                视频
              </div>
              <div
                class="study-tab-item"
                :class="{ 'study-tab-choose': studyTab === 'audio' }"
                @click="studyTab = 'audio'"
                :style="studyTab === 'video' ? { color: '#fff' } : {}"
                v-if="lessonInfo.mediaType === 'audio'"
              >
                音频
              </div>
              <div
                class="study-tab-item"
                :class="{ 'study-tab-choose': studyTab === 'original' }"
                :style="studyTab === 'video' ? { color: '#fff' } : {}"
                @click="studyTab = 'original'"
                v-if="articleList.length > 0"
              >
                原文
              </div>
              <div
                class="study-tab-item"
                :class="{ 'study-tab-choose': studyTab === 'translation' }"
                :style="studyTab === 'video' ? { color: '#fff' } : {}"
                @click="studyTab = 'translation'"
                v-if="articleList.length > 0"
              >
                译文
              </div>
              <div
                class="study-tab-item"
                :class="{ 'study-tab-choose': studyTab === 'cloud' }"
                :style="studyTab === 'video' ? { color: '#fff' } : {}"
                @click="studyTab = 'cloud'"
                v-if="textList.length > 0"
              >
                词频
              </div>
            </div></template
          >
        </Header>
        <div
          class="study-cloud"
          v-if="studyTab === 'cloud' && textList.length > 0"
        >
          <WordChart
            :chartData="textList"
            :wordId="'study-word'"
            @chooseWord="chooseWord"
            :keyword="keyword"
          />
        </div>
        <div
          class="study-box"
          v-else
          :style="
            studyTab === 'video'
              ? { padding: '10px 0px' }
              : { padding: '10px 15px' }
          "
        >
          <template v-if="studyTab === 'original' && articleList.length > 0">
            <template
              v-for="(item, index) in articleList"
              :key="`original${index}`"
            >
              <div
                class="text-item"
                @click.stop="sentenceKey = item._key"
                :style="
                  sentenceKey === item._key
                    ? {
                        backgroundColor: '#F5F5F5',
                        borderLeft: '3px solid #4d57ff',
                      }
                    : {}
                "
              >
                <div style="width: 2em"></div>
                <span
                  v-for="(textItem, textIndex) in item.originalArr"
                  :key="`originalText${textIndex}`"
                  :class="{
                    'text-point': !textPoint(textItem) || !isNaN(textItem),
                  }"
                  @click.stop="
                    textPoint(textItem) && isNaN(textItem)
                      ? chooseWord(textItem, textIndex, 'section', item._key)
                      : null
                  "
                  :style="
                    changeIndex !== index
                      ? keyword === textItem && /\b\w+\b/g.test(textItem)
                        ? {
                            color: '#4D57FF',
                          }
                        : {}
                      : lessonInfo.language === 'en'
                      ? { opacity: 0 }
                      : { padding: '0px', letterSpacing: '1px', opacity: 0 }
                  "
                  >{{ textItem }}</span
                >
              </div>
              <div
                class="text-item"
                style="text-indent: 2em"
                v-if="sentenceKey === item._key"
                :style="
                  sentenceKey === item._key
                    ? {
                        backgroundColor: '#F5F5F5',
                        borderLeft: '3px solid #f7b500',
                        marginTop: '-8px',
                      }
                    : {}
                "
              >
                {{ item.translation }}
                <div
                  class="text-item-error"
                  @click.stop="toggleError(item._key)"
                >
                  纠
                </div>
              </div>
            </template>
          </template>
          <template v-if="studyTab === 'translation' && articleList.length > 0">
            <template
              v-for="(item, index) in articleList"
              :key="`translation${index}`"
            >
              <div
                class="text-item"
                style="text-indent: 2em"
                @click.stop="sentenceKey = item._key"
                :style="
                  sentenceKey === item._key
                    ? {
                        backgroundColor: '#F5F5F5',
                        borderLeft: '3px solid #f7b500',
                      }
                    : {}
                "
              >
                {{ item.translation }}
              </div>
              <div
                class="text-item"
                v-if="sentenceKey === item._key"
                :style="
                  sentenceKey === item._key
                    ? {
                        backgroundColor: '#F5F5F5',
                        borderLeft: '3px solid #4d57ff',
                        marginTop: '-8px',
                      }
                    : {}
                "
              >
                <div style="width: 2em"></div>
                <span
                  v-for="(textItem, textIndex) in item.originalArr"
                  :key="`originalText${textIndex}`"
                  :class="{ 'text-point': !/\b\w+\b/g.test(textItem) }"
                  @click.stop="
                    /\b\w+\b/g.test(textItem)
                      ? chooseWord(textItem, textIndex, 'section', item._key)
                      : ''
                  "
                  :style="
                    changeIndex !== index
                      ? keyword === textItem && /\b\w+\b/g.test(textItem)
                        ? {
                            color: '#4D57FF',
                          }
                        : {}
                      : { opacity: 0 }
                  "
                  >{{ textItem }}</span
                >
                <div
                  class="text-item-error"
                  @click.stop="toggleError(item._key)"
                >
                  纠
                </div>
              </div>
            </template>
          </template>
          <template v-if="studyTab === 'video'">
            <div
              class="study-video"
              :style="studyTab === 'video' ? { color: '#fff' } : {}"
            >
              <VideoPlayer
                :src="mediaSrc"
                :title="lessonInfo.name"
                :cover="lessonInfo.cover"
                :videoIndex="mediaIndex"
                @videoTimeupdate="videoTimeupdate"
                @changeVideoIndex="changeMediaIndex"
                @reloadVideo="reloadMedia"
                @loadNext="loadNext"
                ref="studyMediaRef"
                videoType="custom"
              >
                <template #custom>
                  <div class="study-video-content" v-if="studyMediaRef">
                    <div
                      class="study-video-caption"
                      @mouseenter="
                        studyMediaRef.reloadMedia(true);
                        setMusicSrc('/music/inout.mp3');
                      "
                      @mouseleave="
                        studyMediaRef.reloadMedia(false);
                        setMusicSrc('/music/inout.mp3');
                      "
                    >
                      <template v-if="captionObj">
                        <div
                          class="study-original"
                          :style="studyTab === 'video' ? { color: '#fff' } : {}"
                        >
                          <span
                            v-for="(item, index) in captionObj.originalArr"
                            :key="`originalCaption${index}`"
                            :class="{
                              'text-point': !textPoint(item) || !isNaN(item),
                            }"
                            @click.stop="
                              textPoint(item) && isNaN(item)
                                ? chooseWord(
                                    item,
                                    index,
                                    'caption',
                                    captionObj._key
                                  )
                                : ''
                            "
                            :style="{
                              padding:
                                lessonInfo.language === 'cn'
                                  ? '0px'
                                  : '0px 5px',
                              letterSpacing: '1px',
                              color:
                                keyword === item &&
                                index === keyIndex &&
                                textPoint(item) &&
                                isNaN(item)
                                  ? '#4D57FF'
                                  : '#fff',
                            }"
                          >
                            {{ item }}
                          </span>
                        </div>
                        <div
                          v-if="
                            agentInfo?.config?.showTranslation &&
                            captionObj.translation
                          "
                          class="study-translation"
                          :style="studyTab === 'video' ? { color: '#fff' } : {}"
                        >
                          {{ captionObj.translation }}
                        </div>

                        <div
                          class="study-video-error"
                          @click="
                            captionObj
                              ? (toggleError(captionObj._key),
                                studyMediaRef.playMedia(false))
                              : null
                          "
                        >
                          纠
                        </div>
                        <div
                          class="study-video-translation"
                          @click="changeShowTranslation()"
                          v-if="captionObj.translation"
                          :style="
                            agentInfo?.config?.showTranslation
                              ? { background: '#4d57ff' }
                              : {}
                          "
                        >
                          译
                        </div>
                      </template>
                    </div>
                    <div class="study-video-buttonGroup">
                      <div
                        class="buttonGroup-top"
                        @click="
                          studyMediaRef.reloadMedia(reloadState);
                          reloadState = !reloadState;
                        "
                        :style="
                          studyMediaRef.reloadState
                            ? {
                                backgroundColor: '#4D57FF',
                              }
                            : {}
                        "
                      >
                        <div
                          class="buttonGroup-top-center"
                          :style="{
                            animation: studyMediaRef.isPlay
                              ? `fadenum ${
                                  studyMediaRef.reloadState ? 1.5 : 8
                                }s linear infinite`
                              : '',
                          }"
                        >
                          <img src="/common/reload.svg" alt="" />
                        </div>
                        {{
                          studyMediaRef.reloadState
                            ? "解除单句循环"
                            : "进入单句循环"
                        }}
                      </div>
                      <div class="buttonGroup-center">
                        <div
                          class="buttonGroup-top-text"
                          @click="changeMediaIndex('last')"
                        >
                          <FontIcon
                            iconName="shangyiju1"
                            :iconStyle="{
                              fontSize:
                                deviceType === 'phone' ? '20px' : '10px',
                              marginRight: '3px',
                            }"
                          />
                        </div>
                        <div>
                          第 {{ mediaIndex + 1 }} / {{ captionsList.length }} 句
                        </div>

                        <div
                          class="buttonGroup-top-text"
                          style="justify-content: flex-end"
                          @click="changeMediaIndex('next')"
                        >
                          <FontIcon
                            iconName="xiayiju1"
                            :iconStyle="{
                              fontSize:
                                deviceType === 'phone' ? '20px' : '10px',
                              marginLeft: '3px',
                            }"
                          />
                        </div>
                      </div>
                      <div class="buttonGroup-bottom">
                        <FontIcon
                          customClassName="buttonGroup-bottom-button"
                          iconName="a-zanting2"
                          @iconClick="studyMediaRef.playMedia(false)"
                          :iconStyle="{
                            fontSize: deviceType === 'phone' ? '20px' : '10px',
                          }"
                          v-if="studyMediaRef.isPlay"
                        />
                        <FontIcon
                          customClassName="buttonGroup-bottom-button"
                          iconName="a-bofang2"
                          @iconClick="studyMediaRef.playMedia(true)"
                          :iconStyle="{
                            fontSize: deviceType === 'phone' ? '20px' : '10px',
                          }"
                          v-else
                        />
                        <OnClickOutside
                          @trigger="studyMediaRef.videoHuds = false"
                        >
                          <div class="buttonGroup-bottom-volume">
                            <div
                              class="buttonGroup-bottom-volume-progress"
                              v-show="studyMediaRef.videoHuds"
                            >
                              <el-slider
                                vertical
                                height="80px"
                                class="buttonGroup-bottom-volume-bar"
                                v-model="studyMediaRef.videoVolume"
                                :show-tooltip="false"
                                @change="studyMediaRef.handleVideoVolume"
                              />
                            </div>

                            <FontIcon
                              v-if="studyMediaRef.videoVolume <= 0"
                              customClassName="buttonGroup-bottom-button"
                              iconName="jingyin"
                              :iconStyle="{
                                fontSize:
                                  deviceType === 'phone' ? '20px' : '10px',
                                color: '#888',
                              }"
                              @click.stop="
                                studyMediaRef.videoHuds =
                                  !studyMediaRef.videoHuds
                              "
                            />
                            <FontIcon
                              v-if="studyMediaRef.videoVolume > 0"
                              customClassName="buttonGroup-bottom-button"
                              iconName="shengyin"
                              :iconStyle="{
                                fontSize:
                                  deviceType === 'phone' ? '20px' : '10px',
                                color: studyTab === 'video' ? '#fff' : '#333',
                              }"
                              @click.stop="
                                studyMediaRef.videoHuds =
                                  !studyMediaRef.videoHuds
                              "
                            />
                          </div>
                        </OnClickOutside>
                        <div class="buttonGroup-bottom-container">
                          <el-slider
                            class="buttonGroup-bottom-slider"
                            v-model="studyMediaRef.currentProgress"
                            :show-tooltip="false"
                            @input="studyMediaRef.handleProgressChange"
                          />
                          <div class="buttonGroup-bottom-time">
                            <span style="margin-right: 2px">{{
                              studyMediaRef.videoStart
                            }}</span
                            >/<span style="margin-left: 2px">{{
                              studyMediaRef.durationTime
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </VideoPlayer>
            </div>
          </template>
          <template v-if="studyTab === 'audio'">
            <!--   @mouseenter="
                deviceType !== 'phone' ? studyMediaRef.reloadMedia(true) : false
              "
              @mouseleave="
                deviceType !== 'phone'
                  ? studyMediaRef.reloadMedia(false)
                  : false
              " -->
            <div class="study-caption study-audio-caption">
              <div
                v-for="(item, index) in captionsList"
                :key="`caption${index}`"
                class="text-item"
                style="padding-left: 10px"
              >
                <FontIcon
                  iconName="a-bofang2"
                  customClassName="study-audio-icon"
                  :iconStyle="{
                    fontSize: '16px',
                    color: '#4D57FF',
                  }"
                  v-if="index === mediaIndex"
                />
                <div
                  class="study-original"
                  style="width: 100%"
                  :style="sentenceKey === item._key ? { color: '#4D57FF' } : {}"
                  @click="
                    sentenceKey !== item._key
                      ? clickMedia(item.startTime, 'outer', item._key, index)
                      : null
                  "
                >
                  <span
                    v-for="(textItem, textIndex) in item.originalArr"
                    :key="`originalCaption${textIndex}`"
                    :class="{
                      'text-point': !textPoint(textItem) || !isNaN(textItem),
                    }"
                    @click.stop="
                      textPoint(textItem) && isNaN(textItem)
                        ? chooseWord(textItem, textIndex, 'caption', item._key)
                        : ''
                    "
                    :style="{
                      padding: lessonInfo.language === 'cn' ? '0px' : '0px 5px',
                      letterSpacing: '1px',
                      fontWeight:
                        keyword === textItem &&
                        textIndex === keyIndex &&
                        textPoint(textItem) &&
                        isNaN(textItem)
                          ? 900
                          : 'normal',
                      color:
                        keyword === textItem &&
                        textIndex === keyIndex &&
                        textPoint(textItem) &&
                        isNaN(textItem)
                          ? '#4D57FF'
                          : '',
                    }"
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
                :audioIndex="mediaIndex"
                @audioTimeupdate="audioTimeupdate"
                @changeAudioIndex="changeMediaIndex"
                @reloadAudio="reloadMedia"
                @loadNext="loadNext"
                ref="studyMediaRef"
                audioType="custom"
              >
                <template #custom>
                  <div
                    class="study-audio-content"
                    v-if="studyMediaRef"
                    style="background-color: #000; color: #fff"
                  >
                    <!-- <div class="study-video-caption"></div> -->
                    <div class="study-video-buttonGroup">
                      <div
                        class="buttonGroup-top"
                        @click="
                          studyMediaRef.reloadMedia(reloadState);
                          reloadState = !reloadState;
                        "
                        :style="
                          studyMediaRef.reloadState
                            ? {
                                backgroundColor: '#4D57FF',
                              }
                            : {}
                        "
                      >
                        <div
                          class="buttonGroup-top-center"
                          :style="{
                            animation: studyMediaRef.isPlay
                              ? `fadenum ${
                                  studyMediaRef.reloadState ? 1.5 : 8
                                }s infinite`
                              : '',
                          }"
                        >
                          <img src="/common/reload.svg" alt="" />
                        </div>
                        {{
                          studyMediaRef.reloadState
                            ? "解除单句循环"
                            : "进入单句循环"
                        }}
                      </div>
                      <div class="buttonGroup-center">
                        <div
                          class="buttonGroup-top-text"
                          @click="changeMediaIndex('last')"
                        >
                          <FontIcon
                            iconName="shangyiju1"
                            :iconStyle="{
                              fontSize: '10px',
                              marginRight: '3px',
                            }"
                          />
                        </div>
                        <div>
                          第 {{ mediaIndex + 1 }} / {{ captionsList.length }} 句
                        </div>
                        <div
                          class="buttonGroup-top-text"
                          style="justify-content: flex-end"
                          @click="changeMediaIndex('next')"
                        >
                          <FontIcon
                            iconName="xiayiju1"
                            :iconStyle="{
                              fontSize: '10px',
                              marginLeft: '3px',
                            }"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="study-audio-box">
                      <div class="study-audio-left" v-if="deviceType === 'pc'">
                        <img :src="lessonInfo.cover" alt="" />
                      </div>
                      <FontIcon
                        customClassName="buttonGroup-bottom-button"
                        iconName="a-zanting2"
                        @iconClick="studyMediaRef.playMedia(false)"
                        :iconStyle="{
                          fontSize: '20px',
                          margin: '0px 15px 0px 25px',
                        }"
                        v-if="studyMediaRef.isPlay"
                      />
                      <FontIcon
                        customClassName="buttonGroup-bottom-button"
                        iconName="a-bofang2"
                        @iconClick="studyMediaRef.playMedia(true)"
                        :iconStyle="{
                          fontSize: '20px',
                          margin: '0px 15px 0px 25px',
                        }"
                        v-else
                      />
                      <OnClickOutside
                        @trigger="studyMediaRef.audioHuds = false"
                      >
                        <div class="buttonGroup-bottom-volume">
                          <div
                            class="buttonGroup-bottom-volume-progress"
                            v-show="studyMediaRef.audioHuds"
                          >
                            <el-slider
                              vertical
                              height="80px"
                              class="buttonGroup-bottom-volume-bar"
                              v-model="studyMediaRef.audioVolume"
                              :show-tooltip="false"
                              @change="studyMediaRef.handleAudioVolume"
                            />
                          </div>

                          <FontIcon
                            v-if="studyMediaRef.audioVolume <= 0"
                            customClassName="buttonGroup-bottom-button"
                            iconName="jingyin"
                            :iconStyle="{
                              fontSize: '20px',
                              marginRight: '15px',
                              color: '#888',
                            }"
                            @click.stop="
                              studyMediaRef.audioHuds = !studyMediaRef.audioHuds
                            "
                          />
                          <FontIcon
                            v-if="studyMediaRef.audioVolume > 0"
                            customClassName="buttonGroup-bottom-button"
                            iconName="shengyin"
                            :iconStyle="{
                              fontSize: '20px',
                              marginRight: '15px',
                              color: '#fff',
                            }"
                            @click.stop="
                              studyMediaRef.audioHuds = !studyMediaRef.audioHuds
                            "
                          />
                        </div>
                      </OnClickOutside>
                      <div class="study-audio-right">
                        <div class="study-audio-title">
                          <div v-if="deviceType === 'pc'">
                            {{ mediaList[mediaListIndex]?.name }}
                          </div>
                          <div class="study-audio-time">
                            <span style="margin-left: 10px">{{
                              studyMediaRef.audioStart
                            }}</span>
                            /
                            <span style="margin-left: 10px">{{
                              studyMediaRef.durationTime
                            }}</span>
                          </div>
                        </div>
                        <el-slider
                          class="study-audio-slider"
                          v-model="studyMediaRef.currentProgress"
                          :show-tooltip="false"
                          @input="studyMediaRef.handleProgressChange"
                        />
                      </div>
                      <div
                        class="study-audio-error"
                        @click="
                          captionsList[mediaIndex]
                            ? (toggleError(captionsList[mediaIndex]._key),
                              studyMediaRef.playAudio(false))
                            : null
                        "
                      >
                        纠
                      </div>
                      <div
                        class="study-audio-translation"
                        @click="changeShowTranslation()"
                        v-if="captionsList[mediaIndex]?.translation"
                        :style="
                          agentInfo?.config?.showTranslation
                            ? { background: '#4d57ff' }
                            : {}
                        "
                      >
                        译
                      </div>
                    </div>
                  </div>
                </template>
              </AudioPlayer>
            </div>
          </template>
        </div>
      </div>
      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
        :mediaName="mediaList[mediaIndex]?.name"
        :type="studyTab === 'cloud' ? 'outer' : 'inner'"
        v-if="deviceType === 'pc'"
      />
      <ErrorWord
        :errorVisible="errorVisible"
        :errorKey="errorKey"
        :type="studyTab"
        @close="toggleError()"
        v-if="deviceType === 'pc'"
      />
      <!-- <div class=""></div> -->
    </div>
    <div class="study-note-tree" v-if="noteVisible">
      <IframeView :url="noteUrl" />
    </div>
    <el-drawer
      v-model="keywordVisible"
      direction="rtl"
      size="80%"
      :with-header="false"
      :append-to-body="true"
    >
      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
        :mediaName="mediaList[mediaIndex]?.name"
        :type="studyTab === 'cloud' ? 'outer' : 'inner'"
      />
    </el-drawer>
    <el-drawer
      v-model="errorVisible"
      direction="rtl"
      size="80%"
      :with-header="false"
      :append-to-body="true"
    >
      <ErrorWord
        :errorVisible="errorVisible"
        :errorKey="errorKey"
        :type="studyTab"
        @close="toggleError()"
      />
    </el-drawer>

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
  width: 100%;
  height: 100%;
  align-content: flex-start;

  @include flex(center, center, wrap);

  .study-container {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    @include flex(space-between, center, null);

    .study-left {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      padding: 29px 0px 0px 0px;
      box-sizing: border-box;

      .study-tab {
        width: 100%;
        height: 100%;
        @include flex(flex-end, center, null);

        .study-tab-item {
          width: 150px;
          height: 70px;
          font-size: 18px;
          color: #919191;
          line-height: 80px;
          text-align: right;
          cursor: pointer;
        }

        .study-tab-choose {
          height: 45px;
          font-size: 22px;
          color: #000000;
          line-height: 45px;
        }
      }

      .study-box {
        width: 100%;
        height: calc(100% - 30px);
        padding: 10px 15px 0px 15px;
        // text-indent: 2em;
        font-family: "Kaiti SC", "STKaiti", "Arial", sans-serif;
        box-sizing: border-box;
        @include scroll();

        .text-item {
          width: 100%;
          font-size: 32px;
          color: #333333;
          line-height: 55px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
          padding: 2px 0px;
          box-sizing: border-box;
          // word-wrap: break-word;
          // word-break: normal;
          @include flex(flex-start, center, wrap);
          &:hover {
            background-color: #f5f5f5;
          }
          .text-item-error {
            width: 45px;
            height: 45px;
            border: 1px dashed #979797;
            color: #666;
            border-radius: 50%;
            position: absolute;
            z-index: 2;
            right: 10px;
            bottom: 10px;
            text-align: center;
            line-height: 45px;
            // font-size: 16px;
            text-indent: 0px;
            cursor: pointer;
          }
          .study-original-mask {
            width: 100%;
            min-height: 100%;
            position: absolute;
            z-index: 1;
            left: 0px;
            top: 0px;
            text-indent: 2em;
            background-color: #f5f5f5;
            // @include flex(flex-start, center, wrap);
          }

          // &:hover {
          //   color: $commonColor;
          // }
          span {
            padding: 2px 4px;
            box-sizing: border-box;

            &:not(.text-point):hover {
              cursor: pointer;
              color: $commonColor;
              // background-color: $commonColor;
              // padding: 10px 0px;
              // box-sizing: border-box;
            }
          }
        }

        .study-video {
          width: 100%;
          height: 100%;
          padding: 0px;
        }

        .study-audio {
          width: 100%;
          height: 200px;
          padding: 0px;
        }

        .study-video-content,
        .study-audio-content {
          width: 100%;
          height: 190px;
          padding: 0px 0px 0px 15px;
          box-sizing: border-box;
          @include flex(space-between, center, null);

          .study-video-caption {
            width: calc(100% - 280px);
            height: 100%;
            position: relative;
            z-index: 1;
            @include scroll();
            @include flex(flex-start, center, wrap);
            position: relative;
            z-index: 1;

            .study-video-subtitle {
              width: 100%;
              height: 50px;
              @include flex(center, center, null);
              position: absolute;
              z-index: 2;
              top: 0px;
              left: 0px;

              .study-subtitle-text {
                height: 50px;
                font-size: 20px;
                font-family: PingFang SC, PingFang SC-Regular;
                color: #ffffff;
                line-height: 40px;
                background-size: 100% 100%;
                background-repeat: no-repeat;
                padding: 0px 25px;
                box-sizing: border-box;
              }
            }

            .study-original {
              font-size: 40px;
              // font-family: PingFang SC, PingFang SC-Semibold;
              font-weight: Semibold;
              color: #000000;
              line-height: 55px;
              letter-spacing: 1.3px;
              padding: 10px;
              @include flex(flex-start, center, wrap);

              span {
                padding: 0px 8px;

                // @include p-number(0px, 5px);
                &:not(.text-point):hover {
                  cursor: pointer;
                  color: $commonColor;
                }
              }
            }
            .study-translation {
              font-size: 30px;
              line-height: 40px;
              padding: 10px;
              box-sizing: border-box;
              word-break: break-all;
            }
            .study-video-error,
            .study-video-translation {
              width: 50px;
              height: 50px;
              border: 1px dashed #979797;
              color: #fff;
              border-radius: 50%;
              text-align: center;
              line-height: 50px;
              // font-size: 16px;
              text-indent: 0px;
              cursor: pointer;
              position: absolute;
              z-index: 2;
              right: 10px;
              bottom: 10px;
            }
            .study-video-translation {
              right: 70px;
            }
          }

          .study-video-buttonGroup {
            width: 260px;
            height: 100%;
            font-family: PingFang SC, PingFang SC-Regular;
            align-content: center;
            @include flex(flex-start, center, wrap);
            .buttonGroup-top {
              width: 100%;
              height: 42px;
              border: 1px solid #4d57ff;
              border-radius: 22px;
              font-size: 16px;
              font-weight: Regular;
              color: #ffffff;
              line-height: 20px;
              cursor: pointer;
              @include p-number(0px, 10px);
              @include flex(center, center, null);
              .buttonGroup-top-center {
                width: 36px;
                height: 36px;
                margin-right: 8px;
                overflow: hidden;
                cursor: pointer;
                transform-origin: 50% 50%;
                @include flex(center, center, null);
                img {
                  width: 36px;
                  height: 36px;
                  object-fit: cover;
                }
              }
            }

            .buttonGroup-center {
              width: 100%;
              height: 20px;
              margin: 30px 0px 30px 0px;
              font-size: 16px;
              text-align: center;
              line-height: 20px;
              @include flex(space-between, center, null);
            }

            .buttonGroup-bottom {
              width: 100%;
              height: 30px;
              border-radius: 9px;
              @include p-number(0px, 10px);
              @include flex(space-between, center, null);

              .buttonGroup-bottom-button {
                width: 30px;
                height: 100%;
                margin: 0px 2px;
                @include flex(center, center, null);
              }

              .buttonGroup-bottom-container {
                width: calc(100% - 20px);
                height: 100%;
                @include flex(space-between, center, null);

                .buttonGroup-bottom-slider {
                  width: calc(100% - 80px);
                  height: 2px;
                  background: #4d57ff;
                }

                .buttonGroup-bottom-time {
                  font-size: 12px;
                }
              }
            }
          }
        }
        .buttonGroup-bottom-volume {
          position: relative;
          z-index: 1;
          margin-right: 5px;

          .buttonGroup-bottom-volume-progress {
            width: 32px;
            /* prettier-ignore */
            height: 90px;
            position: absolute;
            /* prettier-ignore */
            top: -75Px;
            /* prettier-ignore */
            right: -20Px;
          }

          .buttonGroup-bottom-volume-bar {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .buttonGroup-bottom-volume-icon {
            width: 24px;
            height: 24px;
            cursor: pointer;
          }
        }
        .study-audio-content {
          padding-left: 22px;
          .study-audio-box {
            width: calc(100% - 360px);
            height: 100%;
            margin: 0px 45px 0px 30px;
            @include flex(space-between, center, null);

            .study-audio-left {
              width: 80px;
              height: 80px;
              background: #d8d8d8;
              border-radius: 8px;
              overflow: hidden;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
            .buttonGroup-bottom-volume-progress {
              width: 32px;
              height: 140px;
              position: absolute;
              top: -145px;
              right: 20px;
            }
            .study-audio-right {
              width: calc(100% - 350px);
              height: 100%;
              align-content: center;
              @include flex(flex-start, center, flex);

              .study-audio-title {
                width: 100%;
                height: 30px;
                font-family: PingFang SC, PingFang SC-Regular;
                font-size: 24px;
                font-weight: 600;
                color: #333333;
                margin-bottom: 20px;
                color: #fff;
                @include flex(space-between, center, null);

                .study-audio-time {
                  font-size: 18px;
                }
              }

              .study-audio-slider {
                width: 100%;
                height: 2px;
                background: #4d57ff;
              }

              // .study-video-translation {
              //   right: 70px;
              // }
            }
            .study-audio-error,
            .study-audio-translation {
              width: 50px;
              height: 50px;
              border: 1px dashed #979797;
              color: #fff;
              border-radius: 50%;
              text-align: center;
              line-height: 50px;
              // font-size: 16px;
              cursor: pointer;
              // position: absolute;
              // z-index: 2;
              // right: 10px;
              // bottom: 10px;
            }
          }
        }

        .study-audio-caption {
          width: 100%;
          height: calc(100% - 215px);
          background: #fff;
          color: #333;
          text-indent: 0em;
          margin-bottom: 15px;
          @include scroll();
          @include flex(center, center, wrap);

          .study-audio-icon {
            width: 55px;
            height: 100%;
            position: absolute;
            z-index: 2;
            left: 0px;
            top: 0px;

            // @include flex(center, center, null);
          }

          .study-original {
            font-size: 32px;
            line-height: 40px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;

            span {
              // @include p-number(0px, 5px);
              &:not(.text-point):hover {
                cursor: pointer;
                font-weight: 900;
                color: $commonColor;
              }
            }
          }
          .study-translation {
            font-size: 22px;
            line-height: 40px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;
          }
        }
      }

      .study-cloud {
        width: 100%;
        height: calc(100% - 35px);
        box-sizing: border-box;
      }
    }
    .study-left-keyword {
      width: calc(100% - 523px);
    }
  }

  .study-read {
    opacity: 0.1;
    position: fixed;
    z-index: -1;
    top: -100px;
    left: 0px;
  }

  .study-note-tree {
    width: 100%;
    height: 100%;
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
.study-phone {
  .study-container {
    .study-left {
      .study-tab {
        width: 100%;
        height: 56px;
        @include flex(flex-start, center, null);
      }

      .study-box {
        .study-video-content,
        .study-audio-content {
          height: calc(100% - 600px);
          align-content: flex-start;
          @include flex(center, center, wrap);

          .study-video-caption {
            width: 100%;
            height: calc(100% - 600px);
          }

          .study-video-buttonGroup {
            width: 80vw;
            height: 500px;
            .buttonGroup-top {
              width: 100%;
              height: 80px;
              border-radius: 40px;
              font-size: 32px;
              line-height: 80px;
              cursor: pointer;
              @include p-number(0px, 10px);
              @include flex(center, center, null);
              .buttonGroup-top-center {
                width: 50px;
                height: 50px;
                overflow: hidden;
                img {
                  width: 50px;
                  height: 50px;
                }
              }
            }

            .buttonGroup-center {
              width: 100%;
              height: 120px;
              margin: 30px 0px 30px 0px;
              font-size: 32px;
              line-height: 120px;
              @include flex(space-between, center, null);
            }

            .buttonGroup-bottom {
              width: 100%;
              height: 30px;

              .buttonGroup-bottom-button {
                width: 30px;
                height: 100%;
                margin: 0px 12px;
                @include flex(center, center, null);
              }

              .buttonGroup-bottom-container {
                width: calc(100% - 150px);
                height: 100%;
                @include flex(space-between, center, null);

                .buttonGroup-bottom-slider {
                  width: calc(100% - 200px);
                  height: 2px;
                  background: #4d57ff;
                }

                .buttonGroup-bottom-time {
                  font-size: 26px;
                }
              }
            }
          }
        }
        .buttonGroup-bottom-volume {
          position: relative;
          z-index: 1;
          margin-right: 5px;

          .buttonGroup-bottom-volume-progress {
            width: 32px;
            /* prettier-ignore */
            height: 90px;
            position: absolute;
            /* prettier-ignore */
            top: -75Px;
            /* prettier-ignore */
            right: -20Px;
          }

          .buttonGroup-bottom-volume-bar {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .buttonGroup-bottom-volume-icon {
            width: 24px;
            height: 24px;
            cursor: pointer;
          }
        }
        .study-audio-content {
          height: 500px;
          padding-left: 22px;
          align-content: center;
          .study-video-buttonGroup {
            height: 300px;
            .buttonGroup-center {
              height: 100px;
              margin: 10px 0px;
            }
          }
          .study-audio-box {
            width: 100%;
            height: 150px;
            @include flex(space-between, center, wrap);

            .study-audio-left {
              width: 80px;
              height: 80px;
              background: #d8d8d8;
              border-radius: 8px;
              overflow: hidden;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
            .buttonGroup-bottom-volume-progress {
              width: 32px;
              height: 140px;
              position: absolute;
              top: -145px;
              right: 20px;
            }
            .study-audio-right {
              width: calc(100% - 350px);
              height: 100%;
              align-content: center;
              @include flex(flex-start, center, flex);

              .study-audio-title {
                .study-audio-time {
                  font-size: 28px;
                }
              }

              .study-audio-slider {
                width: 100%;
                height: 2px;
                background: #4d57ff;
              }

              // .study-video-translation {
              //   right: 70px;
              // }
            }
          }
        }

        .study-audio-caption {
          width: 100%;
          height: calc(100% - 600px);
          background: #fff;
          color: #333;
          text-indent: 0em;
          margin-bottom: 15px;
          @include scroll();
          @include flex(center, center, wrap);

          .study-audio-icon {
            width: 55px;
            height: 100%;
            position: absolute;
            z-index: 2;
            left: 0px;
            top: 0px;

            // @include flex(center, center, null);
          }

          .study-original {
            font-size: 32px;
            line-height: 40px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;

            span {
              // @include p-number(0px, 5px);
              &:not(.text-point):hover {
                cursor: pointer;
                font-weight: 900;
                color: $commonColor;
              }
            }
          }
          .study-translation {
            font-size: 22px;
            line-height: 40px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;
          }
        }
      }
    }
  }
}
</style>
<style lang="scss">
.study-audio-slider,
.buttonGroup-bottom-slider,
.buttonGroup-bottom-volume-bar {
  .el-slider__button {
    width: 0.1rem;
    height: 0.1rem;
    margin-bottom: 0.02rem;
  }

  .el-slider__bar {
    background: #4d57ff;
  }
}

.study-audio-slider {
  .el-slider__button-wrapper {
    /* prettier-ignore */
    width: 25Px !important;

    @include flex(center, center, null);

    .el-slider__button {
      /* prettier-ignore */
      width: 16Px;
      /* prettier-ignore */
      height: 16Px;
      /* prettier-ignore */
      margin-bottom: -3Px;
    }
  }
}
.buttonGroup-bottom-volume-bar {
  .el-slider__runway {
    margin: 0 14px !important;
  }
}

@keyframes fadenum {
  100% {
    transform: rotate(360deg);
  }
}

.header {
  .el-dropdown__popper {
    top: 40px !important;
    left: 0px !important;
    right: auto !important;
    bottom: auto !important;
  }
}
</style>
