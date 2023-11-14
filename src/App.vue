<script setup lang="ts">
import { getSearchParamValue } from "@/services/util";
import request from "@/services/api";
import { storeToRefs } from "pinia";
import router from "@/router";
import appStore from "@/store";
import api from "@/services/api";

const dayjs: any = inject("dayjs");
const { token } = storeToRefs(appStore.authStore);
const { musicSrc } = storeToRefs(appStore.commonStore);
const { setToken, getUserInfo } = appStore.authStore;
const { setDeviceWidth } = appStore.commonStore;
const musicRef = ref<any>(null);
onMounted(() => {
  let url = window.location.href;
  //自动切换为https
  if (url.indexOf("http://localhost") === -1 && url.indexOf("https") < 0) {
    url = url.replace("http:", "https:");
    window.location.replace(url);
  }
  setDeviceWidth(
    document.documentElement.offsetWidth,
    document.documentElement.offsetHeight
  );

  const search = window.location.search
    ? window.location.search.split("?")[1]
    : window.location.hash.split("?")[1];
  const token = getSearchParamValue(search, "token")
    ? (getSearchParamValue(search, "token") as string)
    : localStorage.getItem("auth_token");
  if (token) {
    request.setToken(token);
    setToken(token);
  } else {
    router.push("/");
  }
});
//初始化
watch(
  token,
  (newVal) => {
    if (newVal) {
      getUserInfo();
    }
  },
  { immediate: true }
);
watch(musicSrc, (newSrc) => {
  musicRef.value.pause();
  musicRef.value.src = newSrc;
  nextTick(() => {
    musicRef.value.play();
  });
});
</script>

<template>
  <router-view></router-view>
  <audio
    ref="musicRef"
    src=""
    :style="{ position: 'fixed', zIndex: -5, opacity: 0 }"
  >
    您的浏览器不支持 audio 标签。
  </audio>
</template>

<style lang="scss">
#app {
  background: var(--diary-bg-color);
  -webkit-tap-highlight-color: transparent;
}
*::-webkit-scrollbar {
  width: 4px;
  height: 2px;
}

*::-webkit-scrollbar-thumb {
  border-radius: 100px;
  background-color: var(--el-text-color-secondary);
}
</style>
