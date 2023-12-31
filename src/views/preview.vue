<script setup lang="ts">
import Header from "@/components/header.vue";
import Avatar from "@/components/avatar.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import "vue3-video-play/dist/style.css";
import { videoPlay } from "vue3-video-play";
import VideoPlayer from "@/components/videoPlayer.vue";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import router from "@/router";
import { getSearchParamValue } from "@/services/util";
const { deviceType } = storeToRefs(appStore.commonStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const props = defineProps<{
  lessonKey: string;
}>();
const mediaList = ref<any>([]);
const captionsList = ref<any>([]);
const articleList = ref<any>([]);
const mediaKey = ref<string>("");
const mediaIndex = ref<number>(-1);
const lessonInfo = ref<any>(null);
const videoSrc = ref<string>("");
const original = ref<string>("");
const translation = ref<string>("");
const captionsState = ref<boolean>(false);
const lastTime = ref<number>(0);
const videoRef = ref<any>(null);
const previewType = ref<string>("");
const studyMediaRef = ref<any>(null);
onMounted(() => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
  getLessonInfo();
  const search = window.location.search
    ? window.location.search.split("?")[1]
    : window.location.hash.split("?")[1];
  previewType.value = getSearchParamValue(search, "type") as string;
  if (getSearchParamValue(search, "index")) {
    mediaIndex.value = +(getSearchParamValue(search, "index") as string);
  }
});
const getLessonInfo = async () => {
  let lessonRes = (await api.request.get("resource/detail", {
    resourceKey: props.lessonKey,
    agentKey: agentKey.value,
  })) as ResultProps;
  if (lessonRes.msg === "OK") {
    lessonInfo.value = lessonRes.data;
    getMedia();
  }
};
const subscribeLesson = async (key) => {
  const dataRes = (await api.request.post("subscribe", {
    agentKey: agentKey.value,
    resourceKey: key,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    ElMessage.success("订阅成功");
    lessonInfo.value.hasAdd = true;
  }
};
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
  let captionaRes = (await api.request.get("caption", {
    mediaKey: key,
  })) as ResultProps;
  if (captionaRes.msg === "OK") {
    captionsList.value = captionaRes.data;
  }
};
const getArticleList = async (key) => {
  let list: any = [];
  let obj: any = {};
  let articleRes = (await api.request.get("section", {
    mediaKey: key,
  })) as ResultProps;
  if (articleRes.msg === "OK") {
    articleList.value = articleRes.data;
    console.log(articleList.value);
  }
};
const setCaption = (index) => {
  videoSrc.value = mediaList.value[index].url;
  getCaption(mediaList.value[index]._key);
};

const videoTimeupdate = (time) => {
  if (lastTime.value !== time) {
    let currentTime = time * 1000;
    captionsState.value = false;
    captionsList.value.forEach((item) => {
      if (item.startTime < currentTime && item.endTime > currentTime) {
        captionsState.value = true;
        original.value = item.original;
        translation.value = item.translation;
      }
    });
    if (!captionsState.value) {
      original.value = "";
      translation.value = "";
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
  clickMedia(captionsList.value[mediaIndex.value].startTime);
};
const reloadMedia = (time, index) => {
  if (time * 1000 >= captionsList.value[index].endTime) {
    mediaIndex.value = index;
    clickMedia(captionsList.value[index].startTime);
  }
};
const clickMedia = (time, type?: string) => {
  let currentTime = time / 1000;
  studyMediaRef.value.handleTimeChange(currentTime, type);
};
const toUrl = () => {
  router.push(`/home/study/${lessonInfo.value._key}`);
};
watchEffect(() => {
  if (mediaList.value.length > 0 && mediaList.value[mediaIndex.value]) {
    videoSrc.value = mediaList.value[mediaIndex.value].url;
    mediaKey.value = mediaList.value[mediaIndex.value]._key;
    getCaption(mediaList.value[mediaIndex.value]._key);
    getArticleList(mediaList.value[mediaIndex.value]._key);
    if (studyMediaRef.value) {
      studyMediaRef.value.handleTimeChange(0, "out", -1, true);
    }
  }
});
</script>
<template>
  <div
    class="preview"
    v-if="lessonInfo"
    :class="{ 'preview-phone': deviceType === 'phone' }"
  >
    <Header
      :title="lessonInfo.name"
      :backPath="'/home/center'"
      :color="'#fff'"
      :noTitle="deviceType === 'phone'"
      v-if="previewType !== 'back'"
    >
      <template #icon>
        <el-dropdown
          max-height="300px"
          trigger="click"
          v-if="deviceType === 'phone'"
        >
          <div class="icon-point dp--center single-to-long" style="color: #fff">
            <FontIcon iconName="liebiao" style="margin-right: 8px" />
            {{ mediaList[mediaIndex]?.name }}
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                @click="mediaIndex = index"
                v-for="(item, index) in mediaList"
                :key="`media${item._key}`"
                :style="
                  mediaIndex === index
                    ? { backgroundColor: '#edeeff', color: '#4d57ff' }
                    : {}
                "
                >{{ item.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </Header>
    <div class="preview-header">
      <div class="dp--center">
        <Avatar
          :src="lessonInfo.developerInfo?.logo"
          :alt="lessonInfo.developerInfo?.name"
          :imgStyle="{ marginRight: '10px' }"
        />
        二次创作者：{{ lessonInfo.developerInfo?.name }}
      </div>
      <div class="dp--center" v-if="previewType !== 'back'">
        <el-button
          type="primary"
          round
          class="preview-header-button"
          @click="toUrl"
          style="background-color: #fff05e; color: #333333"
          v-if="lessonInfo.hasAdd"
          >开始学习</el-button
        >
        <el-button
          type="primary"
          round
          class="preview-header-button"
          @click="subscribeLesson(lessonInfo._key)"
          v-else
          >订阅</el-button
        >
      </div>
    </div>
    <div class="preview-container">
      <div class="preview-left">
        <template
          v-if="
            lessonInfo.mediaType === 'video' || lessonInfo.mediaType === 'audio'
          "
        >
          <VideoPlayer
            :src="videoSrc"
            :title="lessonInfo.name"
            :cover="lessonInfo.cover"
            :videoIndex="mediaIndex"
            @videoTimeupdate="videoTimeupdate"
            @changeVideoIndex="changeMediaIndex"
            @reloadVideo="reloadMedia"
            ref="studyMediaRef"
            videoType="preview"
          />
          <div
            class="preview-left-audio"
            v-if="lessonInfo.mediaType === 'audio'"
          >
            <img :src="lessonInfo.cover" alt="" />
          </div>
          <div class="preview-left-caption">
            <div
              class="preview-left-original"
              :style="!original ? { background: 'transparent' } : {}"
            >
              {{ original }}
            </div>
            <div
              class="preview-left-translation"
              :style="!translation ? { background: 'transparent' } : {}"
            >
              {{ translation }}
            </div>
          </div>
        </template>
        <template v-if="lessonInfo.mediaType === 'pdf'">
          <div
            v-for="(item, index) in articleList"
            :key="`original${index}`"
            class="preview-left-article"
          >
            {{ item.original }}
          </div>
        </template>
      </div>
      <div class="preview-right" v-if="deviceType === 'pc'">
        <div class="preview-right-title">资源选集</div>
        <div class="preview-media">
          <el-tooltip
            v-for="(item, index) in mediaList"
            :key="`media${item._key}`"
            :content="item.name"
            placement="right"
            :hide-after="0"
          >
            <div
              class="preview-media-item single-to-long"
              @click="mediaIndex = index"
              :style="mediaIndex === index ? { background: '#38383c' } : {}"
            >
              P{{ index + 1 }}. {{ item.name }}
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.preview {
  width: 100%;
  height: 100%;
  background: #161620;
  padding: 0px 0px 34px 0px;
  box-sizing: border-box;
  align-content: flex-start;
  @include flex(center, center, wrap);

  .preview-header {
    width: 90%;
    height: 50px;
    margin-top: 30px;
    margin-bottom: 50px;
    font-size: 20px;
    color: #ffffff;
    @include flex(space-between, center, null);

    .preview-header-button {
      width: 168px;
      height: 50px;
      font-size: 20px;
    }
  }

  .preview-container {
    width: 90%;
    height: calc(100% - 200px);
    @include flex(space-between, center, null);

    .preview-left {
      flex: 1;
      height: 100%;
      position: relative;
      z-index: 1;
      padding: 0px 10px;
      box-sizing: border-box;
      @include scroll();

      .preview-left-audio {
        width: 100%;
        height: calc(100% - 152px);
        position: absolute;
        z-index: 2;
        left: 0px;
        top: 0px;
        overflow: hidden;

        img {
          width: 100%;
          height: 90%;
          object-fit: cover;
        }
      }

      .preview-left-caption {
        width: calc(100% - 50px);
        min-height: 0px;
        position: absolute;
        z-index: 1;
        left: 0px;
        bottom: 100px;

        .preview-left-original {
          // width: 100%;
          // height: 35px;
          font-size: 28px;
          color: #fff;
          text-align: left;
          line-height: 35px;
          padding: 15px;
          box-sizing: border-box;
          // background-color: rgba(0, 0, 0, 0.5);
        }

        .preview-left-translation {
          // width: 100%;
          font-size: 24px;
          color: #e3e3e3;
          text-align: left;
          line-height: 30px;
          padding: 0px 15px 15px 15px;
          box-sizing: border-box;
          // background-color: rgba(0, 0, 0, 0.5);
        }
      }

      .preview-left-article {
        font-size: 25px;
        color: #fff;
        line-height: 38px;
      }
    }

    .preview-right {
      width: 365px;
      height: 100%;
      background: #232325;
      border-radius: 12px;
      @include p-number(25px, 35px);

      .preview-right-title {
        width: 100%;
        height: 35px;
        font-size: 24px;
        font-weight: 500;
        color: #ffffff;
        line-height: 35px;
        letter-spacing: 1px;
        margin-bottom: 18px;
      }

      .preview-media {
        width: 100%;
        height: calc(100% - 43px);
        @include scroll();

        .preview-media-item {
          width: 100%;
          height: 55px;
          // background: #38383c;
          border-radius: 12px;
          font-size: 18px;
          color: #ffffff;
          line-height: 55px;
          cursor: pointer;
          @include p-number(0px, 13px);

          &:hover {
            border-radius: 12px;
          }
        }
      }
    }
  }
}
.preview-phone {
  .preview-container {
    width: 90%;
    height: calc(100% - 200px);
    @include flex(space-between, center, null);

    .preview-left {
      .preview-left-audio {
        height: calc(100% - 400px);
      }
      .preview-left-caption {
        bottom: 250px;
      }

      .preview-left-article {
        font-size: 25px;
        color: #fff;
        line-height: 38px;
      }
    }
  }
}
</style>
<style></style>
