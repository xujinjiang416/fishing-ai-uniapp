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
