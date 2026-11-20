/* overlay.js — 全局浮层状态（唯一浮层宿主 AppOverlays 消费）
 * 页面通过 common/ui.js 的语义化方法触发，不直接改这里。
 * 运行环境：小程序 / App / H5（纯 Vue reactive，不依赖 DOM）。
 * 约定：每个字段为 null 表示该浮层关闭；非 null 时其内容即浮层配置（含内部 _resolve 回调）。
 */
import { reactive } from 'vue'

/**
 * 全局浮层状态对象（单一实例，模块级共享）
 * @type {{
 *   modal: Object|null,
 *   paywall: Object|null,
 *   ad: Object|null,
 *   location: Object|null,
 *   toast: { show: boolean, msg: string, icon: string }
 * }}
 */
export const overlay = reactive({
  /* 通用模态（配置见 ui.openModal） */
  modal: null,
  /* 会员套餐选择弹窗（替代原付费墙 / 单次解锁） */
  paywall: null,
  /* 广告播放器 */
  ad: null,
  /* 位置选择弹层 */
  location: null,
  /* 轻提示：show 控制显隐，msg 文本，icon 为图标名（空串表示无图标） */
  toast: { show: false, msg: '', icon: '' }
})

export default overlay
