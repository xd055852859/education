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

import KeywordItem from "@/components/keywordItem.vue";
import { SplitVendorChunkCache } from "vite";
const props = defineProps<{
  targetDate: number | string;
}>();
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
const lineData = ref<any>([]);
onMounted(() => {
  //@ts-ignore
  chartDate.value = parseInt(props.targetDate);
});
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
    chartData.value = [];
    let list: any = [];
    lineData.value = [
      {
        name: "关键字",
        type: "bar",
        min: 0,
        max: 100,
        areaColor: ["141", "169", "541"],
      },
      {
        name: "学习时间",
        type: "line",
        min: 0,
        max: 24,
        areaColor: ["255", "218", "142"],
      },
    ];
    list[0] = dataRes.data.keywordNum.map((item) => {
      item.name = "关键字";
      item.type = "bar";
      item.min = 0;
      item.max = 100;
      item.areaColor = ["141", "169", "541"];
      return item;
    });
    list[1] = dataRes.data.studyTime.map((item) => {
      item.num = item.count;
      item.count = dayjs
        .duration(item.count * 60000)
        .asHours()
        .toFixed(2);
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
    chartIndex.value = chartData.value[0].length - 1;
  }
};
const chooseWord = (word, wordKey) => {
  keyword.value = word;
  keywordKey.value = wordKey;
  changeSize.value = 1;
};
const changeList = (list) => {
  keywordList.value = _.cloneDeep(list);
};
const chooseDate = (date, index) => {
  chartDate.value = dayjs(date).startOf("day").valueOf();
  chartIndex.value = index;
};
const reloadData = () => {
  // getData();
  getChartData();
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
    <div class="calendar-container">
      <div class="calendar-left">
        <Header :title="'学习日历'" :backPath="'/home'" />
        <div class="calendar-left-box">
          <div
            class="calendar-chart"
            v-if="
              ((chartData[0] && chartData[0].length > 0) ||
                (chartData[1] && chartData[1].length > 0)) &&
              targetDate == 0
            "
          >
            <line-chart
              line-id="board-chart"
              :chart-data="chartData"
              :changeSize="changeSize"
              @chooseDate="chooseDate"
              :yData="yData"
              :xData="xData"
              :lineData="lineData"
            />
          </div>

          <!-- v-if="index < item.length - 1" -->
          <template v-if="keywordList.length">
            <div class="calendar-title" v-if="chartDate !== 0">
              {{ dayjs(chartDate).format("YYYY.M.DD") }} 星期{{
                "日一二三四五六".split("")[dayjs(chartDate).day()]
              }}
            </div>
            <div class="calendar-title" v-if="chartIndex !== -1 && !targetDate">
              学习了
              <span v-if="chartData[1] && chartData[1][chartIndex]"
                >{{ chartData[1][chartIndex].count }} 小时</span
              >,<span v-if="chartData[0] && chartData[0][chartIndex]"
                >新增了{{ chartData[0][chartIndex].count }}张知识库片</span
              >
            </div>
            <KeywordItem
              @changeList="changeList"
              :list="keywordList"
              :keyword="keyword"
              @chooseWord="chooseWord"
              :type="'outer'"
              @reloadData="reloadData"
            />
          </template>
        </div>
      </div>

      <Keyword
        :keyword="keyword"
        :keywordKey="keywordKey"
        @setKeyword="keyword = ''"
        type="outer"
      />
    </div>
  </div>
</template>
<style scoped lang="scss">
.calendar {
  width: 100%;
  height: 100%;

  // align-content: flex-start;
  // @include p-number(34px, 0px);
  // @include flex(center, center, wrap);
  .calendar-container {
    width: 100%;
    height: 100%;
    @include flex(space-between, center, null);

    .calendar-left {
      flex: 1;
      height: 100%;

      @include flex(space-between, center, wrap);

      .calendar-left-box {
        min-width: 1120px;
        flex: 1;
        height: calc(100% - 120px);
        padding: 10px 120px;
        margin-top: 25px;
        box-sizing: border-box;
        @include scroll();

        .calendar-chart {
          width: 100%;
          height: 300px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0px 2px 9px 0px rgba(178, 178, 178, 0.5);
          margin-bottom: 30px;
          padding-top: 15px;
          box-sizing: border-box;
        }

        .calendar-title {
          width: 100%;
          height: 40px;
          font-size: 18px;
        }
      }
    }
  }
}
</style>
<style></style>
