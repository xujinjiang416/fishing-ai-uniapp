/* utils.js — 共享纯函数工具（无副作用、无平台 API） */

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function pad2(n) { return String(n).padStart(2, '0') }

/** 2026-11-05 */
export function ymd(d) {
  const t = d || new Date()
  return t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate())
}

/** 2026-11-05 周三 */
export function today() {
  const d = new Date()
  return ymd(d) + ' 周' + WEEK[d.getDay()]
}

/** '2026-11-05' -> '2026-11-05 周四'；非法输入原样返回（iOS 不认连字符，先转斜杠） */
export function dateWeek(iso) {
  const t = new Date(String(iso || '').replace(/-/g, '/'))
  if (isNaN(t.getTime())) return String(iso || '')
  return ymd(t) + ' 周' + WEEK[t.getDay()]
}

/** 金额：19.90 -> 19.9；199.00 -> 199 */
export function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '')
}

/** 评分/数值字段缺省兜底：null/undefined/空串/非数字 -> '--'，否则保留一位小数 */
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
  '部分退款': {
    key: 'partial', text: '部分退款', desc: '部分金额已退款到账',
    icon: 'coins', color: '#C08A2E', cls: 'tag--gold'
  },
  '已退款': {
    key: 'refunded', text: '已退款', desc: '退款已完成',
    icon: 'coins', color: '#6E807E', cls: 'tag--mute'
  }
}

export function orderStatusMeta(status) {
  return ORDER_STATUS_MAP[status] || {
    key: 'unknown', text: status || '--', desc: '',
    icon: 'info', color: '#6E807E', cls: 'tag--mute'
  }
}

/** 订单状态流转节点（含当前节点状态：done / current / todo） */
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
    '退款中': 2, '部分退款': 3, '已退款': 3
  }
  const current = indexMap[status] != null ? indexMap[status] : 0
  return nodes.map((n, i) => Object.assign({}, n, {
    state: i < current ? 'done' : (i === current ? 'current' : 'todo')
  }))
}

/** 星级填充百分比（用于叠加裁剪实现半星） */
export function starsPercent(n) {
  return (Math.round(n) / 5 * 100) + '%'
}

/** 时段/结论等级 -> 进度条背景类 */
export function lvlBg(level) {
  return { explode: 'bg-explode', hot: 'bg-hot', fair: 'bg-fair', slow: 'bg-slow', stop: 'bg-stop' }[level] || 'bg-slow'
}
/** 时段/结论等级 -> 文字色类 */
export function lvlColor(level) {
  return { explode: 'lvl-explode', hot: 'lvl-hot', fair: 'lvl-fair', slow: 'lvl-slow', stop: 'lvl-stop' }[level] || 'lvl-slow'
}
/** 时段/结论等级 -> tag 样式类 */
export function lvlTag(level) {
  return { explode: 'tag--accent', hot: 'tag--success', fair: 'tag--warn', slow: 'tag--mute', stop: 'tag--mute' }[level] || 'tag--mute'
}

/** 由近到远的距离分组标签 */
export function distGroup(km) {
  if (km <= 3) return '3 公里内 · 家门口'
  if (km <= 6) return '3-6 公里 · 骑行可达'
  if (km <= 10) return '6-10 公里 · 驾车一刻钟'
  return '10 公里以上 · 值得一跑'
}

/** 当前时刻落在第几个时段（找不到返回 -1） */
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

export const IMG = {
  weatherPoster: '/static/img/weather-poster.jpg',
  lakeHero: '/static/img/lake-hero.jpg'
}
