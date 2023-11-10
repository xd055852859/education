<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
const props = defineProps<{
  cover: string;
  title: string;
  src: string;
  videoIndex: number;
}>();
const emits = defineEmits<{
  (e: "videoTimeupdate", time: number): void;
  (e: "changeVideoIndex", type: string);
  (e: "reloadVideo", time: number, index: number): void;
}>();

const videoIsPlay = ref<boolean>(true); //音频是否在播放
const videoStart = ref<string>("0:00");
const durationTime = ref<string>("0:00"); //音频的总时长，显示的时间格式
const duration = ref<number>(0); //音频的总时长
const videoVolume = ref<number>(50); //音量的默认值是0.5
const videoHuds = ref<boolean>(false); //是否显示音量slider
const videoRef = ref<any>(null);
const currentProgress = ref<number>(0);
const reloadState = ref<boolean>(false);
const reloadIndex = ref<number>(-1);
// 获取音频时长
function calculateDuration() {
  if (videoRef.value) {
    videoRef.value.loop = false;
    videoRef.value.src = props.src;
    // 监听音频播放完毕
    videoRef.value.addEventListener(
      "ended",
      function () {
        videoIsPlay.value = true;
        currentProgress.value = 0;
      },
      false
    );
    if (videoRef.value != null) {
      videoRef.value.oncanplay = function () {
        duration.value = videoRef.value.duration; // 计算音频时长
        durationTime.value = transTime(videoRef.value.duration); //换算成时间格式
        console.log(duration.value);
      };
      videoRef.value.volume = 0.5; // 设置默认音量50%
    }
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
const playVideo = () => {
  if (videoRef.value.paused) {
    videoRef.value.play();
    videoIsPlay.value = false;
  } else {
    videoRef.value.pause();
    videoIsPlay.value = true;
  }
};

// 根据当前播放时间，实时更新进度条
const updateProgress = (e) => {
  var value = e.target.currentTime / e.target.duration;
  if (videoRef.value.play) {
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
const handleProgressChange = (val) => {
  if (!val) {
    return;
  }
  // 更新音频的当前播放时间
  handleTimeChange(duration.value * (val / 100));
};
const handleTimeChange = (time, type?: string) => {
  if (type) {
    reloadState.value = false;
  }
  videoRef.value.pause();
  videoRef.value.currentTime = time;
  nextTick(() => {
    videoRef.value.play();
    videoIsPlay.value = false;
  });
};
//调整音量
const handleVideoVolume = (val) => {
  videoRef.value.volume = val / 100;
};
const pauseMedia = () => {
  videoRef.value.pause();
  videoIsPlay.value = true;
};
watchEffect(() => {
  calculateDuration();
});
defineExpose({
  handleTimeChange,
  pauseMedia
});
</script>
<template>
  <div class="video-content">
    <video
      @timeupdate="updateProgress"
      :controls="false"
      ref="videoRef"
      class="video-resource"
    >
      <source :src="src" type="video/*" />
      您的浏览器不支持视频播放
    </video>
    <div class="video-box">
      <FontIcon
        customClassName="video-button"
        iconName="shangyige"
        @iconClick="emits('changeVideoIndex', 'last')"
        :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
      />
      <img
        class="video-img"
        src="/common/play.svg"
        alt=""
        @click="playVideo"
        v-if="videoIsPlay"
      />
      <img
        class="video-img"
        src="/common/pause.svg"
        alt=""
        @click="playVideo"
        v-else
      />

      <FontIcon
        customClassName="video-button"
        @click="playVideo"
        iconName="xiayige"
        @iconClick="emits('changeVideoIndex', 'next')"
        :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
      />

      <div class="video-container">
        <el-slider
          class="video-slider"
          v-model="currentProgress"
          :show-tooltip="false"
          @change="handleProgressChange"
        />
        <div class="video-time">
          <span style="margin-left: 10px">{{ videoStart }}</span>
          /
          <span style="margin-left: 10px">{{ durationTime }}</span>
        </div>
      </div>
      <FontIcon
        customClassName="video-button"
        iconName="zhongbo2"
        :iconStyle="{
          fontSize: '22px',
          color: reloadState ? '#4D57FF' : '#888',
        }"
        @click.stop="
          reloadState = !reloadState;
          reloadIndex = reloadState ? videoIndex : -1;
        "
      />
      <div class="volume">
        <div class="volume-progress" v-show="videoHuds">
          <el-slider
            vertical
            height="100px"
            class="volume-bar"
            v-model="videoVolume"
            :show-tooltip="false"
            @change="handleVideoVolume"
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
          :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
          @click.stop="videoHuds = !videoHuds"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.video-content {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  background-color: rgb(23, 23, 33);
  .video-resource {
    width: 100%;
    height: calc(100% - 50px);
    background-color: rgb(23, 23, 33);
  }
  .video-box {
    width: 100%;
    height: 50px;
    background-color: rgb(0, 0, 0, 0.1);
    padding: 0px 10px 0px 38px;
    box-sizing: border-box;
    position: absolute;
    z-index: 5;
    left: 0px;
    bottom: 0px;
    @include flex(flex-start, center, null);
    .video-button {
      width: 35px;
      height: 100%;
      @include flex(center, center, null);
    }
    .video-img {
      width: 35px;
      height: 35px;
      margin: 0px 12px;
    }
    .video-container {
      width: calc(100% - 360px);
      height: 100%;
      margin: 0px 45px 0px 30px;
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
    margin-left: 15px;
    .volume-progress {
      width: 32px;
      height: 140px;
      position: absolute;
      top: -142px;
      right: -4px;
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
</style>
<style lang="scss">
.video-slider,
.volume-bar {
  .el-slider__button {
    width: 16px;
    height: 16px;
    margin-bottom: 5px;
  }
  .el-slider__bar {
    background: #4d57ff;
  }
}
.video-slider {
  .el-slider__button-wrapper {
    width: 4px;
  }
}
.volume-bar {
  .el-slider__runway {
    margin: 0 14px !important;
  }
}
</style>