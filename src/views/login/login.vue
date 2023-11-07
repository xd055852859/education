<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import router from "@/router";
import api from "@/services/api";
import appStore from "@/store";
import { ElMessage } from "element-plus";
const { setToken, setLoginState } = appStore.authStore;

const mobile = ref<string>("");
const password = ref<string>("");
const mobileArea = ref<string>("+86");
const login = async () => {
  if (!mobile.value) {
    ElMessage.error("请输入账号");

    return;
  }
  let reg = /^1(3\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\d|9[0-35-9])\d{8}$/g;
  if (!reg.test(mobile.value)) {
    ElMessage.error("请输入正确的账号");
    return;
  }
  if (!password.value) {
    ElMessage.error("请输入密码");
    return;
  }
  if (!password.value.trim()) {
    ElMessage.error("密码不能为空或者仅有空格");
    return;
  }
  let loginRes = (await api.request.post("account/loginByPassword", {
    mobileArea: "+86",
    mobile: mobile.value,
    password: password.value,
    appHigh: 3,
  })) as ResultProps;
  if (loginRes.msg === "OK") {
    localStorage.clear();
    ElMessage.success("登录成功");
    setToken(loginRes.data.token);
    api.setToken(loginRes.data.token);
    router.replace("/home");
  }
};
</script>
<template>
  <div class="login-content">
    <el-input
      v-model="mobile"
      placeholder="请输入手机号"
      class="login-input"
      autocomplete="new-password"
      size="large"
    >
      <!-- <template #prepend>
        <el-select v-model="mobileArea" placeholder="请选择区号" :style="{width:'70px'}">
          <el-option label="86" value="+86" />
        </el-select> 
        </template> -->
    </el-input>
    <el-input
      v-model="password"
      type="password"
      placeholder="请输入密码"
      show-password
      class="login-input"
      autocomplete="new-password"
      size="large"
    />
    <div class="login-reset">
      <div @click="setLoginState('codeLogin')">验证码登录</div>
      <div @click="setLoginState('reset')">找回密码</div>
    </div>
    <div class="login-bottom-button">
      <el-button type="primary" class="login-button" @click="login()">
        登录
      </el-button>
      <div class="login-prompt" @click="setLoginState('register')">
        没有场景英语账户？<span>立即注册</span>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.login-content {
  .login-reset {
    width: 100%;
    height: 20px;
    text-align: right;
    line-height: 20px;
    margin: 6px 0px 20px 0px;
    font-size: 16px;

    @include flex(space-between, center, null);
    > div {
      color: var(--el-color-primary);
      cursor: pointer;
    }
  }
}
</style>
<style></style>
