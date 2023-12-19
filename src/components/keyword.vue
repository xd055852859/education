<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import { MoreFilled, Close } from "@element-plus/icons-vue";
import api from "@/services/api";
import IframeView from "@/components/iframeView.vue";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import _ from "lodash";
import { storeToRefs } from "pinia";
import KeywordItem from "./keywordItem.vue";
import FontIcon from "./fontIcon.vue";
import { is_mobile } from "@/services/util";
const { deviceType } = storeToRefs(appStore.commonStore);
const dayjs: any = inject("dayjs");
const { lessonKey, lessonInfo } = storeToRefs(appStore.lessonStore);
const props = defineProps<{
  keyword: string;
  keywordKey?: string;
  type?: string;
}>();
const emits = defineEmits<{
  (e: "setKeyword", keyword: string): void;
  (e: "reloadData", keywordKey: string, note: string): void;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const { user } = storeToRefs(appStore.authStore);
const { setUserInfo } = appStore.authStore;
const note = ref<string>("");
const noteVisible = ref<boolean>(false);
const keywordTabs = ref<any>([]);

const keywordTab = ref<string>("word");
const keywordList = ref<any>([]);
const chooseTab = ref<string[]>([]);
const dropdownRef = ref<any>(null);
const chooseKeywordTabs = computed(() => {
  let list: any = [];
  checkTab.value = [];
  chooseTab.value = [];
  if (keywordTabs.value) {
    keywordTabs.value.forEach((item) => {
      if (user.value?.config.keywordTab.indexOf(item._key) !== -1) {
        list.push(item);
        checkTab.value.push(true);
        chooseTab.value.push(item._key);
      } else {
        checkTab.value.push(false);
      }
    });
  }
  return list;
});

const checkTab = ref<boolean[]>([]);
onMounted(() => {
  getTabData();
});
const getList = async () => {
  let dataRes = (await api.request.get("study/keyword/resource", {
    agentKey: agentKey.value,
    resourceKey: lessonKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    dataRes.data.forEach((keywordsItem, keywordsIndex) => {
      if (keywordsItem.note) {
        keywordsItem.note = keywordsItem.note.replace(/\n/g, "<br/>");
      }
      if (keywordsItem.sentences) {
        keywordsItem.sentences = [
          keywordsItem.sentences.map((sentenceItem) => {
            let reg = new RegExp(`${keywordsItem.keyword}`, "g");
            sentenceItem = Array.isArray(sentenceItem)
              ? sentenceItem.join("")
              : sentenceItem;
            sentenceItem = sentenceItem
              .replace(reg, `#${keywordsItem.keyword}#`)
              .split("#");
            return sentenceItem;
          }),
        ];
      }
      let index = _.findIndex(keywordList.value, {
        mediaKey: keywordsItem.mediaKey,
      });
      if (index !== -1) {
        keywordList.value[index] = {
          ...keywordList.value[index],
          ...keywordsItem,
        };
      } else {
        keywordsItem.expandState = false;
        keywordList.value[keywordsIndex] = { ...keywordsItem };
      }
    });
    console.log(keywordList.value);
  }
};
const getData = async (wordKey) => {
  const keyWordRes = (await api.request.get("study/keyword/detail", {
    keywordKey: wordKey,
  })) as ResultProps;
  if (keyWordRes.msg === "OK") {
    if (keyWordRes.data.note) {
      note.value = keyWordRes.data.note;
      noteVisible.value = true;
    } else {
      note.value = keyWordRes.data.note;
      noteVisible.value = false;
    }
  }
};
const getTabData = async () => {
  const keyWordRes = (await api.request.get(
    "",
    {
      isFront: 1,
    },
    false,
    "https://dictfoxx.qingtime.cn/source"
  )) as ResultProps;
  if (keyWordRes.msg === "OK") {
    keywordTabs.value = keyWordRes.data;
  }
};
const updateTab = async (key, value, tabIndex) => {
  let index = chooseTab.value.indexOf(key);
  if (index === -1) {
    chooseTab.value.push(key);
    checkTab.value[tabIndex] = true;
  } else {
    chooseTab.value.splice(index, 1);
    checkTab.value[tabIndex] = false;
  }
  const keyWordRes = (await api.request.patch("user", {
    config: { ...user.value?.config, keywordTab: chooseTab.value },
  })) as ResultProps;
  if (keyWordRes.msg === "OK") {
    setUserInfo({
      ...user.value,
      config: { ...user.value?.config, keywordTab: chooseTab.value },
    });
  }
};
const saveNote = async (type?: string) => {
  let noteRes = (await api.request.patch("study/note", {
    agentKey: agentKey.value,
    keywordKey: props.keywordKey,
    note: note.value,
  })) as ResultProps;
  if (noteRes.msg === "OK") {
    if (type) {
      ElMessage.success("保存备注成功");
    }
    keywordList.value.forEach((item, index) => {
      let keywordIndex = _.findIndex(item.keywords, { _key: props.keywordKey });
      if (keywordIndex !== -1) {
        item.keywords[keywordIndex].note = note.value;
      }
    });
    if (props.keywordKey) {
      emits("reloadData", props.keywordKey, note.value);
    }
  }
};
const openTuLink = () => {
  //@ts-ignore
  let Tucao = window.Tucao;
  let productId = 611578; // 产品ID
  const data = {
    nickname: user.value?.userName || "场景英语",
    avatar:
      user.value?.userAvatar ||
      "https://yujing.qingtime.cn/common/logoTitle.svg",
    openid: user.value?.userAvatar || productId,
  };
  Tucao.request(productId, data);
};
const changeList = (list) => {
  keywordList.value = _.cloneDeep(list);
};
watch(
  [chooseTab, () => props.type],
  ([newTab, newType]) => {
    if (newType === "outer") {
      keywordTab.value = newTab[0];
    }
  },
  { immediate: true }
);
watchEffect(() => {
  if (
    (!user.value?.config?.keywordTab ||
      user.value?.config?.keywordTab.length === 0) &&
    dropdownRef.value
  ) {
    dropdownRef.value.handleOpen();
  }
});
watch(
  () => props.keywordKey,
  (newWordKey) => {
    if (newWordKey) {
      getData(newWordKey);
      getList();
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="data-right"
    v-if="keyword"
    :style="deviceType === 'phone' ? { width: '100%' } : {}"
  >
    <div class="data-right-title dp-space-center">
      {{ keyword }}
      <div class="dp-center-center">
        <!-- .study-audio-content  -->
        <el-dropdown
          trigger="click"
          :hide-on-click="false"
          ref="dropdownRef"
        >
          <div class="icon-point dp--center">
            <el-icon>
              <MoreFilled />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(item, index) in keywordTabs"
                :key="`tab${item._key}`"
              >
                <div class="dp-space-center data-tab-item" style="width: 120px">
                  <el-checkbox
                    v-model="checkTab[index]"
                    :label="item.name"
                    @change="
                      (value) => {
                        updateTab(item._key, value, index);
                      }
                    "
                  />
                  {{ item.type }}
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div
          class="icon-point dp--center"
          style="margin-left: 10px"
          @click="emits('setKeyword', '')"
        >
          <el-icon color="#999" size="18">
            <Close />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="data-right-content">
      <el-tabs v-model="keywordTab" style="height: 100%">
        <el-tab-pane label="生词表" name="word" v-if="type === 'inner'">
          <div
            class="data-right-iframe"
            style="overflow-x: hidden; overflow-y: auto"
          >
            <template v-if="keywordList.length > 0">
              <KeywordItem @changeList="changeList" :list="keywordList" />
            </template>
            <div class="calendar-empty" v-else>
              <el-empty description="暂无关键字" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane
          v-for="item in chooseKeywordTabs"
          :key="item._key"
          :label="item.name"
          :name="item._key"
        >
          <div class="data-right-iframe">
            <IframeView :url="`${item.url}${keyword}`" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div
      class="data-right-button"
      :style="
        noteVisible
          ? { boxShadow: '0px 2px 9px 0px rgba(178, 178, 178, 0.5)' }
          : {}
      "
    >
      <div
        class="dp-center-center icon-point"
        @click="noteVisible = false"
        v-if="noteVisible"
      >
        <FontIcon iconName="zhankai" :iconStyle="{ color: '#333' }" />
      </div>
      <div class="data-right-note" v-if="noteVisible">
        <el-input
          v-model="note"
          :rows="6"
          type="textarea"
          placeholder="请输入备注"
          @change="saveNote()"
        />
        <!-- <el-button
        type="primary"
        round
        class="note-button"
        size="small"
        @click="saveNote"
        >保存</el-button
      > -->
      </div>
      <div v-if="keywordKey">
        <el-button
          type="primary"
          round
          class="left-button"
          @click="
            noteVisible && note ? saveNote('save') : null;
            noteVisible = !noteVisible;
          "
          >{{ noteVisible ? "保存笔记" : "+学习笔记" }}</el-button
        >
        <el-button class="right-button" link @click="openTuLink"
          >反馈吐槽</el-button
        >
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.data-right {
  width: 523px;
  height: 100%;
  padding: 25px 0px 10px 0px;
  flex-shrink: 0;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  background-color: #fff;
  @include scroll();

  .data-right-title {
    width: 100%;
    height: 40px;
    font-size: 32px;
    font-family: DIN Black, DIN Black-Black;
    font-weight: 900;
    color: $commonColor;
    line-height: 40px;
    padding: 0px 20px 0px 15px;
    box-sizing: border-box;
  }

  .data-right-content {
    width: 100%;
    height: calc(100% - 120px);
    margin: 10px 0px;
    padding: 0px 15px 0px 20px;
    box-sizing: border-box;

    .data-right-iframe {
      width: 100%;
      height: 100%;
      padding: 0px 10px;
      box-sizing: border-box;
      // @include scroll();
    }
  }

  .data-right-button {
    width: 100%;
    padding: 0px 50px 30px 50px;
    background-color: #fff;
    box-sizing: border-box;
    position: absolute;
    z-index: 2;
    bottom: 0px;
    left: 0px;

    .data-right-note {
      width: 100%;
      margin-bottom: 18px;
    }

    .left-button {
      width: 45%;
      height: 38px;
    }

    .right-button {
      width: 45%;
      height: 38px;
    }
  }
}
</style>
<style lang="scss">
.data-right {
  .el-tabs {
    .el-tabs__header {
      margin-bottom: 5px;
    }

    .el-tabs__content {
      height: calc(100% - 55px);

      .el-tab-pane {
        height: 100%;
      }
    }
  }
  .data-tab-item {
    .el-checkbox__label {
      font-size: 18px;
    }
  }
  .data-right-note {
    .el-textarea__inner {
      background: #f9f9f9;
      border: 1px solid #e3e3e3;
      border-radius: 12px;
    }
  }
  .data-right-title {
    .el-dropdown__popper {
      top: 40px !important;
      left: -200px !important;
      right: auto !important;
      bottom: auto !important;
    }
  }
}
</style>
