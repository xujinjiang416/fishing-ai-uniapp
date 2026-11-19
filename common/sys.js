/* sys.js — 系统信息（自定义导航栏所需的顶部安全区高度）
 * 说明：本项目使用 navigationStyle: custom，页面需自行留出状态栏高度。
 */
let info = {}
try { info = uni.getSystemInfoSync() || {} } catch (e) { info = {} }

/** 状态栏高度（px）；H5 为 0 */
export const statusBarHeight = info.statusBarHeight || 0

/** 底部安全区在 CSS 里用 env(safe-area-inset-bottom) 处理，这里仅保留数值备用 */
export const safeAreaBottom = (info.safeArea && info.screenHeight)
  ? Math.max(0, info.screenHeight - info.safeArea.bottom)
  : 0

export const platform = info.platform || 'devtools'

export default { statusBarHeight, safeAreaBottom, platform }
