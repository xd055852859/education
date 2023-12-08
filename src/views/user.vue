<script setup lang="ts">
import "vue-cropper/dist/index.css";
import { VueCropper } from "vue-cropper";
import appStore from "@/store";
import { storeToRefs } from "pinia";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { Close, Plus, Delete, Edit } from "@element-plus/icons-vue";
import _ from "lodash";
import { base64ToFile, fileToBase64, uploadFile } from "@/services/util";
import Share from "@/components/share.vue";
import Avatar from "@/components/avatar.vue";
import api from "@/services/api";
import { ResultProps } from "@/interface/Common";
import router from "@/router";
import IframeView from "@/components/iframeView.vue";
const { user } = storeToRefs(appStore.authStore);
const { agentList, agentKey, agentInfo } = storeToRefs(appStore.agentStore);
const { deviceWidth, deviceHeight, deviceType } = storeToRefs(
  appStore.commonStore
);
const { setToken } = appStore.authStore;
const { setAgentList, getAgentList, setAgentKey, setAgentInfo } =
  appStore.agentStore;
interface RuleForm {
  userAvatar: string;
  userName: string;
  showTranslation: boolean;
}

const { setUserInfo } = appStore.authStore;
const userVisible = ref<boolean>(false);
const agentVisible = ref<boolean>(false);
const suggestionVisible = ref<boolean>(false);
const shareVisible = ref<boolean>(false);
const urlVisible = ref<boolean>(false);
const cropperVisible = ref<boolean>(false);
const shareUrl = ref<string>("");
const score = ref<number>(0);
const content = ref<string>("");
const userType = ref<string>("user");
const config = ref<any>({});
const targetAgentKey = ref<string>("");
const colors = ref<any>({ 4: "#99A9BF", 8: "#b3e19d", 10: "#FF9900" });
const urlBase64 = ref<any>(null);
const cropperRef = ref<any>(null);
const ruleFormRef = ref<FormInstance>();
const ruleForm = reactive<RuleForm>({
  userAvatar: "",
  userName: "",
  showTranslation: false,
});
const rules = reactive<FormRules<RuleForm>>({
  userName: [
    {
      required: true,
      message: userType.value === "user" ? "请输入用户名称" : "请输入角色名称",
      trigger: "blur",
    },
    // { min: 1, max: 12, message: "请输入不超过", trigger: "blur" },
  ],
});
const uploadImage = async (file, type) => {
  if (file) {
    urlBase64.value = await fileToBase64(file);
    cropperVisible.value = true;
    console.log(urlBase64.value);
  }
};
const saveImg = () => {
  let mimeType = ["image/*"];
  cropperRef.value.getCropData((data) => {
    // do something
    console.log(data);
    let file = base64ToFile(data);
    uploadFile(file, mimeType, async (url) => {
      ruleForm.userAvatar = url;
      cropperVisible.value = false;
    });
  });
};
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      if (userType.value === "user") {
        let userRes = (await api.request.patch("user", {
          userName: ruleForm.userName,
          userAvatar: ruleForm.userAvatar,
        })) as ResultProps;
        if (userRes.msg === "OK") {
          //@ts-ignore
          let newUser: User = {
            ...user,
            userName: ruleForm.userName,
            userAvatar: ruleForm.userAvatar,
          };
          ElMessage.success("编辑用户成功");
          userVisible.value = false;
          setUserInfo(newUser);
          clearUser();
        }
      } else if (userType.value === "agent") {
        if (targetAgentKey.value) {
          config.value = {
            ...config.value,
            showTranslation: ruleForm.showTranslation,
          };
          let userRes = (await api.request.patch("agent", {
            agentKey: targetAgentKey.value,
            name: ruleForm.userName,
            icon: ruleForm.userAvatar,
            config: config.value,
          })) as ResultProps;
          if (userRes.msg === "OK") {
            //@ts-ignore
            ElMessage.success("编辑角色成功");
            userVisible.value = false;
            let index = _.findIndex(agentList.value, {
              _key: targetAgentKey.value,
            });
            if (index !== -1) {
              let list: any = _.cloneDeep(agentList.value);
              list[index] = {
                ...list[index],
                name: ruleForm.userName,
                icon: ruleForm.userAvatar,
                config: config.value,
              };
              setAgentList(list);
              setAgentInfo({
                ...agentInfo.value,
                name: ruleForm.userName,
                icon: ruleForm.userAvatar,
                config: config.value,
              });
            }
            clearUser();
          }
        } else {
          let userRes = (await api.request.post("agent", {
            name: ruleForm.userName,
            icon: ruleForm.userAvatar,
            config: {},
          })) as ResultProps;
          if (userRes.msg === "OK") {
            ElMessage.success("新增角色成功");
            let list = _.cloneDeep(agentList.value);
            list.push(userRes.data);
            setAgentList(list);

            userVisible.value = false;
            clearUser();
          }
        }
      }
    } else {
      console.log("error submit!", fields);
    }
  });
};
const clearUser = () => {
  ruleForm.userAvatar = "";
  ruleForm.userName = "";
  targetAgentKey.value = "";
};
const setUser = () => {
  userVisible.value = true;
  userType.value = "user";
  if (user.value) {
    if (user.value?.userAvatar) {
      ruleForm.userAvatar = user.value.userAvatar;
    }
    if (user.value?.userName) {
      ruleForm.userName = user.value.userName;
    }
  }
};
const setAgent = (agentItem) => {
  userVisible.value = true;
  userType.value = "agent";
  if (agentItem) {
    targetAgentKey.value = agentItem._key;
    config.value = agentItem.config;
    ruleForm.userAvatar = agentItem.icon;
    ruleForm.userName = agentItem.name;
    ruleForm.showTranslation = agentItem.config?.showTranslation
      ? agentItem.config?.showTranslation
      : false;
  } else {
    ruleForm.userAvatar = "";
    ruleForm.userName = "";
    ruleForm.showTranslation = false;
    config.value = {};
  }
};
const deleteAgent = async (key, index) => {
  ElMessageBox.confirm("确定要删除角色及角色下的数据吗?", "删除角色", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
  }).then(async () => {
    const deleteRes = (await api.request.delete("agent", {
      agentKey: key,
    })) as ResultProps;
    if (deleteRes.msg === "OK") {
      ElMessage.success("删除用户成功");
      let list = _.cloneDeep(agentList.value);
      list.splice(index, 1);
      setAgentList(list);
    }
  });
};
const saveSuggestion = async () => {
  const deleteRes = (await api.request.post("suggestion", {
    score: score.value,
    content: content.value,
  })) as ResultProps;
  if (deleteRes.msg === "OK") {
    ElMessage.success("保存评价成功");
    suggestionVisible.value = false;
    score.value = 0;
    content.value = "";
  }
};
const toUrl = () => {
  window.open(
    "https://notecute.com/#/post?key=1499044542&view=table&hideHead=1&publicShare=1&isWebview=1",
    "new",
    `width=650, height=500, resizable=false, toolbar=no, menubar=no, location=no, status=no, top=${
      (deviceHeight.value - 500) / 2
    }, left=${(deviceWidth.value - 650) / 2}`
  );
};
const logout = () => {
  router.push("/");
  localStorage.clear();
  sessionStorage.clear();
  ElMessage.success("退出登录成功");
  setToken("");
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
const shareHtml = () => {
  shareVisible.value = true;
  shareUrl.value = `https://cjyy.qingtime.cn`;
};
// watch(
//   user,
//   (newUser) => {
//     if (newUser) {
//       if (newUser?.userAvatar) {
//         ruleForm.userAvatar = newUser.userAvatar;
//       }
//       if (newUser?.userName) {
//         ruleForm.userName = newUser.userName;
//       }
//       if (newUser && !newUser.userAvatar && !newUser.userName) {
//         userVisible.value = true;
//       }
//     }
//   },
//   { immediate: true }
// );
</script>
<template>
  <div class="user">
    <div class="user-name">
      <div class="user-name-avatar" @click="setUser">
        <Avatar
          :src="user?.userAvatar"
          :alt="user?.userName"
          :style="{ width: '0.41rem', height: '0.41rem' }"
        />
      </div>
      <div class="user-name-title single-to-long">{{ user?.userName }}</div>
    </div>
    <div class="user-nav">
      <div @click="setUser" class="user-nav-item">
        <img src="/user/logo1.svg" alt="" />个人信息
      </div>
      <div @click="agentVisible = true" class="user-nav-item">
        <img src="/user/logo2.svg" alt="" />角色管理
      </div>
      <div class="user-nav-item" @click="openTuLink">
        <img src="/user/logo3.svg" alt="" />使用反馈
      </div>
      <div class="user-nav-item" @click="suggestionVisible = true">
        <img src="/user/logo4.svg" alt="" />使用评价
      </div>
      <div class="user-nav-item" @click="urlVisible = true">
        <img src="/user/logo5.svg" alt="" />用户协议
      </div>
      <div class="user-nav-item" @click="shareHtml()">
        <img src="/user/logo8.svg" alt="" />分享
      </div>
      <div class="user-nav-item" @click="logout">
        <img src="/user/logo6.svg" alt="" />退出登录
      </div>
    </div>

    <el-dialog
      v-model="cropperVisible"
      title="裁剪图片"
      :width="deviceType === 'phone' ? '300px' : '600px'"
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <div
        :style="{
          width: '100%',
          height: deviceType === 'phone' ? '200px' : '450px',
        }"
      >
        <VueCropper
          ref="cropperRef"
          :img="urlBase64"
          autoCrop="true"
          centerBox="true"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cropperVisible = false">取消</el-button>
          <el-button type="primary" @click="saveImg()">确认</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
      v-model="userVisible"
      :title="userType === 'user' ? '用户设置' : '角色设置'"
      :width="deviceType === 'phone' ? '300px' : '450px'"
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <div
        class="user-set dp-center-center"
        :style="{ height: deviceType === 'phone' ? '200px' : '300px' }"
      >
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          :rules="rules"
          label-width="80px"
          status-icon
          label-position="left"
          require-asterisk-position="right"
          style="width: calc(100% - 40px)"
        >
          <el-form-item
            label="头像"
            prop="logo"
            style="margin-top: 45px; margin-bottom: 45px"
          >
            <div class="upload-button upload-img-button logo-box">
              <img
                :src="ruleForm.userAvatar"
                alt=""
                :style="{ width: '100%', height: '100%' }"
                class="upload-cover"
                v-if="ruleForm.userAvatar"
              />
              <el-icon :size="50" color="#ebebeb" v-else>
                <Plus />
              </el-icon>
              <input
                type="file"
                accept="image/*"
                @change="
                  //@ts-ignore
                  uploadImage($event.target.files[0], 'userAvatar')
                "
                class="upload-img"
              />
            </div>
          </el-form-item>
          <el-form-item
            label="名称"
            prop="userName"
            required
            style="margin-bottom: 45px"
          >
            <el-input
              v-model="ruleForm.userName"
              placeholder="请输入用户名称"
            />
          </el-form-item>
          <el-form-item
            label="译文字幕"
            prop="showTranslation"
            style="margin-bottom: 45px"
            v-if="userType === 'agent'"
          >
            <el-switch v-model="ruleForm.showTranslation" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm(ruleFormRef)"
            >确认</el-button
          >
        </span>
      </template>
    </el-dialog>
    <el-dialog
      v-model="agentVisible"
      :width="deviceType === 'phone' ? '300px' : '450px'"
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="agent-header dp-space-center">
          <div :id="titleId" :class="titleClass">角色管理</div>
          <div class="dp--center" style="justify-content: flex-end">
            <el-button
              type="primary"
              @click="setAgent"
              style="margin-left: 10px"
              >新增角色</el-button
            >
          </div>
        </div>
      </template>
      <div
        class="agent-container"
        :style="{ height: deviceType === 'phone' ? '250px' : '500px' }"
      >
        <div
          class="agent-item select-third-item icon-point"
          v-for="(item, index) in agentList"
          :key="`agent${item._key}`"
          @click="setAgentKey(item._key)"
          :style="item._key === agentKey ? { background: '#ebebeb' } : ''"
        >
          <div class="select-item-logo">
            <Avatar
              :src="item.icon"
              :alt="item.name"
              :style="{ width: '0.28rem', height: '0.28rem' }"
            />
          </div>
          <div class="select-item-name single-to-long">{{ item.name }}</div>
          <div class="select-icon-hover">
            <div
              class="select-item-icon icon-point"
              @click="
                $event.stopPropagation();
                setAgent(item);
              "
            >
              <el-icon size="16">
                <Edit />
              </el-icon>
            </div>
            <div
              class="select-item-icon icon-point"
              @click="
                $event.stopPropagation();
                deleteAgent(item._key, index);
              "
              v-if="index > 0"
            >
              <el-icon size="16">
                <Delete />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="suggestionVisible"
      :width="deviceType === 'phone' ? '300px' : '450px'"
      title="使用评价"
      :destroy-on-close="true"
      @close="
        score = 0;
        content = '';
      "
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <div class="suggestion-box">
        <el-rate v-model="score" :colors="colors" :max="10" size="large" />
        <div class="suggestion-title">建议</div>
        <el-input
          v-model="content"
          rows="5"
          type="textarea"
          placeholder="请输入建议"
          size="large"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="saveSuggestion"> 提交 </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="urlVisible"
      title="用户协议"
      :width="deviceType === 'phone' ? '450px' : '650px'"
      class="url-box"
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <div
        style="width: 100%"
        :style="{ height: deviceType === 'phone' ? '250px' : '500px' }"
      >
        <IframeView
          url="https://notecute.com/#/post?key=1499044542&view=digest&hideHead=1&publicShare=1&isWebview=1"
        />
      </div>
    </el-dialog>
    <el-dialog
      v-model="shareVisible"
      title="分享"
      :width="deviceType === 'phone' ? '300px' : '450px'"
      :top="deviceType === 'phone' ? '5%' : '15vh'"
    >
      <div
        style="width: 100%"
        :style="{ height: deviceType === 'phone' ? '250px' : '500px' }"
      >
        <Share :url="shareUrl" />
      </div>
    </el-dialog>
  </div>
</template>
<style scoped lang="scss">
.user {
  width: 100%;
  height: 100%;
  @include p-number(37px, 0px);

  .user-name {
    cursor: pointer;
    @include flex(center, center, wrap);

    .user-name-avatar {
      width: 80px;
      height: 80px;
    }

    .user-name-title {
      width: calc(100% - 40px);
      height: 40px;
      font-size: 22px;
      text-align: center;
      margin: 20px 0px;
    }
  }

  .user-nav {
    width: 100%;
    height: 100%;

    .user-nav-item {
      width: 100%;
      height: 70px;
      font-size: 18px;
      cursor: pointer;
      @include p-number(0px, 27px);
      @include flex(flex-start, center, null);

      > img {
        width: 25px;
        height: 25px;
        margin-right: 15px;
      }
    }
  }
}

.user-set {
  .logo-box {
    width: 200px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;

    .logo-item {
      font-size: 50px;
      color: #ebebeb;
    }
  }
}

.agent-header {
  .dialog-close-button {
    position: absolute;
    right: 20px;
    top: 35px;
  }
}

.agent-container {
  width: 100%;
  height: 350px;

  @include p-number(10px, 10px);
  @include scroll();

  .agent-item {
    width: 100%;
    @include p-number(0px, 20px);

    &:hover {
      background: #ebebeb;
    }
  }
}

.suggestion-box {
  width: 100%;
  @include p-number(10px, 25px);

  .suggestion-title {
    margin: 10px 0px 25px 0px;
  }
}
</style>
<style lang="scss">
.url-box {
  .el-dialog__header {
    height: 50px;
    padding-top: 0px;
    padding-bottom: 0px;
    margin-right: 0px;
    background-color: #f7f7f7;
    @include flex(space-between, center, null);

    .el-dialog__title {
      font-size: 16px;
    }
  }

  .el-dialog__headerbtn {
    height: 50px;
    top: 0px;
  }
}
</style>
