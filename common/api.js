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
import { request, setToken, upload } from './request.js'

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

/* 上传入口：与 call 相同的返回结构，失败不抛异常（业务错误 / 网络异常都转成 {code,msg}） */
async function callUpload(path, filePath, opts) {
  try {
    const data = await upload(Object.assign({ url: path, filePath }, opts || {}))
    return { code: 0, data }
  } catch (e) {
    if (e.business) return { code: e.code, data: e.data, msg: e.message }
    return { code: -1, data: null, msg: (e && e.message) || '图片上传失败，请稍后重试' }
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
    const res = await call('/user/profile', {})
    if (res.code === 0 && res.data && res.data.entitlements) {
      Store.setEntitlements(res.data.entitlements)
    }
    return res
  },

  /* GET /api/cities -> [provinces]（省/市/区三级，选到区） */
  /**
   * 拉取省市区三级数据（公开接口，无需登录）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为省份数组
   */
  async fetchCities() {
    return call('/cities', { auth: false })
  },

  /* GET /api/geo/center?province&city&district -> { coord: "lng,lat" | null } */
  /**
   * 查询地区中心坐标（切换地区时先定位地图，再加载钓点）
   * @param {{province?: string, city?: string, district?: string}} [params]
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 形如 { coord: 'lng,lat' | null }
   */
  async fetchRegionCenter(params) {
    const p = params || {}
    return call('/geo/center' + q({
      province: p.province,
      city: p.city,
      district: p.district
    }), { auth: false, timeout: 8000 })
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
      date: p.date,
      // 非会员只请求摘要，避免服务端 403；会员请求全量
      preview: p.preview === undefined ? (Store.weatherUnlocked ? 0 : 1) : (p.preview ? 1 : 0)
    }
    const res = await call('/weather' + q(body), {})
    if (res.code === 0 && res.data && res.data.entitlements) {
      Store.setEntitlements(res.data.entitlements)
    }
    return res
  },

  /* GET /api/spots?keyword&province&city&district -> [spots]（按所选行政区返回真实小型水域） */
  /**
   * 查询附近钓点（省市区缺省取本地已选位置）
   * @param {{keyword?: string, province?: string, city?: string, district?: string}} [params]
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为钓点数组
   */
  async fetchSpots(params) {
    const p = params || {}
    const loc = Store.location || {}
    // 该地区首次查询要等高德 + OSM 检索与大模型补文案（实测 30~90s），超时时间单独放宽
    return call('/spots' + q({
      keyword: p.keyword,
      province: p.province || loc.province,
      city: p.city || loc.city,
      district: p.district || loc.district
    }), { auth: !!Store.isLoggedIn, timeout: 90000 })
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

  /* GET /api/spots/:id/comments?page&page_size -> {list,total,page,pageSize}（不传 page 兼容旧数组） */
  /**
   * 分页获取钓点评论
   * @param {string} spotId 钓点 id
   * @param {number} page 页码（从 1 开始）
   * @param {number} [pageSize] 每页条数，缺省 20
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为分页对象或数组（旧契约）
   */
  async fetchSpotComments(spotId, page, pageSize) {
    return call('/spots/' + encodeURIComponent(spotId) + '/comments' + q({
      page: page || 1,
      page_size: pageSize || 20
    }), {})
  },

  /* POST /api/uploads/spot multipart file -> { url }（需登录） */
  /**
   * 上传一张图片到本站（投稿 / 评论共用）
   * @param {string} filePath 本地临时文件路径（uni.chooseImage 返回）
   * @param {Function} [onProgress] 上传进度回调，参数为 0~100
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { url }
   */
  async uploadSpotImage(filePath, onProgress) {
    return callUpload('/uploads/spot', filePath, { name: 'file', onProgress })
  },

  /* POST /api/spot-submissions body:{kind,name,region,coord,address,water,fish[],pay,note,photos[],cover} */
  /**
   * 提交钓点投稿
   * @param {Object} data 投稿字段（kind 固定 new_spot）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为投稿详情
   */
  async submitSpot(data) {
    return call('/spot-submissions', { method: 'POST', data })
  },

  /* GET /api/spot-submissions/mine -> [submissions] */
  /**
   * 我的投稿列表
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 为投稿数组
   */
  async fetchMySubmissions() {
    return call('/spot-submissions/mine', {})
  },

  /* GET /api/spot-submissions/:id -> submission */
  /**
   * 投稿详情
   * @param {string} id 投稿 id
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async fetchSpotSubmission(id) {
    return call('/spot-submissions/' + encodeURIComponent(id), {})
  },

  /* POST /api/spot-submissions/:id/withdraw -> submission */
  /**
   * 撤回投稿
   * @param {string} id 投稿 id
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async withdrawSubmission(id) {
    return call('/spot-submissions/' + encodeURIComponent(id) + '/withdraw', { method: 'POST' })
  },

  /* POST /api/spot-submissions/:id/supplement body:{photos?,coord?,note?} -> submission */
  /**
   * 补充投稿材料（照片 / 坐标 / 说明）
   * @param {string} id 投稿 id
   * @param {{photos?: string[], coord?: string, note?: string}} payload 需要补充的字段
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async supplementSubmission(id, payload) {
    return call('/spot-submissions/' + encodeURIComponent(id) + '/supplement', {
      method: 'POST',
      data: payload || {}
    })
  },

  /* POST /api/spot-reports body:{spot_id,report_type,proposed_coord?,photos[],note?} */
  /**
   * 提交钓点纠错 / 举报
   * @param {{spot_id: string, report_type: string, proposed_coord?: string, photos?: string[], note?: string}} payload 举报字段
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async reportSpot(payload) {
    return call('/spot-reports', { method: 'POST', data: payload })
  },

  /* POST /api/spots/:id/fishability body:{verdict:'yes'|'no'} -> {yes,no,myVote,limit,hidden} */
  /**
   * 反馈该钓点是否还能正常作钓（需登录）
   * @param {string} spotId 钓点 id
   * @param {'yes'|'no'} verdict yes=可以作钓 / no=无法作钓
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 yes/no/myVote/limit/hidden
   */
  async reportFishability(spotId, verdict) {
    return call('/spots/' + encodeURIComponent(spotId) + '/fishability', {
      method: 'POST',
      data: { verdict }
    })
  },

  /* GET /api/spot-reports/mine -> [reports] */
  /**
   * 我的纠错记录
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async fetchMyReports() {
    return call('/spot-reports/mine', {})
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

  /* POST /api/events body:{events:[{eventId,event,source,scene,channel,props}]} */
  /**
   * 批量上报行为事件（失败静默，不阻塞业务）
   * @param {Array<Object>} events 事件数组
   * @returns {Promise<{code: number, data: *, msg?: string}>}
   */
  async postEvents(events) {
    if (!Array.isArray(events) || !events.length) return { code: 0, data: null }
    return call('/events', { method: 'POST', data: { events: events.slice(0, 50) } })
  },

  /**
   * 上报单条行为事件（失败静默，不阻塞页面）
   * @param {string} event 事件名
   * @param {Object} [props] 事件属性
   * @param {string} [source] 来源模块
   * @param {string} [scene] 场景
   * @returns {void}
   */
  track(event, props, source, scene) {
    if (!event) return
    const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(16).slice(2, 10)
    this.postEvents([
      {
        eventId,
        event,
        source: source || 'miniapp',
        scene: scene || '',
        channel: 'miniapp',
        props: props || {}
      }
    ])
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

  /* POST /api/ads/reward -> { points, todayCount, pointsBalance } */
  /**
   * 看完广告后领取奖励积分（服务端仅统计观看次数，展示限制由微信流量主组件执行）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含 { points, todayCount, pointsBalance }
   */
  async rewardAd(requestId) {
    // 客户端幂等号：同一视频只领一次；旧调用不传时服务端仍兼容
    const rid = requestId || ('ad_' + Date.now() + '_' + Math.random().toString(16).slice(2, 10))
    const res = await call('/ads/reward', { method: 'POST', data: { requestId: rid } })
    // 服务端已计数，把本地观看统计与后端对齐
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
    const res = await call('/user/membership', {})
    if (res.code === 0 && res.data && res.data.entitlements) {
      Store.setEntitlements(res.data.entitlements)
    }
    return res
  },

  /* POST /api/user/membership body:{plan} -> { orderNo, months, payAmount, status, memberExpire } */
  /**
   * 购买/续费会员
   * @param {string} plan 套餐 id（来自 /config 的 plans）
   * @returns {Promise<{code: number, data: *, msg?: string}>} data 含订单号、月数、金额、到期时间
   */
  async buyMembership(plan) {
    const res = await call('/user/membership', { method: 'POST', data: { plan: plan || '' } })
    if (res.code === 0 && res.data && res.data.entitlements) {
      Store.setEntitlements(res.data.entitlements)
    }
    return res
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