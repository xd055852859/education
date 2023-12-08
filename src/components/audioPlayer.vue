<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
const props = defineProps<{
  cover: string;
  title: string;
  src: string;
  audioIndex: number;
  audioType: string;
}>();
const emits = defineEmits<{
  (e: "audioTimeupdate", time: number): void;
  (e: "changeAudioIndex", type: string);
  (e: "reloadAudio", time: number, index: number): void;
  (e: "endMedia"): void;
  (e: "loadNext"): void;
}>();

const isPlay = ref<boolean>(false); //音频是否在播放
const audioStart = ref<string>("0:00");
const durationTime = ref<string>("0:00"); //音频的总时长，显示的时间格式
const duration = ref<number>(0); //音频的总时长
const audioVolume = ref<number>(50); //音量的默认值是0.5
const audioHuds = ref<boolean>(false); //是否显示音量slider
const audioRef = ref<any>(null);
const currentProgress = ref<number>(0);
const reloadState = ref<boolean>(false);
const reloadIndex = ref<number>(-1);
// 获取音频时长
function calculateDuration() {
  console.log(audioRef.value);
  if (audioRef.value) {
    audioRef.value.loop = false;
    audioRef.value.src = props.src;
    // 监听音频播放完毕
    audioRef.value.addEventListener(
      "ended",
      function () {
        isPlay.value = false;
        currentProgress.value = 0;
        emits("loadNext");
      },
      false
    );
    if (audioRef.value != null) {
      console.log(audioRef.value.oncanplay);
      audioRef.value.oncanplay = function () {
        console.log(audioRef.value.duration);
        duration.value = audioRef.value.duration; // 计算音频时长
        durationTime.value = transTime(audioRef.value.duration); //换算成时间格式
      };
      audioRef.value.volume = 0.5; // 设置默认音量50%
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
const playAudio = () => {
  if (audioRef.value.paused) {
    audioRef.value.play();
    isPlay.value = true;
  } else {
    audioRef.value.pause();
    isPlay.value = false;
  }
};

// 根据当前播放时间，实时更新进度条
const updateProgress = (e) => {
  var value = e.target.currentTime / e.target.duration;
  if (audioRef.value.play) {
    currentProgress.value = value * 100;
    audioStart.value = transTime(audioRef.value.currentTime);
    if (reloadState.value) {
      emits("reloadAudio", audioRef.value.currentTime, reloadIndex.value);
    } else {
      emits("audioTimeupdate", audioRef.value.currentTime);
    }
  }
};

//调整播放进度
const handleProgressChange = (val) => {
  if (!val) {
    return;
  }
  // 更新音频的当前播放时间
  handleTimeChange(duration.value * (val / 100), "", 0, true);
};
const handleTimeChange = (
  time,
  type?: string,
  index?: number,
  play?: boolean
) => {
  if (type && index !== -1) {
    reloadIndex.value = index as number;
  }
  audioRef.value.pause();
  audioRef.value.currentTime = time;
  isPlay.value = false;
  if (!play) {
    nextTick(() => {
      audioRef.value.play();
      isPlay.value = true;
      // if (type) {
      //   reloadState.value = true;
      // }
    });
  }
};
//调整音量
const handleAudioVolume = (val) => {
  audioRef.value.volume = val / 100;
};
const pauseMedia = () => {
  audioRef.value.pause();
  isPlay.value = true;
};
const playMedia = (playState) => {
  if (playState) {
    audioRef.value.play();
    isPlay.value = true;
  } else {
    audioRef.value.pause();
    isPlay.value = false;
  }
};
const changeVolume = () => {
  audioHuds.value = !audioHuds.value;
};
const reloadMedia = (state) => {
  reloadState.value = state ? state : !reloadState.value;
  reloadIndex.value = reloadState.value ? props.audioIndex : -1;
};
watchEffect(() => {
  calculateDuration();
});
defineExpose({
  isPlay,
  audioVolume,
  audioHuds,
  audioStart,
  durationTime,
  currentProgress,
  reloadState,
  reloadIndex,
  playAudio,
  handleProgressChange,
  handleAudioVolume,
  handleTimeChange,
  playMedia,
  reloadMedia,
  changeVolume,
});
</script>
<template>
  <audio
    @timeupdate="updateProgress"
    @ended="emits('endMedia')"
    controls
    ref="audioRef"
    style="display: none"
  >
    <source :src="src" type="audio/*" />
    您的浏览器不支持音频播放
  </audio>
  <div class="audio-box" v-if="audioType === 'normal'">
    <el-tooltip content="上一句">
      <FontIcon
        customClassName="audio-button"
        iconName="shangyige"
        @iconClick="emits('changeAudioIndex', 'last')"
        :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
      />
    </el-tooltip>
    <img
      class="audio-img"
      src="/common/play.svg"
      alt=""
      @click="playAudio"
      v-if="isPlay"
    />
    <img
      class="audio-img"
      src="/common/pause.svg"
      alt=""
      @click="playAudio"
      v-else
    />
    <el-tooltip content="下一句">
      <FontIcon
        customClassName="audio-button"
        @click="playAudio"
        iconName="xiayige"
        @iconClick="emits('changeAudioIndex', 'next')"
        :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
      />
    </el-tooltip>
    <div class="audio-container">
      <div class="audio-left">
        <img :src="cover" alt="" />
      </div>
      <div class="audio-right">
        <div class="audio-title">
          <div>{{ title }}</div>
          <div class="audio-time">
            <span style="margin-left: 10px">{{ audioStart }}</span>
            /
            <span style="margin-left: 10px">{{ durationTime }}</span>
          </div>
        </div>
        <el-slider
          class="audio-slider"
          v-model="currentProgress"
          :show-tooltip="false"
          @change="handleProgressChange"
        />
      </div>
    </div>
    <el-tooltip content="循环">
      <FontIcon
        customClassName="audio-button"
        iconName="zhongbo2"
        :iconStyle="{
          fontSize: '22px',
          color: reloadState ? '#4D57FF' : '#888',
          animation: isPlay ? `fadenum ${reloadState ? 1.5 : 3}s infinite` : '',
        }"
        @click.stop="
          reloadState = !reloadState;
          reloadIndex = reloadState ? audioIndex : -1;
        "
      />
    </el-tooltip>
    <div class="volume">
      <div class="volume-progress" v-show="audioHuds">
        <el-slider
          vertical
          height="100px"
          class="volume-bar"
          v-model="audioVolume"
          :show-tooltip="false"
          @change="handleAudioVolume"
        />
      </div>

      <FontIcon
        v-if="audioVolume <= 0"
        customClassName="audio-button"
        iconName="jingyin"
        :iconStyle="{ fontSize: '14px', color: '#888' }"
        @click.stop="audioHuds = !audioHuds"
      />
      <FontIcon
        v-if="audioVolume > 0"
        customClassName="audio-button"
        iconName="shengyin"
        :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
        @click.stop="audioHuds = !audioHuds"
      />
    </div>
  </div>
  <slot name="custom" v-else></slot>
</template>
<style lang="scss">
.audio-box {
  width: 100%;
  height: 100px;
  background: #f6f6f6;
  padding: 0px 25px 0px 38px;
  @include flex(flex-start, center, null);

  .audio-button {
    width: 35px;
    height: 100%;
    @include flex(center, center, null);
  }

  .audio-img {
    width: 35px;
    height: 35px;
    margin: 0px 12px;
  }

  .audio-container {
    width: calc(100% - 360px);
    height: 100%;
    margin: 0px 45px 0px 30px;
    @include flex(space-between, center, null);

    .audio-left {
      width: 42px;
      height: 42px;
      background: #d8d8d8;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .audio-right {
      width: calc(100% - 55px);
      height: 100%;
      align-content: center;
      @include flex(flex-start, center, flex);

      .audio-title {
        width: 100%;
        height: 30px;
        font-family: PingFang SC, PingFang SC-Regular;
        font-size: 20px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 10px;
        @include flex(space-between, center, null);

        .audio-time {
          font-size: 14px;
        }
      }

      .audio-slider {
        width: 100%;
        height: 2px;
        background: #4d57ff;
      }
    }
  }
}

.volume {
  position: relative;
  margin-left: 15px;
  z-index: 10;
  .volume-progress {
    width: 32px;
    height: 140px;
    position: absolute;
    z-index: 10;
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
</style>
<style lang="scss">
.audio-slider,
.volume-bar {
  .el-slider__button {
    /* prettier-ignore */
    width: 16Px;
    /* prettier-ignore */
    height: 16Px;
    /* prettier-ignore */
    margin-bottom: 5Px;
  }

  .el-slider__bar {
    background: #4d57ff;
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

.audio-slider {
  .el-slider__button-wrapper {
    width: 4px;
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
