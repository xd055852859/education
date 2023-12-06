<script setup lang="ts">
import { ArrowLeft } from "@element-plus/icons-vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    backPath?: string;
    color?: string;
  }>(),
  { title: "", backPath: "", color: "#333" }
);
</script>
<template>
  <div className="header">
    <div className="header-title" :style="{ color: color }">
      <div v-if="backPath" @click="$router.push(backPath)" class="header-back">
        <el-icon :style="{ color: color,fontSize:'25px' }"><ArrowLeft /></el-icon>
      </div>
      <slot name="icon"></slot>
      {{ title }}
    </div>
    <slot name="button"></slot>
  </div>
</template>
<style scoped lang="scss">
.header {
  width: 100%;
  height: 28px;
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
