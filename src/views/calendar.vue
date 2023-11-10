<script setup lang="ts">
import Header from "@/components/header.vue";
import lineChart from "@/components/chart/lineChart.vue";
import FontIcon from "@/components/fontIcon.vue";
import Keyword from "@/components/keyword.vue";
import api from "@/services/api";
import { storeToRefs } from "pinia";
import appStore from "@/store";
import _ from "lodash";
import { ResultProps } from "@/interface/Common";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
const { agentKey } = storeToRefs(appStore.agentStore);
const dayjs: any = inject("dayjs");
// const expandState = ref<boolean>(false);
// const expandKey = ref<string>("");
const chartData = ref<any>([]);
const chartIndex = ref<number>(-1);
const keywordList = ref<any>([]);
const keyword = ref<string>("");
const keywordKey = ref<string>("");
const changeSize = ref<number>(0);
const chartDate = ref<number>(0);
const xData = ref<any>([]);
const yData = ref<any>([]);
const getData = async () => {
  chartDate.value = chartDate.value
    ? chartDate.value
    : dayjs().startOf("day").valueOf();
  let dataRes = (await api.request.get("study/keyword/someday", {
    agentKey: agentKey.value,
    filterDate: chartDate.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    dataRes.data.forEach((item) => {
      item.keywords.forEach((keywordsItem) => {
        if (keywordsItem.note) {
          keywordsItem.note = keywordsItem.note.replace(/\n/g, "<br/>");
        }
        if (keywordsItem.sentences) {
          keywordsItem.sentences = keywordsItem.sentences.map(
            (sentenceItem) => {
              let reg = new RegExp(`${keywordsItem.keyword}`, "g");
              sentenceItem = Array.isArray(sentenceItem)
                ? sentenceItem.join("")
                : sentenceItem;
              sentenceItem = sentenceItem
                .replace(reg, `#${keywordsItem.keyword}#`)
                .split("#");
              return sentenceItem;
            }
          );
        }
      });
      item.expandState = false;
    });

    keywordList.value = dataRes.data;
  }
};
const getChartData = async () => {
  let dataRes = (await api.request.get("study/chart", {
    agentKey: agentKey.value,
    begTime: dayjs().subtract(7, "days").startOf("day").valueOf(),
    endTime: dayjs().endOf("day").valueOf(),
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    let list: any = [];
    list[0] = dataRes.data.keywordNum.map((item) => {
      item.name = "关键字";
      item.type = "bar";
      item.min = 0;
      item.max = 100;
      return item;
    });
    list[1] = dataRes.data.studyTime.map((item) => {
      item.name = "学习时间";
      item.type = "line";
      item.min = 0;
      item.max = 24;
      item.num = item.count;
      item.count = dayjs
        .duration(item.count * 60000)
        .asHours()
        .toFixed(1);
      return item;
    });
    xData.value = _.sortBy(
      _.uniq([
        ...list[0].map((item) => {
          return item.ctime;
        }),
        ...list[1].map((item) => {
          return item.ctime;
        }),
      ]),
      (item) => {
        return dayjs(item).valueOf();
      }
    );
    chartData.value[0] = [];
    chartData.value[1] = [];
    xData.value.forEach((item) => {
      let keyIndex = _.findIndex(list[0], (dataItem: any) => {
        return dataItem.ctime === item;
      });
      if (keyIndex === -1) {
        chartData.value[0].push({
          name: "关键字",
          type: "bar",
          min: 0,
          max: 100,
          count: 0,
          ctime: item,
        });
      } else {
        chartData.value[0].push(list[0][keyIndex]);
      }
      let studyIndex = _.findIndex(list[1], (dataItem: any) => {
        return dataItem.ctime === item;
      });
      if (studyIndex === -1) {
        chartData.value[1].push({
          name: "学习时间",
          type: "line",
          min: 0,
          max: 24,
          count: 0,
          ctime: item,
        });
      } else {
        chartData.value[1].push(list[1][studyIndex]);
      }
    });

    yData.value = [
      {
        type: "value",
        name: "关键字(个)",
        interval: 50,
        axisLabel: {
          formatter: "{value}",
        },
      },
      {
        type: "value",
        name: "学习时间(小时)",
        interval: 5,
        axisLabel: {
          formatter: "{value}",
        },
      },
    ];
    console.log(chartData.value);
    chartIndex.value = chartData.value[0].length - 1;
  }
};
const chooseWord = (word, wordKey) => {
  console.log(word);
  keyword.value = word;
  keywordKey.value = wordKey;
  changeSize.value = 1;
};
const chooseDate = (date, index) => {
  chartDate.value = dayjs(date).startOf("day").valueOf();
};
const archiveKeyword = async (index, keywordKey, keywordIndex, isArchived) => {
  let dataRes = (await api.request.patch("study/keyword/archive", {
    keywordKey: keywordKey,
    isArchived: isArchived,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    ElMessage.success(`${isArchived ? "归档" : "关注"}成功`);
    keywordList.value[index].keywords[keywordIndex].isArchived = isArchived;
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
      ElMessage.success("删除关键字成功");
      keywordList.value[index].keywords.splice(keywordIndex, 1);
      if (keywordList.value[index].keywords.length === 0) {
        keywordList.value.splice(index, 1);
      }
    }
  });
};
// const expandKeyword=(index)=>{
//   keywordList.value[index].expandState = !keywordList.value[index].expandState;
// }
watchEffect(() => {
  if (agentKey.value) {
    getChartData();
  }
});
watchEffect(() => {
  if (agentKey.value) {
    getData();
  }
});
</script>
<template>
  <div class="calendar">
    <Header :title="'学习日历'" :backPath="'/home'" />
    <div class="calendar-container">
      <div class="calendar-left">
        <div>
          <div class="calendar-chart">
            <line-chart
              line-id="board-chart"
              :chart-data="chartData"
              :changeSize="changeSize"
              @chooseDate="chooseDate"
              :yData="yData"
              :xData="xData"
              v-if="chartData.length > 0"
            />
          </div>

          <!-- v-if="index < item.length - 1" -->
          <template v-if="keywordList.length > 0">
            <div class="calendar-title" v-if="chartDate !== 0">
              {{ dayjs(chartDate).format("YYYY.M.DD") }} 星期{{
                "日一二三四五六".split("")[dayjs(chartDate).day()]
              }}
            </div>
            <div class="calendar-title" v-if="chartIndex !== -1">
              学习了
              {{
                dayjs
                  .duration(chartData[1][chartIndex].num * 60000)
                  .asMinutes()
                  .toFixed(2)
              }}
              分钟，新增了{{ chartData[0][chartIndex].count }}张知识库片
            </div>
            <div
              class="calendar-keyword dp--center"
              v-for="(item, index) in keywordList"
              :key="`lesson${item._key}`"
              style="flex-wrap: wrap"
            >
              <div class="keyword-title">
                {{ item.resouceName }}
                <div
                  class="keyword-box-icon icon-point"
                  @click="item.expandState = !item.expandState"
                >
                  <FontIcon
                    :iconName="item.expandState ? 'shouqiquanping' : 'quanping'"
                    :iconStyle="{ color: '#333' }"
                  />
                </div>
              </div>
              <div class="keyword-title">{{ item.mediaName }}</div>
              <template v-if="item.expandState">
                <div
                  v-for="(keywordItem, keywordIndex) in item.keywords"
                  :key="`keyword${keywordItem._key}`"
                  class="keyword-box"
                  style="width: 100%"
                >
                  <div class="keyword-box-title dp-space-center">
                    {{ keywordItem.keyword }}
                    <div class="dp-center-center">
                      <div
                        v-if="keywordItem.isArchived"
                        class="concernItem-box-icon icon-point"
                        @click="
                          archiveKeyword(
                            index,
                            keywordItem._key,
                            keywordIndex,
                            false
                          )
                        "
                      >
                        <FontIcon iconName="a-xin-kongxin2" />
                      </div>
                      <div
                        @click="
                          archiveKeyword(
                            index,
                            keywordItem._key,
                            keywordIndex,
                            true
                          )
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
                        @click="
                          deleteKeyword(index, keywordItem._key, keywordIndex)
                        "
                      >
                        <el-icon :size="18"><Delete /></el-icon>
                      </div>
                    </div>
                  </div>
                  <div
                    class="keyword-box-subtitle"
                    v-for="(
                      sentenceItem, sentenceIndex
                    ) in keywordItem.sentences"
                    :key="`sentence${sentenceIndex}`"
                  >
                    <span
                      v-for="(wordItem, wordIndex) in sentenceItem"
                      :key="`word${wordIndex}`"
                      @click="
                        wordItem === keywordItem.keyword
                          ? chooseWord(wordItem, keywordItem._key)
                          : ''
                      "
                      :style="
                        wordItem === keywordItem.keyword
                          ? {
                              background:
                                keyword === wordItem ? '#ffe3b5' : '#c2c4f6',
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
                  @click="chooseWord(keywordItem.keyword, keywordItem._key)"
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
          <div class="calendar-empty" v-else>
            <el-empty description="当前日期无关键字" />
          </div>
        </div>
      </div>

      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
      />
    </div>
  </div>
</template>
<style scoped lang="scss">
.calendar {
  width: 100vw;
  height: 100vh;
  align-content: flex-start;
  @include p-number(34px, 0px);
  @include flex(center, center, wrap);
  .calendar-container {
    width: 100vw;
    height: calc(100vh - 120px);
    margin-top: 25px;
    padding: 10px 119px 20px 78px;
    box-sizing: border-box;
    @include flex(space-between, center, null);

    .calendar-left {
      min-width: 1120px;
      flex: 1;
      height: 100%;
      @include p-number(10px, 10px);
      @include scroll();
      .calendar-chart {
        width: 100%;
        height: 284px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0px 2px 9px 0px rgba(178, 178, 178, 0.5);
        margin-bottom: 30px;
      }
      .calendar-title {
        width: 100%;
        height: 40px;
        font-size: 18px;
      }
      .calendar-keyword {
        width: 100%;
        border-radius: 14px;
        box-shadow: 0px 2px 9px 0px rgba(178, 178, 178, 0.5);
        padding: 15px 33px;
        box-sizing: border-box;
        margin-bottom: 20px;
        .keyword-title {
          width: 100%;
          height: 28px;
          font-size: 18px;
          font-weight: 500;
          color: $commonColor;
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
            height: 40px;
            font-size: 28px;
            font-family: DIN Black, DIN Black-Black;
            font-weight: 900;
            line-height: 35px;
            margin-bottom: 6px;
            .concernItem-box-icon {
              display: none;
            }
            &:hover {
              .concernItem-box-icon {
                @include flex(center, center, null);
              }
            }
          }
          .keyword-box-subtitle {
            width: 100%;
            font-size: 22px;
            color: #333333;
            line-height: 26px;
            margin-bottom: 10px;
          }
          .keyword-box-content {
            background: #ffffff;
            font-size: 20px;
            padding: 0px 10px;
            box-sizing: border-box;
          }
          .keyword-box-icon {
            display: none;
          }
        }
        .keyword-title-box {
          height: 56px;
          font-size: 18px;
          line-height: 28px;
          margin-bottom: 30px;
          @include flex(flex-start, center, null);
        }

        &:hover {
          .keyword-box {
            .keyword-box-icon {
              @include flex(center, center, null);
            }
          }
        }
      }
      .calendar-empty {
        width: 100%;
        height: calc(100vh - 490px);
        @include flex(center, center, null);
      }
    }
  }
}
</style>
<style></style>
