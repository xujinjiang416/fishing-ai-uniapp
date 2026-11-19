/* state.js — 全局轻量状态（uni storage 持久化 + Vue 响应式）
 * 只存"用户资产/身份"这类跨页一致的数据；页面内临时 UI 状态由各自页面管理。
 *
 * 本次改造（需求 1、3、5）：
 * - 移除全部内置演示数据（昵称/积分/订单/收藏/评论等），初始为中性空值，
 *   真实用户数据一律来自后端接口（登录 / 拉取资料 / 各项业务接口）；
 * - 业务配置缓存（签到积分 / 广告积分 / 会员套餐）来自后端 /config，禁止写死数值；
 * - 配置文件带过期时间缓存到本地，后台改配置后小程序在缓存过期周期内自动刷新，无需发版。
 */
import { reactive } from 'vue'

// 存储键版本升级（v3）：丢弃 v2 里遗留的旧演示缓存，避免老数据污染真实账号状态
const KEY = 'fishai.state.v3'
// 配置缓存键：v3 起套餐(plans)一律来自后端 /config；升级版本号可自动丢弃旧结构缓存
const CONFIG_KEY = 'fishai.config.v3'
// 配置缓存有效期：5 分钟。后台改配置后，最迟 5 分钟内小程序端即可同步到最新规则。
const CONFIG_TTL = 5 * 60 * 1000

function pad2(n) { return String(n).padStart(2, '0') }
function today() {
  const d = new Date()
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

/** 配置缺省值（后端未连通 / 配置缺失时的兜底，保证功能与弹窗不空白）。
 *  注意：这里只有业务规则的「缺省值」，不包含任何演示/模拟业务数据；
 *  会员套餐默认空数组，交由后端返回。 */
function defaultConfig() {
  return {
    pointsPerYuan: 150,
    checkin: { memberPoints: 5, normalPoints: 1 },
    ad: { points: 5, seconds: 30, limitNormal: 15, limitMember: 20 },
    plans: []
  }
}

function defaults() {
  return {
    uid: '',
    nickname: '',
    avatarText: '',
    phone: '',
    loggedIn: false,            // 登录状态（老数据缺省补 false = 未登录）
    isMember: false,
    memberExpire: '',
    points: 0,                  // 当前可用积分（真实值以后端为准）
    pointsTotal: 0,
    streak: 0,                  // 连续签到天数
    maxStreak: 0,
    lastCheckinDate: '',
    checkedToday: false,
    adsDate: today(),
    adsWatchedToday: 0,
    adPointsToday: 0,
    location: { province: '', city: '', district: '' },
    favorites: [],
    orders: [],
    myComments: []
  }
}

function readStorage(key) {
  try { return uni.getStorageSync(key) || '' } catch (e) { return '' }
}
function writeStorage(key, val) {
  try { uni.setStorageSync(key, val) } catch (e) { /* ignore */ }
}

const state = reactive({
  data: null,
  // 业务配置缓存（签到 / 广告 / 套餐），来自后端 /config
  config: null,
  configAt: 0
})

function load() {
  if (state.data) return
  let d = null
  try {
    const raw = readStorage(KEY)
    d = raw ? JSON.parse(raw) : defaults()
  } catch (e) { d = defaults() }
  const base = defaults()
  for (const k in base) { if (d[k] === undefined) d[k] = base[k] }
  state.data = d
  // 读取配置缓存
  try {
    const rawCfg = readStorage(CONFIG_KEY)
    if (rawCfg) {
      const parsed = JSON.parse(rawCfg)
      state.config = parsed.data || null
      state.configAt = parsed.at || 0
    }
  } catch (e) { /* ignore */ }
  rollDaily()
}

function save() {
  writeStorage(KEY, JSON.stringify(state.data))
}

/** 跨天刷新：广告计数、签到状态归零 */
function rollDaily() {
  if (state.data.adsDate !== today()) {
    state.data.adsDate = today()
    state.data.adsWatchedToday = 0
    state.data.adPointsToday = 0
    state.data.checkedToday = false
    save()
  }
}

const Store = {
  key: KEY,
  /** 返回整个状态对象（响应式引用，改完请调用 save()） */
  get data() { load(); return state.data },
  save,
  reset() {
    state.data = defaults()
    save()
  },

  /* ---- 业务配置（签到 / 广告 / 套餐） ---- */
  /** 配置快照（缺失时返回缺省值，保证字段一定存在，避免页面报错） */
  get config() {
    load()
    const cfg = state.config
    const def = defaultConfig()
    if (!cfg) return def
    return {
      pointsPerYuan: cfg.pointsPerYuan || def.pointsPerYuan,
      checkin: Object.assign({}, def.checkin, cfg.checkin || {}),
      ad: Object.assign({}, def.ad, cfg.ad || {}),
      // 套餐必须是数组：旧结构缓存（无 plans 字段）时回退空数组，避免弹窗空白；
      // 后端明确返回空数组（全部下架）时尊重空值。
      plans: Array.isArray(cfg.plans) ? cfg.plans : def.plans
    }
  },
  /** 配置缓存是否仍在有效期内 */
  get configFresh() {
    load()
    return !!state.config && (Date.now() - state.configAt) < CONFIG_TTL
  },
  /** 写入配置缓存（含写入时间，用于 TTL 判断） */
  setConfig(cfg) {
    if (!cfg) return
    const prev = state.config || {}
    const next = Object.assign({}, cfg)
    // 容错：旧结构 / 异常响应不含 plans 时，沿用已有套餐或空数组，避免解锁弹窗为空
    if (!Array.isArray(next.plans)) {
      next.plans = (Array.isArray(prev.plans) && prev.plans.length) ? prev.plans : []
    }
    state.config = next
    state.configAt = Date.now()
    writeStorage(CONFIG_KEY, JSON.stringify({ data: next, at: state.configAt }))
  },
  /** 会员套餐列表（来自配置，供解锁弹窗 / 开通页展示） */
  get plans() { return this.config.plans },
  /** 当前身份对应的广告每日额度 */
  get adsLimit() {
    const ad = this.config.ad
    return this.isMember ? (ad.limitMember || 20) : (ad.limitNormal || 15)
  },
  /** 单次广告可得积分 */
  get adPoints() { return this.config.ad.points || 5 },
  /** 单次广告时长（秒） */
  get adSeconds() { return this.config.ad.seconds || 30 },
  /** 当前身份对应的签到积分 */
  get checkinPoints() {
    const c = this.config.checkin
    return this.isMember ? (c.memberPoints || 0) : (c.normalPoints || 0)
  },

  /* ---- 登录 ---- */
  get isLoggedIn() { load(); return !!state.data.loggedIn },
  login(account) {
    load()
    state.data.loggedIn = true
    if (account !== undefined) state.data.account = account
    save()
    return true
  },
  /** 用后端返回的 user 覆盖本地身份与资产（登录 / 拉取资料后调用） */
  hydrate(u) {
    if (!u) return
    load()
    const d = state.data
    if (u.uid) d.uid = u.uid
    if (u.nickname) d.nickname = u.nickname
    if (u.avatarText) d.avatarText = u.avatarText
    if (u.phone) d.phone = u.phone
    if (u.isMember !== undefined) d.isMember = !!u.isMember
    if (u.memberExpire !== undefined) d.memberExpire = u.memberExpire || ''
    if (u.points != null) d.points = u.points
    if (u.pointsTotal != null) d.pointsTotal = u.pointsTotal
    if (u.streak != null) d.streak = u.streak
    if (u.maxStreak != null) d.maxStreak = u.maxStreak
    if (u.lastCheckinDate !== undefined) d.lastCheckinDate = u.lastCheckinDate || ''
    if (u.checkedToday !== undefined) d.checkedToday = !!u.checkedToday
    if (u.adsWatchedToday != null) d.adsWatchedToday = u.adsWatchedToday
    if (u.adPointsToday != null) d.adPointsToday = u.adPointsToday
    if (u.location) d.location = u.location
    save()
  },
  /** 登录成功：写入登录态并用后端用户信息刷新本地 */
  setSession(user) {
    load()
    state.data.loggedIn = true
    this.hydrate(user)
    save()
  },
  logout() { load(); state.data.loggedIn = false; save() },

  /* ---- 会员 ---- */
  get isMember() { load(); return !!state.data.isMember },
  setMember(v) { load(); state.data.isMember = !!v; save() },

  /* ---- 内容访问权（会员制）---- */
  isUnlocked() { return this.isMember },

  /* ---- 积分 ---- */
  get points() { load(); return state.data.points },
  addPoints(n) { load(); state.data.points += n; state.data.pointsTotal += Math.max(n, 0); save(); return state.data.points },
  spendPoints(n) { load(); state.data.points = Math.max(0, state.data.points - n); save(); return state.data.points },

  /* ---- 广告额度：普通 / 会员分别按配置读取 ---- */
  get adsWatchedToday() { load(); return state.data.adsWatchedToday },
  get adsLeftToday() { return Math.max(0, this.adsLimit - this.adsWatchedToday) },
  addAdWatch() { load(); state.data.adsWatchedToday += 1; save(); return state.data.adsWatchedToday },

  /* ---- 位置 ---- */
  get location() { load(); return state.data.location },
  setLocation(loc) { load(); state.data.location = Object.assign({}, state.data.location, loc, { source: 'manual' }); save() },
  setGeoLocation(loc) { load(); state.data.location = Object.assign({}, state.data.location, loc, { source: 'gps' }); save() },

  /* ---- 收藏 ---- */
  isFavorite(id) { load(); return state.data.favorites.indexOf(id) > -1 },
  setFavorite(id, on) {
    load()
    const i = state.data.favorites.indexOf(id)
    if (on && i === -1) state.data.favorites.push(id)
    if (!on && i > -1) state.data.favorites.splice(i, 1)
    save()
    return on
  },
  toggleFavorite(id) {
    load()
    const i = state.data.favorites.indexOf(id)
    if (i > -1) state.data.favorites.splice(i, 1)
    else state.data.favorites.push(id)
    save()
    return i === -1
  }
}

load()

export default Store