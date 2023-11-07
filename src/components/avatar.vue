<script setup lang="ts">
import defaultPersonPng from "@/assets/common/defaultPerson.png";
import defaultGroupPng from "@/assets/common/defaultGroup.png";
const props = withDefaults(
  defineProps<{
    src: any;
    alt?: string;
    type?: string;
    index?: number;
    size?: number;
    imgStyle?: any;
  }>(),
  { index: 0, type: "person", size: 35 }
);
const BgColorArray = [
  "#1890ff",
  "rgb(0,170,255)",
  "rgb(143,126,230)",
  "rgb(179,152,152)",
  "rgb(242,237,166)",
];
const bgColor = computed(() => {
  return BgColorArray[props.index % 5];
});
// const emits = defineEmits<{
//   (e: "setTargetIndex", index: number): void;
// }>();
</script>
<template>
  <div
    :style="{
      borderRadius: type === 'person' ? '50%' : '10%',
      width: size + 'px',
      height: size + 'px',
      fontSize: size / 2.2 + 'px',
      ...props.imgStyle,
    }"
    class="avatar-content"
  >
    <img
      :alt="alt"
      :src="src"
      @error="(e: any) => {
                e.target.onerror = null;
                e.target.src =
                  type === 'person' ? defaultPersonPng : defaultGroupPng;
              }"
      class="avatar-img"
      v-if="src"
    />

    <div
      className="avatar-img"
      :style="{ backgroundColor: bgColor }"
      v-else-if="alt"
    >
      {{ alt.substring(0, 1) }}
    </div>
    <img alt="" src="/common/default.png" class="avatar-img" v-else />
  </div>
</template>
<style scoped lang="scss">
.avatar-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
}
</style>
<style></style>
