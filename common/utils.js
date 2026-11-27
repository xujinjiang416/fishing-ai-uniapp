/* utils.js — 共享纯函数工具（无副作用、无平台 API）
 * 运行环境：小程序 / App / H5 通用（不调用 uni.* 与 DOM，可被任意端复用）。
 * 依赖：无。所有函数输入输出均为原始值/普通对象，便于单测与页面直接引用。
 */

/** 星期中文表：索引与 Date.getDay() 对齐（0 = 周日） */
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 数字补零到 2 位
 * @param {number} n 整数
 * @returns {string} 如 3 -> '03'
 */
function pad2(n) { return String(n).padStart(2, '0') }

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} [d] 目标日期，缺省为当前时间
 * @returns {string} 如 '2026-11-05'
 */
export function ymd(d) {
  const t = d || new Date()
  return t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate())
}

/**
 * 今日日期 + 星期
 * @returns {string} 如 '2026-11-05 周三'
 */
export function today() {
  const d = new Date()
  return ymd(d) + ' 周' + WEEK[d.getDay()]
}

/**
 * 日期字符串转「日期 + 星期」
 * @param {string} iso 形如 '2026-11-05'；非法输入原样返回
 * @returns {string} 如 '2026-11-05 周四'
 */
export function dateWeek(iso) {
  const t = new Date(String(iso || '').replace(/-/g, '/'))
  if (isNaN(t.getTime())) return String(iso || '')
  return ymd(t) + ' 周' + WEEK[t.getDay()]
}

/**
 * 金额展示：保留两位小数并去掉无意义的 '.00'
 * @param {number} n 金额（元）
 * @returns {string} 如 19.90 -> '19.9'，199.00 -> '199'
 */
export function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '')
}

/**
 * 评分/数值字段缺省兜底
 * @param {*} v 原始值（null/undefined/空串/非数字均视为无效）
 * @returns {string} 有效时保留一位小数，否则返回 '--'
 */
export function ratingText(v) {
  const n = Number(v)
  if (v === null || v === undefined || v === '' || isNaN(n)) return '--'
  return n.toFixed(1)
}

/* ---------------- 订单状态（小程序端统一展示口径） ----------------
 * 后端原始状态 -> 用户可读状态（待付款 / 待发货 / 待收货 / 已完成 / 已取消）。
 * 商品评价功能已移除：订单完成后直接进入「已完成」，不再有「待评价」节点。
 */
const ORDER_STATUS_MAP = {
  '待支付': {
    key: 'unpaid', text: '待付款', desc: '订单已创建，请尽快完成支付',
    icon: 'wallet', color: '#E8662B', cls: 'tag--accent'
  },
  '待发货': {
    key: 'unshipped', text: '待发货', desc: '商家正在备货，请耐心等待',
    icon: 'package', color: '#0A6A6C', cls: 'tag--primary'
  },
  '已发货': {
    key: 'shipped', text: '待收货', desc: '商品已发出，请留意物流信息并及时查收',
    icon: 'truck', color: '#1B7FD4', cls: 'tag--primary'
  },
  '已完成': {
    key: 'completed', text: '已完成', desc: '订单已完成，感谢您的购买',
    icon: 'circle-check', color: '#1D7A50', cls: 'tag--success'
  },
  '已关闭': {
    key: 'cancelled', text: '已取消', desc: '订单已取消，如有需要请重新下单',
    icon: 'x', color: '#6E807E', cls: 'tag--mute'
  },
  '退款中': {
    key: 'refunding', text: '退款中', desc: '退款申请处理中，请耐心等待',
    icon: 'refresh-cw', color: '#E8662B', cls: 'tag--accent'
  },
  '待退款审核': {
    key: 'refunding', text: '待退款审核', desc: '退款申请已提交，请等待管理员审核',
    icon: 'refresh-cw', color: '#E8662B', cls: 'tag--accent'
  },
  '部分退款': {
    key: 'partial', text: '部分退款', desc: '部分金额已退款到账',
    icon: 'coins', color: '#C08A2E', cls: 'tag--gold'
  },
  '已退款': {
    key: 'refunded', text: '已退款', desc: '退款已完成',
    icon: 'coins', color: '#6E807E', cls: 'tag--mute'
  }
}

/**
 * 订单状态元信息映射（后端中文状态 -> 展示态）
 * @param {string} status 后端原始状态，如 '待支付'
 * @returns {{key: string, text: string, desc: string, icon: string, color: string, cls: string}}
 *   展示用状态对象；未命中时返回 unknown 兜底
 */
export function orderStatusMeta(status) {
  return ORDER_STATUS_MAP[status] || {
    key: 'unknown', text: status || '--', desc: '',
    icon: 'info', color: '#6E807E', cls: 'tag--mute'
  }
}

/**
 * 订单状态流转节点（含当前节点状态：done / current / todo）
 * @param {string} status 后端原始订单状态
 * @returns {Array<{key: string, text: string, state: 'done'|'current'|'todo'}>}
 *   已关闭订单返回「待付款 + 已取消」两节点，其余返回四节点进度
 */
export function orderFlow(status) {
  if (status === '已关闭') {
    return [
      { key: 'unpaid', text: '待付款', state: 'done' },
      { key: 'cancelled', text: '已取消', state: 'current' }
    ]
  }
  const nodes = [
    { key: 'unpaid', text: '待付款' },
    { key: 'unshipped', text: '待发货' },
    { key: 'shipped', text: '待收货' },
    { key: 'completed', text: '已完成' }
  ]
  // 退款类状态按已支付 / 已发货 / 已完成节点近似定位
  const indexMap = {
    '待支付': 0, '待发货': 1, '已发货': 2, '已完成': 3,
    '退款中': 2, '待退款审核': 3, '部分退款': 3, '已退款': 3
  }
  const current = indexMap[status] != null ? indexMap[status] : 0
  return nodes.map((n, i) => Object.assign({}, n, {
    state: i < current ? 'done' : (i === current ? 'current' : 'todo')
  }))
}

/**
 * 星级填充百分比（用于叠加裁剪实现半星）
 * @param {number} n 星级（0~5，四舍五入取整）
 * @returns {string} 百分比字符串，如 '80%'
 */
export function starsPercent(n) {
  return (Math.round(n) / 5 * 100) + '%'
}

/**
 * 时段/结论等级 -> 进度条背景类
 * @param {string} level explode|hot|fair|slow|stop
 * @returns {string} 对应 CSS 类名，未知等级回退 'bg-slow'
 */
export function lvlBg(level) {
  return { explode: 'bg-explode', hot: 'bg-hot', fair: 'bg-fair', slow: 'bg-slow', stop: 'bg-stop' }[level] || 'bg-slow'
}
/**
 * 时段/结论等级 -> 文字色类
 * @param {string} level explode|hot|fair|slow|stop
 * @returns {string} 对应 CSS 类名，未知等级回退 'lvl-slow'
 */
export function lvlColor(level) {
  return { explode: 'lvl-explode', hot: 'lvl-hot', fair: 'lvl-fair', slow: 'lvl-slow', stop: 'lvl-stop' }[level] || 'lvl-slow'
}
/**
 * 时段/结论等级 -> tag 样式类
 * @param {string} level explode|hot|fair|slow|stop
 * @returns {string} 对应 tag 类名，未知等级回退 'tag--mute'
 */
export function lvlTag(level) {
  return { explode: 'tag--accent', hot: 'tag--success', fair: 'tag--warn', slow: 'tag--mute', stop: 'tag--mute' }[level] || 'tag--mute'
}

/**
 * 计算当前时刻落在第几个时段
 * @param {Array<{time: string}>} slots 时段数组，time 形如 '06:00-09:00'
 * @returns {number} 命中时段下标；未命中或空数组返回 -1
 */
export function nowSlotIndex(slots) {
  if (!slots || !slots.length) return -1
  const d = new Date()
  const mins = d.getHours() * 60 + d.getMinutes()
  for (let i = 0; i < slots.length; i++) {
    const parts = String(slots[i].time).split('-')
    const toMin = t => { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]) }
    let s = toMin(parts[0])
    let e = toMin(parts[1])
    if (e <= s) e += 24 * 60
    if (mins >= s && mins < e) return i
  }
  return -1
}

/**
 * 静态图片资源路径表（均为本地 /static 资源，避免依赖外链）
 * weatherPoster：天气分享海报底图；lakeHero：首页湖面主视觉
 * @type {{weatherPoster: string, lakeHero: string}}
 */
export const IMG = {
  weatherPoster: '/static/img/weather-poster.jpg',
  lakeHero: '/static/img/lake-hero.jpg'
}
