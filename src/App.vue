<script setup lang="ts">
import { getSearchParamValue, is_mobile } from "@/services/util";
import request from "@/services/api";
import { storeToRefs } from "pinia";
import router from "@/router";
import appStore from "@/store";
import api from "@/services/api";
import _ from "lodash";
const dayjs: any = inject("dayjs");
const { token } = storeToRefs(appStore.authStore);
const { musicSrc, musicNum, deviceWidth, deviceHeight } = storeToRefs(
  appStore.commonStore
);
const { setToken, getUserInfo } = appStore.authStore;
const { setDeviceWidth, setDeviceType } = appStore.commonStore;
const musicRef = ref<any>(null);
onMounted(() => {
  changeDevice();
  // 检测设备方向
  window.addEventListener("orientationchange", _.debounce(changeDevice, 100));
  // // 检测设备方向
  window.addEventListener(
    "resize",
    // function () {
    //   document.documentElement.style.setProperty(
    //     "--vh",
    //     `${window.innerHeight * 0.01}px`
    //   );
    _.debounce(changeDevice, 100)
    // }
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
const changeDevice = () => {
  setDeviceWidth(
    document.documentElement.offsetWidth,
    document.documentElement.offsetHeight
  );
  let html: any = document.getElementById("htmlId");
  //
  if (deviceWidth.value < deviceHeight.value) {
    setDeviceType("phone");
    if (is_mobile()) {
      html.style.fontSize = "100px";
    } else {
      html.style.fontSize = "120px";
    }
  } else {
    setDeviceType("pc");
  }
};
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
watch([musicSrc, musicNum], ([newSrc, newNum]) => {
  if (musicRef.value) {
    musicRef.value.pause();
    musicRef.value.src = newSrc;
    nextTick(() => {
      musicRef.value.play();
    });
  }
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
*::-webkit-scrollbar {
  width: 4px;
  height: 2px;
}

*::-webkit-scrollbar-thumb {
  border-radius: 100px;
  background-color: var(--el-text-color-secondary);
}
</style>
