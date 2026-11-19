/* api.js — 接口层（仅对接真实后端）
 * 返回结构统一为 { code, data, msg }，与后端契约一致，页面无需改动。
 *
 * 后端地址配置在 common/request.js 的 BASE_URL。
 * 网络异常按「无数据」处理：返回 { code: -1, data: null, msg }，
 * 页面据此展示缺省内容，不降级到任何本地演示数据、不抛出未捕获异常导致白屏。
 */
import Store from './state.js'
import { request, setToken } from './request.js'

function q(obj) {
  const parts = []
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined && v !== null && v !== '') parts.push(k + '=' + encodeURIComponent(v))
  }
  return parts.length ? '?' + parts.join('&') : ''
}

/* 统一调用入口：成功 {code:0,data}；业务错误 {code,data,msg}；网络异常 {code:-1,data:null,msg} */
async function call(path, opts) {
  try {
    const data = await request(Object.assign({ url: path }, opts || {}))
    return { code: 0, data }
  } catch (e) {
    if (e.business) return { code: e.code, data: e.data, msg: e.message }
    return { code: -1, data: null, msg: (e && e.message) || '网络异常，请稍后重试' }
  }
}

const Api = {
  /* ---- 鉴权 ---- */
  /* POST /api/auth/wechat body:{code} -> { token, user }（小程序正式环境用） */
  async loginByWechat(code) {
    const res = await call('/auth/wechat', { method: 'POST', data: { code } })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/login body:{account,password} -> { token, user }；account 为手机号 */
  async login(account, password) {
    const res = await call('/auth/login', {
      method: 'POST',
      data: { account: account || '', password: password || '' }
    })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/register body:{phone,password,confirmPassword} -> { token, user, isNew } */
  async register(phone, password, confirmPassword) {
    const res = await call('/auth/register', {
      method: 'POST',
      data: {
        phone: phone || '',
        password: password || '',
        confirmPassword: confirmPassword || ''
      }
    })
    if (res.code === 0 && res.data && res.data.token) setToken(res.data.token)
    return res
  },

  /* POST /api/auth/logout */
  async logout() {
    const res = await call('/auth/logout', { method: 'POST' })
    setToken('')
    return res
  },

  /* GET /api/user/profile -> { user } */
  async fetchProfile() {
    return call('/user/profile', {})
  },

  /* GET /api/cities -> [provinces]（省/市/区三级，选到区） */
  async fetchCities() {
    return call('/cities', { auth: false })
  },

  /* GET /api/config -> { pointsPerYuan, checkin, ad, plans }（公开接口）
   * 小程序端所有「签到积分 / 广告积分 / 会员套餐」规则都以此为准，页面禁止硬编码。 */
  async fetchConfig() {
    return call('/config', { auth: false })
  },

  /* 确保本地配置缓存有效：未过期直接返回缓存，过期或 force 时重新拉取后端。
   * 始终返回可用配置（后端不通时回退默认缺省值），避免调用方拿到空值报错。 */
  async ensureConfig(force) {
    if (!force && Store.configFresh) return Store.config
    const res = await this.fetchConfig()
    if (res && res.code === 0 && res.data) Store.setConfig(res.data)
    return Store.config
  },

  /* GET /api/weather?province&city&district -> { weather, verdict, slots } */
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
  async fetchSpot(id) {
    return call('/spots/' + encodeURIComponent(id), {})
  },

  /* POST /api/spots/:id/comments body:{text,images[],rating} -> { comment } */
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
  async fetchGoods(params) {
    const p = params || {}
    return call('/goods' + q({ cat: p.cat }), { auth: false })
  },

  /* GET /api/goods/:id -> { goods } */
  async fetchGoodsDetail(id) {
    return call('/goods/' + encodeURIComponent(id), { auth: false })
  },

  /* POST /api/orders body:{goodsId,qty,usePoints} -> { orderNo, payAmount, usePoints, goods, status, payment } */
  async createOrder(payload) {
    return call('/orders', { method: 'POST', data: payload })
  },

  /* GET /api/user/orders -> [orders] */
  async fetchOrders() {
    return call('/user/orders', {})
  },

  /* GET /api/user/orders/:orderNo -> { order } */
  async fetchOrderDetail(orderNo) {
    return call('/user/orders/' + encodeURIComponent(orderNo), {})
  },

  /* GET /api/user/orders/:orderNo/logistics -> { company, no, phone, deliveryType, shippedAt } */
  async fetchOrderLogistics(orderNo) {
    return call('/user/orders/' + encodeURIComponent(orderNo) + '/logistics', {})
  },

  /* GET /api/user/comments -> [comments] */
  async fetchMyComments() {
    return call('/user/comments', {})
  },

  /* GET /api/user/favorites -> { ids, spots } */
  async fetchFavorites() {
    return call('/user/favorites', {})
  },

  /* GET /api/ads/creatives -> [creatives]（营销广告素材） */
  async fetchAdCreatives() {
    return call('/ads/creatives', { auth: false })
  },

  /* GET /api/checkin -> { checkedToday, streak, maxStreak, dailyPoints, days, date } */
  async fetchCheckinStatus() {
    return call('/checkin', {})
  },

  /* POST /api/checkin -> { points, streak, bonus, isMember, pointsBalance } */
  async doCheckin() {
    return call('/checkin', { method: 'POST' })
  },

  /* POST /api/ads/reward -> { points, todayCount, limit, pointsBalance } */
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
  async fetchMembership() {
    return call('/user/membership', {})
  },

  /* POST /api/user/membership body:{plan} -> { orderNo, months, payAmount, status, memberExpire } */
  async buyMembership(plan) {
    return call('/user/membership', { method: 'POST', data: { plan: plan || '' } })
  },

  /* POST /api/user/favorites body:{spotId} -> { spotId, favorited } */
  async toggleFavorite(spotId) {
    const res = await call('/user/favorites', { method: 'POST', data: { spotId } })
    if (res.code === 0 && res.data && res.data.favorited != null) {
      Store.setFavorite(spotId, res.data.favorited)
    }
    return res
  },

  /* POST /api/user/location body:{province,city,district} */
  async saveLocation(loc) {
    return call('/user/location', {
      method: 'POST',
      data: { province: loc.province, city: loc.city, district: loc.district }
    })
  },

  /* ---- 收货地址 ---- */
  /* GET /api/user/addresses -> [addresses] */
  async fetchAddresses() {
    return call('/user/addresses', {})
  },

  /* GET /api/user/addresses/:id -> { address } */
  async fetchAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id), {})
  },

  /* POST /api/user/addresses -> { address } */
  async createAddress(payload) {
    return call('/user/addresses', { method: 'POST', data: payload })
  },

  /* PUT /api/user/addresses/:id -> { address } */
  async updateAddress(id, payload) {
    return call('/user/addresses/' + encodeURIComponent(id), { method: 'PUT', data: payload })
  },

  /* POST /api/user/addresses/:id/default -> { address } */
  async setDefaultAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id) + '/default', { method: 'POST' })
  },

  /* DELETE /api/user/addresses/:id */
  async deleteAddress(id) {
    return call('/user/addresses/' + encodeURIComponent(id), { method: 'DELETE' })
  }
}

export default Api