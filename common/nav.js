/* nav.js — 路由与底部导航（唯一 active 规则）
 * 采用自定义 TabBar（跨端一致 + 支持自定义图标），因此 tab 页用 reLaunch 切换。
 * 同时承担「登录守卫」：所有跳转都收敛到 nav()，未登录时直接跳登录页（不再弹提示框）。
 */
import Store from './state.js'

/** 登录页路径
 * @type {string}
 */
export const LOGIN_PAGE = '/pages/login/login'

/** 4 个 tab 页路径（顺序与 AppTabBar 一致）
 * @type {string[]}
 */
export const TABS = [
  '/pages/index/index',
  '/pages/spots/spots',
  '/pages/shop/shop',
  '/pages/profile/profile'
]

/** 页面 key -> tab key（用于判断当前页应高亮哪个底部 Tab）
 * @type {Object<string, string>}
 */
export const NAV_MAP = {
  index: 'home', home: 'home', weather: 'home',
  spots: 'spots', 'spot-detail': 'spots',
  shop: 'shop', 'product-detail': 'shop',
  profile: 'profile', checkin: 'profile', earn: 'profile', membership: 'profile'
}

/**
 * 判断是否为底部 Tab 页
 * @param {string} url 页面路径（不含域名，需与 TABS 中的写法完全一致）
 * @returns {boolean} true 表示属于 4 个一级 Tab 页
 */
export function isTab(url) {
  return TABS.indexOf(url) > -1
}

/**
 * 判断目标路径是否为登录页（忽略 query / hash）
 * @param {string} url 页面路径
 * @returns {boolean} 是否为登录页
 */
function isLoginPage(url) {
  return String(url).split('?')[0].split('#')[0] === LOGIN_PAGE
}

/**
 * 打开页面（不做守卫），供守卫放行后 / 登录跳转使用
 * @param {string} url 页面路径
 * @returns {void}
 */
function openPage(url) {
  if (isTab(url)) uni.reLaunch({ url })
  else uni.navigateTo({ url })
}

/**
 * 未登录时直接跳登录页；已在登录页则不重复跳转
 * @returns {void}
 */
export function toLogin() {
  const pages = getCurrentPages()
  const cur = pages && pages.length ? String(pages[pages.length - 1].route || '') : ''
  if (cur.replace(/^\//, '') === LOGIN_PAGE.replace(/^\//, '')) return
  openPage(LOGIN_PAGE)
}

/** 打开页面：tab 页用 reLaunch，其余用 navigateTo；未登录时直接跳登录页
 * opts.force = true 可强制跳转（如退出登录后回首页）
 * @param {string} url 页面路径（可带 query，如 '/pages/spot-detail/spot-detail?id=1'）
 * @param {{force?: boolean}} [opts] 跳转选项；force 为 true 时跳过登录守卫
 * @returns {void}
 */
export function nav(url, opts) {
  opts = opts || {}
  if (!opts.force && !Store.isLoggedIn && !isLoginPage(url)) {
    toLogin()
    return
  }
  openPage(url)
}

/**
 * 返回上一页；无历史时回首页
 * @returns {void}
 */
export function back() {
  const pages = getCurrentPages()
  if (pages && pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: TABS[0] })
}

export default { TABS, NAV_MAP, isTab, nav, back, LOGIN_PAGE, toLogin }
