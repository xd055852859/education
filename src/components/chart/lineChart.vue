<script setup lang="ts">
import * as echarts from "echarts";

const props = defineProps<{
  lineId: string;
  chartData: any;
  changeSize?: number;
  yData?: any;
  xData?: any;
}>();
const emits = defineEmits<{
  (e: "chooseDate", date: string, index: number): void;
}>();
const dayjs: any = inject("dayjs");
let chart: any | null = null;
let option: echarts.EChartsOption | null = null;
const xAxisData = ref<any>(null);
const seriesData = ref<any>(null);
const nameData = ref<any>(null);

onMounted(() => {
  xAxisData.value = [
    ...props.chartData[0].map((item) => {
      return dayjs(item.ctime).format("YYYY-MM-DD");
    }),
    ...props.chartData[1].map((item) => {
      return dayjs(item.ctime).format("YYYY-MM-DD");
    }),
  ];

  seriesData.value = props.chartData.map((item, index) => {
    console.log(item);
    let newItem: any = {
      name: item[0].name,
      type: item[0].type,
      min: item[0].min,
      max: item[0].max,
      yAxisIndex: index,
      data: [],
    };
    item.forEach((countItem) => {
      newItem.data.push(countItem.count);
    });
    return newItem;
  });
  nameData.value = props.chartData.map((item) => {
    return item[0]?.name;
  });
  console.log(props.xData);
  let chartDom: any = document.getElementById(props.lineId);
  chart = echarts.init(chartDom, null, {
    width: chartDom.parentElement.offsetWidth * 1.05,
    height: chartDom.parentElement.offsetHeight * 1.1,
  });
  option = {
    legend: {
      data: nameData.value,
    },
    grid: {
      left: "5%",
      // right: '4%',
      top: "17%",
      // containLabel: true
    },
    xAxis: {
      name: "日期",
      type: "category",
      data: props.xData,
    },
    yAxis: props.yData,
    tooltip: {
      trigger: "axis",
    },
    series: seriesData.value,
  };

  option && chart.setOption(option);
  console.log(seriesData.value);
  chart.on("click", function (params) {
    console.log(params);
    emits("chooseDate", params.name, params.dataIndex);
  });
});
watch(
  () => props.chartData,
  (newVal) => {
    xAxisData.value = [
      ...props.chartData[0].map((item) => {
        return dayjs(item.ctime).format("YYYY-MM-DD");
      }),
      ...props.chartData[1].map((item) => {
        return dayjs(item.ctime).format("YYYY-MM-DD");
      }),
    ];
    seriesData.value = newVal.map((item, index) => {
      let newItem: any = {
        name: item[0].name,
        type: item[0].type,
        min: item[0].min,
        max: item[0].max,
        yAxisIndex: index,
        data: [],
      };
      item.forEach((countItem) => {
        newItem.data.push(countItem.count);
      });
      return newItem;
    });
    //@ts-ignore
    chart.setOption<echarts.EChartsOption>({
      xAxis: {
        data: xAxisData.value,
      },
      series: seriesData.value,
    });
    //@ts-ignore
    chart.resize();
  },
  { deep: true }
);
watch(
  () => props.changeSize,
  (newVal) => {
    let chartDom: any = document.getElementById(props.lineId);
    //@ts-ignore
    chart.resize({
      width: chartDom.parentElement.offsetWidth * 0.65,
      height: chartDom.parentElement.offsetHeight * 1.1,
    });
  }
);
</script>
<template>
  <div :id="lineId" class="line-chart"></div>
</template>
<style scoped lang="scss">
.line-chart {
  width: 100%;
  height: 100%;
}
</style>
<style></style>
