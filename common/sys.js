/* sys.js — 系统信息（自定义导航栏所需的顶部安全区高度）
 * 说明：本项目使用 navigationStyle: custom，页面需自行留出状态栏高度。
 * 运行环境：均在模块加载时读取一次系统信息（静态值，不随旋转/分屏变化）；
 * 依赖 uni.getSystemInfoSync；H5 端部分字段缺失，已做 0 值兜底。
 */
let info = {}
try { info = uni.getSystemInfoSync() || {} } catch (e) { info = {} }

/**
 * 状态栏高度（px）；H5 为 0
 * 用途：自定义导航栏顶部内边距，可用 style="padding-top: statusBarHeight px" 直接绑定
 * @type {number}
 */
export const statusBarHeight = info.statusBarHeight || 0

/**
 * 底部安全区高度（px）
 * 用途：给 fixed 底部元素留出 Home 指示条空间；CSS 中优先使用 env(safe-area-inset-bottom)
 * @type {number}
 */
export const safeAreaBottom = (info.safeArea && info.screenHeight)
  ? Math.max(0, info.screenHeight - info.safeArea.bottom)
  : 0

/**
 * 运行平台标识（如 ios / android / devtools / windows）
 * @type {string}
 */
export const platform = info.platform || 'devtools'

export default { statusBarHeight, safeAreaBottom, platform }
