<script setup lang="ts">
import _ from "lodash";
import { formatMonth } from "@/services/util";
import { storeToRefs } from "pinia";
import appStore from "@/store";
const dayjs: any = inject("dayjs");
const props = defineProps<{
  calendarTimeList: any;
}>();
const emits = defineEmits<{
  (e: "getCalendarNum", startTime: number, endTime: number): void;
}>();
const { agentKey } = storeToRefs(appStore.agentStore);
const calendarDate = ref<any>(null);
const calendarYear = ref<any>([]);
const calendarMonth = ref<any>([]);
const month = ref<number>(0);
const calendarList = ref<any>([]);
// const weekArr = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const weekArr = ["一", "二", "三", "四", "五", "六", "日"];
onMounted(() => {
  calendarDate.value = dayjs().startOf("month").startOf("day");
});
const getCalendar = (targetDate: any) => {
  // 获得当前月的天数  和 第一天的星期数
  // let newTaskList: any = [];
  calendarYear.value = dayjs(targetDate).year();
  calendarMonth.value = dayjs(targetDate).month() + 1;
  let calendarDayNum = 0;
  if (
    dayjs(targetDate).startOf("month").day() === 0 ||
    dayjs(targetDate).startOf("month").day() < 2
  ) {
    calendarDayNum = 42;
  } else {
    calendarDayNum = 35;
  }
  getTargetDate(targetDate, calendarDayNum);
};
const chooseMonth = (type: string) => {
  if (type === "left") {
    calendarDate.value = dayjs(calendarDate.value)
      .subtract(1, "month")
      .startOf("month")
      .startOf("day");
  } else if (type === "right") {
    calendarDate.value = dayjs(calendarDate.value)
      .add(1, "month")
      .startOf("month")
      .startOf("day");
  }
};
const getMonthDays = (momentObj: any) => {
  return momentObj.daysInMonth();
};
const getWeekDays = (momentObj: any) => {
  return momentObj.startOf("month").weekday(); //
};
const getTargetDate = (targetDate: any, calendarDayNum: number) => {
  let curDays = getMonthDays(targetDate); // 当前天数
  let curWeek = getWeekDays(targetDate.clone()); // 当前月第一天的星期(索引值)
  let upDays = getMonthDays(targetDate.clone().subtract(1, "month")); // 上月的天数
  // 生成的结构
  let strDate: any = [];
  // 下个月的起始日期
  let nextFirstDate = 0;
  for (let i = 0; i < calendarDayNum; i++) {
    // 1. 当前月的上一个月
    if (i < curWeek) {
      // 返回的索引值刚好是上月在当月显示的天数
      let momentDate = dayjs(
        `${targetDate.clone().year()}-${
          targetDate.clone().subtract(1, "months").month() + 1
        }-${upDays}`
      );

      strDate.unshift({
        month: "last",
        day: upDays,
        date: momentDate,
        week: momentDate.day(),
        startTime: momentDate.startOf("day").valueOf(),
        endTime: momentDate.endOf("day").valueOf(),
        targetMonth: momentDate.month(),
      });
      upDays--; // 倒叙显示   30 31
    } else if (i >= curDays + curWeek) {
      //去除掉当月天数+上月天数就是下月天数
      // 2. 当前月的下一个月：除去当月最后一天+上月的几天剩余的是下月开始计算
      // curWeek 返回值刚好是上月占用的天数
      nextFirstDate++;
      let momentDate = dayjs(
        `${targetDate.clone().year()}-${
          targetDate.clone().add(1, "months").month() + 1
        }-${nextFirstDate}`
      );
      console.log(
        `${targetDate.clone().year()}-${
          targetDate.clone().add(1, "months").month() + 1
        }-${nextFirstDate}`
      );
      strDate.push({
        month: "next",
        day: nextFirstDate,
        date: momentDate,
        week: momentDate.day(),
        startTime: momentDate.startOf("day").valueOf(),
        endTime: momentDate.endOf("day").valueOf(),
        targetMonth: momentDate.month(),
      });
    } else {
      // 3. 当前月
      // i-curWeek+1 为当前月的天数
      // date()获取日期号
      // m.date() == i - curWeek + 1说明这一天是当月当天，添加样式
      let momentDate = dayjs(
        new Date(
          targetDate.year() +
            "/" +
            (targetDate.clone().month() + 1) +
            "/" +
            (i - curWeek + 1)
        ).getTime()
      );
      let obj: any = {
        month: "target",
        day: i - curWeek + 1,
        date: momentDate,
        week: momentDate.day(),
        startTime: momentDate.startOf("day").valueOf(),
        endTime: momentDate.endOf("day").valueOf(),
        targetMonth: momentDate.month(),
      };
      if (
        momentDate.startOf("day").valueOf() === dayjs().startOf("day").valueOf()
      ) {
        obj.targetDay = true;
      }
      strDate.push(obj);
    }
  }
  console.log(strDate);
  emits(
    "getCalendarNum",
    strDate[0].startTime,
    strDate[strDate.length - 1].endTime
  );
  calendarList.value = strDate;
};
watchEffect(() => {
  if (calendarDate.value && agentKey.value) {
    getCalendar(calendarDate.value);
  }
});
</script>
<template>
  <div class="calendar">
    <div class="calendar-header">
      <img
        @click="chooseMonth('left')"
        src="/overview/leftCalendar.svg"
        alt=""
      />
      <div>{{ calendarYear }} {{ formatMonth(calendarMonth, "zh") }}</div>
      <img
        @click="chooseMonth('right')"
        src="/overview/rightCalendar.svg"
        alt=""
      />
    </div>
    <div class="calendar-week">
      <div
        class="calendar-week-list"
        v-for="(weekItem, weekIndex) in weekArr"
        :key="`week${weekIndex}`"
      >
        <div class="calendar-week-item">
          {{ weekItem }}
        </div>
      </div>
    </div>
    <div class="calendar-day">
      <div
        class="calendar-day-list"
        v-for="(calendarItem, calendarIndex) in calendarList"
        :key="`calendar${calendarIndex}`"
      >
        <div
          class="calendar-day-item icon-pointer"
          :class="{ 'calendar-day-choose': calendarItem.targetDay }"
          @click="
            calendarTimeList.indexOf(calendarItem.startTime) !== -1
              ? $router.push(`/home/calendar/${calendarItem.startTime}`)
              : null
          "
        >
          <div
            class="calendar-day-title"
            :style="calendarItem.month !== 'target' ? { color: '#9da3a9' } : {}"
          >
            {{ calendarItem.targetDay ? "今" : calendarItem.day }}
          </div>
          <div
            class="calendar-day-point"
            :style="
              calendarTimeList.indexOf(calendarItem.startTime) !== -1
                ? {
                    backgroundColor: '#4D57FF',
                  }
                : {}
            "
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.calendar {
  width: 100%;
  .calendar-header {
    width: 100%;
    height: 34px;
    font-size: 12px;
    color: #333333;
    line-height: 17px;
    letter-spacing: 0.27px;
    font-weight: bold;
    margin-bottom: 10px;
    @include flex(space-between, center, null);
    img {
      width: 34px;
      height: 34px;
      cursor: pointer;
    }
  }
  .calendar-week {
    width: 100%;
    margin-bottom: 5px;
    @include flex(flex-start, center, null);
    .calendar-week-list {
      width: 14.2%;
      .calendar-week-item {
        width: 26px;
        height: 17px;
        font-size: 12px;
        color: #9da3a9;
        line-height: 17px;
        text-align: center;
        letter-spacing: 0.27px;
      }
    }
  }
  .calendar-day {
    width: 100%;
    @include flex(flex-start, center, wrap);
    .calendar-day-list {
      width: 14.2%;
      height: 35px;
      .calendar-day-item {
        width: 26px;
        height: 30px;
        align-content: center;
        box-sizing: border-box;
        @include flex(center, center, wrap);
        .calendar-day-title {
          width: 100%;
          font-size: 12px;
          text-align: center;
          color: #333333;
          line-height: 16px;
        }
        .calendar-day-point {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
      }
      .calendar-day-choose {
        border: 1.2px solid $commonColor;
        border-radius: 7px;
        color: $commonColor;
      }
    }
  }
}
</style>
<style></style>
