<template>
  <view class="app login">
    <view class="login__glow"></view>

    <view class="login__nav">
      <AppBar back />
    </view>

    <view class="login__body">
      <text class="login__welcome">欢迎使用</text>
      <text class="login__brand">渔获 AI</text>
      <text class="login__slogan">AI 钓鱼助手 · 看天出钓，渔获翻倍</text>

      <view class="login__hero">
        <image class="login__hero-img" src="/static/img/lake-hero.jpg" mode="aspectFill" />
        <view class="login__hero-tag">
          <AppIcon name="waves" :size="12" color="#FFFFFF" />
          <text>实时鱼情 · AI 研判</text>
        </view>
      </view>
    </view>

    <view class="login__foot">
      <view class="login__card">
        <!-- 登录 / 注册 切换 -->
        <view class="lg-tabs">
          <text
            class="lg-tab"
            :class="{ 'is-on': mode === 'login' }"
            @click="switchMode('login')"
          >登录</text>
          <text
            class="lg-tab"
            :class="{ 'is-on': mode === 'register' }"
            @click="switchMode('register')"
          >注册</text>
        </view>

        <view class="field">
          <input
            class="field__input"
            type="number"
            maxlength="11"
            v-model="phone"
            placeholder="请输入手机号"
            placeholder-class="field__ph"
          />
        </view>

        <view class="field mt10">
          <input
            class="field__input"
            password
            maxlength="16"
            v-model="password"
            placeholder="请输入密码（6-16 位）"
            placeholder-class="field__ph"
          />
        </view>

        <view v-if="mode === 'register'" class="field mt10">
          <input
            class="field__input"
            password
            maxlength="16"
            v-model="confirm"
            placeholder="请再次输入密码"
            placeholder-class="field__ph"
          />
        </view>

        <view class="lg-btn" :class="{ 'lg-btn--dim': submitting }" @click="submit">
          <text>{{ submitting ? '处理中…' : (mode === 'register' ? '注册并登录' : '登录') }}</text>
        </view>

        <view class="agree">
          <view class="agree__box" :class="{ 'is-on': agreed }" @click="agreed = !agreed">
            <AppIcon v-if="agreed" name="check" :size="11" color="#FFFFFF" />
          </view>
          <text class="agree__t" @click="agreed = !agreed">我已阅读并同意</text>
          <text class="agree__link" @click="openDoc('user')">《用户协议》</text>
          <text class="agree__t" @click="agreed = !agreed">与</text>
          <text class="agree__link" @click="openDoc('privacy')">《隐私协议》</text>
        </view>
      </view>

      <text class="login__tip">演示账号：13800138000 · 密码 123456</text>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Store from '../../common/state.js'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'
import { back } from '../../common/nav.js'

const PHONE_RE = /^1[3-9]\d{9}$/
const PWD_MIN = 6
const PWD_MAX = 16

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      mode: 'login', // 'login' | 'register'
      phone: '',
      password: '',
      confirm: '',
      agreed: true,
      submitting: false
    }
  },
  methods: {
    switchMode(m) {
      if (this.mode === m) return
      this.mode = m
      this.password = ''
      this.confirm = ''
    },
    submit() {
      const phone = String(this.phone || '').replace(/\s/g, '')
      if (!PHONE_RE.test(phone)) {
        ui.toast('请输入正确的 11 位手机号', 'alert-triangle')
        return
      }
      const pwd = String(this.password || '')
      if (pwd.length < PWD_MIN || pwd.length > PWD_MAX) {
        ui.toast('密码需为 6-16 位', 'alert-triangle')
        return
      }
      const confirm = String(this.confirm || '')
      if (this.mode === 'register' && pwd !== confirm) {
        ui.toast('两次输入的密码不一致', 'alert-triangle')
        return
      }
      if (!this.agreed) {
        ui.toast('请先阅读并同意《用户协议》与《隐私协议》', 'alert-triangle')
        return
      }
      this.doSubmit(phone, pwd, confirm)
    },
    async doSubmit(phone, pwd, confirm) {
      if (this.submitting) return
      this.submitting = true
      const isReg = this.mode === 'register'
      const res = isReg ? await Api.register(phone, pwd, confirm) : await Api.login(phone, pwd)
      this.submitting = false
      if (res.code !== 0) {
        ui.toast(res.msg || (isReg ? '注册失败，请重试' : '登录失败，请重试'), 'alert-triangle')
        return
      }
      const d = res.data || {}
      Store.setSession(d.user)
      ui.toast(isReg ? '注册成功，已自动登录' : '登录成功', 'circle-check')
      back()
    },
    openDoc(kind) {
      const isUser = kind === 'user'
      ui.openModal({
        title: isUser ? '用户协议' : '隐私协议',
        text: isUser
          ? '本演示环境仅用于产品功能演示。注册需提供手机号作为账号，用于保存积分、签到、收藏与订单等数据。演示环境不会产生真实交易与扣款。'
          : '我们仅收集你注册时填写的手机号用于账号识别，密码经加密存储、不可逆，也不会将数据提供给第三方。演示数据可随时在「我的 → 清除本地缓存」中重置。',
        buttons: [{ text: '我知道了', cls: 'line', value: true }]
      })
    }
  }
}
</script>

<style>
/* 保留 .app 以继承设计 token（CSS 变量），此处只做浅色水蓝铺底 */
.app.login {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  overflow: hidden;
}
.login__glow {
  position: absolute;
  left: -25%;
  top: -18%;
  width: 150%;
  height: 52%;
  background: radial-gradient(circle, var(--c-primary-l) 0%, rgba(229, 244, 244, 0) 68%);
  pointer-events: none;
}

.login__nav { position: relative; }

.login__body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 28px 0;
}
.login__welcome { font-size: 12px; letter-spacing: 5px; color: var(--c-ink-4); }
.login__brand {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-top: 6px;
  color: var(--c-primary-d);
}
.login__slogan {
  margin-top: 10px;
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--c-ink-3);
}
.login__hero {
  position: relative;
  width: 100%;
  max-width: 350px;
  height: 186px;
  margin-top: 14px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 14px 30px rgba(11, 95, 114, .16);
}
.login__hero-img { width: 100%; height: 100%; }
.login__hero-tag {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 13px;
  background: rgba(9, 42, 48, .42);
  font-size: 11px;
  letter-spacing: .5px;
  color: #FFFFFF;
}

.login__foot { position: relative; padding: 0 20px 26px; }
.login__card {
  background: var(--c-surface);
  border-radius: 24px;
  padding: 20px 20px 16px;
  box-shadow: 0 12px 30px rgba(11, 95, 114, .10);
}

.lg-tabs { display: flex; flex-direction: row; margin-bottom: 16px; }
.lg-tab {
  position: relative;
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  color: var(--c-ink-4);
}
.lg-tab.is-on { color: var(--c-ink); }
.lg-tab.is-on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 26px;
  height: 3px;
  margin-left: -13px;
  border-radius: 2px;
  background: var(--c-primary);
}

.field {
  height: 50px;
  padding: 0 14px;
  border-radius: 14px;
  background: var(--c-surface-2);
  display: flex;
  flex-direction: row;
  align-items: center;
}
.field__input { flex: 1; height: 50px; font-size: 15px; color: var(--c-ink); }
.field__ph { color: var(--c-ink-4); font-size: 14px; }
.mt10 { margin-top: 10px; }

.lg-btn {
  height: 52px;
  margin-top: 18px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #FFFFFF;
  background: var(--grad-water);
  box-shadow: 0 10px 22px rgba(11, 95, 114, .28);
}
.lg-btn--dim { opacity: .55; box-shadow: none; }

.agree {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 14px;
}
.agree__box {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1.5px solid var(--c-line);
  background: var(--c-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 7px;
  flex: none;
}
.agree__box.is-on { background: var(--c-primary); border-color: var(--c-primary); }
.agree__t { font-size: 11.5px; color: var(--c-ink-3); }
.agree__link { font-size: 11.5px; color: var(--c-primary); }

.login__tip {
  display: block;
  text-align: center;
  margin-top: 16px;
  font-size: 10.5px;
  letter-spacing: .5px;
  color: var(--c-ink-4);
}
</style>
