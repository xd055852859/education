<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { ElMessage } from "element-plus";
import QrcodeVue from "qrcode.vue";
// const { toClipboard } = useClipboard();

const props = defineProps<{
  url: string;
}>();
onMounted(() => {});
const sharePano = () => {
  const source = props.url;
  // 考虑到兼容性问题，
  // 先判断当前有没有clipboard实例，如果有，则使用useClipboard；如果没有，则使用js原生方法
  if (navigator.clipboard) {
    const { copy } = useClipboard({ source });
    copy();
  } else {
    const input = document.createElement("input");
    input.setAttribute("value", source);
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }
  ElMessage({
    message: "复制链接成功",
    type: "success",
    duration: 1000,
  });
};
</script>
<template>
  <div class="code-container">
    <div class="code-url">
      <div class="code-input single-to-long">{{ url }}</div>
      <el-button @click="sharePano" type="primary" style="width:100px">复制</el-button>
    </div>
    <div class="code-box">
      <qrcode-vue :value="url" :size="200" level="H" />
    </div>
  </div>
</template>
<style scoped lang="scss">
.code-container {
  width: 100%;
  height: 450px;
  @include p-number(0px, 25px);
  .code-url {
    width: 100%;
    height: 90px;
    @include flex(space-between, center, null);
    margin-bottom: 70px;
    .code-input {
      flex: 1;
      border: 1px solid #efefef;
      padding: 8px;
      border-radius: 8px;
      margin-right:20px;
    }
  }
  .code-box {
    width: 100%;
    height: 180px;
    @include flex(center, center, null);
  }
}
</style>
<style></style>
