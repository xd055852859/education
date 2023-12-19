<script setup lang="ts">
import appStore from "@/store";
import { ArrowLeft } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
const { deviceType } = storeToRefs(appStore.commonStore);
const props = withDefaults(
  defineProps<{
    title?: string;
    backPath?: string;
    color?: string;
    type?: string;
    noTitle?: boolean;
  }>(),
  { title: "", backPath: "", color: "#333" }
);
</script>
<template>
  <div
    class="header"
    :class="{
      'header-study': type === 'phone',
      'header-phone': deviceType === 'phone',
    }"
  >
    <div class="header-title" :style="{ color: color }">
      <div v-if="backPath" @click="$router.push(backPath)" class="header-back">
        <el-icon
          :style="{
            color: color,
            fontSize: deviceType === 'phone' ? '18px' : '25px',
          }"
          ><ArrowLeft
        /></el-icon>
      </div>
      <slot name="icon"></slot>
      <template v-if="!noTitle">{{ title }}</template>
    </div>
    <slot name="button"></slot>
  </div>
</template>
<style scoped lang="scss">
.header {
  width: 100%;
  height: 70px;
  font-size: 24px;
  font-weight: 500;
  background-color: transparent;
  @include p-number(0px, 37px);
  @include flex(space-between, center, null);
  .header-title {
    width: 100%;
    height: 100%;
    @include flex(flex-start, center, null);
    .header-back {
      margin-right: 10px;
      cursor: pointer;
      @include flex(flex-start, center, null);
    }
  }
  .header-button {
    height: 100%;
    cursor: pointer;
    @include flex(flex-end, center, null);
    .button-img {
      width: 40px;
      height: 100%;
      font-size: 27px;
      @include flex(center, center, null);
    }
  }
}
.header-study {
  height: 112px;
  @include p-number(0px, 15px);
  @include flex(space-between, center, wrap);
  .header-title {
    width: 100%;
    height: 56px;
  }
}
.header-phone {
  @include p-number(0px, 15px);
}
.user-set {
  .logo-box {
    width: 200px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    .logo-item {
      font-size: 50px;
      color: #ebebeb;
    }
  }
}
</style>
<style></style>
