/* overlay.js — 全局浮层状态（唯一浮层宿主 AppOverlays 消费）
 * 页面通过 common/ui.js 的语义化方法触发，不直接改这里。
 */
import { reactive } from 'vue'

export const overlay = reactive({
  /* 通用模态（配置见 ui.openModal） */
  modal: null,
  /* 会员套餐选择弹窗（替代原付费墙 / 单次解锁） */
  paywall: null,
  /* 广告播放器 */
  ad: null,
  /* 位置选择弹层 */
  location: null,
  /* 轻提示 */
  toast: { show: false, msg: '', icon: '' }
})

export default overlay
