<script setup lang="ts">
import Header from "@/components/header.vue";
import FontIcon from "@/components/fontIcon.vue";
import Keyword from "@/components/keyword.vue";
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
const { token } = storeToRefs(appStore.authStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const { lessonKey, lessonInfo } = storeToRefs(appStore.lessonStore);
const { setLessonKey } = appStore.lessonStore;
const { setMusicSrc } = appStore.commonStore;
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
const reloadState = ref<boolean>(true)
onMounted(() => {
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
    mediaListIndex.value = 0;
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
      let text = item.original.match(/\b\w+\b/g);
      item.original = item.original.match(
        /\b\w+\b|[\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]/g
      );
      text = text.filter((item) => item.length > 2);
      list.push(...text);
      return item;
    });
    list.forEach((item) => {
      obj[item.toLowerCase()] = {
        name: item.toLowerCase(),
        value: obj[item.toLowerCase()] ? obj[item.toLowerCase()].value + 1 : 1,
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
    captionsList.value = captionaRes.data.map((item, index) => {
      item.original = item.original
        .replace(/\n/g, "")
        .match(/\b\w+\b|[\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]/g);
      return item;
    });
    console.log(captionsList.value);
  }
};
const videoTimeupdate = (time) => {
  if (lastTime.value !== parseInt(time)) {
    let currentTime = time * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item, index) => {
      if (item.startTime < currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        captionObj.value = item;
        mediaIndex.value = index;
        sentenceKey.value = item._key;
      }
    });
    console.log(captionObj.value);
    // if (!captionsState.value) {
    // captionObj.value = null;
    // keyIndex.value = -1;
    // }
    lastTime.value = parseInt(time);
  }
};
const audioTimeupdate = (time) => {
  if (lastTime.value !== parseInt(time)) {
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
    console.log(captionsList.value.length);
    console.log(mediaIndex.value);
    mediaIndex.value =
      captionsList.value.length - 1 === mediaIndex.value
        ? mediaIndex.value
        : mediaIndex.value + 1;
  }
  console.log(mediaIndex.value);
  sentenceKey.value = captionsList.value[mediaIndex.value]._key;
  clickMedia(captionsList.value[mediaIndex.value].startTime);
};

const clickMedia = (time, type?: string, key?: string, index?: number) => {
  let currentTime = time / 1000;
  if (type && key) {
    sentenceKey.value = key;
  }
  studyMediaRef.value.handleTimeChange(currentTime, type, index);
};
const reloadMedia = (time, index) => {
  if (time * 1000 >= captionsList.value[index].endTime) {
    mediaIndex.value = index;
    sentenceKey.value = captionsList.value[index]._key;
    clickMedia(captionsList.value[index].startTime);
  }
};
const chooseWord = async (word, index, type: string, key?: string) => {
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
watch([mediaListIndex, lessonInfo], ([newIndex, newInfo]) => {
  // audioRef.value.pause();
  // videoRef.value.pause();
  if (newInfo && mediaList.value.length > 0) {
    if (newInfo.mediaType === "video") {
      studyTab.value = "video";
    } else if (newInfo.mediaType === "audio") {
      studyTab.value = "audio";
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
    if (studyMediaRef.value) {
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
      api.request.post("study/log", {
        agentKey: agentKey.value,
        mediaKey: mediaList.value[newIndex]._key,
      });
    }, 60000);
  }
});
watch(studyTab, () => {
  sentenceKey.value = "";
  keyIndex.value = -1;
  keyword.value = "";
});
</script>
<template>
  <div class="study" v-if="lessonInfo">
    <!-- class="study-audio" -->
    <!-- <video autoPlay controls ref="audioRef">
      <source :src="audioSrc" type="audio/mpeg" />
    </video> -->
    <audio :src="audioSrc" ref="audioRef" controls autoplay class="study-read"></audio>
    <div class="study-container">
      <div class="study-left">
        <Header :title="mediaList[mediaListIndex].name" :backPath="'/home'">
          <template #icon>
            <el-dropdown max-height="80vh">
              <div class="icon-point" style="margin-right: 8px">
                <FontIcon iconName="liebiao" />
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="mediaListIndex = index" v-for="(item, index) in mediaList"
                    :key="`media${item._key}`" :style="mediaListIndex === index
                      ? { backgroundColor: '#edeeff', color: '#4d57ff' }
                      : {}
                      ">{{ item.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </Header>
        <div class="study-tab">
          <div class="study-tab-item" :class="{ 'study-tab-choose': studyTab === 'video' }" @click="studyTab = 'video'"
            v-if="lessonInfo.mediaType === 'video'">
            视频
          </div>
          <div class="study-tab-item" :class="{ 'study-tab-choose': studyTab === 'audio' }" @click="studyTab = 'audio'"
            v-if="lessonInfo.mediaType === 'audio'">
            音频
          </div>
          <div class="study-tab-item" :class="{ 'study-tab-choose': studyTab === 'original' }"
            @click="studyTab = 'original'">
            原文
          </div>
          <div class="study-tab-item" :class="{ 'study-tab-choose': studyTab === 'translation' }"
            @click="studyTab = 'translation'">
            译文
          </div>
          <div class="study-tab-item" :class="{ 'study-tab-choose': studyTab === 'cloud' }" @click="studyTab = 'cloud'">
            词频
          </div>
        </div>

        <div class="study-cloud" v-if="studyTab === 'cloud' && textList.length > 0">
          <WordChart :chartData="textList" :wordId="'study-word'" @chooseWord="chooseWord" :keyword="keyword" />
        </div>
        <div class="study-box" v-else :style="studyTab === 'video' ? { padding: '10px 0px' } : { padding: '10px 15px' }">
          <template v-if="studyTab === 'original' && articleList.length > 0">
            <div v-for="(item, index) in articleList" :key="`original${index}`" class="text-item">
              <!--                 :style="sentenceKey === item._key ? { color: '#4D57FF' } : {}" -->
              <div style="width: 2em"></div>
              <span v-for="(textItem, textIndex) in item.original" :key="`originalText${textIndex}`"
                :class="{ 'text-point': !/\b\w+\b/g.test(textItem) }" @click="
                  /\b\w+\b/g.test(textItem)
                    ? chooseWord(textItem, textIndex, 'section', item._key)
                    : ''
                  " :style="keyword === textItem && /\b\w+\b/g.test(textItem)
    ? {
      color: '#4D57FF',
    }
    : {}
    ">{{ textItem }}</span>
            </div>
          </template>
          <template v-if="studyTab === 'translation' && articleList.length > 0">
            <div v-for="(item, index) in articleList" :key="`translation${index}`" class="text-item icon-point" :style="item && sentenceKey === item._key ? { color: '#4D57FF' } : {}
              " style="text-indent: 2em">
              {{ item.translation }}
            </div>
          </template>
          <template v-if="studyTab === 'video'">
            <div class="study-video">
              <VideoPlayer :src="mediaSrc" :title="lessonInfo.name" :cover="lessonInfo.cover" :videoIndex="mediaIndex"
                @videoTimeupdate="videoTimeupdate" @changeVideoIndex="changeMediaIndex" @reloadVideo="reloadMedia"
                ref="studyMediaRef" videoType="custom">
                <template #custom>
                  <div class="study-video-content" v-if="studyMediaRef">
                    <div class="study-video-caption" @mouseenter="
                      studyMediaRef.reloadMedia(true);
                    setMusicSrc('/music/inout.mp3');
                    " @mouseleave="
  studyMediaRef.reloadMedia(false);
setMusicSrc('/music/inout.mp3');
">
                      <template v-if="captionObj">
                        <!-- <div class="study-video-subtitle">
                          <div
                            class="study-subtitle-text"
                            :style="{
                              backgroundImage: `url(${
                                studyMediaRef.reloadState
                                  ? '/common/reloadTitle.png'
                                  : '/common/unReloadTitle.png'
                              })`,
                            }"
                          >
                           
                          </div>
                        </div> -->
                        <div class="study-original">
                          <span v-for="(item, index) in captionObj.original" :key="`originalCaption${index}`"
                            :class="{ 'text-point': !/\b\w+\b/g.test(item) }" @click="
                              /\b\w+\b/g.test(item)
                                ? chooseWord(
                                  item,
                                  index,
                                  'caption',
                                  captionObj._key
                                )
                                : ''
                              " :style="keyword === item &&
    index === keyIndex &&
    /\b\w+\b/g.test(item)
    ? {
      color: '#4D57FF',
    }
    : {}
    ">
                            {{ item }}
                          </span>
                        </div>
                      </template>
                    </div>
                    <div class="study-video-buttonGroup">
                      <div class="buttonGroup-top">
                        <div class="buttonGroup-top-text" @click="changeMediaIndex('last')">
                          <FontIcon iconName="shangyiju1" :iconStyle="{
                            fontSize: '10px',
                            marginRight: '3px',
                          }" />上句
                        </div>
                        <div class="buttonGroup-top-center"
                          @click="studyMediaRef.reloadMedia(reloadState); reloadState = !reloadState" :style="{
                            animation:
                              studyMediaRef.reloadState && captionObj
                                ? 'fadenum 3s infinite'
                                : '',
                          }">
                          <img src="/common/reload.svg" alt="" />
                        </div>
                        <div class="buttonGroup-top-text" style="justify-content: flex-end"
                          @click="changeMediaIndex('next')">
                          下句
                          <FontIcon iconName="xiayiju1" :iconStyle="{
                            fontSize: '10px',
                            marginLeft: '3px',
                          }" />
                        </div>
                      </div>
                      <div class="buttonGroup-center" :style="{
                        color: studyMediaRef.reloadState ? '#4d57ff' : '#666',
                      }">
                        <template v-if="studyMediaRef.reloadState && captionObj"><span
                            style="font-weight: 600; margin-right: 2px">磨耳朵:
                          </span>
                          {{ `第 ${mediaIndex + 1} 句 ` }}</template>
                        <template v-else-if="captionObj">{{
                          `欣赏至第 ${mediaIndex + 1} 句 (共 ${captionsList.length
                            } 句)`
                        }}</template>
                      </div>
                      <div class="buttonGroup-bottom">
                        <FontIcon customClassName="buttonGroup-bottom-button" iconName="a-zanting2"
                          @iconClick="studyMediaRef.playVideo" :iconStyle="{ fontSize: '10px' }"
                          v-if="studyMediaRef.isPlay" />
                        <FontIcon customClassName="buttonGroup-bottom-button" iconName="a-bofang2"
                          @iconClick="studyMediaRef.playVideo" :iconStyle="{ fontSize: '10px' }" v-else />
                        <OnClickOutside @trigger="studyMediaRef.videoHuds = false">
                          <div class="buttonGroup-bottom-volume">
                            <div class="buttonGroup-bottom-volume-progress" v-show="studyMediaRef.videoHuds">
                              <el-slider vertical height="100px" class="buttonGroup-bottom-volume-bar"
                                v-model="studyMediaRef.videoVolume" :show-tooltip="false"
                                @change="studyMediaRef.handleVideoVolume" />
                            </div>

                            <FontIcon v-if="studyMediaRef.videoVolume <= 0" customClassName="buttonGroup-bottom-button"
                              iconName="jingyin" :iconStyle="{
                                fontSize: '10px',
                                color: '#888',
                              }" @click.stop="
  studyMediaRef.videoHuds =
  !studyMediaRef.videoHuds
  " />
                            <FontIcon v-if="studyMediaRef.videoVolume > 0" customClassName="buttonGroup-bottom-button"
                              iconName="shengyin" :iconStyle="{
                                fontSize: '10px',
                                color: '#333',
                              }" @click.stop="
  studyMediaRef.videoHuds =
  !studyMediaRef.videoHuds
  " />
                          </div>
                        </OnClickOutside>
                        <div class="buttonGroup-bottom-container">
                          <el-slider class="buttonGroup-bottom-slider" v-model="studyMediaRef.currentProgress"
                            :show-tooltip="false" @change="studyMediaRef.handleProgressChange" />
                          <div class="buttonGroup-bottom-time">
                            <span style="margin-right: 2px">{{
                              studyMediaRef.videoStart
                            }}</span>
                            /
                            <span style="margin-left: 2px">{{
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
            <div class="study-caption study-audio-caption">
              <div v-for="(item, index) in captionsList" :key="`caption${index}`" class="text-item"
                style="padding-left: 10px">
                <FontIcon iconName="a-bofang2" customClassName="study-audio-icon" :iconStyle="{
                  fontSize: '16px',
                  color: '#4D57FF',
                }" v-if="index === mediaIndex" />
                <div class="study-original" :style="sentenceKey === item._key ? { color: '#4D57FF' } : {}" @click="
                  sentenceKey !== item._key
                    ? clickMedia(item.startTime, 'outer', item._key, index)
                    : null
                  ">
                  <span v-for="(textItem, textIndex) in item.original" :key="`originalCaption${textIndex}`"
                    :class="{ 'text-point': !/\b\w+\b/g.test(textItem) }" @click="
                      /\b\w+\b/g.test(textItem) && sentenceKey === item._key
                        ? chooseWord(textItem, textIndex, 'caption', item._key)
                        : ''
                      " :style="keyword === textItem &&
    textIndex === keyIndex &&
    /\b\w+\b/g.test(item)
    ? {
      color: '#4D57FF',
    }
    : {}
    ">{{ textItem }}</span>
                </div>
              </div>
            </div>
            <div class="study-audio" v-if="lessonInfo">
              <AudioPlayer :src="mediaSrc" :title="lessonInfo.name" :cover="lessonInfo.cover" :audioIndex="mediaIndex"
                @audioTimeupdate="audioTimeupdate" @changeAudioIndex="changeMediaIndex" @reloadAudio="reloadMedia"
                ref="studyMediaRef" audioType="custom">
                <template #custom>
                  <div class="study-audio-content" v-if="studyMediaRef">
                    <!-- <div class="study-video-caption"></div> -->
                    <div class="study-video-buttonGroup">
                      <div class="buttonGroup-top">
                        <div class="buttonGroup-top-text" @click="changeMediaIndex('last')">
                          <FontIcon iconName="shangyiju1" :iconStyle="{
                            fontSize: '10px',
                            marginRight: '3px',
                          }" />上句
                        </div>
                        <div class="buttonGroup-top-center"
                          @click="studyMediaRef.reloadMedia(reloadState); reloadState = !reloadState" :style="{
                            animation: studyMediaRef.reloadState
                              ? 'fadenum 3s infinite'
                              : '',
                          }">
                          <img src="/common/reload.svg" alt="" />
                        </div>
                        <div class="buttonGroup-top-text" style="justify-content: flex-end"
                          @click="changeMediaIndex('next')">
                          下句
                          <FontIcon iconName="xiayiju1" :iconStyle="{
                            fontSize: '10px',
                            marginLeft: '3px',
                          }" />
                        </div>
                      </div>
                      <div class="buttonGroup-center" :style="{
                        color: studyMediaRef.reloadState ? '#4d57ff' : '#666',
                      }">
                        <template v-if="studyMediaRef.reloadState"><span style="font-weight: 600; margin-right: 2px">磨耳朵:
                          </span>
                          {{ `第 ${mediaIndex + 1} 句 ` }}</template>
                        <template v-else>{{
                          `欣赏至第 ${mediaIndex + 1} 句 (共 ${captionsList.length
                            } 句)`
                        }}</template>
                      </div>
                      <div class="buttonGroup-bottom">
                        <FontIcon customClassName="buttonGroup-bottom-button" iconName="a-zanting2"
                          @iconClick="studyMediaRef.playAudio" :iconStyle="{ fontSize: '10px' }"
                          v-if="studyMediaRef.isPlay" />
                        <FontIcon customClassName="buttonGroup-bottom-button" iconName="a-bofang2"
                          @iconClick="studyMediaRef.playAudio" :iconStyle="{ fontSize: '10px' }" v-else />
                        <OnClickOutside @trigger="studyMediaRef.audioHuds = false">
                          <div class="buttonGroup-bottom-volume">
                            <div class="buttonGroup-bottom-volume-progress" v-show="studyMediaRef.audioHuds">
                              <el-slider vertical height="100px" class="buttonGroup-bottom-volume-bar"
                                v-model="studyMediaRef.audioVolume" :show-tooltip="false"
                                @change="studyMediaRef.handleAudioVolume" />
                            </div>

                            <FontIcon v-if="studyMediaRef.audioVolume <= 0" customClassName="buttonGroup-bottom-button"
                              iconName="jingyin" :iconStyle="{
                                fontSize: '10px',
                                color: '#888',
                              }" @click.stop="
  studyMediaRef.audioHuds =
  !studyMediaRef.audioHuds
  " />
                            <FontIcon v-if="studyMediaRef.audioVolume > 0" customClassName="buttonGroup-bottom-button"
                              iconName="shengyin" :iconStyle="{
                                fontSize: '10px',
                                color: '#333',
                              }" @click.stop="
  studyMediaRef.audioHuds =
  !studyMediaRef.audioHuds
  " />
                          </div>
                        </OnClickOutside>
                        <div class="buttonGroup-bottom-container">
                          <el-slider class="buttonGroup-bottom-slider" v-model="studyMediaRef.currentProgress"
                            :show-tooltip="false" @change="studyMediaRef.handleProgressChange" />
                          <div class="buttonGroup-bottom-time">
                            <span style="margin-right: 2px">{{
                              studyMediaRef.audioStart
                            }}</span>
                            /
                            <span style="margin-left: 2px">{{
                              studyMediaRef.durationTime
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </AudioPlayer>
            </div>
          </template>
        </div>
      </div>
      <Keyword :keyword="keyword" :keywordKey="keywordKey" @setKeyword="keyword = ''"
        :mediaName="mediaList[mediaIndex]?.name" :type="studyTab === 'cloud' ? 'outer' : 'inner'" />
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

  @include flex(center, center, wrap);

  .study-container {
    width: 100vw;
    height: 100%;
    position: relative;
    z-index: 1;
    @include flex(space-between, center, null);

    .study-left {
      min-width: 1120px;
      flex: 1;
      height: 100%;
      position: relative;
      z-index: 1;
      padding: 29px 0px 0px 0px;
      box-sizing: border-box;

      .study-tab {
        width: 100%;
        height: 70px;
        @include flex(flex-start, center, null);

        .study-tab-item {
          width: 180px;
          height: 70px;
          font-size: 18px;
          color: #919191;
          line-height: 80px;
          text-align: center;
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
        height: calc(100vh - 125px);
        font-family: "Kaiti SC", "STKaiti", "Arial", sans-serif;
        padding: 10px 15px;
        // text-indent: 2em;
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
          // word-wrap: break-word;
          // word-break: normal;
          @include flex(flex-start, center, wrap);

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
          height: 200px;
          padding: 0px 15px;
          box-sizing: border-box;
          @include flex(space-between, center, null);

          .study-video-caption {
            width: calc(100% - 310px);
            height: 100%;
            @include scroll();
            @include flex(center, center, wrap);
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
              font-size: 45px;
              // font-family: PingFang SC, PingFang SC-Semibold;
              font-weight: Semibold;
              color: #000000;
              line-height: 69px;
              letter-spacing: 1.3px;
              padding: 10px;
              @include flex(flex-start, center, wrap);

              >span {
                padding: 0px 8px;
                cursor: pointer;

                // @include p-number(0px, 5px);
                &:hover {
                  color: $commonColor;
                }
              }
            }
          }

          .study-video-buttonGroup {
            width: 295px;
            height: 100%;
            font-family: PingFang SC, PingFang SC-Regular;

            .buttonGroup-top {
              width: 100%;
              height: 95px;

              background: #e8e8e8;
              border-top-left-radius: 9px;
              border-top-right-radius: 9px;

              @include p-number(0px, 10px);
              @include flex(space-between, center, null);

              .buttonGroup-top-text {
                width: 60px;
                height: 30px;
                font-size: 12px;
                cursor: pointer;
                @include flex(center, center, null);

                &:hover {
                  background: #dbdbdb;
                  border-radius: 8px;
                  color: $commonColor;
                }
              }

              .buttonGroup-top-center {
                width: 75px;
                height: 75px;
                overflow: hidden;
                cursor: pointer;

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }
            }

            .buttonGroup-center {
              width: 100%;
              height: 37px;
              background: #e2e2e2;
              border-radius: 0px 0px 9px 9px;
              margin-bottom: 10px;
              font-size: 16px;
              text-align: center;
              line-height: 37px;
            }

            .buttonGroup-bottom {
              width: 100%;
              height: 45px;
              background: rgba(0, 0, 0, 0.09);
              border-radius: 9px;
              @include p-number(0px, 10px);
              @include flex(space-between, center, null);

              .buttonGroup-bottom-button {
                width: 35px;
                height: 100%;
                margin: 0px 2px;
                @include flex(center, center, null);
              }

              .buttonGroup-bottom-container {
                width: calc(100% - 20px);
                height: 100%;
                @include flex(space-between, center, null);

                .buttonGroup-bottom-slider {
                  width: calc(100% - 90px);
                  height: 2px;
                  background: #4d57ff;
                }

                .buttonGroup-bottom-time {
                  font-size: 12px;
                }
              }

              .buttonGroup-bottom-volume {
                position: relative;
                margin-right: 15px;

                .buttonGroup-bottom-volume-progress {
                  width: 32px;
                  height: 140px;
                  position: absolute;
                  top: -145px;
                  right: 10px;
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
            }
          }
        }

        .study-audio-content {
          padding-left: 22px;
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
            height: 55px;
            position: absolute;
            z-index: 2;
            left: -1px;
            top: -2px;

            // @include flex(center, center, null);
          }

          .study-original {
            font-size: 32px;
            line-height: 40px;
            padding: 10px;
            box-sizing: border-box;
            word-break: break-all;

            >span {
              cursor: pointer;

              // @include p-number(0px, 5px);
              &:hover {
                color: $commonColor;
              }
            }
          }
        }
      }

      .study-cloud {
        width: 100%;
        height: calc(100vh - 105px);
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

.buttonGroup-bottom-slider {
  .el-slider__button-wrapper {
    width: 2px;
  }

  .el-slider__runway {
    background-color: #bebebe;
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

/* .d-control-progress{
  height:40px !important;
}*/
@keyframes fadenum {
  100% {
    transform: rotate(360deg);
  }
}
</style>
