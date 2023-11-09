<script setup lang="ts">
import FontIcon from "@/components/fontIcon.vue";
const props = defineProps<{
  cover: string;
  title: string;
  src: string;
  audioIndex: number;
}>();
const emits = defineEmits<{
  (e: "audioTimeupdate", time: number): void;
  (e: "changeAudioIndex", type: string);
  (e: "reloadAudio", time: number, index: number): void;
}>();

const audioIsPlay = ref<boolean>(true); //音频是否在播放
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
  if (audioRef.value) {
    audioRef.value.loop = false;
    audioRef.value.src = props.src;
    // 监听音频播放完毕
    audioRef.value.addEventListener(
      "ended",
      function () {
        audioIsPlay.value = true;
        currentProgress.value = 0;
      },
      false
    );
    if (audioRef.value != null) {
      audioRef.value.oncanplay = function () {
        duration.value = audioRef.value.duration; // 计算音频时长
        durationTime.value = transTime(audioRef.value.duration); //换算成时间格式
        console.log(duration.value);
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
    audioIsPlay.value = false;
  } else {
    audioRef.value.pause();
    audioIsPlay.value = true;
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
  handleTimeChange(duration.value * (val / 100));
};
const handleTimeChange = (time, type?: string) => {
  if (type) {
    reloadState.value = false;
  }
  audioRef.value.pause();
  audioRef.value.currentTime = time;
  nextTick(() => {
    audioRef.value.play();
    audioIsPlay.value = false;
  });
};
//调整音量
const handleAudioVolume = (val) => {
  audioRef.value.volume = val / 100;
};
const changeAudio = (type) => {};
watchEffect(() => {
  calculateDuration();
});
defineExpose({
  handleTimeChange,
});
</script>
<template>
  <div class="audio-box">
    <audio
      @timeupdate="updateProgress"
      controls
      ref="audioRef"
      style="display: none"
    >
      <source :src="src" type="audio/mpeg" />
      您的浏览器不支持音频播放
    </audio>
    <FontIcon
      customClassName="audio-button"
      iconName="shangyige"
      @iconClick="emits('changeAudioIndex', 'last')"
      :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
    />
    <img
      class="audio-img"
      src="/common/play.svg"
      alt=""
      @click="playAudio"
      v-if="audioIsPlay"
    />
    <img
      class="audio-img"
      src="/common/pause.svg"
      alt=""
      @click="playAudio"
      v-else
    />

    <FontIcon
      customClassName="audio-button"
      @click="playAudio"
      iconName="xiayige"
      @iconClick="emits('changeAudioIndex', 'next')"
      :iconStyle="{ fontSize: '14px', color: '#4D57FF' }"
    />
    <div class="audio-container">
      <div class="audio-left">
        <img :src="cover" alt="" />
      </div>
      <div class="audio-right">
        <div class="audio-title">
          <div>{{ title }}</div>
          <div class="audio_time">
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
    <FontIcon
      customClassName="audio-button"
      iconName="zhongbo2"
      :iconStyle="{
        fontSize: '22px',
        color: reloadState ? '#4D57FF' : '#888',
      }"
      @click.stop="
        reloadState = true;
        reloadIndex = audioIndex;
      "
    />
    <div class="volume">
      <div class="volume_progress" v-show="audioHuds">
        <el-slider
          vertical
          height="100px"
          class="volume_bar"
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
        .audio_time {
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
  .volume_progress {
    width: 32px;
    height: 140px;
    position: absolute;
    top: -142px;
    right: -4px;
  }
  .volume_bar {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .volume_icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
}
</style>
<style lang="scss">
.audio-slider,
.volume_bar {
  .el-slider__button {
    width: 16px;
    height: 16px;
    margin-bottom: 5px;
  }
  .el-slider__bar {
    background: #4d57ff;
  }
}
.audio-slider {
  .el-slider__button-wrapper {
    width: 4px;
  }
}
.volume_bar {
  .el-slider__runway {
    margin: 0 14px !important;
  }
}
</style>
