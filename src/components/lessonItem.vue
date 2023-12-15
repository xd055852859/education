<script setup lang="ts">
import appStore from "@/store";
import { storeToRefs } from "pinia";

const { deviceType } = storeToRefs(appStore.commonStore);
const props = defineProps<{
  item: any;
  last?: boolean;
}>();
const emits = defineEmits<{
  (e: "clickLesson"): void;
}>();
</script>
<template>
  <div
    class="lessonItem"
    @click="emits('clickLesson')"
    :style="last ? { borderBottom: '0px' } : {}"
    :class="{ 'lessonItem-phone': deviceType === 'phone' }"
  >
    <div class="lessonItem-img">
      <img :src="item.cover" alt="" />
      <img
        src="/overview/top.svg"
        alt=""
        class="lessonItem-top"
        v-if="item.top"
      />
    </div>
    <div class="lessonItem-content">
      <div class="lessonItem-content-title">{{ item.name }}</div>
      <div class="lessonItem-content-info">
        <div
          class="dp--center"
          v-for="(tagItem, index) in item.tagInfoArr"
          :key="`'tag'+index˝`"
          style="margin-right: 10px"
        >
          <div
            class="dp--center"
            v-for="(pathItem, pathIndex) in tagItem"
            :key="`'path'+index˝`"
          >
            <template v-if="pathIndex !== 0">
              <div>
                {{ pathItem.name }}
              </div>
              <div style="margin-bottom: 3px">
                {{ pathIndex !== tagItem.length - 1 ? " / " : "" }}
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="lessonItem-content-description">{{ item.description }}</div>
    </div>
    <slot name="button"></slot>
  </div>
</template>
<style lang="scss">
.lessonItem {
  width: 100%;
  height: 210px;
  border-bottom: 1px solid #e3e3e3;
  position: relative;
  z-index: 1;
  @include flex(space-between, center, null);
  .lessonItem-img {
    width: 229px;
    height: 142px;
    margin-right: 31px;
    position: relative;
    z-index: 1;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lessonItem-top {
      width: 55px;
      height: 28px;
      position: absolute;
      z-index: 2;
      right: 0px;
      top: 0px;
    }
  }
  .lessonItem-content {
    flex: 1;
    height: 120px;
    .lessonItem-content-title {
      width: 100%;
      height: 35px;
      font-size: 24px;
      font-weight: 500;
      color: #000000;
      line-height: 35px;
    }
    .lessonItem-content-info {
      width: 100%;
      min-height: 17px;
      margin: 10px 0px;
      font-size: 16px;
      color: #666666;
      line-height: 17px;
      @include flex(flex-start, center, wrap);
    }
    .lessonItem-content-description {
      width: 100%;
      // height: 34px;
      font-size: 18px;
      color: #444444;
      line-height: 26px;
      text-indent: 2em;
      @include more-toLong(2);
      font-family: "Kaiti SC", "STKaiti", "Arial", sans-serif;
    }
  }
  .lessonItem-button {
    display: none;
    position: absolute;
    z-index: 2;
    top: 20px;
    right: 0px;
  }
  &:hover {
    .lessonItem-button {
      @include flex(center, center, null);
    }
  }
}
.lessonItem-phone {
  width: 100%;
  height: 180px;
  border-bottom: 1px solid #e3e3e3;
  position: relative;
  z-index: 1;
  @include flex(space-between, center, null);
  .lessonItem-img {
    width: 142px;
    height: 142px;
    margin-right: 31px;
    position: relative;
    z-index: 1;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lessonItem-top {
      width: 55px;
      height: 28px;
      position: absolute;
      z-index: 2;
      right: 0px;
      top: 0px;
    }
  }
  .lessonItem-content {
    flex: 1;
    height: 130px;
    .lessonItem-content-title {
      width: 100%;
      height: 35px;
      font-size: 24px;
      font-weight: 500;
      color: #000000;
      line-height: 35px;
    }
    .lessonItem-content-info {
      width: 100%;
      min-height: 17px;
      margin: 10px 0px;
      font-size: 16px;
      color: #666666;
      line-height: 17px;
      @include flex(flex-start, center, wrap);
    }
    .lessonItem-content-description {
      width: 100%;
      // height: 34px;
      font-size: 18px;
      color: #444444;
      line-height: 26px;
      text-indent: 2em;
      @include more-toLong(2);
      font-family: "Kaiti SC", "STKaiti", "Arial", sans-serif;
    }
  }
  .lessonItem-button {
    @include flex(center, center, null);
  }
}
</style>
<style></style>
