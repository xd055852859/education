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
const { setTagKey } = appStore.lessonStore;
const tagList = ref<any>([]);
const lessonList = ref<any>([]);
const page = ref<number>(1);
const total = ref<number>(0);
const chooseKey = ref<string>("");
const chooseKeyList = ref<string[]>([]);
onMounted(() => {
  getTag("1498319365");
  getLesson(1);
});
const getTag = async (key) => {
  const dataRes = (await api.request.get("tag/list", {
    fatherId: key,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    tagList.value.push(dataRes.data);
  }
};
const getLesson = async (page: number, tagKey?: string, clear?: boolean) => {
  const dataRes = (await api.request.get("resource/center", {
    agentKey: agentKey.value,
    tagKey: tagKey,
    page: page ? page : 1,
    limit: 30,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    if (clear) {
      lessonList.value = [];
    }
    lessonList.value = [...lessonList.value, ...dataRes.data];
    total.value = dataRes.total as number;
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
  chooseKey.value = item._key;
  chooseKeyList.value[index] = item._key;
  chooseKeyList.value = chooseKeyList.value.slice(0, index + 1);
  getTag(item._key);

  // }
  setTagKey(item._key);
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
  <div class="lesson-center">
    <Header title="课程库" :backPath="'/home'" />
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
          @click="chooseItem(tagItem, index)"
          class="dp--center choose-list"
        >
          <div
            :style="
              chooseKeyList.indexOf(tagItem._key) !== -1
                ? {
                    color: '#fff',
                    background: '#4d57ff',
                    borderRadius: '25px',
                  }
                : {}
            "
            class="choose-item icon-point"
          >
            {{ tagItem.name }}
          </div>
          <el-divider direction="vertical" v-if="tagIndex < item.length - 1" />
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
          :key="`lesson${item._key}`"
          style="width: 100%"
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
  height: 100vh;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 34px 0px;
  box-sizing: border-box;
  // @include flex(center, center, wrap);
  .lesson-center-tag {
    width: 1200px;
    min-height: 90px;
    background: #ffffff;
    border-radius: 14px;
    margin: 14px 0px 30px 0px;

    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.09);
    font-size: 18px;
    color: #666666;
    @include p-number(31px, 46px);
    @include flex(flex-start, center, wrap);
    .choose-list {
      // width: 100%;
      height: 32px;
      margin-bottom: 8px;
      .choose-item {
        height: 32px;
        padding: 0px 16px;
        line-height: 32px;
      }
    }
  }
  .lesson-center-container {
    width: 1200px;
    flex: 1;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.09);
    align-content: flex-start;
    @include flex(center, flex-start, wrap);
    @include p-number(9px, 47px);
    @include scroll();
  }
}
</style>
<style></style>
