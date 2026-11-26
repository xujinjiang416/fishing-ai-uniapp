<template>
  <!-- 区块：登录页根容器 / 竖向三段式：顶部导航、品牌展示、底部表单卡 -->
  <view class="app login">
    <!-- 装饰：左上角水蓝径向光晕，纯视觉，pointer-events 由样式层关闭 -->
    <view class="login__glow"></view>

    <!-- 区块：顶部导航 / 仅一个返回按钮，用于从其他页跳入后返回 -->
    <view class="login__nav">
      <AppBar back />
    </view>

    <!-- 区块：品牌展示区 / 欢迎语 + 品牌名 + slogan + 头图胶囊标签 -->
    <view class="login__body">
      <text class="login__welcome">欢迎使用</text>
      <text class="login__brand">渔获 AI</text>
      <text class="login__slogan">AI 钓鱼助手 · 看天出钓，渔获翻倍</text>

      <view class="login__hero">
        <image class="login__hero-img" src="/static/img/lake-hero.jpg" mode="aspectFill" />
        <!-- 头图角标：半透明深色底 + 白字，保证在浅色湖景上可读 -->
        <view class="login__hero-tag">
          <AppIcon name="waves" :size="12" color="#FFFFFF" />
          <text>实时鱼情 · AI 研判</text>
        </view>
      </view>
    </view>

    <!-- 区块：底部表单卡 / 登录与注册共用一套输入，注册时额外显示确认密码 -->
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

        <!-- 用户名输入：4-16 位，实时校验长度、空格、表情与字符集 -->
        <view class="field" :class="{ 'field--err': usernameTip }">
          <input
            class="field__input"
            type="text"
            maxlength="20"
            v-model="username"
            @input="onInput('username', $event)"
            placeholder="请输入用户名（4-16 位）"
            placeholder-class="field__ph"
          />
        </view>
        <text v-if="usernameTip" class="field__err">{{ usernameTip }}</text>

        <!-- 密码输入：6-16 位，密文显示，实时拦截纯空格与表情 -->
        <view class="field mt10" :class="{ 'field--err': passwordTip }">
          <input
            class="field__input"
            password
            maxlength="20"
            v-model="password"
            @input="onInput('password', $event)"
            placeholder="请输入密码（6-16 位）"
            placeholder-class="field__ph"
          />
        </view>
        <text v-if="passwordTip" class="field__err">{{ passwordTip }}</text>

        <!-- 确认密码：仅注册模式渲染，用于二次校验 -->
        <view v-if="mode === 'register'" class="field mt10" :class="{ 'field--err': confirmTip }">
          <input
            class="field__input"
            password
            maxlength="20"
            v-model="confirm"
            @input="onInput('confirm', $event)"
            placeholder="请再次输入密码"
            placeholder-class="field__ph"
          />
        </view>
        <text v-if="confirmTip" class="field__err">{{ confirmTip }}</text>

        <!-- 提交按钮：submitting 期间降透明度并按提交中态显示文案（防止重复点击） -->
        <view class="lg-btn" :class="{ 'lg-btn--dim': submitting }" @click="submit">
          <text>{{ submitting ? '处理中…' : (mode === 'register' ? '注册并登录' : '登录') }}</text>
        </view>

        <!-- 协议勾选：圆形勾选框，未勾选时提交会被拦截 -->
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
    </view>

    <!-- 区块：全局浮层宿主 / 承载协议弹窗与 toast -->
    <AppOverlays />
  </view>
</template>

<script>
/* 登录 / 注册页
 *
 * 职责：用户名 + 密码登录，或注册后自动登录。
 * props/emits：页面级组件，无 props、无 emits。
 * 数据来源：Api.login(username, pwd) / Api.register(username, pwd, confirm)，返回 { code, msg, data: { user } }。
 * 状态：
 *   - mode     'login' | 'register'，默认 'login'；
 *   - username / password / confirm  输入值（字符串）；
 *   - touched  各字段是否已输入过，用于实时错误提示；
 *   - agreed   Boolean 是否同意协议，默认 true；
 *   - submitting Boolean 提交中，防重复请求。
 * 校验规则：用户名 4-16 位，仅中英文 / 数字 / _ / -，禁止空格与表情；
 *           密码 6-16 位，禁止纯空格与表情；注册时两次密码需一致；必须勾选协议。
 * 成功处理：Store.setSession(user) 写登录态 → toast → 返回上一页。
 * 注意：使用自定义导航（AppBar），页面背景为浅色水蓝，表单卡负责承载所有交互。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Store from '../../common/state.js'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'
import { back } from '../../common/nav.js'

/* 用户名长度范围（含） */
const NAME_MIN = 4
const NAME_MAX = 16
/* 密码长度范围（含） */
const PWD_MIN = 6
const PWD_MAX = 16
/* 用户名允许字符：中文、英文、数字、下划线与短横线 */
const USERNAME_RE = /^[A-Za-z0-9_\-\u4e00-\u9fa5]+$/
/* 表情符号：补充平面 Emoji + 常见 BMP 符号 + 变体选择符 / 零宽连接符 */
const EMOJI_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2B00-\u2BFF]|\uFE0F|\u200D/

/**
 * 是否包含表情符号
 * @param {String} s 输入文本
 * @returns {Boolean}
 */
function hasEmoji(s) {
  return EMOJI_RE.test(String(s || ''))
}

/**
 * 移除表情符号
 * @param {String} s 输入文本
 * @returns {String} 去除表情后的文本
 */
function stripEmoji(s) {
  return String(s || '').replace(EMOJI_RE, '')
}

/**
 * 用户名规则校验（返回空串表示通过）
 * @param {String} v 用户名
 * @returns {String} 错误提示文案
 */
function usernameError(v) {
  if (!v) return '请输入用户名'
  if (/\s/.test(v)) return '用户名不能包含空格'
  if (hasEmoji(v)) return '用户名不能包含表情符号'
  if (v.length < NAME_MIN || v.length > NAME_MAX) return '用户名需为 4-16 位字符'
  if (!USERNAME_RE.test(v)) return '用户名仅支持中英文、数字、下划线和短横线'
  return ''
}

/**
 * 密码规则校验（返回空串表示通过）
 * @param {String} v 密码
 * @returns {String} 错误提示文案
 */
function passwordError(v) {
  if (!v) return '请输入密码'
  if (!v.trim()) return '密码不能为纯空格'
  if (v.length < PWD_MIN || v.length > PWD_MAX) return '密码需为 6-16 位'
  if (hasEmoji(v)) return '密码不能包含表情符号'
  return ''
}

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      // 当前表单模式：登录或注册，切换时清空密码类输入
      mode: 'login', // 'login' | 'register'
      // 用户名（4-16 位，登录 / 注册共用）
      username: '',
      // 登录 / 注册密码
      password: '',
      // 确认密码，仅注册模式使用
      confirm: '',
      // 各字段是否已输入过：未输入前不展示错误，输入后实时提示
      touched: { username: false, password: false, confirm: false },
      // 是否已勾选用户协议与隐私协议，默认已勾选
      agreed: true,
      // 请求进行中标记，用于按钮置灰与防重复提交
      submitting: false,
      // 上次 toast 时间戳，避免输入过程中重复弹窗
      lastTipAt: 0
    }
  },
  computed: {
    /** 用户名实时错误提示（仅在输入过后展示） */
    usernameTip() {
      return this.touched.username ? usernameError(String(this.username || '')) : ''
    },
    /** 密码实时错误提示（仅在输入过后展示） */
    passwordTip() {
      return this.touched.password ? passwordError(String(this.password || '')) : ''
    },
    /** 确认密码实时错误提示（仅注册模式） */
    confirmTip() {
      if (this.mode !== 'register' || !this.touched.confirm) return ''
      const c = String(this.confirm || '')
      if (!c) return '请再次输入密码'
      if (c !== String(this.password || '')) return '两次输入的密码不一致'
      return ''
    }
  },
  methods: {
    /**
     * 切换登录 / 注册模式；同模式点击直接忽略，切换时清空密码避免误带
     * @param {String} m 'login' | 'register'
     * @returns {void}
     */
    switchMode(m) {
      if (this.mode === m) return
      this.mode = m
      this.password = ''
      this.confirm = ''
      this.touched.password = false
      this.touched.confirm = false
    },
    /**
     * 输入过程中实时处理：拦截表情、超长截断，并弹出提示
     * @param {String} field 字段名 username / password / confirm
     * @param {Object} e 输入事件（e.detail.value 为当前文本）
     * @returns {void}
     */
    onInput(field, e) {
      const raw = String((e && e.detail && e.detail.value) || '')
      this.touched[field] = true
      if (hasEmoji(raw)) {
        this[field] = stripEmoji(raw)
        this.tip('不能输入表情符号')
        return
      }
      const max = field === 'username' ? NAME_MAX : PWD_MAX
      if (raw.length > max) {
        this[field] = raw.slice(0, max)
        this.tip(field === 'username' ? '用户名需为 4-16 位字符' : '密码需为 6-16 位')
        return
      }
      this[field] = raw
    },
    /**
     * 节流 toast：1.2 秒内只提示一次，避免连续输入时弹窗刷屏
     * @param {String} text 提示文案
     * @returns {void}
     */
    tip(text) {
      const now = Date.now()
      if (now - this.lastTipAt < 1200) return
      this.lastTipAt = now
      ui.toast(text, 'alert-triangle')
    },
    /**
     * 提交前的本地校验（顺序：用户名 → 密码 → 确认密码 → 协议）
     * 任一不通过即 toast 提示并中断，全部通过后进入异步提交
     * @returns {void}
     */
    submit() {
      const username = String(this.username || '')
      const pwd = String(this.password || '')
      this.touched.username = true
      this.touched.password = true

      const uErr = usernameError(username)
      if (uErr) {
        ui.toast(uErr, 'alert-triangle')
        return
      }
      const pErr = passwordError(pwd)
      if (pErr) {
        ui.toast(pErr, 'alert-triangle')
        return
      }
      const confirm = String(this.confirm || '')
      if (this.mode === 'register') {
        this.touched.confirm = true
        if (!confirm) {
          ui.toast('请再次输入密码', 'alert-triangle')
          return
        }
        if (pwd !== confirm) {
          ui.toast('两次输入的密码不一致', 'alert-triangle')
          return
        }
      }
      if (!this.agreed) {
        ui.toast('请先阅读并同意《用户协议》与《隐私协议》', 'alert-triangle')
        return
      }
      this.doSubmit(username, pwd, confirm)
    },
    /**
     * 调用登录 / 注册接口并落地会话
     * 分步：① 防重复提交；② 按 mode 选择接口；③ 失败 toast 并结束；
     *       ④ 成功写入登录态、提示、返回上一页。
     * @param {String} username 已校验的用户名
     * @param {String} pwd      已校验的密码
     * @param {String} confirm  确认密码（仅注册接口使用）
     * @returns {Promise<void>}
     */
    async doSubmit(username, pwd, confirm) {
      if (this.submitting) return
      this.submitting = true
      const isReg = this.mode === 'register'
      const res = isReg ? await Api.register(username, pwd, confirm) : await Api.login(username, pwd)
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
    /**
     * 查看用户协议 / 隐私协议：用全局模态展示演示版文本
     * @param {String} kind 'user' 用户协议 | 'privacy' 隐私协议
     * @returns {void}
     */
    openDoc(kind) {
      const isUser = kind === 'user'
      ui.openModal({
        title: isUser ? '用户协议' : '隐私协议',
        text: isUser
          ? '注册需提供用户名作为账号，用于保存积分、签到、收藏与订单等数据。'
          : '我们仅收集你注册时填写的用户名用于账号识别，密码经加密存储、不可逆，也不会将数据提供给第三方。缓存数据可随时在「我的 → 清除本地缓存」中重置。',
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
/* 页面背景光晕：绝对定位铺在内容之下，pointer-events:none 避免遮挡点击 */
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
/* 头图：max-width 350px 约束大屏高度，overflow:hidden 配合圆角裁切 */
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

/* 底部表单区：左右 20px、底部 26px 留白，避免贴住系统手势区 */
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
.field--err { border: 1px solid var(--c-danger); }
.field__err {
  display: block;
  margin: 6px 4px 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--c-danger);
}
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

/* 协议行：flex-wrap 允许窄屏折行，整体居中 */
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
</style>
