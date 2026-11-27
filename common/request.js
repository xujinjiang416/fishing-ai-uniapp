/* request.js — 统一 HTTP 请求层（HTTPS / token 注入 / 统一响应解包 / 401 处理）
 * 全站接口调用都必须经过这里，页面禁止直接调用 uni.request。
 *
 * 后端返回契约：{ code, data, msg }，code = 0 表示成功。
 *
 * 运行环境适配：
 *   · 小程序（mp-weixin）：当前环境为 CloudBase PostgreSQL 模式，
 *     微信云开发不支持在该模式下绑定小程序环境，因此 callContainer 停用，
 *     统一走 HTTPS（云托管公网域名）。开发/预览版在开发者工具中关闭域名校验；
 *     正式发布前把该域名加入小程序后台的 request 合法域名。
 *   · H5 / App：同样走 uni.request，BASE_URL 指向云托管公网地址。
 *
 * 错误分层（决定了 api.js 是否降级）：
 *   · 业务错误（HTTP 2xx 但 code != 0，或 401）→ Error.business = true，附带 e.code / e.data；
 *   · 网络错误（fail、超时、非约定格式、HTTP >= 400）→ Error.business = false，e.code = -1。
 */
import Store from './state.js'
import { toLogin } from './nav.js'

/* 云开发环境：与小程序绑定的环境 ID */
export const CLOUD_ENV = 'fishing-ai-dev-d4gchkp0uf94eea4f'
/* 云托管服务名：callContainer 通过 X-WX-SERVICE 路由到该服务 */
export const CLOUD_SERVICE = 'fishing-api'

/* 是否启用 callContainer：
 * CloudBase PostgreSQL 模式环境在微信云开发中「暂不支持选择」，
 * 无法完成小程序 AppID 与环境绑定，故关闭容器通道，直接走 HTTPS。
 * 如后续迁移到传统模式环境，可改为 true 并重新绑定。
 */
const USE_CONTAINER = false

/* 后端地址（小程序 / H5 / App 统一使用）：
 * - 正式环境：云托管公网地址 + /api
 * - 本地联调：可临时改为 http://127.0.0.1:8000/api
 * @type {string}
 */
export const BASE_URL = 'https://fishing-api-355464-8-1306325032.sh.run.tcloudbase.com/api'

/* 本地存储中的 token 键名（与 Store 的业务状态分开存放，便于单独清除） */
const TOKEN_KEY = 'fishai.token'

let cloudInited = false

/** 判断当前运行时是否启用云托管 callContainer（PG 模式环境固定关闭） */
function canUseContainer() {
  if (!USE_CONTAINER) return false
  // #ifdef MP-WEIXIN
  return typeof wx !== 'undefined' && !!wx.cloud && typeof wx.cloud.callContainer === 'function'
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/** 懒初始化云开发（多次调用安全；未绑定环境时静默失败，由 HTTP 兜底） */
function ensureCloud() {
  if (cloudInited) return
  if (typeof wx !== 'undefined' && wx.cloud) {
    try {
      wx.cloud.init({ env: CLOUD_ENV, traceUser: true })
    } catch (e) { /* 环境未绑定 AppID 时忽略，后续走 HTTPS 兜底 */ }
    cloudInited = true
  }
}

/**
 * 通过云托管 callContainer 发起请求
 * @param {{path: string, method?: string, data?: *, header?: Object}} opts
 * @returns {Promise<{statusCode: number, data: *}>} 原始响应（不解包）
 */
function containerRequest(opts) {
  ensureCloud()
  const { path, method = 'GET', data = null, header = {} } = opts || {}
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: CLOUD_ENV },
      path: '/api' + path,
      method,
      data,
      header: Object.assign({}, header, { 'X-WX-SERVICE': CLOUD_SERVICE }),
      success: (res) => resolve({ statusCode: res.statusCode, data: res.data }),
      fail: (err) => reject(netError(err && err.errMsg)),
    })
  })
}

/**
 * 读取本地鉴权 token
 * @returns {string} token 字符串；未登录 / 读取异常时返回空串
 */
export function getToken() {
  try { return uni.getStorageSync(TOKEN_KEY) || '' } catch (e) { return '' }
}

/**
 * 写入或清除本地鉴权 token
 * @param {string} t token 值；传空值则删除
 * @returns {void}
 */
export function setToken(t) {
  try {
    if (t) uni.setStorageSync(TOKEN_KEY, t)
    else uni.removeStorageSync(TOKEN_KEY)
  } catch (e) { /* ignore */ }
}

/** 业务错误（后端已明确返回 code != 0），不应降级到本地 mock
 * @param {number} code 后端业务错误码
 * @param {string} [msg] 后端错误文案（缺省 '请求失败'）
 * @param {*} [data] 错误附加数据
 * @returns {Error} 带 business=true / code / data 的 Error 实例
 */
function apiError(code, msg, data) {
  const e = new Error(msg || '请求失败')
  e.code = code
  e.data = data
  e.business = true
  return e
}

/** 网络层错误（连不上后端、超时、响应格式异常），可降级到本地 mock
 * @param {string} [msg] 错误文案（缺省为通用网络异常提示）
 * @returns {Error} 带 business=false / code=-1 的 Error 实例
 */
function netError(msg) {
  const e = new Error(msg || '网络异常，请稍后重试')
  e.code = -1
  e.business = false
  return e
}

/**
 * 解析可展示的图片地址：后端已返回绝对地址，外链 / 本地临时路径原样返回，
 * 历史相对路径（/static/...）补上服务端源站。
 * @param {string} path 图片地址
 * @returns {string} 可直接用于 image src / previewImage 的地址
 */
export function mediaUrl(path) {
  const s = String(path || '')
  if (!s) return ''
  if (/^(https?:)?\/\//i.test(s) || s.indexOf('data:') === 0) return s
  if (s.indexOf('wxfile:') === 0 || s.indexOf('file:') === 0 || s.indexOf('blob:') === 0) return s
  const origin = BASE_URL.replace(/\/api\/?$/, '')
  return origin + (s.charAt(0) === '/' ? s : '/' + s)
}

/**
 * 统一处理原始响应：解包 { code, data, msg } 并区分业务错误 / 网络错误
 * @returns {Promise<*>} 解包后的 body.data
 */
function handleResponse(res) {
  let body = res.data
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (e) { body = null }
  }
  if (!body || typeof body !== 'object') body = {}
  const hasCode = typeof body.code !== 'undefined'

  if (res.statusCode === 401) {
    setToken('')
    Store.logout()
    toLogin()
    throw apiError(401, body.msg || '登录已过期，请重新登录', body.data)
  }
  if (hasCode && body.code !== 0) {
    throw apiError(body.code, body.msg, body.data)
  }
  if (res.statusCode >= 400) {
    throw netError(body.msg || ('服务异常（' + res.statusCode + '）'))
  }
  if (!hasCode) {
    throw netError('响应格式不正确')
  }
  return body.data
}

/**
 * HTTPS 兜底请求：H5 / App，或小程序 callContainer 不可用（环境未绑定等）时使用。
 * @param {{path: string, method?: string, data?: *, header?: Object, timeout?: number}} opts
 * @returns {Promise<*>} 解包后的 body.data
 */
function httpRequest(opts) {
  const { path, method = 'GET', data = null, header = {}, timeout = 12000 } = opts || {}
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + path,
      method,
      data,
      header,
      timeout,
      success: (res) => {
        try { resolve(handleResponse(res)) } catch (e) { reject(e) }
      },
      fail: (err) => reject(netError(err && err.errMsg)),
    })
  })
}

/**
 * HTTPS 兜底上传（multipart）：callContainer 失败或非小程序端使用。
 * @returns {Promise<*>} 解包后的 body.data
 */
function httpUpload(opts) {
  const { path, filePath, name = 'file', formData = {}, header = {}, timeout = 60000, onProgress } = opts || {}
  return new Promise((resolve, reject) => {
    const task = uni.uploadFile({
      url: BASE_URL + path,
      filePath,
      name,
      formData,
      header,
      timeout,
      success: (res) => {
        try { resolve(handleResponse(res)) } catch (e) { reject(e) }
      },
      fail: (err) => reject(netError(err && err.errMsg)),
    })
    if (task && typeof task.onProgressUpdate === 'function' && typeof onProgress === 'function') {
      task.onProgressUpdate((res) => onProgress(res.progress))
    }
  })
}

/**
 * 上传文件：小程序优先 callContainer + base64，失败时回退 multipart。
 * @param {{url: string, filePath: string, name?: string, formData?: Object, auth?: boolean, timeout?: number, onProgress?: Function}} opts
 *   url 为相对 BASE_URL 的路径（如 '/uploads/spot'）
 * @returns {Promise<*>} 解包后的 body.data
 */
export function upload(opts) {
  const { url, filePath, name = 'file', formData = {}, auth = true, timeout = 60000, onProgress } = opts || {}
  const header = {}
  const token = getToken()
  if (auth && token) header.Authorization = 'Bearer ' + token

  // 小程序：读文件为 base64，走 JSON 接口，避开 multipart 与域名限制
  if (canUseContainer()) {
    return new Promise((resolve, reject) => {
      const fs = uni.getFileSystemManager()
      if (!fs || !fs.readFile) {
        // 无文件系统能力时直接回退 multipart
        httpUpload({ path: url, filePath, name, formData, header, timeout, onProgress }).then(resolve).catch(reject)
        return
      }
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (r) => {
          const jsonHeader = Object.assign({ 'Content-Type': 'application/json' }, header)
          if (typeof onProgress === 'function') onProgress(30)
          containerRequest({
            path: url + '-base64',
            method: 'POST',
            data: { data: r.data },
            header: jsonHeader,
          })
            .then((res) => {
              if (typeof onProgress === 'function') onProgress(100)
              resolve(handleResponse(res))
            })
            .catch(() => {
              // 容器通道失败（环境未绑定等）→ multipart 兜底
              httpUpload({ path: url, filePath, name, formData, header, timeout, onProgress }).then(resolve).catch(reject)
            })
        },
        fail: (err) => reject(netError(err && err.errMsg)),
      })
    })
  }

  return httpUpload({ path: url, filePath, name, formData, header, timeout, onProgress })
}

/** 发起请求；成功 resolve(data)，失败 reject(Error)
 * @param {{url: string, method?: string, data?: *, auth?: boolean, timeout?: number}} opts
 *   url 为相对 BASE_URL 的路径（如 '/weather'）；auth=false 表示不注入 token（公开接口）
 * @returns {Promise<*>} 解包后的 body.data
 */
export function request(opts) {
  const { url, method = 'GET', data = null, auth = true, timeout = 12000 } = opts || {}
  const header = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (auth && token) header.Authorization = 'Bearer ' + token

  if (canUseContainer()) {
    return containerRequest({ path: url, method, data, header })
      .then(handleResponse)
      .catch((e) => {
        // 业务错误直接抛出；网络/环境错误回退 HTTPS（需配置合法域名或关闭域名校验）
        if (e && e.business) throw e
        return httpRequest({ path: url, method, data, header, timeout })
      })
  }

  return httpRequest({ path: url, method, data, header, timeout })
}

export default { request, upload, mediaUrl, getToken, setToken, BASE_URL, CLOUD_ENV, CLOUD_SERVICE }
