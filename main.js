/* main.js — uni-app 应用入口（Vue 3）
 * 运行环境：微信小程序 / App / H5（由 uni-app 编译到各端）
 * 职责：创建应用实例并交给 uni-app 运行时挂载 App.vue 根组件。
 * 依赖：vue 的 createSSRApp（Vue3 版 uni-app 要求必须使用它，不能用 createApp）。
 * 注意：本文件不接受业务逻辑；全局状态 / 请求 / UI 均放在 common 目录。
 */
import App from './App'
import { createSSRApp } from 'vue'

/**
 * 创建应用实例（uni-app 约定的固定导出名，框架启动时自动调用）
 * @returns {{ app: Object }} app 为已注册 App.vue 根组件的 Vue 应用实例
 */
export function createApp() {
  const app = createSSRApp(App) // 根组件：App.vue，仅承载全局样式与监听生命周期
  return { app }
}
