<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import api from "@/services/api";
import appStore from "@/store";
import { ElMessage, ElMessageBox } from "element-plus";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { Delete } from "@element-plus/icons-vue";
import FontIcon from "./fontIcon.vue";
const { agentKey } = storeToRefs(appStore.agentStore);
const props = defineProps<{
  list: any;
  keyword?: string;
  type?: string;
}>();
const emits = defineEmits<{
  (e: "changeList", list: any): void;
  (e: "chooseWord", word: string, wordKey: string): void;
  (e: "reloadData"): void;
}>();

const archiveKeyword = async (index, keywordKey, keywordIndex, isArchived) => {
  let dataRes = (await api.request.patch("study/keyword/archive", {
    keywordKey: keywordKey,
    isArchived: isArchived,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    let list = _.cloneDeep(props.list);
    ElMessage.success(`${isArchived ? "归档" : "关注"}成功`);
    list[index].keywords[keywordIndex].isArchived = isArchived;
    emits("changeList", list);
  }
};
const deleteKeyword = async (index, keywordKey, keywordIndex) => {
  ElMessageBox.confirm("是否删除该关键字", "删除关键字", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  }).then(async () => {
    let dataRes = (await api.request.delete("study/keyword", {
      agentKey: agentKey.value,
      keywordKey: keywordKey,
    })) as ResultProps;
    if (dataRes.msg === "OK") {
      let list = _.cloneDeep(props.list);
      ElMessage.success("删除关键字成功");
      list[index].keywords.splice(keywordIndex, 1);
      if (list[index].keywords.length === 0) {
        list.splice(index, 1);
      }
      emits("changeList", list);
      emits("reloadData");
    }
  });
};
</script>
<template>
  <div
    class="calendar-keyword dp--center"
    v-for="(item, index) in list"
    :key="`lesson${item._key}`"
    style="flex-wrap: wrap"
  >
    <div class="keyword-title">
      {{ type === "outer" ? item.resouceName : item.mediaName }}
      <div
        class="keyword-box-icon icon-point"
        @click="item.expandState = !item.expandState"
      >
        <FontIcon
          :iconName="item.expandState ? 'shouqi' : 'zhankai'"
          :iconStyle="{ color: '#333' }"
        />
      </div>
    </div>
    <div class="keyword-title" v-if="type === 'outer' && item.mediaNum > 1">
      {{ item.mediaName }}
    </div>
    <template v-if="item.expandState">
      <div
        v-for="(keywordItem, keywordIndex) in item.keywords"
        :key="`keyword${keywordItem._key}`"
        class="keyword-box"
        style="width: 100%"
      >
        <div class="keyword-box-title dp--center">
          {{ keywordItem.keyword }}
          <img
            :src="
              keywordItem.status
                ? keywordItem.isArchived
                  ? '/overview/logo2.svg'
                  : '/overview/logo1.svg'
                : '/overview/logo4.svg'
            "
            alt=""
            v-if="type === 'outer'"
          />
          <!-- <div class="dp-center-center">
            <div
              v-if="keywordItem.isArchived"
              class="concernItem-box-icon icon-point"
              @click="
                archiveKeyword(index, keywordItem._key, keywordIndex, false)
              "
            >
              <FontIcon iconName="a-xin-kongxin2" />
            </div>
            <div
              @click="
                archiveKeyword(index, keywordItem._key, keywordIndex, true)
              "
              class="concernItem-box-icon icon-point"
              v-else
            >
              <FontIcon
                iconName="a-xin-tianchong2"
                :iconStyle="{ color: '#4D57FF' }"
              />
            </div>
            <div
              class="concernItem-box-icon icon-point"
              style="margin-left: 10px"
              @click="deleteKeyword(index, keywordItem._key, keywordIndex)"
            >
              <el-icon :size="18">
                <Delete />
              </el-icon>
            </div>
          </div> -->
        </div>
        <div
          class="keyword-box-subtitle"
          v-for="(sentenceItem, sentenceIndex) in [
            ...new Set(keywordItem.sentences),
          ]"
          :key="`sentence${sentenceIndex}`"
        >
          <span
            v-for="(wordItem, wordIndex) in sentenceItem"
            :key="`word${wordIndex}`"
            @click="
              wordItem === keywordItem.keyword && type === 'outer'
                ? emits('chooseWord', wordItem, keywordItem._key)
                : ''
            "
            :style="
              wordItem === keywordItem.keyword
                ? {
                    background: keyword === wordItem ? '#ffe3b5' : '#c2c4f6',
                    padding: '2px 0px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }
                : {}
            "
          >
            {{ wordItem }}
          </span>
        </div>
        <div
          class="keyword-box-content"
          v-if="keywordItem.note"
          v-html="keywordItem.note"
        ></div>
      </div>
    </template>
    <template v-else>
      <div
        v-for="(keywordItem, keywordIndex) in item.keywords"
        :key="`keyword${keywordItem._key}`"
        class="keyword-title-box icon-point"
        @click="
          type === 'outer'
            ? emits('chooseWord', keywordItem.keyword, keywordItem._key)
            : ''
        "
        :style="
          keyword === keywordItem.keyword
            ? {
                color: '#4D57FF',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }
            : {}
        "
      >
        <span>{{ keywordItem.keyword }}</span>
        <el-divider
          direction="vertical"
          v-if="keywordIndex < item.keywords.length - 1"
        />
      </div>
    </template>
  </div>
</template>
<style scoped lang="scss">
.calendar-keyword {
  width: 100%;
  border-radius: 14px;
  padding: 15px 33px;
  box-sizing: border-box;
  margin-bottom: 20px;
  box-shadow: 0px 2px 5px 0px rgba(178, 178, 178, 0.5);

  .keyword-title {
    width: 100%;
    height: 28px;
    font-size: 18px;
    font-weight: 500;
    color: #666666;
    line-height: 26px;
    margin-bottom: 10px;

    @include flex(space-between, center, null);
  }

  .keyword-box {
    background: #f2f4fb;
    border-radius: 12px;
    margin-bottom: 30px;
    @include p-number(14px, 28px);

    .keyword-box-title {
      width: 100%;
      height: 32px;
      font-size: 30px;
      font-family: DIN Black, DIN Black-Black;
      font-weight: 900;
      line-height: 32px;
      margin-bottom: 6px;
      color: #4d57ff;
      // @include flex(space-between, center, null);
      img {
        width: 30px;
        height: 30px;
        margin-left: 15px;
      }
      .concernItem-box-icon {
        @include flex(center, center, null);
      }
    }

    .keyword-box-subtitle {
      width: 100%;
      font-size: 18px;
      color: #333333;
      line-height: 32px;
    }

    .keyword-box-content {
      font-size: 16px;
      line-height: 28px;
      white-space: pre-wrap;
      color: #4d57ff;
      @include p-number(10px, 10px);
    }

    .keyword-box-icon {
      display: none;
    }
  }

  .keyword-title-box {
    height: 36px;
    font-size: 18px;
    line-height: 28px;
    margin-bottom: 10px;
    @include flex(flex-start, center, null);
  }

  &:hover {
    box-shadow: 0px 2px 10px 0px rgba(78, 78, 78, 0.5);

    .keyword-box {
      .keyword-box-icon {
        @include flex(center, center, null);
      }
    }
  }
}

.calendar-empty {
  width: 100%;
  height: calc(100% - 490px);
  @include flex(center, center, null);
}
</style>
<style></style>
