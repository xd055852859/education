<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import { MoreFilled, Close } from "@element-plus/icons-vue";
import api from "@/services/api";
import IframeView from "@/components/iframeView.vue";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";

const props = defineProps<{
  keyword: string;
  keywordKey: string;
}>();
const emits = defineEmits<{
  (e: "setKeyword", keyword: string): void;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const { user } = storeToRefs(appStore.authStore);
const { setUserInfo } = appStore.authStore;
const chooseKeywordTabs = computed(() => {
  let list: any = [];
  chooseTab.value = [];
  if (keywordTabs.value && user.value?.config?.keywordTab) {
    keywordTabs.value.forEach((item) => {
      if (user.value?.config.keywordTab.indexOf(item._key) !== -1) {
        list.push(item);
        checkTab.value.push(true);
        chooseTab.value.push(item._key);
      } else {
        checkTab.value.push(false);
      }
    });
    keywordTab.value = list[0]._key;
  }
  return list;
});
const note = ref<string>("");
const noteVisible = ref<boolean>(false);
const keywordTabs = ref<any>([]);

const keywordTab = ref<string>("");
const chooseTab = ref<string[]>([]);
const checkTab = ref<boolean[]>([]);
onMounted(() => {
  getTabData();
});
const getData = async (wordKey) => {
  const keyWordRes = (await api.request.get("study/keyword/detail", {
    keywordKey: wordKey,
  })) as ResultProps;
  if (keyWordRes.msg === "OK") {
    note.value = keyWordRes.data.note ? keyWordRes.data.note : "";
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
const updateTab = async (key, value) => {
  let index = chooseTab.value.indexOf(key);
  if (index === -1) {
    chooseTab.value.push(key);
    checkTab.value[index] = true;
  } else {
    chooseTab.value.splice(index, 1);
    checkTab.value[index] = false;
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
const saveNote = async () => {
  let noteRes = (await api.request.patch("study/note", {
    agentKey: agentKey.value,
    keywordKey: props.keywordKey,
    note: note.value,
  })) as ResultProps;
  if (noteRes.msg === "OK") {
    // ElMessage.success("保存备注成功");
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
watch(
  () => props.keywordKey,
  (newWordKey) => {
    if (newWordKey) {
      getData(newWordKey);
    }
  }
);
</script>
<template>
  <div class="data-right" v-if="keyword">
    <div class="data-right-title dp-space-center">
      {{ keyword }}
      <div class="dp-center-center">
        <el-dropdown trigger="click" :hide-on-click="false">
          <div class="icon-point dp--center">
            <el-icon><MoreFilled /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(item, index) in keywordTabs"
                :key="`tab${item._key}`"
              >
                <div class="dp-space-center" style="width: 120px">
                  <el-checkbox
                    v-model="checkTab[index]"
                    :label="item.name"
                    @change="
                      (value) => {
                        updateTab(item._key, value);
                      }
                    "
                  />
                  {{ item.type }}
                </div></el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div
          class="icon-point dp--center"
          style="margin-left: 10px"
          @click="emits('setKeyword', '')"
        >
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </div>
    <div class="data-right-content">
      <el-tabs v-model="keywordTab">
        <el-tab-pane
          v-for="item in chooseKeywordTabs"
          :key="item._key"
          :label="item.name"
          :name="item._key"
          ><div class="data-right-iframe">
            <IframeView :url="`${item.url}${keyword}`" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="data-right-note" v-if="noteVisible">
      <el-input
        v-model="note"
        :rows="8"
        type="textarea"
        placeholder="请输入备注"
        @change="saveNote"
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
    <div class="data-right-button">
      <el-button
        type="primary"
        round
        class="left-button"
        @click="noteVisible = !noteVisible"
        >备注</el-button
      >
      <el-button class="right-button" round @click="openTuLink"
        >反馈吐槽</el-button
      >
    </div>
  </div>
</template>
<style scoped lang="scss">
.data-right {
  width: 565px;
  height: calc(100% - 10px);
  margin-top: 10px;
  margin-left: 36px;
  border-radius: 14px;
  box-shadow: 0px 2px 9px 0px rgba(178, 178, 178, 0.5);
  padding: 25px 0px 10px 0px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  @include scroll();
  .data-right-title {
    width: 100%;
    height: 40px;
    font-size: 32px;
    font-family: DIN Black, DIN Black-Black;
    font-weight: 900;
    color: #333333;
    line-height: 40px;
    padding: 0px 20px 0px 53px;
    box-sizing: border-box;
  }
  .data-right-content {
    width: 100%;
    height: calc(100% - 120px);
    margin: 10px 0px;
    padding: 0px 44px 0px 53px;
    box-sizing: border-box;
    .data-right-iframe {
      width: 100%;
      height: calc(100vh - 380px);
    }
  }
  .data-right-note {
    width: 100%;
    position: absolute;
    z-index: 2;
    left: 0px;
    bottom: 80px;
    padding: 10px 44px 10px 53px;
    box-sizing: border-box;
    .note-button {
      width: 120px;
      position: absolute;
      z-index: 3;
      right: 60px;
      bottom: 20px;
    }
  }
  .data-right-button {
    width: 100%;
    height: 40px;
    padding: 0px 44px 0px 53px;
    box-sizing: border-box;
    .left-button {
      width: 246px;
      height: 38px;
    }
    .right-button {
      width: 168px;
      height: 38px;
      border: 1px solid $commonColor;
      color: $commonColor;
    }
  }
}
</style>
<style></style>
