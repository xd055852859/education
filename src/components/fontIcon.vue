<script setup lang="ts">
const props = defineProps<{
  iconName: string;
  iconStyle?: any;
  boxStyle?: any;
  customClassName?: string;
}>();
const emits = defineEmits<{
  (e: "iconClick"): void;
}>();
</script>
<template>
  <div
    :class="customClassName"
    @click="emits('iconClick')"
    :style="{ ...boxStyle }"
  >
    <i :class="`iconfont icon-${iconName}`" :style="{ ...iconStyle }" />
  </div>
</template>
<style scoped lang="scss"></style>
<style></style>
