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
/**
 * 生成「今天」的 YYYY-MM-DD（用于跨天判断）
 * @returns {string} 本地时区日期串
 */
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
    ad: { points: 5 },
    pointsRules: {
      globalCap: 1500,
      monthlyCapNormal: 2000,
      monthlyCapMember: 2000
    },
    plans: []
  }
}

/**
 * 本地状态的完整默认值（首次启动 / 退出登录后重置 / 老数据缺字段补齐均用它）
 * @returns {Object} 中性空态：不含任何演示数据，全部真实值以接口返回为准
 */
function defaults() {
  return {
    uid: '',
    username: '',
    nickname: '',
    avatarText: '',
    phoneBound: false,
    loggedIn: false,            // 登录状态（老数据缺省补 false = 未登录）
    isMember: false,
    memberExpire: '',
    points: 0,                  // 当前可用积分（真实值以后端为准）
    pointsTotal: 0,
    entitlements: {             // 服务端下发的权益矩阵（唯一口径）
      member: false,
      weather: false,
      spots: false,
      adFree: false,
      support: 'normal',
      checkinPoints: 1,
      pointsMonthlyCap: 2000
    },
    streak: 0,                  // 连续签到天数
    maxStreak: 0,
    lastCheckinDate: '',
    checkedToday: false,
    adsDate: today(),           // 广告计数所属日期，跨天时由 rollDaily 归零
    adsWatchedToday: 0,         // 当天已看广告条数（仅统计，不设系统上限）
    adPointsToday: 0,           // 当天通过广告累计获得的积分
    location: { province: '', city: '', district: '' }, // 当前选点（省/市/区）
    favorites: [],              // 收藏的钓点 id 列表
    orders: [],                 // 本地订单缓存（列表页首屏占位用，详情仍以后端为准）
    myComments: []              // 我的评论缓存
  }
}

/**
 * 读取本地存储（异常时返回空串，保证调用方永远拿到可用值）
 * @param {string} key 存储键
 * @returns {*} 原始值或 ''
 */
function readStorage(key) {
  try { return uni.getStorageSync(key) || '' } catch (e) { return '' }
}
/**
 * 写入本地存储（失败静默：小程序存储满 / 隐私模式时不阻断业务流程）
 * @param {string} key 存储键
 * @param {*} val 待写入值
 * @returns {void}
 */
function writeStorage(key, val) {
  try { uni.setStorageSync(key, val) } catch (e) { /* ignore */ }
}

const state = reactive({
  data: null,                 // 用户资产/身份（对应 KEY 持久化）
  // 业务配置缓存（签到 / 广告 / 套餐），来自后端 /config
  config: null,
  configAt: 0                 // 配置写入时间戳（ms），用于 CONFIG_TTL 过期判断
})

/**
 * 惰性加载：从 storage 还原状态与配置缓存，补齐全缺失字段并做跨天刷新。
 * 幂等——已加载（state.data 非空）则直接返回；模块底部会自动调用一次。
 * @returns {void}
 */
function load() {
  if (state.data) return
  let d = null
  try {
    const raw = readStorage(KEY)
    d = raw ? JSON.parse(raw) : defaults()
  } catch (e) { d = defaults() }
  const base = defaults()
  for (const k in base) { if (d[k] === undefined) d[k] = base[k] }
  // 旧版本缓存中的手机号字段：清理，避免本地继续留存个人敏感信息
  if ('phone' in d) {
    delete d.phone
    writeStorage(KEY, JSON.stringify(d))
  }
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

/**
 * 把 state.data 序列化持久化到 KEY
 * @returns {void}
 */
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

/**
 * 全局 Store（唯一实例）：读写用户资产 / 身份 / 业务配置。
 * 所有 getter 内部都会先 load()，因此任意页面 import 即可安全使用。
 */
const Store = {
  /** 持久化键名（调试 / 清理数据时使用） */
  key: KEY,
  /** 返回整个状态对象（响应式引用，改完请调用 save()） */
  get data() { load(); return state.data },
  save,
  /**
   * 重置为默认空态并落盘（退出登录 / 切换账号时使用）
   * @returns {void}
   */
  reset() {
    state.data = defaults()
    save()
  },

  /* ---- 业务配置（签到 / 广告 / 套餐） ---- */
  /** 配置快照（缺失时返回缺省值，保证字段一定存在，避免页面报错）
   * @returns {{pointsPerYuan: number, checkin: Object, ad: Object, plans: Array}}
   */
  get config() {
    load()
    const cfg = state.config
    const def = defaultConfig()
    if (!cfg) return def
    return {
      pointsPerYuan: cfg.pointsPerYuan || def.pointsPerYuan,
      checkin: Object.assign({}, def.checkin, cfg.checkin || {}),
      ad: Object.assign({}, def.ad, cfg.ad || {}),
      pointsRules: Object.assign({}, def.pointsRules, cfg.pointsRules || {}),
      // 套餐必须是数组：旧结构缓存（无 plans 字段）时回退空数组，避免弹窗空白；
      // 后端明确返回空数组（全部下架）时尊重空值。
      plans: Array.isArray(cfg.plans) ? cfg.plans : def.plans
    }
  },
  /** 配置缓存是否仍在有效期内（TTL = CONFIG_TTL，供 Api.ensureConfig 判断是否需要刷新）
   * @returns {boolean} true 表示可直接复用缓存
   */
  get configFresh() {
    load()
    return !!state.config && (Date.now() - state.configAt) < CONFIG_TTL
  },
  /** 写入配置缓存（含写入时间，用于 TTL 判断）
   * @param {Object} cfg 后端 /config 返回的配置对象
   * @returns {void}
   */
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
  /** 会员套餐列表（来自配置，供解锁弹窗 / 开通页展示）
   * @returns {Array<Object>} 套餐数组，可能为空（表示后台未配置）
   */
  get plans() { return this.config.plans },
  /** 单次广告可得积分
   * @returns {number} 配置值，缺省 5
   */
  get adPoints() { return this.config.ad.points || 5 },
  /** 当前身份对应的签到积分
   * @returns {number} 会员取 memberPoints，普通用户取 normalPoints
   */
  get checkinPoints() {
    const c = this.config.checkin
    return this.isMember ? (c.memberPoints || 0) : (c.normalPoints || 0)
  },

  /* ---- 登录 ---- */
  /** 是否已登录（页面的登录守卫读它） */
  get isLoggedIn() { load(); return !!state.data.loggedIn },
  /**
   * 仅置位登录态（不含用户资料，正式登录请用 setSession）
   * @param {string} [account] 登录账号（用户名），传入时写入 state.account
   * @returns {boolean} 恒为 true
   */
  login(account) {
    load()
    state.data.loggedIn = true
    if (account !== undefined) state.data.account = account
    save()
    return true
  },
  /** 用后端返回的 user 覆盖本地身份与资产（登录 / 拉取资料后调用）
   * @param {Object} u 后端用户对象（字段缺省时跳过，不会把已有值清空）
   * @returns {void}
   */
  hydrate(u) {
    if (!u) return
    load()
    const d = state.data
    if (u.uid) d.uid = u.uid
    if (u.username !== undefined) d.username = u.username || ''
    if (u.nickname) d.nickname = u.nickname
    if (u.avatarText) d.avatarText = u.avatarText
    if (u.phoneBound !== undefined) d.phoneBound = !!u.phoneBound
    if (u.isMember !== undefined) d.isMember = !!u.isMember
    if (u.memberExpire !== undefined) d.memberExpire = u.memberExpire || ''
    if (u.entitlements && typeof u.entitlements === 'object') {
      d.entitlements = Object.assign({}, d.entitlements, u.entitlements)
      d.isMember = !!u.entitlements.member
    }
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
  /** 登录成功：写入登录态并用后端用户信息刷新本地
   * @param {Object} [user] 后端返回的用户对象，可为空（仅置登录态）
   * @returns {void}
   */
  setSession(user) {
    load()
    state.data.loggedIn = true
    this.hydrate(user)
    save()
  },
  /** 登出：仅清登录态，保留本地缓存（token 由 request.js 单独清除）
   * @returns {void}
   */
  logout() { load(); state.data.loggedIn = false; save() },

  /* ---- 会员 ---- */
  /** 是否会员（内容访问权 / 签到积分都依赖它） */
  get isMember() { load(); return !!state.data.isMember },
  /** 服务端下发的权益矩阵（唯一口径；缺省时按非会员兜底） */
  get entitlements() { load(); return state.data.entitlements || {} },
  /** 是否免广告（会员权益；未同步时按会员身份兜底） */
  get adFree() {
    const e = this.entitlements
    return e.adFree !== undefined ? !!e.adFree : this.isMember
  },
  /** 是否可看完整天气（会员权益；未同步时按会员身份兜底） */
  get weatherUnlocked() {
    const e = this.entitlements
    return e.weather !== undefined ? !!e.weather : this.isMember
  },
  /** 是否可看完整钓点（会员权益；未同步时按会员身份兜底） */
  get spotsUnlocked() {
    const e = this.entitlements
    return e.spots !== undefined ? !!e.spots : this.isMember
  },
  /**
   * 设置会员状态（支付成功回调 / 拉取资料时同步）
   * @param {boolean} v 是否会员
   * @returns {void}
   */
  setMember(v) { load(); state.data.isMember = !!v; save() },
  /** 写入服务端权益矩阵（登录 / 拉取资料 / 会员页返回时调用） */
  setEntitlements(v) {
    if (!v || typeof v !== 'object') return
    load()
    state.data.entitlements = Object.assign({}, state.data.entitlements, v)
    state.data.isMember = !!state.data.entitlements.member
    save()
  },

  /* ---- 内容访问权（会员制）---- */
  /**
   * 当前身份是否可访问付费内容
   * @param {string} [feature] weather / spots；缺省按会员身份判断
   * @returns {boolean}
   */
  isUnlocked(feature) {
    const e = this.entitlements
    if (feature === 'weather') return e.weather !== undefined ? !!e.weather : this.isMember
    if (feature === 'spots') return e.spots !== undefined ? !!e.spots : this.isMember
    return this.isMember
  },

  /* ---- 积分 ---- */
  /** 当前可用积分 */
  get points() { load(); return state.data.points },
  /**
   * 增加积分（只累加非负部分到累计值）
   * @param {number} n 变动值，正数增加
   * @returns {number} 变动后的可用积分
   */
  addPoints(n) { load(); state.data.points += n; state.data.pointsTotal += Math.max(n, 0); save(); return state.data.points },
  /**
   * 扣除积分（不足时归零，不会出现负分）
   * @param {number} n 扣除值
   * @returns {number} 扣除后的可用积分
   */
  spendPoints(n) { load(); state.data.points = Math.max(0, state.data.points - n); save(); return state.data.points },

  /* ---- 广告统计：展示次数与时长由微信流量主规范控制 ---- */
  /** 当天已观看广告条数 */
  get adsWatchedToday() { load(); return state.data.adsWatchedToday },
  /**
   * 本地累加一次广告观看（服务端返回后应以接口计数为准覆盖）
   * @returns {number} 累加后的当天观看条数
   */
  addAdWatch() { load(); state.data.adsWatchedToday += 1; save(); return state.data.adsWatchedToday },

  /* ---- 位置 ---- */
  /** 当前选点位置 {province, city, district, source} */
  get location() { load(); return state.data.location },
  /**
   * 手动选择位置（source 标记为 manual）
   * @param {{province?: string, city?: string, district?: string}} loc 位置增量字段
   * @returns {void}
   */
  setLocation(loc) { load(); state.data.location = Object.assign({}, state.data.location, loc, { source: 'manual' }); save() },
  /**
   * GPS 定位结果（source 标记为 gps，便于区分定位来源）
   * @param {{province?: string, city?: string, district?: string}} loc 位置增量字段
   * @returns {void}
   */
  setGeoLocation(loc) { load(); state.data.location = Object.assign({}, state.data.location, loc, { source: 'gps' }); save() },

  /* ---- 收藏 ---- */
  /**
   * 判断是否已收藏某钓点
   * @param {string} id 钓点 id
   * @returns {boolean} 是否已收藏
   */
  isFavorite(id) { load(); return state.data.favorites.indexOf(id) > -1 },
  /**
   * 设置收藏状态（幂等，重复设置不会产生重复项）
   * @param {string} id 钓点 id
   * @param {boolean} on true 收藏 / false 取消
   * @returns {boolean} 设置后的收藏状态
   */
  setFavorite(id, on) {
    load()
    const i = state.data.favorites.indexOf(id)
    if (on && i === -1) state.data.favorites.push(id)
    if (!on && i > -1) state.data.favorites.splice(i, 1)
    save()
    return on
  },
  /**
   * 切换收藏状态
   * @param {string} id 钓点 id
   * @returns {boolean} 切换后是否为「已收藏」
   */
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