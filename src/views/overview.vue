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
const dayjs: any = inject("dayjs");
const { user } = storeToRefs(appStore.authStore);
const { agentInfo, agentKey } = storeToRefs(appStore.agentStore);
const { setLessonKey } = appStore.lessonStore;
const calendarNumList = ref<any>([]);
const calendarTimeList = ref<any>([]);
const userVisible = ref<boolean>(false);
const foldVisible = ref<boolean>(false);
const subscribeList = ref<any>([]);
const foldList = ref<any>([]);
const studyTime = ref<number>(0);
const keywordCount = ref<number>(0);
const noteNum = ref<number>(0);

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
    keywordCount.value = numRes.data.keywordCount;
    noteNum.value = numRes.data.keywordCount2;
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
      subscribeList.value.push(newItem[0]);
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
      console.log(topIndex);
      subscribeList.value.splice(topIndex + 1, 0, item);
    }
  }
};
watchEffect(() => {
  if (agentKey.value) {
    getData();
    getFoldData();
    getNum();
  }
});
</script>
<template>
  <div class="overview">
    <div class="overview-header">
      <div class="dp--center overview-user">
        <div @mouseenter="userVisible = true">
          <FontIcon
            iconName="a-shensuocaidan1x"
            :iconStyle="{ fontSize: '22px', marginRight: '10px' }"
          />
        </div>
        <img src="/overview/logo.svg" alt="" />
      </div>
      <el-button
        type="primary"
        class="overview-button"
        round
        @click="$router.push('center')"
        ><img src="/overview/overviewHeader.svg" alt="" />课程库</el-button
      >
    </div>
    <div class="overview-box">
      <div class="overview-container">
        <div class="overview-top">
          <div class="calendar-box">
            <Calendar
              @getCalendarNum="getCalendarNum"
              :calendarTimeList="calendarTimeList"
            />
          </div>
          <div class="data-box">
            <div class="data-top">
              <div @click="userVisible = true" class="data-top-avatar">
                <Avatar
                  :src="user?.userAvatar"
                  :alt="user?.userName"
                  :style="{
                    width: '0.3rem',
                    height: '0.3rem',
                    marginRight: '0.07rem',
                  }"
                />
              </div>
              <div class="dp-space-center">
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
            </div>
            <div class="data-bottom">
              <div
                class="data-container"
                @click="$router.push('/home/concern/care')"
              >
                <div class="data-title" style="color: #5478fb">
                  {{ noteNum }}<span>个</span>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo1.svg" alt="" />生词库
                </div>
              </div>
              <div
                class="data-container"
                @click="$router.push('/home/concern/uncare')"
              >
                <div class="data-title" style="color: #ff5660">
                  {{ keywordCount }}<span>个</span>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo2.svg" alt="" />熟词库
                </div>
              </div>

              <div
                class="data-container"
                @click="$router.push('/home/calendar')"
              >
                <div class="data-title" style="color: #eb930c">
                  {{
                    dayjs
                      .duration(studyTime * 60000)
                      .asHours()
                      .toFixed(1)
                  }}<span>小时</span>
                </div>
                <div class="data-subtitle">
                  <img src="/overview/logo3.svg" alt="" />学习日历
                </div>
              </div>
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
        <div class="overview-center">
          订阅课件( {{ subscribeList.length }} )
        </div>
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
                      <el-dropdown trigger="click" :hide-on-click="false">
                        <div class="icon-point dp--center">
                          <el-icon><MoreFilled /></el-icon>
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
                      <el-dropdown trigger="click" :hide-on-click="false">
                        <div class="icon-point dp--center">
                          <el-icon><MoreFilled /></el-icon>
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
    v-model="userVisible"
    title="用户"
    direction="ltr"
    size="16%"
    :with-header="false"
  >
    <userCenter />
  </el-drawer>
</template>
<style scoped lang="scss">
.overview {
  width: 100vw;
  height: 100vh;
  background-image: url("/common/commonBg.png");
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
    height: calc(100vh - 100px);
    box-sizing: border-box;
    @include flex(center, flex-start, null);
    .overview-container {
      width: 1200px;
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
          width: calc(100% - 375px);
          @include flex(center, space-between, wrap);
          .data-top {
            width: 100%;
            height: 67px;
            font-size: 24px;
            color: #000000;
            line-height: 33px;
            margin-bottom: 50px;
            @include flex(flex-start, center, null);
            .data-top-avatar {
            }
          }
          .data-bottom {
            width: 100%;
            height: 105px;
            @include flex(space-between, center, null);
            .data-container {
              width: 33%;
              height: 100%;
              cursor: pointer;
              @include flex(flex-start, center, wrap);
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
                @include flex(flex-start, center, null);
                img {
                  width: 35px;
                  height: 35px;
                  margin-right: 5.5px;
                }
              }
            }
          }
        }
      }
      .overview-center {
        width: 100%;
        height: 33px;
        font-size: 24px;
        font-family: PingFang SC, PingFang SC-Regular;
        color: #000000;
        line-height: 33px;
        margin: 25px 0px 17px 0px;
      }
      .overview-bottom {
        width: 100%;
        height: calc(100% - 450px);
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
            font-size: 14px;
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
</style>
<style></style>
