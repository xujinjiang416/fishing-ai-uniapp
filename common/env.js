/**
 * env.js — 小程序多环境配置（唯一配置入口）
 *
 * 环境划分：
 *   development：微信小程序开发版（develop）、体验版（trial）
 *   production：微信小程序正式版（release）
 *
 * 自动匹配：通过 uni.getAccountInfoSync().miniProgram.envVersion 判断，
 * 不需要在代码或构建参数里手动切换。H5 构建按 process.env.NODE_ENV 判断。
 *
 * 生产环境字段当前留空，购买云服务后只需填写 production 下的 apiBase /
 * cloudEnv / cloudService / storageBase，业务代码无需改动。
 */

/* 各环境完整配置：新增参数只改这里，request.js 与页面不感知具体地址 */
export const ENVIRONMENTS = {
  development: {
    name: '开发测试环境',
    // 云托管 API（小程序开发版 / 体验版）
    apiBase: 'https://fishing-api-355464-8-1306325032.sh.run.tcloudbase.com/api',
    // 云开发环境 ID
    cloudEnv: 'fishing-ai-dev-d4gchkp0uf94eea4f',
    // 云托管服务名
    cloudService: 'fishing-api',
    // 云存储网关（公开图片域名，供后续扩展使用）
    storageBase: 'https://fishing-ai-dev-d4gchkp0uf94eea4f.api.tcloudbasegateway.com',
    // PG 模式环境无法绑定 callContainer，保持 false
    useContainer: false
  },
  production: {
    name: '生产环境',
    // 预留：生产云服务购买后填写，例如 https://prod-api.example.com/api
    apiBase: '',
    // 预留：生产云开发环境 ID
    cloudEnv: '',
    // 预留：生产云托管服务名
    cloudService: '',
    // 预留：生产云存储网关域名
    storageBase: '',
    useContainer: false
  }
}

/**
 * 把微信运行版本映射为环境名。
 * @param {string} envVersion develop | trial | release
 * @returns {'development'|'production'}
 */
export function resolveAppEnv(envVersion) {
  return envVersion === 'release' ? 'production' : 'development'
}

/** 当前实际运行版本对应的环境名 */
export function detectAppEnv() {
  // #ifdef MP-WEIXIN
  try {
    const info = uni.getAccountInfoSync()
    const version = info && info.miniProgram && info.miniProgram.envVersion
    return resolveAppEnv(version)
  } catch (e) {
    // 读取失败时按开发测试环境处理，避免开发工具直接不可用
  }
  // #endif

  // #ifdef H5
  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
  // #endif

  return 'development'
}

export const APP_ENV = detectAppEnv()
export const ENV_CONFIG = ENVIRONMENTS[APP_ENV]
export const ENV_NAME = ENV_CONFIG.name
export const IS_ENV_CONFIGURED = Boolean(ENV_CONFIG.apiBase)
