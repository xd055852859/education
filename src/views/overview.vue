<script setup lang="ts">
import Calendar from "@/components/calendar.vue";
import Avatar from "@/components/avatar.vue";
import LessonItem from "@/components/lessonItem.vue";
import FontIcon from "@/components/fontIcon.vue";
import { MoreFilled } from "@element-plus/icons-vue";
import { ResultProps } from "@/interface/Common";
import userCenter from "./user.vue";
import api from "@/services/api";
import { storeToRefs } from "pinia";
import appStore from "@/store";
import router from "@/router";
import { ElMessage } from "element-plus";
import { is_mobile } from "@/services/util";
const dayjs: any = inject("dayjs");
const { deviceType } = storeToRefs(appStore.commonStore);
const { user } = storeToRefs(appStore.authStore);
const { agentList, agentInfo, agentKey } = storeToRefs(appStore.agentStore);
const { setLessonKey } = appStore.lessonStore;
const { getAgentList, setAgentKey } = appStore.agentStore;
const { setUserVisible } = appStore.commonStore;
const calendarNumList = ref<any>([]);
const calendarTimeList = ref<any>([]);
const userState = ref<boolean>(false);
const onceVisible = ref<boolean>(false);
const foldVisible = ref<boolean>(false);
const subscribeList = ref<any>([]);
const foldList = ref<any>([]);
const studyTime = ref<number>(0);
const keywordCount = ref<number>(0);
const masterNum = ref<number>(0);
const noteNum = ref<number>(0);
const interval1 = ref<any>(null);
const interval2 = ref<any>(null);
const interval3 = ref<any>(null);
const getCalendarNum = async (startTime, endTime) => {
  let numRes = (await api.request.get("study/calendar", {
    agentKey: agentKey.value,
    startTime,
    endTime,
  })) as ResultProps;
  if (numRes.msg === "OK") {
    calendarNumList.value = [];
    calendarTimeList.value = [];
    numRes.data.forEach((item) => {
      item.time = dayjs(item.ctime).startOf("day").valueOf();
      calendarNumList.value.push(item);
      calendarTimeList.value.push(item.time);
    });
  }
};
const getData = async () => {
  let dataRes = (await api.request.get("subscribe", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    subscribeList.value = dataRes.data;
  }
};
const getFoldData = async () => {
  let dataRes = (await api.request.get("subscribe/fold", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (dataRes.msg === "OK") {
    foldList.value = dataRes.data;
  }
};
const getNum = async () => {
  let numRes = (await api.request.get("agent/summary", {
    agentKey: agentKey.value,
  })) as ResultProps;
  if (numRes.msg === "OK") {
    studyTime.value = numRes.data.studyTime;
    let count1 = 0;
    let count2 = 0;
    let count3 = 0;
    if (interval1.value) {
      clearInterval(interval1.value);
      interval1.value = null;
    }
    if (interval2.value) {
      clearInterval(interval2.value);
      interval2.value = null;
    }
    if (interval3.value) {
      clearInterval(interval3.value);
      interval3.value = null;
    }
    interval1.value = setInterval(function () {
      // 更新数字
      keywordCount.value = count1;

      // 如果计数器达到100，清除定时器
      if (count1 >= numRes.data.keywordCount) {
        clearInterval(interval1.value);
      } else {
        // 增加计数器的值
        count1++;
      }
    }, 50);
    interval2.value = setInterval(function () {
      // 更新数字
      noteNum.value = count2;
      if (count2 >= numRes.data.keywordCount2) {
        clearInterval(interval2.value);
      }
      // 增加计数器的值
      count2++;
    }, 50);
    interval3.value = setInterval(function () {
      // 更新数字
      masterNum.value = count3;

      if (count3 >= numRes.data.masterNum) {
        clearInterval(interval3.value);
      }

      // 增加计数器的值
      count3++;
    }, 50);
    // keywordCount.value = numRes.data.keywordCount;
    // noteNum.value = numRes.data.keywordCount2;
    // masterNum.value = numRes.data.masterNum;
  }
};
const chooseLesson = (item) => {
  setLessonKey(item._key);
  router.push(`/home/study/${item._key}`);
};
const foldLesson = async (item, index, folded) => {
  let foldRes = (await api.request.patch("subscribe/fold", {
    agentKey: agentKey.value,
    resourceKey: item._key,
    folded: folded,
  })) as ResultProps;
  if (foldRes.msg === "OK") {
    ElMessage.success(`${folded ? "折叠" : "取消折叠"}成功`);
    if (folded) {
      let newItem = subscribeList.value.splice(index, 1);
      foldList.value.push(newItem[0]);
    } else {
      let newItem = foldList.value.splice(index, 1);
      if (newItem[0].top) {
        subscribeList.value.unshift(newItem[0]);
      } else {
        subscribeList.value.push(newItem[0]);
      }
    }
  }
};
const topLesson = async (item, index, top) => {
  let topRes = (await api.request.patch("subscribe/top", {
    agentKey: agentKey.value,
    resourceKey: item._key,
    top: top,
  })) as ResultProps;
  if (topRes.msg === "OK") {
    ElMessage.success(`${top ? "置顶" : "取消置顶"}成功`);
    item.top = top;
    if (top) {
      subscribeList.value.splice(index, 1);
      subscribeList.value.unshift(item);
    } else {
      let topIndex = -1;
      subscribeList.value.splice(index, 1);
      subscribeList.value.forEach((subscribeItem, subscribeIndex) => {
        if (subscribeItem.top) {
          topIndex = subscribeIndex;
        }
      });
      subscribeList.value.splice(topIndex + 1, 0, item);
    }
  }
};
watchEffect(() => {
  if (agentKey.value) {
    getData();
    getFoldData();
    getNum();
    getAgentList();
  }
});
watch(
  user,
  (info) => {
    if (info && !info.userName) {
      userState.value = true;
      ElMessage.info("请设置个人信息");
      setTimeout(() => {
        setUserVisible(true);
      }, 800);
      //
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="overview"
    :style="{
      backgroundImage: `url('/common/${
        deviceType === 'pc' ? 'commonBg' : 'commonPhoneBg'
      }.png')`,
    }"
    :class="{ 'overviwe-phone': deviceType === 'phone' }"
  >
    <div class="overview-header">
      <div class="dp--center overview-user" @click="userState = true">
        <div
          @mouseenter="onceVisible ? (userState = true) : null"
          @mouseleave="onceVisible = true"
          style="height: 100%"
          v-if="deviceType === 'pc'"
        >
          <FontIcon
            iconName="a-shensuocaidan1x"
            :iconStyle="{ fontSize: '22px', marginRight: '10px' }"
            :boxStyle="{ height: '100%' }"
            :customClassName="'dp--center'"
          />
        </div>
        <img src="/overview/logo.svg" alt="" />
      </div>
      <el-button
        type="primary"
        class="overview-button"
        round
        @click="$router.push('center')"
        ><img src="/overview/overviewHeader.svg" alt="" />课件库</el-button
      >
    </div>
    <div class="overview-box" @mousemove.once="onceVisible = true">
      <div
        class="overview-container"
        :style="deviceType === 'phone' ? { width: '90vw' } : {}"
      >
        <div class="overview-top">
          <div class="calendar-box">
            <Calendar
              @getCalendarNum="getCalendarNum"
              :calendarTimeList="calendarTimeList"
            />
          </div>
          <div class="data-box">
            <div class="data-top">
              <div @click="userState = true" class="data-top-avatar">
                <Avatar
                  :src="agentInfo?.icon"
                  :alt="agentInfo?.name"
                  :style="{
                    width: '0.38rem',
                    height: '0.38rem',
                    marginRight: '0.07rem',
                  }"
                />
              </div>
              <div>
                <el-dropdown
                  :trigger="deviceType === 'phone' ? 'click' : 'hover'"
                >
                  <div class="data-top-title icon-point dp-space-center">
                    你好, {{ agentInfo?.name }}
                    <FontIcon
                      iconName="zhankai"
                      :iconStyle="{
                        color: '#666',
                        fontSize: '14px',
                        marginLeft: '10px',
                      }"
                    />
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="(item, index) in agentList"
                        :key="`agent${item._key}`"
                      >
                        <div
                          class="agent-item select-third-item icon-point"
                          @click="setAgentKey(item._key)"
                        >
                          <div class="select-item-logo">
                            <Avatar
                              :src="item.icon"
                              :alt="item.name"
                              :style="{ width: '0.28rem', height: '0.28rem' }"
                            />
                          </div>
                          <div class="select-item-name single-to-long">
                            {{ item.name }}
                          </div>
                          <div v-if="item._key === agentKey">
                            <img src="/common/choose.svg" alt="" />
                          </div>
                        </div>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <div
                  v-if="studyTime > 0"
                  class="data-top-subtitle icon-point"
                  @click="$router.push(`/home/calendar/0`)"
                >
                  共学习了
                  <span style="color: #14c78c">{{
                    dayjs
                      .duration(studyTime * 60000)
                      .asHours()
                      .toFixed(2)
                  }}</span>
                  小时,
                  <span style="color: #ff5660">{{
                    keywordCount + noteNum + masterNum
                  }}</span>
                  个单词
                </div>
                <div class="data-top-subtitle" v-else>欢迎访问</div>
              </div>
            </div>
            <div class="data-bottom">
              <div
                class="data-container first-data"
                @click="$router.push('/home/concern/uncare')"
              >
                <div class="data-title" style="color: #5478fb">
                  {{ keywordCount }}
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo1.svg" alt="" />生词
                </div>
              </div>
              <div
                class="data-container second-data"
                @click="$router.push('/home/concern/care')"
              >
                <div class="data-title" style="color: #ff5660">
                  <div class="data-num">{{ noteNum }}</div>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo2.svg" alt="" />熟词
                </div>
              </div>
              <div
                class="data-container third-data"
                @click="$router.push('/home/concern/master')"
              >
                <div class="data-title" style="color: #eb930c">
                  <div class="data-num">{{ masterNum }}</div>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo4.svg" alt="" />搞定
                </div>
              </div>
              <!-- <div class="data-container" @click="$router.push(`/home/calendar/0`)">
                <div class="data-title" style="color: #eb930c">
                  {{
                    dayjs
                      .duration(studyTime * 60000)
                      .asHours()
                      .toFixed(1)
                  }}<span>小时</span>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo3.svg" alt="" />学习记录
                </div>
              </div> -->
            </div>

            <!-- <div
            class="overview-top-container"
            @click="$router.push('/home/note')"
          >
            <img src="/overview/logo3.svg" alt="" />
            <div class="overview-top-content">
              <div class="overview-top-title">{{ noteNum }}<span>篇</span></div>
              <div class="overview-top-subtitle">学习日记</div>
            </div>
          </div> -->
          </div>
        </div>
        <div class="overview-center">订阅( {{ subscribeList.length }} )</div>
        <div class="overview-bottom">
          <div
            class="overview-bottom-box"
            :style="{
              alignContent: subscribeList.length > 0 ? 'flex-start' : 'center',
            }"
          >
            <template v-if="subscribeList.length > 0">
              <template
                class="dp-space-center"
                v-for="(item, index) in subscribeList"
                :key="`lesson${item._key}`"
              >
                <LessonItem
                  :item="item"
                  @clickLesson="chooseLesson(item)"
                  :last="index === subscribeList.length - 1"
                >
                  <template #button>
                    <div
                      class="lessonItem-button dp-center-center"
                      @click="$event.stopPropagation()"
                    >
                      <el-dropdown
                        :trigger="deviceType === 'phone' ? 'click' : 'hover'"
                        :hide-on-click="false"
                        :teleported="false"
                      >
                        <div class="icon-point dp--center">
                          <el-icon>
                            <MoreFilled />
                          </el-icon>
                        </div>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              @click="topLesson(item, index, !item.top)"
                              >{{
                                item.top ? "取消置顶" : "置顶"
                              }}</el-dropdown-item
                            >
                            <el-dropdown-item
                              @click="foldLesson(item, index, true)"
                              >折叠</el-dropdown-item
                            >
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </template>
                </LessonItem>
              </template>
            </template>
            <div
              class="dp-center-center"
              v-else
              style="width: 100%; height: 100%"
            >
              <el-empty description="无资源" />
            </div>
            <div
              @click="foldVisible = !foldVisible"
              style="width: 100%"
              class="overview-fold-title"
              v-if="foldList.length > 0"
            >
              折叠 ({{ foldList.length }})
              <img
                :src="
                  foldVisible
                    ? '/common/doubleup.svg'
                    : '/common/doubledown.svg'
                "
                alt=""
              />
              <div class="overview-fold-line"></div>
            </div>
            <template v-if="foldVisible">
              <template
                class="dp-space-center"
                v-for="(item, index) in foldList"
                :key="`fold${item._key}`"
              >
                <LessonItem :item="item" @clickLesson="chooseLesson(item)">
                  <template #button>
                    <div
                      class="lessonItem-button dp-center-center"
                      @click="$event.stopPropagation()"
                    >
                      <el-dropdown
                        :trigger="deviceType === 'phone' ? 'click' : 'hover'"
                        :hide-on-click="false"
                        :teleported="false"
                      >
                        <div class="icon-point dp--center">
                          <el-icon>
                            <MoreFilled />
                          </el-icon>
                        </div>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              @click="foldLesson(item, index, false)"
                              >取消折叠</el-dropdown-item
                            >
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </template>
                </LessonItem>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
  <el-drawer
    v-model="userState"
    title="用户"
    direction="ltr"
    :size="deviceType === 'pc' ? '20%' : '50%'"
    :with-header="false"
    :append-to-body="true"
  >
    <userCenter />
  </el-drawer>
</template>
<style scoped lang="scss">
.overview {
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding-top: 40px;
  box-sizing: border-box;

  .overview-header {
    width: 100%;
    height: 30px;
    margin-bottom: 30px;
    padding: 0px 57px 0px 28px;
    box-sizing: border-box;
    @include flex(space-between, center, null);

    .overview-user {
      height: 100%;
      font-size: 22px;
      color: #000000;
      line-height: 22px;

      img {
        width: 146px;
        height: 30px;
      }
    }

    .overview-button {
      width: 168px;
      height: 52px;
      font-size: 20px;
      font-weight: 500;
      color: #ffffff;

      img {
        width: 22px;
        height: 22px;
        margin-right: 10px;
      }
    }
  }

  .overview-box {
    width: 100%;
    height: calc(100% - 100px);
    box-sizing: border-box;
    @include flex(center, flex-start, null);

    .overview-container {
      width: 1200px;
      max-width: 90vw;
      height: 100%;

      .overview-top {
        width: 100%;
        height: 300px;
        @include flex(space-between, center, null);

        .calendar-box {
          width: 275px;
          background: #ffffff;
          border-radius: 7px;
          box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.09);
          @include p-number(17px, 21px);
        }

        .data-box {
          width: calc(100% - 300px);
          @include flex(center, space-between, wrap);

          .data-top {
            width: 100%;
            height: 67px;
            font-size: 24px;
            color: #000000;
            line-height: 33px;
            margin-bottom: 50px;
            padding-left: 80px;
            @include flex(flex-start, center, null);

            .data-top-title {
              width: 100%;
              height: 33px;
              font-size: 24px;
              color: #000000;
              line-height: 33px;
              margin-bottom: 10px;
            }
            .data-top-subtitle {
              width: 100%;
              height: 25px;
              font-size: 18px;
              color: #000000;
              line-height: 25px;
            }
          }

          .data-bottom {
            width: 100%;
            height: 144px;
            position: relative;
            z-index: 1;
            @include flex(space-between, center, null);

            .data-container,
            .second-data {
              width: 40%;
              height: 100%;
              cursor: pointer;
              align-content: center;

              @include flex(space-between, center, wrap);

              .data-title {
                width: 100%;
                height: 67px;
                font-size: 58px;
                font-family: DIN Alternate, DIN Alternate-Bold;
                font-weight: bold;
                color: #000000;
                margin-bottom: 4px;
                padding-left: 11px;
                box-sizing: border-box;
                @include flex(center, center, null);
                .data-num {
                  // animation: fadeIn 500ms ease-in-out infinite;
                }
                span {
                  font-size: 22px;
                  font-weight: normal;
                  color: #999999;
                  margin-left: 8px;
                }
              }

              .data-subtitle {
                width: 100%;
                height: 35px;
                font-size: 25px;
                color: #333333;
                line-height: 36px;
                @include flex(center, center, null);

                img {
                  width: 35px;
                  height: 35px;
                  margin-right: 5.5px;
                }
              }
            }
            .first-data {
              padding-right: 7%;
              box-sizing: border-box;
              background-color: #ebeefc;
            }
            .second-data {
              width: 40%;
              height: 100%;
              position: absolute;
              z-index: 2;
              top: 0px;
              left: 31%;
              background-image: url("/common/secondBg.svg");
              background-position: center center;
              background-size: cover;
              background-repeat: no-repeat;
            }
            .third-data {
              padding-left: 7%;
              box-sizing: border-box;
              background-color: #ffecd2;
            }
          }
        }
      }

      .overview-center {
        width: 100%;
        height: 33px;
        font-size: 24px;
        // font-family: PingFang SC, PingFang SC-Regular;
        color: #000000;
        line-height: 33px;
        margin: 25px 0px 17px 0px;
      }

      .overview-bottom {
        width: 100%;
        height: calc(100% - 380px);
        background: rgba(255, 255, 255, 0.88);
        border-radius: 14px;
        box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.09);
        @include p-number(24px, 15px);

        .overview-bottom-box {
          width: 100%;
          height: 100%;
          @include p-number(0px, 32px);
          @include scroll();
          @include flex(center, center, wrap);

          .overview-fold-title {
            width: 100%;
            height: 20px;
            font-size: 18px;
            color: #333333;
            line-height: 20px;
            margin-top: 20px;
            cursor: pointer;
            @include flex(flex-start, center, null);

            img {
              width: 10px;
              height: 9px;
              margin: 0px 10px;
            }

            .overview-fold-line {
              flex: 1;
              height: 1px;
              border-bottom: 1px dashed #cfcfcf;
            }
          }
        }
      }
    }
  }
}
.overviwe-phone {
  padding-top: 0px;
  .overview-header {
    height: 70px;
    margin-bottom: 0px;
    padding: 0px 28px;
    box-sizing: border-box;
    @include flex(space-between, center, null);
    .overview-button {
      width: 128px;
      height: 42px;
      font-size: 18px;
      font-weight: 500;
      color: #ffffff;
      @include flex(center, center, null);
      img {
        width: 18px;
        height: 18px;
        margin-right: 10px;
      }
    }
  }
  .overview-box {
    .overview-container {
      .overview-top {
        height: 430px;
        flex-direction: column-reverse;
        @include flex(center, center, wrap);
        .calendar-box {
          width: 100%;
          padding: 17px 16px 8px 16px;
          box-sizing: border-box;
        }
        .data-box {
          width: 100%;
          margin-bottom: 20px;
          .data-top {
            margin-bottom: 15px;
            padding-left: 0px;
          }
          .data-bottom {
            height: 120px;
          }
        }
      }
      .overview-center {
        margin: 15px 0px 17px 0px;
      }
      .overview-bottom {
        height: calc(100% - 500px);
        padding: 20px 15px 24px 25px;
        .overview-bottom-box {
          padding: 0px 20px 0px 0px;
        }
      }
    }
  }
}
</style>
<style lang="scss">
.agent-item {
  width: 400px;
}
.data-top {
  .el-dropdown__popper {
    top: 40px !important;
    left: 0px !important;
    right: auto !important;
    bottom: auto !important;
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
