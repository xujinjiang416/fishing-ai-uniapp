/* ui.js — 共享 UI 运行时（Toast / 模态 / 底部弹层 / 广告 / 付费墙 / 位置选择 / 复制）
 * 所有页面复用本文件，禁止各页自写弹窗与全局样式。
 * 形态说明：原型用 DOM 字符串渲染，这里改为「响应式浮层状态 + AppOverlays 宿主组件」，
 * 对外暴露语义化 Promise API，页面代码更贴近业务。
 * 运行环境：小程序 / App / H5（依赖 uni.* 的剪贴板 API，其余为纯状态操作）。
 * 依赖：overlay(浮层状态) / Store(登录态、会员态、位置) / Api(配置、广告素材) / nav(路由守卫)。
 */
import { overlay } from './overlay.js'
import Store from './state.js'
import Api from './api.js'
import { nav, back, toLogin } from './nav.js'

export { nav, back, toLogin }

/** 当前 toast 自动关闭定时器（重复调用时先清除，避免提前隐藏新提示） */
let toastTimer = null

/* ---------------- 轻提示 ---------------- */
/**
 * 轻提示（1.8s 自动消失，同屏只保留最新一条）
 * @param {string} msg 提示文案
 * @param {string} [iconName] 左侧图标名（见 icons.js），缺省不显示图标
 * @returns {void}
 */
export function toast(msg, iconName) {
  overlay.toast.msg = msg
  overlay.toast.icon = iconName || ''
  overlay.toast.show = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { overlay.toast.show = false }, 1800)
}

/* ---------------- 通用模态 ----------------
 * cfg: { icon, iconTone:'primary'|'gold'|'accent', title, sub, text,
 *        rows:[{k,v,cls}], benefits:[{ic,t,d}], notes:[{type,icon,text}],
 *        buttons:[{text,cls,value}], dismissable:true }
 * 返回：被点击按钮的 value，遮罩关闭返回 null
 * @param {Object} cfg 模态配置（见上），内部会补默认 dismissable:true 与空 buttons
 * @returns {Promise<*>} 用户点击按钮的 value；遮罩/关闭时为 null
 */
export function openModal(cfg) {
  return new Promise(resolve => {
    overlay.modal = Object.assign({ dismissable: true, buttons: [] }, cfg || {}, { _resolve: resolve })
  })
}

/**
 * 关闭当前模态并结算 openModal 的 Promise
 * @param {*} [value] 需要回传给调用方的结果；undefined 视为 null
 * @returns {void}
 */
export function closeModal(value) {
  const m = overlay.modal
  if (!m) return
  overlay.modal = null
  if (m._resolve) m._resolve(value === undefined ? null : value)
}

/* ---------------- 通用确认 ---------------- */
/**
 * 二次确认弹窗（确定 / 再想想）
 * @param {{title?: string, text?: string, okText?: string, cancelText?: string}} [o] 文案配置
 * @returns {Promise<boolean>} 点击确定为 true，取消为 false
 */
export function confirm(o) {
  o = o || {}
  return openModal({
    title: o.title || '确认操作',
    sub: o.text || '',
    buttons: [
      { text: o.okText || '确定', cls: 'primary', value: true },
      { text: o.cancelText || '再想想', cls: 'line', value: false }
    ],
    dismissable: false
  }).then(v => v === true)
}

/* ---------------- 广告播放器（模拟，无真实广告 SDK）----------------
 * 返回：true = 完整看完；false = 中途取消
 * @param {{seconds?: number, count?: number}} [o] seconds 单条时长(默认30s)，count 连播条数(默认1)
 * @returns {Promise<boolean>} 是否完整看完
 */
export function adSequence(o) {
  o = o || {}
  const seconds = o.seconds || 30
  const count = o.count || 1
  return new Promise(resolve => {
    overlay.ad = {
      count,
      seconds,
      index: 0,
      total: seconds * 1000,
      left: seconds * 1000,
      creative: { brand: '', slogan: '', cta: '' },
      creatives: [],
      _resolve: resolve
    }
    // 异步拉取真实广告素材（营销活动）；失败则维持空素材，不影响播放
    Api.fetchAdCreatives().then(res => {
      if (res.code !== 0 || !res.data || !res.data.length) return
      const list = res.data
      if (!overlay.ad) return
      overlay.ad.creatives = list
      overlay.ad.creative = list[0] || overlay.ad.creative
    })
  })
}

/**
 * 由 AppOverlays 的 AdPlayer 在倒计时结束时调用：关闭播放器并判定为“完整观看”
 * @returns {void}
 */
export function adDone() {
  const a = overlay.ad
  if (!a) return
  overlay.ad = null
  a._resolve(true)
}

/**
 * 由 AppOverlays 的 AdPlayer 在用户关闭时调用：关闭播放器、提示未获得权益
 * @returns {void}
 */
export function adCancel() {
  const a = overlay.ad
  if (!a) return
  overlay.ad = null
  toast('已取消观看，未获得权益', 'alert-triangle')
  a._resolve(false)
}

/**
 * 只播放一条广告的语法糖
 * @param {{seconds?: number}} [o] seconds 时长(默认30s)
 * @returns {Promise<boolean>} 是否完整看完
 */
export function singleAd(o) {
  return adSequence({ count: 1, seconds: (o && o.seconds) || 30 })
}

/* ---------------- 会员套餐选择弹窗（替代原「看广告 / 付费」解锁弹窗） ----------------
 * 需求：点击需解锁的内容时，弹出「会员套餐选择列表」，展示后台配置的全部套餐；
 * 用户点击任意套餐 -> 跳转开通会员页并携带该套餐 id（planId）。
 * 返回：选中的套餐 id（字符串，可能是 '' 表示直接去开通页），取消返回 null。
 * @param {{title?: string, sub?: string, featureLabel?: string}} [o] 弹窗文案覆盖项
 * @returns {Promise<string|null>} 选中套餐 id（可能为空串）；取消为 null
 */
export async function planSelector(o) {
  o = o || {}
  // 先确保拿到最新套餐配置（含缓存 TTL 控制），后端不通时用内置默认兜底
  let cfg = await Api.ensureConfig()
  let plans = (cfg && cfg.plans) || []
  // 兜底：若套餐为空，强制刷新一次配置（可能是旧结构缓存或首启未同步），仍为空再展示空态
  if (!plans.length) {
    cfg = await Api.ensureConfig(true)
    plans = (cfg && cfg.plans) || []
  }
  return new Promise(resolve => {
    overlay.paywall = Object.assign({
      title: '开通会员',
      sub: '开通会员后可无限次使用，且全程无广告',
      featureLabel: '当前功能'
    }, o, { plans, _resolve: resolve })
  })
}

/**
 * 由 AppOverlays 的套餐弹窗在用户做出选择后调用（planId 或 null）
 * @param {string|null} planId 选中套餐 id；null 表示用户关闭弹窗
 * @returns {void}
 */
export function choosePaywall(planId) {
  const p = overlay.paywall
  if (!p) return
  overlay.paywall = null
  p._resolve(planId)
}

/** 统一入口：会员直接放行；非会员弹出会员套餐列表并跳转开通页。
 * 返回：true 表示当前可查看（会员）；false 表示需要先开通会员。
 * @param {{title?: string, sub?: string, featureLabel?: string}} [o] 透传给套餐弹窗的文案配置
 * @returns {Promise<boolean>} true = 会员可查看；false = 已跳转开通流程 / 用户取消
 */
export async function requireUnlock(o) {
  o = o || {}
  // 会员直接放行（内容访问权即「是否会员」）
  if (Store.isMember) return true
  const planId = await planSelector(o)
  if (planId === null) return false
  // 跳转开通会员页，携带所选套餐 id；无套餐（配置为空）时直接进开通页
  const url = '/pages/membership/membership' + (planId ? ('?planId=' + encodeURIComponent(planId)) : '')
  nav(url)
  return false
}

/* ---------------- 位置选择（手机定位 / 省市区三级）----------------
 * 返回：选中的 location 对象；关闭返回 null
 * @returns {Promise<{province: string, city: string, district: string}|null>}
 *   选中位置（与 Store.location 同结构）；关闭为 null
 */
export function locationSheet() {
  return new Promise(resolve => {
    const cur = Store.location
    overlay.location = {
      p: cur.province,
      c: cur.city,
      d: cur.district,
      _resolve: resolve
    }
  })
}

/**
 * 由 AppOverlays 的 LocationSheet 调用：关闭弹层并回传选择结果
 * @param {Object} [value] 选中的位置对象；undefined 视为 null（取消）
 * @returns {void}
 */
export function closeLocationSheet(value) {
  const l = overlay.location
  if (!l) return
  overlay.location = null
  l._resolve(value === undefined ? null : value)
}

/* ---------------- 复制 ---------------- */
/**
 * 复制文本到剪贴板并给出结果提示
 * @param {string} text 待复制内容（会 String() 转换）
 * @param {string} [tip] 成功提示文案，缺省为「已复制，可直接粘贴到导航软件」
 * @returns {void}
 */
export function copy(text, tip) {
  uni.setClipboardData({
    data: String(text),
    success() { toast(tip || '已复制，可直接粘贴到导航软件', 'copy') },
    fail() { toast('复制失败，请手动选择文本', 'alert-triangle') }
  })
}

export default {
  toast, openModal, closeModal, confirm,
  adSequence, adDone, adCancel, singleAd,
  planSelector, choosePaywall, requireUnlock,
  locationSheet, closeLocationSheet,
  copy, nav, back, toLogin
}
