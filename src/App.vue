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
  let url = window.location.href;
  //自动切换为https
  // if (url.indexOf("http://localhost") === -1 && url.indexOf("https") < 0) {
  //   url = url.replace("http:", "https:");
  //   window.location.replace(url);
  // }

  setDeviceWidth(
    document.documentElement.offsetWidth,
    document.documentElement.offsetHeight
  );
  if (is_mobile()) {
    orientationPhone();
    setDeviceType("phone");
  } else {
    orientationDevice(deviceWidth.value < deviceHeight.value);
    setDeviceType("pc");
  }

  // // 检测设备方向
  window.addEventListener(
    "orientationchange",
    _.debounce(function () {
      setDeviceWidth(
        document.documentElement.offsetWidth,
        document.documentElement.offsetHeight
      );
      if (is_mobile()) {
        orientationPhone();
      } else {
        orientationDevice(deviceWidth.value < deviceHeight.value);
      }
    }, 100)
  );
  // // 检测设备方向
  window.addEventListener(
    "resize",
    _.debounce(function () {
      setDeviceWidth(
        document.documentElement.offsetWidth,
        document.documentElement.offsetHeight
      );
      if (is_mobile()) {
        orientationPhone();
      } else {
        orientationDevice(
          deviceWidth.value < deviceHeight.value && deviceWidth.value < 720
        );
      }
    }, 100)
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
const orientationPhone = () => {
  let orientation = 0;
  //@ts-ignore
  if (!isNaN(window.orientation)) {
    orientation = window.orientation;
  } else if (
    window.screen.orientation &&
    !isNaN(window.screen.orientation.angle)
  ) {
    orientation = window.screen.orientation.angle;
    //@ts-ignore
  } else if (!isNaN(window.mozOrientation)) {
    //@ts-ignore
    orientation = window.mozOrientation;
    //@ts-ignore
  } else if (!isNaN(window.msOrientation)) {
    //@ts-ignore
    orientation = window.msOrientation;
  }
  orientationDevice(orientation === 0 || orientation === 180, "phone");
};
const orientationDevice = (state, type?: string) => {
  let width = window.innerWidth;
  let height = window.innerHeight;
  let html: any = document.getElementById("htmlId");
  if (state) {
    // 设备处于竖屏模式，强制横屏
    var diff = height / 2 - width / 2;
    document.body.style.width = height + "px";
    document.body.style.height = width + "px";
    html.style.fontSize = width > 720 ? "120px" : "90px";
    document.body.style.transform =
      "rotate(90deg) translate(" + diff + "px," + diff + "px)";
  } else {
    // 设备处于横屏模式，恢复原始样式
    document.body.style.transform = "none";
    document.body.style.width = width + "px";
    document.body.style.height = height + "px";
    if (type) {
      html.style.fontSize = "90px";
    }
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
