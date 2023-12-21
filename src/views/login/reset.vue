<script setup lang="ts">
import { ResultProps } from "@/interface/Common";
import router from "@/router";
import api from "@/services/api";
import appStore from "@/store";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
const { loginState } = storeToRefs(appStore.authStore);
const { setToken, setLoginState } = appStore.authStore;
const mobile = ref<string>("");
const password = ref<string>("");
const code = ref<string>("");
const codeState = ref<boolean>(false);
const codeTime = ref<number>(60);
const getCode = async () => {
  const codeRes = (await api.request.post("account/vertifyCode", {
    mobileArea: "+86",
    mobile: mobile.value,
    source:
      loginState.value === "register"
        ? 1
        : loginState.value === "reset"
        ? 3
        : 2,
  })) as ResultProps;
  if (codeRes.msg === "OK") {
    ElMessage.success("发送成功");
    codeState.value = true;
    let timer = setInterval(() => {
      if (codeTime.value === 0) {
        codeState.value = false;
        clearInterval(timer);
      }
      codeTime.value = codeTime.value - 1;
    }, 1000);
  }
};
const changeState = async () => {
  let reg = /^1(3\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\d|9[0-35-9])\d{8}$/g;
  if (!reg.test(mobile.value)) {
    ElMessage.error("请输入正确的账号");
    return;
  }
  if (loginState.value !== "codeLogin") {
    if (!password.value) {
      ElMessage.error("请输入密码");
      return;
    }
    if (!password.value.trim()) {
      ElMessage.error("密码不能为空或者仅有空格");
      return;
    }
  }
  if (loginState.value === "register") {
    const registerRes = (await api.request.post("account", {
      mobileArea: "+86",
      mobile: mobile.value,
      password: password.value,
      code: code.value,
    })) as ResultProps;
    if (registerRes.msg === "OK") {
      ElMessage.success("注册成功");
      setToken(registerRes.data.token);
      api.setToken(registerRes.data.token);
      router.replace("/home");
    }
  } else if (loginState.value === "reset") {
    const registerRes = (await api.request.patch("account/pwdSet", {
      mobileArea: "+86",
      mobile: mobile.value,
      password: password.value,
      code: code.value,
    })) as ResultProps;
    if (registerRes.msg === "OK") {
      ElMessage.success("重置密码成功");
      setLoginState("login");
    }
  } else if (loginState.value === "codeLogin") {
    const registerRes = (await api.request.get("account/getTempToken", {
      mobileArea: "+86",
      mobile: mobile.value,
      code: code.value,
    })) as ResultProps;
    if (registerRes.msg === "OK") {
      localStorage.clear();
      ElMessage.success("登录成功");
      setToken(registerRes.data.token);
      api.setToken(registerRes.data.token);
      router.replace("/home");
    }
  }
};
</script>
<template>
  <div class="reset-content">
    <el-input
      v-model="mobile"
      placeholder="请输入手机号"
      size="large"
      class="login-input"
    >
    </el-input>

    <el-input
      v-model="password"
      type="password"
      placeholder="请输入密码"
      show-password
      class="login-input"
      size="large"
      v-if="loginState !== 'codeLogin'"
    />
    <div class="reset-code">
      <el-input
        v-model="code"
        placeholder="请输入验证码"
        autocomplete="new-password"
        size="large"
        class="login-input"
        :style="{ width: 'calc(100% - 55px)', marginBottom: '0px' }"
      />

      <el-button
        type="primary"
        @click="getCode()"
        :disabled="codeState"
        :style="{ marginLeft: '5px' }"
        size="large"
      >
        {{ codeState ? `剩余${codeTime}秒` : "获取验证码" }}
      </el-button>
    </div>
    <div class="login-bottom-button">
      <el-button type="primary" class="login-button" @click="changeState()">
        {{
          loginState === "register"
            ? "注册账号"
            : loginState === "reset"
            ? "重置密码"
            : "验证码登录"
        }}
      </el-button>

      <div class="login-prompt dp-space-center">
        <div @click="setLoginState('login')">有账号? 去<span>登录</span></div>
        <div
          @click="setLoginState('register')"
          v-if="loginState !== 'register'"
        >
          <span>立即注册</span>
        </div>
      </div>
      <!-- <div class="login-prompt" v-else>
        没有场景英语账户？<span>立即注册</span>
      </div> -->
    </div>
  </div>
</template>
<style scoped lang="scss">
.reset-code {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background-color: transparent;
  margin-bottom: 35px;
  @include flex(space-between, center, null);

  .reset-button {
    width: 96px;
    height: 40px;
    font-size: 14px;
    color: $commonColor;
    background: $loginInput;
    border-radius: 0px;
    border: 0px;
    outline: none;
    overflow: hidden;
    flex-shrink: 0;
    margin-left: 10px;
    cursor: pointer;
    @include flex(center, center, null);
  }
}
</style>
<style></style>
