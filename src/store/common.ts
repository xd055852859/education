import { ref } from "vue";
import { defineStore } from "pinia";
import { agentStore } from "./agent";
import { authStore } from "./auth";
import { lessonStore } from "./lesson";
// 使用setup模式定义
export const commonStore = defineStore("commonStore", () => {
  const deviceType = ref<string>("pc");
  const deviceWidth = ref<number>(0);
  const deviceHeight = ref<number>(0);
  const deviceSize = ref<string>("md");
  const musicSrc = ref<string>("");
  const musicNum = ref<number>(0);
  const userVisible = ref<boolean>(false);
  const setDeviceType = (newDeviceType: string) => {
    deviceType.value = newDeviceType;
  };
  const setDeviceWidth = (width: number, height: number) => {
    deviceWidth.value = width;
    deviceHeight.value = height;
    if (width < 550) {
      deviceSize.value = "xs";
    } else if (550 <= width) {
      deviceSize.value = "sm";
    } else if (768 <= width) {
      deviceSize.value = "md";
    } else if (992 <= width) {
      deviceSize.value = "lg";
    } else if (1200 <= width) {
      deviceSize.value = "xl";
    }
  };
  const setMusicSrc = (newSrc) => {
    musicNum.value = musicNum.value + 1;
    musicSrc.value = newSrc;
  };
  const setUserVisible = (visible) => {
    userVisible.value = visible;
  };
  const clearStore = () => {
    agentStore().$reset();
    authStore().$reset();
    lessonStore().$reset();
  };
  return {
    deviceType,
    setDeviceType,
    deviceWidth,
    deviceHeight,
    setDeviceWidth,
    deviceSize,
    musicSrc,
    musicNum,
    setMusicSrc,
    userVisible,
    setUserVisible,
    clearStore
  };
});
