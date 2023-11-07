import { ref } from "vue";
import { defineStore } from "pinia";

// 使用setup模式定义
export const commonStore = defineStore("commonStore", () => {
  const deviceType = ref<string>("computer");
  const deviceWidth = ref<number>(0);
  const deviceHeight = ref<number>(0);
  const deviceSize = ref<string>("md");
  const site = ref<string>("sg");
  const chooseKey = ref<string>("");
  const chooseType = ref<string>("");
  const overKey = ref<string>("");
  const overType = ref<string>("");
  const closeNum = ref<number>(-1);
  const fullState = ref<boolean>(false);
  const setDeviceType = (newDeviceType: string) => {
    deviceType.value = newDeviceType;
  };
  const setSite = (newSite: string) => {
    site.value = newSite;
    localStorage.setItem("site", newSite);
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
  const setChoose = (newKey, newType) => {
    chooseKey.value = newKey;
    chooseType.value = newType;
  };
  const setOver = (newKey, newType) => {
    overKey.value = newKey;
    overType.value = newType;
  };
  const setClose = (newNum) => {
    closeNum.value = newNum;
  };
  const setFullState = (newFullState) => {
    fullState.value = newFullState;
  };
  return {
    deviceType,
    setDeviceType,
    deviceWidth,
    deviceHeight,
    setDeviceWidth,
    deviceSize,
    site,
    setSite,
    chooseKey,
    chooseType,
    setChoose,
    overKey,
    overType,
    setOver,
    closeNum,
    setClose,
    fullState,
    setFullState,
  };
});
