/* request.js — 统一 HTTP 请求层（baseURL / token 注入 / 统一响应解包 / 401 处理）
 * 全站接口调用都必须经过这里，页面禁止直接调用 uni.request。
 *
 * 后端返回契约：{ code, data, msg }，code = 0 表示成功。
 */
import Store from './state.js'
import { toLogin } from './nav.js'

/* 后端地址：
 * - 本地联调（微信开发者工具需勾选「不校验合法域名」）：http://127.0.0.1:8000/api
 * - 真机调试：改成电脑的局域网 IP，如 http://192.168.1.10:8000/api
 * - 正式环境：必须是 HTTPS，且在小程序后台配置 request 合法域名
 */
export const BASE_URL = 'http://127.0.0.1:8000/api'

const TOKEN_KEY = 'fishai.token'

export function getToken() {
  try { return uni.getStorageSync(TOKEN_KEY) || '' } catch (e) { return '' }
}

export function setToken(t) {
  try {
    if (t) uni.setStorageSync(TOKEN_KEY, t)
    else uni.removeStorageSync(TOKEN_KEY)
  } catch (e) { /* ignore */ }
}

/** 业务错误（后端已明确返回 code != 0），不应降级到本地 mock */
function apiError(code, msg, data) {
  const e = new Error(msg || '请求失败')
  e.code = code
  e.data = data
  e.business = true
  return e
}

/** 网络层错误（连不上后端、超时、响应格式异常），可降级到本地 mock */
function netError(msg) {
  const e = new Error(msg || '网络异常，请确认后端服务已启动')
  e.code = -1
  e.business = false
  return e
}

/** 发起请求；成功 resolve(data)，失败 reject(Error)
 *  timeout：默认 12s；个别接口首屏要等大模型生成（如 /spots），调用方需自行调大。
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

export default { request, getToken, setToken, BASE_URL }
