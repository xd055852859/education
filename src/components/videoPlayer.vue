<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
import appStore from "@/store";
import _ from "lodash";
import { storeToRefs } from "pinia";
const { deviceType } = storeToRefs(appStore.commonStore);
const props = defineProps<{
  cover: string;
  title: string;
  src: string;
  videoIndex: number;
  videoType: string;
}>();
const emits = defineEmits<{
  (e: "videoTimeupdate", time: number, type?: string): void;
  (e: "changeVideoIndex", type: string);
  (e: "reloadVideo", time: number, index: number): void;
  (e: "loadNext"): void;
}>();

const isPlay = ref<boolean>(false); //音频是否在播放
const videoStart = ref<string>("0:00");
const durationTime = ref<string>("0:00"); //音频的总时长，显示的时间格式
const duration = ref<number>(0); //音频的总时长
const videoVolume = ref<number>(50); //音量的默认值是0.5
const videoHuds = ref<boolean>(false); //是否显示音量slider
const videoRef = ref<any>(null);
const currentProgress = ref<number>(0);
const reloadState = ref<boolean>(false);
const reloadIndex = ref<number>(-1);
onMounted(() => {
  videoRef.value.addEventListener(
    "ended",
    function () {
      if (props.videoType === "preview") {
        console.log("???");
        videoRef.value.pause();
        isPlay.value = false;
      } else {
        currentProgress.value = 0;
        emits("loadNext");
      }
    },
    false
  );
});
// 获取音频时长
function calculateDuration() {
  if (videoRef.value) {
    videoRef.value.src = props.src;
    videoRef.value.pause();
    isPlay.value = false;
    // 监听音频播放完毕
    videoRef.value.oncanplay = function () {
      console.log("!!!",isPlay.value);
      duration.value = videoRef.value.duration; // 计算音频时长
      durationTime.value = transTime(videoRef.value.duration); //换算成时间格式
      // nextTick(() => {
      // videoRef.value.play();
      // isPlay.value = true;
      // });
    };
  }
}
// 音频播放时间换算
const transTime = (duration) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const formattedMinutes = String(minutes).padStart(2, "0"); //padStart(2,"0") 使用0填充使字符串长度达到2
  const formattedSeconds = String(seconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
};
// 播放暂停控制
const playVideo = (state) => {
  if (state) {
    videoRef.value.play();
    isPlay.value = true;
  } else {
    videoRef.value.pause();
    isPlay.value = false;
  }
};

// 根据当前播放时间，实时更新进度条
const updateProgress = (e) => {
  var value = e.target.currentTime / e.target.duration;
  if (videoRef.value?.play) {
    currentProgress.value = value * 100;
    videoStart.value = transTime(videoRef.value.currentTime);
    if (reloadState.value) {
      emits("reloadVideo", videoRef.value.currentTime, reloadIndex.value);
    } else {
      emits("videoTimeupdate", videoRef.value.currentTime);
    }
  }
};

//调整播放进度
const handleProgressChange = _.debounce((val) => {
  if (!val) {
    return;
  }
  console.log(val);
  // 更新音频的当前播放时间
  handleTimeChange(duration.value * (val / 100), "", 0, true);
  emits("videoTimeupdate", duration.value * (val / 100), "change");
}, 100);
const handleTimeChange = (
  time,
  type?: string,
  index?: number,
  play?: boolean
) => {
  if (type && index !== -1) {
    reloadIndex.value = index as number;
  }
  videoRef.value.pause();
  videoRef.value.currentTime = time;
  isPlay.value = false;
  if (!play) {
    nextTick(() => {
      videoRef.value.play();
      isPlay.value = true;
    });
  }
};
//调整音量
const handleVideoVolume = (val) => {
  videoRef.value.volume = val / 100;
};
const changeVolume = () => {
  videoHuds.value = !videoHuds.value;
};
const playMedia = (playState) => {
  if (playState) {
    videoRef.value.play();
    isPlay.value = true;
  } else {
    videoRef.value.pause();
    isPlay.value = false;
  }
};
const reloadMedia = (state) => {
  reloadState.value = state ? state : !reloadState.value;
  reloadIndex.value = reloadState.value ? props.videoIndex : -1;
};
watchEffect(() => {
  calculateDuration();
});
defineExpose({
  isPlay,
  videoVolume,
  videoHuds,
  videoStart,
  durationTime,
  currentProgress,
  reloadState,
  reloadIndex,
  playVideo,
  handleProgressChange,
  handleVideoVolume,
  handleTimeChange,
  playMedia,
  reloadMedia,
  changeVolume,
});
</script>
<template>
  <div
    class="video-content"
    :class="{
      'video-content-phone': deviceType === 'phone',
      'video-content-preview': videoType === 'preview',
    }"
  >
    <!--       x5-video-player-fullscreen="true"
      x5-video-orientation="portraint" -->
    <video
      @timeupdate="updateProgress"
      :controls="false"
      ref="videoRef"
      class="video-resource"
      :class="{ 'video-resource-preview': videoType === 'preview' }"
      @click="playVideo(!isPlay)"
      :loop="false"
      :volume="0.5"
      preload="metadata"
      x5-video-player-type="h5"
      playsinline
      webkit-playsinline="true"
      x5-playsinline="true"
    >
      <source :src="src" type="video/*" />
      您的浏览器不支持视频播放
    </video>
    <div v-if="!isPlay" class="play-button" @click="playVideo(!isPlay)">
      <img src="/common/playBig.png" alt="" />
    </div>
    <div
      class="video-box"
      v-if="videoType === 'normal' || videoType === 'preview'"
    >
      <FontIcon
        customClassName="video-button"
        iconName="a-zanting2"
        @iconClick="playVideo(false)"
        :iconStyle="{ fontSize: '18px', color: '#fff' }"
        v-if="isPlay"
      />
      <FontIcon
        customClassName="video-button"
        iconName="a-bofang2"
        @iconClick="playVideo(true)"
        :iconStyle="{ fontSize: '18px', color: '#fff' }"
        v-else
      />

      <div
        class="video-container"
        :style="videoType === 'preview' ? { width: 'calc(100% - 60px)' } : {}"
      >
        <el-slider
          class="video-slider"
          v-model="currentProgress"
          :show-tooltip="false"
          @input="handleProgressChange"
        />
        <div class="video-time">
          <span style="margin-right: 5px">{{ videoStart }}</span
          >/<span style="margin-left: 5px">{{ durationTime }}</span>
        </div>
      </div>
      <div class="volume">
        <div class="volume-progress" v-show="videoHuds">
          <el-slider
            vertical
            height="70px"
            class="volume-bar"
            v-model="videoVolume"
            :show-tooltip="false"
            @change="handleVideoVolume"
            size="large"
          />
        </div>

        <FontIcon
          v-if="videoVolume <= 0"
          customClassName="video-button"
          iconName="jingyin"
          :iconStyle="{ fontSize: '14px', color: '#888' }"
          @click.stop="videoHuds = !videoHuds"
        />
        <FontIcon
          v-if="videoVolume > 0"
          customClassName="video-button"
          iconName="shengyin"
          :iconStyle="{ fontSize: '14px', color: '#fff' }"
          @click.stop="videoHuds = !videoHuds"
        />
      </div>
      <template v-if="videoType === 'normal'">
        <el-tooltip content="上一句">
          <FontIcon
            customClassName="video-button"
            iconName="shangyiju"
            @iconClick="emits('changeVideoIndex', 'last')"
            :iconStyle="{ fontSize: '18px', color: '#fff' }"
          />
        </el-tooltip>
        <el-tooltip content="循环">
          <FontIcon
            customClassName="video-button"
            iconName="zhongbo2"
            :iconStyle="{
              fontSize: '22px',
              color: reloadState ? '#fff' : '#444',
              margin: '0px 20px',
              animation: isPlay
                ? `fadenum ${reloadState ? 1.5 : 3}s infinite`
                : '',
            }"
            @click.stop="reloadMedia(true)"
          />
        </el-tooltip>
        <el-tooltip content="下一句">
          <FontIcon
            customClassName="video-button"
            @click="playVideo(!isPlay)"
            iconName="xiayiju"
            @iconClick="emits('changeVideoIndex', 'next')"
            :iconStyle="{ fontSize: '18px', color: '#fff' }"
          />
        </el-tooltip>
      </template>
    </div>

    <slot name="custom" v-else></slot>
  </div>
</template>
<style lang="scss">
.video-content {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;

  .play-button {
    width: 260px;
    height: 260px;
    position: absolute;
    z-index: 2;
    top: calc(50% - 205px);
    left: calc(50% - 130px);
    img {
      width: 100%;
      height: 100%;
    }
  }

  // background-color: rgb(23, 23, 33);
  .video-resource {
    width: 100%;
    height: calc(100% - 250px);
    background-color: rgb(23, 23, 33);
  }

  .video-resource-preview {
    height: calc(100% - 145px);
  }

  .video-box {
    width: 100%;
    height: 50px;
    background-color: rgb(0, 0, 0, 0.1);
    padding: 0px 10px;
    box-sizing: border-box;
    position: absolute;
    z-index: 5;
    left: 0px;
    bottom: 0px;
    @include flex(flex-start, center, null);

    .video-button {
      width: 35px;
      height: 100%;
      margin: 0px 2px;
      @include flex(center, center, null);
    }

    .video-img {
      width: 35px;
      height: 35px;
      margin: 0px 12px;
    }

    .video-container {
      width: calc(100% - 300px);
      height: 100%;
      margin: 0px 10px 0px 30px;

      @include flex(space-between, center, null);

      .video-slider {
        width: calc(100% - 120px);
        height: 2px;
        background: #4d57ff;
      }

      .video-time {
        font-size: 14px;
        color: #fff;
      }
    }
  }

  .volume {
    position: relative;
    margin-right: 15px;
    z-index: 10;
    padding-right: 10px;
    box-sizing: border-box;
    .volume-progress {
      /* prettier-ignore */
      height: 80Px;
      width: 32px;
      position: absolute;
      z-index: 10;
      /* prettier-ignore */
      top: -55Px;
      /* prettier-ignore */
      left: -25Px;
    }

    .volume-bar {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .volume-icon {
      width: 24px;
      height: 24px;
      cursor: pointer;
    }
  }
}
.video-content-phone {
  .video-resource {
    height: 35%;
  }
  .video-box {
    height: 50px;
    padding: 0px;
    .video-button {
      width: 35px;
      height: 100%;
      margin: 0px 2px;
      @include flex(center, center, null);
    }

    .video-img {
      width: 35px;
      height: 35px;
      margin: 0px 12px;
    }

    .video-container {
      width: calc(100% - 300px);
      height: 100%;
      margin: 0px 10px 0px 30px;

      @include flex(space-between, center, null);

      .video-slider {
        width: calc(100% - 160px);
        height: 2px;
        background: #4d57ff;
      }

      .video-time {
        font-size: 18px;
        color: #fff;
        margin-right: 5px;
      }
    }
  }
}
.video-content-preview {
  height: calc(100% - 30px);
}
</style>
<style lang="scss">
.video-slider,
.volume-bar {
  .el-slider__button {
    /* prettier-ignore */
    width: 16Px;
    /* prettier-ignore */
    height: 16Px;
    /* prettier-ignore */
    margin-bottom: 10Px;
  }

  .el-slider__bar {
    background: #4d57ff;
  }
}
.video-content-phone {
  .video-slider {
    .el-slider__button {
      /* prettier-ignore */
      margin-bottom: 36Px;
    }
  }
}
.buttonGroup-bottom-slider {
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

.video-slider {
  .el-slider__button-wrapper {
    width: 4px !important;
  }
}

.volume-bar {
  .el-slider__runway {
    margin: 0 14px !important;
  }
}

@keyframes fadenum {
  100% {
    transform: rotate(360deg);
  }
}
</style>
