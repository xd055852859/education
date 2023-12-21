<script setup lang="ts">
import LessonItem from "@/components/lessonItem.vue";
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import Header from "@/components/header.vue";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
const { tagKey } = storeToRefs(appStore.lessonStore);
const { agentKey } = storeToRefs(appStore.agentStore);
const { deviceType } = storeToRefs(appStore.commonStore);
const { setTagKey } = appStore.lessonStore;
const tagList = ref<any>([]);
const lessonList = ref<any>([]);
const page = ref<number>(1);
const total = ref<number>(0);
const chooseKey = ref<string>("");
const chooseAllKey = ref<string>("");
const chooseKeyList = ref<string[]>([]);
onMounted(() => {
  getTag("1498319365");
  chooseAllKey.value = "1498319365";
  getLesson(1);
});
const getTag = async (key) => {
  const dataRes = (await api.request.get("tag/list", {
    fatherId: key,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    tagList.value.push(dataRes.data);
    console.log(tagList.value);
  }
};
const getLesson = async (page: number, tagKey?: string, clear?: boolean) => {
  let newPage = page ? page : 1;
  const dataRes = (await api.request.get("resource/center", {
    agentKey: agentKey.value,
    tagKey: tagKey,
    page: newPage,
    limit: 30,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    if (clear || newPage === 1) {
      lessonList.value = [];
    }
    lessonList.value = [...lessonList.value, ...dataRes.data];
    total.value = dataRes.total as number;
    // nextTick(() => {
    //   lessonList.value.forEach((item) => {
    //     item.animate = true;
    //   });
    // });
  }
};
const subscribeLesson = async (key, index) => {
  const dataRes = (await api.request.post("subscribe", {
    agentKey: agentKey.value,
    resourceKey: key,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    ElMessage.success("订阅成功");
    lessonList.value[index].hasAdd = true;
  }
};
const scrollLesson = (e) => {
  //文档内容实际高度（包括超出视窗的溢出部分）
  let scrollHeight = e.target.scrollHeight;
  //滚动条滚动距离
  let scrollTop = e.target.scrollTop;
  //窗口可视范围高度
  let height = e.target.clientHeight;
  if (
    height + scrollTop >= scrollHeight &&
    lessonList.value.length < total.value
  ) {
    page.value++;
  }
};
const chooseItem = (item, index) => {
  tagList.value = tagList.value.slice(0, index + 1);
  // if (chooseKeyList.value.indexOf(item._key) === -1) {
  //   // chooseKey.value = item._key;
  //   chooseKeyList.value.push(item._key);
  //   getTag(item._key);
  // } else {
  chooseAllKey.value = "";
  chooseKey.value = item._key;
  chooseKeyList.value[index] = item._key;
  chooseKeyList.value = chooseKeyList.value.slice(0, index + 1);
  getTag(item._key);

  // }
  setTagKey(item._key);
};
const chooseAllItem = (key, index) => {
  setTagKey("");
  chooseAllKey.value = key;
  chooseKeyList.value = chooseKeyList.value.slice(0, index);
  tagList.value = tagList.value.slice(0, index + 1);
  console.log(tagList.value);
  getLesson(1, key, true);
};
watch(
  [tagKey, page],
  ([newKey, newPage], [oldKey, oldPage]) => {
    if (newKey) {
      getLesson(newPage, newKey, newKey !== oldKey);
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="lesson-center"
    :style="{
      backgroundImage: `url('/common/${
        deviceType === 'pc' ? 'commonBg' : 'commonPhoneBg'
      }.png')`,
    }"
    :class="{ 'lesson-center-phone': deviceType === 'phone' }"
  >
    <Header title="课件库" :backPath="'/home'" />
    <div class="lesson-center-tag">
      <div
        v-for="(item, index) in tagList"
        :key="`tag${index}`"
        class="dp--center"
        style="width: 100%"
      >
        <div
          v-for="(tagItem, tagIndex) in item"
          :key="`tagItem${tagItem._key}`"
          @click="
            tagItem._key
              ? chooseItem(tagItem, index)
              : chooseAllItem(tagItem.fatherKey, index)
          "
          class="dp--center choose-list"
        >
          <el-divider
            direction="vertical"
            v-if="tagIndex !== 0 && tagItem.resourceCount > 0"
          />
          <div
            v-if="tagItem.resourceCount > 0"
            :style="
              chooseKeyList.indexOf(tagItem._key) !== -1 ||
              tagItem.fatherKey === chooseAllKey
                ? {
                    color: '#fff',
                    background: '#4d57ff',
                    borderRadius: '25px',
                  }
                : {}
            "
            class="choose-item icon-point"
          >
            {{ tagItem.name }} ({{ tagItem.resourceCount }})
          </div>
        </div>
      </div>
    </div>
    <div
      class="lesson-center-container"
      @scroll="scrollLesson"
      :style="{ alignContent: lessonList.length > 0 ? 'flex-start' : 'center' }"
    >
      <template v-if="lessonList.length > 0">
        <div
          v-for="(item, index) in lessonList"
          class="lesson-list-item"
          :key="`lesson${item._key}`"
          style="width: 100%"
          :style="{
            animationDelay: `${0.2 * index}s`,
          }"
        >
          <LessonItem
            :item="item"
            @clickLesson="$router.push(`/preview/${item._key}`)"
          >
            <template #button>
              <div
                class="dp-center-center"
                style="margin-left: 10px"
                @click="$event.stopPropagation()"
              >
                <el-switch
                  :disabled="item.hasAdd"
                  v-model="item.hasAdd"
                  @change="subscribeLesson(item._key, index)"
                />
              </div>
            </template>
          </LessonItem>
        </div>
      </template>
      <el-empty description="无资源" v-else />
    </div>
  </div>
</template>
<style scoped lang="scss">
.lesson-center {
  width: 100vw;
  height: 100%;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0px 0px 34px 0px;
  box-sizing: border-box;
  // @include flex(center, center, wrap);
  .lesson-center-tag {
    width: 1200px;
    max-width: 90vw;
    height: 190px;
    background: #ffffff;
    border-radius: 14px;
    margin: 14px 0px 30px 0px;

    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.09);
    font-size: 18px;
    color: #666666;
    align-content: flex-start;
    @include p-number(20px, 46px);
    @include flex(flex-start, center, wrap);
    @include scroll();
    .choose-list {
      // width: 100%;
      height: 32px;
      margin-bottom: 25px;
      .choose-item {
        height: 32px;
        padding: 0px 16px;
        @include flex(center, center, wrap);
      }
    }
  }
  .lesson-center-container {
    width: 1200px;
    max-width: 90vw;
    flex: 1;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.09);
    align-content: flex-start;
    @include flex(center, flex-start, wrap);
    @include p-number(9px, 47px);
    @include scroll();
    .lesson-list-item {
      opacity: 0;
      transform: translateY(20px);
      animation: show 0.5s ease-in forwards;
    }
  }
}
.lesson-center-phone {
  .lesson-center-tag {
    @include p-number(20px, 20px);
  }
  .lesson-center-container {
    @include p-number(9px, 20px);
  }
}
</style>
<style>
@keyframes show {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
}
</style>
