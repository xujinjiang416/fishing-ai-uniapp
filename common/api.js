/*
 * api.js — 接口层（仅对接真实后端）
 * 返回结构统一为 { code, data, msg }，与后端契约一致，页面无需改动。
 *
 * 后端地址配置在 common/request.js 的 BASE_URL。
 * 网络异常按「无数据」处理：返回 { code: -1, data: null, msg }，
 * 页面据此展示缺省内容，不降级到任何本地演示数据、不抛出未捕获异常导致白屏。
 *
 * 运行环境：小程序 / App / H5（全链路经 request.js，不直接使用 uni.request）。
 * 依赖：State（登录态 / 位置 / 配置 / 收藏缓存）、request（请求与 token）。
 */
import Store from './state.js'
import { request, setToken } from './request.js'

/**
 * 把对象拼成查询串（自动跳过 undefined / null / 空串，值做 URL 编码）
 * @param {Object} obj 查询参数键值对
 * @returns {string} 形如 '?a=1&b=%E6%9D%AD'；无有效参数时返回空串
 */
function q(obj) {
  const parts = []
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined && v !== null && v !== '') parts.push(k + '=' + encodeURIComponent(v))
  }
  return parts.length ? '?' + parts.join('&') : ''
}

/* 统一调用入口：成功 {code:0,data}；业务错误 {code,data,msg}；网络异常 {code:-1,data:null,msg}
 * @param {string} path 相对 BASE_URL 的接口路径（如 '/weather'）
 * @param {Object} [opts] 透传给 request 的选项（method / data / auth / timeout）
 * @returns {Promise<{code: number, data: *, msg?: string}>} 永不 reject，异常被转成 code:-1
 */
async function call(path, opts) {
  try {
    const data = await request(Object.assign({ url: path }, opts || {}))
    return { code: 0, data }
  } catch (e) {
    if (e.business) return { code: e.code, data: e.data, msg: e.message }
    return { code: -1, data: null, msg: (e && e.message) || '网络异常，请稍后重试' }
  }
}

/** 业务接口集合：按域分组，每个方法内部统一经 request 封装并归一化错误 */
const Api = {
  /* ---- 鉴权 ---- */
  /* POST /api/auth/wechat body:{code} -> { token, user }（小程序正式环境用） */
  /**
   * 微信小程序登录（code 换取后端 token，成功后自动写入本地 token）
   * @param {string} code wx.login 返回的临时登录凭证
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { token, user }
   */
  async loginByWechat(code) {
    const res = await call('/auth/wechat', { method: 'POST', data: { code } })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/login body:{account,password} -> { token, user }；account 为用户名 */
  /**
   * 用户名密码登录（成功后自动写入本地 token）
   * @param {string} account 用户名（4-16 位）
   * @param {string} password 密码（明文交给 HTTPS 传输，前端不做加密）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { token, user }
   */
  async login(account, password) {
    const res = await call('/auth/login', {
      method: 'POST',
      data: { account: account || '', password: password || '' }
    })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/register body:{username,password,confirmPassword} -> { token, user, isNew } */
  /**
   * 用户名注册（成功后自动写入本地 token，等同登录）
   * @param {string} username 用户名（4-16 位）
   * @param {string} password 密码
   * @param {string} confirmPassword 确认密码（由后端校验一致性）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { token, user, isNew }
   */
  async register(username, password, confirmPassword) {
    const res = await call('/auth/register', {
      method: 'POST',
      data: {
        username: username || '',
        password: password || '',
        confirmPassword: confirmPassword || ''
      }
    })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/logout */
  /**
   * 退出登录：通知后端作废会话，并清除本地 token
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async logout() {
    const res = await call('/auth/logout', { method: 'POST' })
    setToken('')
    return res
  },

  /* GET /api/user/profile -> { user } */
  /**
   * 拉取当前登录用户资料（页面拿到后通常调用 Store.hydrate 同步本地）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { user }
   */
  async fetchProfile() {
    return call('/user/profile', {})
  },

  /* GET /api/cities -> [provinces]（省/市/区三级，选到区） */
  /**
   * 拉取省市区三级数据（公开接口，无需登录）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为省份数组
   */
  async fetchCities() {
    return call('/cities', { auth: false })
  },

  /* GET /api/config -> { pointsPerYuan, checkin, ad, plans }（公开接口）
   * 小程序端所有「签到积分 / 广告积分 / 会员套餐」规则都以此为准，页面禁止硬编码。 */
  /**
   * 拉取业务配置（签到 / 广告 / 会员套餐规则）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { pointsPerYuan, checkin, ad, plans }
   */
  async fetchConfig() {
    return call('/config', { auth: false })
  },

  /* 确保本地配置缓存有效：未过期直接返回缓存，过期或 force 时重新拉取后端。
   * 始终返回可用配置（后端不通时回退默认缺省值），避免调用方拿到空值报错。 */
  /**
   * 确保本地配置缓存有效
   * @param {boolean} [force] true 时忽略 TTL 强制刷新
   * @returns {Promise<Object>} 始终可用的配置快照（失败时回退 Store 内置缺省值）
   */
  async ensureConfig(force) {
    if (!force && Store.configFresh) return Store.config
    const res = await this.fetchConfig()
    if (res && res.code === 0 && res.data) Store.setConfig(res.data)
    return Store.config
  },

  /* GET /api/weather?province&city&district -> { weather, verdict, slots } */
  /**
   * 查询天气与出钓结论
   * @param {{place?: string, province?: string, city?: string, district?: string, lat?: number, lng?: number, date?: string}} [params]
   *   place 为空格分隔的「省 市 区」字符串，未单独传省市区时按空格拆分兜底
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { weather, verdict, slots }
   */
  async fetchWeather(params) {
    const p = params || {}
    const seg = String(p.place || '').split(' ').filter(Boolean)
    const body = {
      province: p.province || seg[0],
      city: p.city || seg[1],
      district: p.district || seg[2],
      lat: p.lat,
      lng: p.lng,
      date: p.date
    }
    return call('/weather' + q(body), {})
  },

  /* GET /api/spots?keyword&province&city&district -> [spots]（按位置生成，由近到远） */
  /**
   * 查询附近钓点（省市区缺省取本地已选位置）
   * @param {{keyword?: string, province?: string, city?: string, district?: string}} [params]
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为钓点数组
   */
  async fetchSpots(params) {
    const p = params || {}
    const loc = Store.location || {}
    // 该地区首次查询要等大模型生成（实测 10~30s），超时时间单独放宽
    return call('/spots' + q({
      keyword: p.keyword,
      province: p.province || loc.province,
      city: p.city || loc.city,
      district: p.district || loc.district
    }), { auth: !!Store.isLoggedIn, timeout: 60000 })
  },

  /* GET /api/spots/:id -> { spot } */
  /**
   * 获取钓点详情
   * @param {string} id 钓点 id
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { spot }
   */
  async fetchSpot(id) {
    return call('/spots/' + encodeURIComponent(id), {})
  },

  /* POST /api/spots/:id/comments body:{text,images[],rating} -> { comment } */
  /**
   * 发表钓点评论
   * @param {string} spotId 钓点 id
   * @param {{text?: string, images?: string[], rating?: number}} [payload] 评论内容
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { comment }
   */
  async postComment(spotId, payload) {
    return call('/spots/' + encodeURIComponent(spotId) + '/comments', {
      method: 'POST',
      data: {
        text: (payload && payload.text) || '',
        rating: (payload && payload.rating) || 5,
        images: (payload && payload.images) || []
      }
    })
  },

  /* GET /api/goods?cat -> [goods] */
  /**
   * 获取商品列表（公开接口）
   * @param {{cat?: string}} [params] cat 为商品分类
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为商品数组
   */
  async fetchGoods(params) {
    const p = params || {}
    return call('/goods' + q({ cat: p.cat }), { auth: false })
  },

  /* GET /api/goods/:id -> { goods } */
  /**
   * 获取商品详情（公开接口）
   * @param {string} id 商品 id
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { goods }
   */
  async fetchGoodsDetail(id) {
    return call('/goods/' + encodeURIComponent(id), { auth: false })
  },

  /* POST /api/orders body:{goodsId,qty,usePoints} -> { orderNo, payAmount, usePoints, goods, status, payment } */
  /**
   * 创建商品订单
   * @param {{goodsId: string, qty: number, usePoints?: number}} payload 下单参数
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含订单号、应付金额、抵扣积分等信息
   */
  async createOrder(payload) {
    return call('/orders', { method: 'POST', data: payload })
  },

  /* GET /api/user/orders -> [orders] */
  /**
   * 获取我的订单列表
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为订单数组
   */
  async fetchOrders() {
    return call('/user/orders', {})
  },

  /* GET /api/user/orders/:orderNo -> { order } */
  /**
   * 获取订单详情
   * @param {string} orderNo 订单号
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { order }
   */
  async fetchOrderDetail(orderNo) {
    return call('/user/orders/' + encodeURIComponent(orderNo), {})
  },

  /* GET /api/user/orders/:orderNo/logistics -> { company, no, phone, deliveryType, shippedAt } */
  /**
   * 获取订单物流信息
   * @param {string} orderNo 订单号
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { company, no, phone, deliveryType, shippedAt }
   */
  async fetchOrderLogistics(orderNo) {
    return call('/user/orders/' + encodeURIComponent(orderNo) + '/logistics', {})
  },

  /* GET /api/user/comments -> [comments] */
  /**
   * 获取我的评论列表
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为评论数组
   */
  async fetchMyComments() {
    return call('/user/comments', {})
  },

  /* GET /api/user/favorites -> { ids, spots } */
  /**
   * 获取收藏列表（ids 用于本地快速判断，spots 为完整钓点数据）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { ids, spots }
   */
  async fetchFavorites() {
    return call('/user/favorites', {})
  },

  /* GET /api/ads/creatives -> [creatives]（营销广告素材） */
  /**
   * 拉取广告素材（公开接口，播放器展示品牌与标语用）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为素材数组
   */
  async fetchAdCreatives() {
    return call('/ads/creatives', { auth: false })
  },

  /* GET /api/checkin -> { checkedToday, streak, maxStreak, dailyPoints, days, date } */
  /**
   * 查询签到状态与本周签到日历
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含今日是否已签、连续天数、每日积分等
   */
  async fetchCheckinStatus() {
    return call('/checkin', {})
  },

  /* POST /api/checkin -> { points, streak, bonus, isMember, pointsBalance } */
  /**
   * 执行签到
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含本次获得积分、连续天数、积分余额
   */
  async doCheckin() {
    return call('/checkin', { method: 'POST' })
  },

  /* POST /api/ads/reward -> { points, todayCount, limit, pointsBalance } */
  /**
   * 看完广告后领取奖励积分（服务端计数并下发今日已看条数）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { points, todayCount, limit, pointsBalance }
   */
  async rewardAd() {
    const res = await call('/ads/reward', { method: 'POST' })
    // 服务端已计数，把本地额度与后端对齐
    if (res.code === 0 && res.data && res.data.todayCount != null) {
      Store.data.adsWatchedToday = res.data.todayCount
      Store.save()
    }
    return res
  },

  /* GET /api/user/membership -> { isMember, memberExpire, plans } */
  /**
   * 查询会员状态与可购套餐
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { isMember, memberExpire, plans }
   */
  async fetchMembership() {
    return call('/user/membership', {})
  },

  /* POST /api/user/membership body:{plan} -> { orderNo, months, payAmount, status, memberExpire } */
  /**
   * 购买/续费会员
   * @param {string} plan 套餐 id（来自 /config 的 plans）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含订单号、月数、金额、到期时间
   */
  async buyMembership(plan) {
    return call('/user/membership', { method: 'POST', data: { plan: plan || '' } })
  },

  /* POST /api/user/favorites body:{spotId} -> { spotId, favorited } */
  /**
   * 切换收藏（以后端结果为准，同步回本地收藏缓存）
   * @param {string} spotId 钓点 id
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { spotId, favorited }
   */
  async toggleFavorite(spotId) {
    const res = await call('/user/favorites', { method: 'POST', data: { spotId } })
    if (res.code === 0 && res.data && res.data.favorited != null) {
      Store.setFavorite(spotId, res.data.favorited)
    }
    return res
  },

  /* POST /api/user/location body:{province,city,district} */
  /**
   * 上报用户选点（服务端用于个性化推荐）
   * @param {{province: string, city: string, district: string}} loc 位置对象
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async saveLocation(loc) {
    return call('/user/location', {
      method: 'POST',
      data: { province: loc.province, city: loc.city, district: loc.district }
    })
  },

  /* ---- 收货地址 ---- */
  /* GET /api/user/addresses -> [addresses] */
  /**
   * 获取收货地址列表
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为地址数组
   */
  async fetchAddresses() {
    return call('/user/addresses', {})
  },

  /* GET /api/user/addresses/:id -> { address } */
  /**
   * 获取单个收货地址
   * @param {string} id 地址 id
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { address }
   */
  async fetchAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id), {})
  },

  /* POST /api/user/addresses -> { address } */
  /**
   * 新增收货地址
   * @param {Object} payload 地址字段（收件人 / 电话 / 省市区 / 详细地址等）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { address }
   */
  async createAddress(payload) {
    return call('/user/addresses', { method: 'POST', data: payload })
  },

  /* PUT /api/user/addresses/:id -> { address } */
  /**
   * 更新收货地址
   * @param {string} id 地址 id
   * @param {Object} payload 需要更新的字段
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { address }
   */
  async updateAddress(id, payload) {
    return call('/user/addresses/' + encodeURIComponent(id), { method: 'PUT', data: payload })
  },

  /* POST /api/user/addresses/:id/default -> { address } */
  /**
   * 设为默认收货地址
   * @param {string} id 地址 id
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { address }
   */
  async setDefaultAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id) + '/default', { method: 'POST' })
  },

  /* DELETE /api/user/addresses/:id */
  /**
   * 删除收货地址
   * @param {string} id 地址 id
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async deleteAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id), { method: 'DELETE' })
  }
}

export default Api