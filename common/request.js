/* request.js — 统一 HTTP 请求层（baseURL / token 注入 / 统一响应解包 / 401 处理）
 * 全站接口调用都必须经过这里，页面禁止直接调用 uni.request。
 *
 * 后端返回契约：{ code, data, msg }，code = 0 表示成功。
 *
 * 错误分层（决定了 api.js 是否降级）：
 *   · 业务错误（HTTP 2xx 但 code != 0，或 401）→ Error.business = true，附带 e.code / e.data；
 *   · 网络错误（fail、超时、非约定格式、HTTP >= 400）→ Error.business = false，e.code = -1。
 * 本文件不做任何 mock / 本地演示数据降级，只负责如实抛出，由上层 api.js 决定兜底文案。
 * 运行环境：小程序 / App / H5（依赖 uni.request / uni storage）。
 */
import Store from './state.js'
import { toLogin } from './nav.js'

/* 后端地址：
 * - 本地联调（微信开发者工具需勾选「不校验合法域名」）：http://127.0.0.1:8000/api
 * - 真机调试：改成电脑的局域网 IP，如 http://192.168.1.10:8000/api
 * - 正式环境：必须是 HTTPS，且在小程序后台配置 request 合法域名
 * @type {string}
 */
export const BASE_URL = 'http://127.0.0.1:8000/api'

/* 本地存储中的 token 键名（与 Store 的业务状态分开存放，便于单独清除） */
const TOKEN_KEY = 'fishai.token'

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
 * 解析可展示的图片地址：后端返回的 /static/uploads/... 为相对路径，
 * 这里补上服务端源站（BASE_URL 去掉 /api），外链 / 本地临时路径原样返回。
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
 * 上传文件（multipart），与 request 共用 BASE_URL / token / 统一响应解包。
 * @param {{url: string, filePath: string, name?: string, formData?: Object, auth?: boolean, timeout?: number, onProgress?: Function}} opts
 *   url 为相对 BASE_URL 的路径（如 '/uploads/spot'）；onProgress(percent) 接收 0~100 进度
 * @returns {Promise<*>} 解包后的 body.data
 * @throws {Error} 业务错误（business=true，含 code/data）或网络错误（business=false）
 */
export function upload(opts) {
  const { url, filePath, name = 'file', formData = {}, auth = true, timeout = 60000, onProgress } = opts || {}
  return new Promise((resolve, reject) => {
    const header = {}
    const token = getToken()
    if (auth && token) header.Authorization = 'Bearer ' + token

    const task = uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header,
      timeout,
      success: res => {
        let body = res.data
        if (typeof body === 'string') {
          try { body = JSON.parse(body) } catch (e) { body = null }
        }
        if (res.statusCode === 401) {
          setToken('')
          Store.logout()
          toLogin()
          reject(apiError(401, (body && body.msg) || '登录已过期，请重新登录', body && body.data))
          return
        }
        if (body && typeof body.code !== 'undefined' && body.code !== 0) {
          reject(apiError(body.code, body.msg, body.data))
          return
        }
        if (res.statusCode >= 400) {
          reject(netError((body && body.msg) || ('服务异常（' + res.statusCode + '）')))
          return
        }
        if (!body || typeof body.code === 'undefined') {
          reject(netError('响应格式不正确'))
          return
        }
        resolve(body.data)
      },
      fail: err => reject(netError(err && err.errMsg))
    })
    if (task && typeof task.onProgressUpdate === 'function' && typeof onProgress === 'function') {
      task.onProgressUpdate(res => onProgress(res.progress))
    }
  })
}

/** 发起请求；成功 resolve(data)，失败 reject(Error)
 *  timeout：默认 12s；个别接口首屏要等大模型生成（如 /spots），调用方需自行调大。
 * @param {{url: string, method?: string, data?: *, auth?: boolean, timeout?: number}} opts
 *   url 为相对 BASE_URL 的路径（如 '/weather'）；auth=false 表示不注入 token（公开接口）
 * @returns {Promise<*>} 解包后的 body.data
 * @throws {Error} 业务错误（business=true，含 code/data）或网络错误（business=false）
 */
export function request(opts) {
  const { url, method = 'GET', data = null, auth = true, timeout = 12000 } = opts || {}
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (auth && token) header.Authorization = 'Bearer ' + token

    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      timeout,
      success: res => {
        const body = res.data || {}
        const hasCode = body && typeof body.code !== 'undefined'

        if (res.statusCode === 401) {
          setToken('')
          Store.logout()
          toLogin()
          reject(apiError(401, body.msg || '登录已过期，请重新登录', body.data))
          return
        }
        // 后端异常也统一包成 { code, data, msg }（400 / 422 / 404 等），
        // 只要带 code 就是业务错误，不能降级到本地 mock
        if (hasCode && body.code !== 0) {
          reject(apiError(body.code, body.msg, body.data))
          return
        }
        if (res.statusCode >= 400) {
          reject(netError(body.msg || ('服务异常（' + res.statusCode + '）')))
          return
        }
        if (!hasCode) {
          reject(netError('响应格式不正确'))
          return
        }
        resolve(body.data)
      },
      fail: err => reject(netError(err && err.errMsg))
    })
  })
}

export default { request, upload, mediaUrl, getToken, setToken, BASE_URL }
