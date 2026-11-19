/* ui.js — 共享 UI 运行时（Toast / 模态 / 底部弹层 / 广告 / 付费墙 / 位置选择 / 复制）
 * 所有页面复用本文件，禁止各页自写弹窗与全局样式。
 * 形态说明：原型用 DOM 字符串渲染，这里改为「响应式浮层状态 + AppOverlays 宿主组件」，
 * 对外暴露语义化 Promise API，页面代码更贴近业务。
 */
import { overlay } from './overlay.js'
import Store from './state.js'
import Api from './api.js'
import { nav, back, toLogin } from './nav.js'

export { nav, back, toLogin }

let toastTimer = null

/* ---------------- 轻提示 ---------------- */
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
 */
export function openModal(cfg) {
  return new Promise(resolve => {
    overlay.modal = Object.assign({ dismissable: true, buttons: [] }, cfg || {}, { _resolve: resolve })
  })
}

export function closeModal(value) {
  const m = overlay.modal
  if (!m) return
  overlay.modal = null
  if (m._resolve) m._resolve(value === undefined ? null : value)
}

/* ---------------- 通用确认 ---------------- */
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

/** 由 AppOverlays 的 AdPlayer 在倒计时结束时调用 */
export function adDone() {
  const a = overlay.ad
  if (!a) return
  overlay.ad = null
  a._resolve(true)
}

/** 由 AppOverlays 的 AdPlayer 在用户关闭时调用 */
export function adCancel() {
  const a = overlay.ad
  if (!a) return
  overlay.ad = null
  toast('已取消观看，未获得权益', 'alert-triangle')
  a._resolve(false)
}

export function singleAd(o) {
  return adSequence({ count: 1, seconds: (o && o.seconds) || 30 })
}

/* ---------------- 会员套餐选择弹窗（替代原「看广告 / 付费」解锁弹窗） ----------------
 * 需求：点击需解锁的内容时，弹出「会员套餐选择列表」，展示后台配置的全部套餐；
 * 用户点击任意套餐 -> 跳转开通会员页并携带该套餐 id（planId）。
 * 返回：选中的套餐 id（字符串，可能是 '' 表示直接去开通页），取消返回 null。
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

/** 由 AppOverlays 的套餐弹窗在用户做出选择后调用（planId 或 null） */
export function choosePaywall(planId) {
  const p = overlay.paywall
  if (!p) return
  overlay.paywall = null
  p._resolve(planId)
}

/** 统一入口：会员直接放行；非会员弹出会员套餐列表并跳转开通页。
 * 返回：true 表示当前可查看（会员）；false 表示需要先开通会员。
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

/** 由 AppOverlays 的 LocationSheet 调用 */
export function closeLocationSheet(value) {
  const l = overlay.location
  if (!l) return
  overlay.location = null
  l._resolve(value === undefined ? null : value)
}

/* ---------------- 复制 ---------------- */
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
