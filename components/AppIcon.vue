<template>
  <!-- 区块：图标本体 / 统一用 <image> 渲染 SVG DataURI，以兼容小程序与 App（不支持内联 svg） -->
  <image class="ic" :src="uri" :style="styleStr" />
</template>

<script>
/* AppIcon —— 全站唯一图标出口（Lucide 线性图标，渲染为 SVG DataURI）
 * 用法：<AppIcon name="fish" :size="20" color="#0A6A6C" />
 *
 * 职责：把图标名解析为 base64 SVG，交给 <image> 显示，保证各端表现一致且离线可用。
 * props：
 *   - name  String      图标键名（common/icons.js 中的映射键），默认 'info'，未命中时回退 info；
 *   - size  Number|String 图标边长（px），默认 20，非数字时按 20 处理；
 *   - color String      描边色，默认 '#12211F'，需传具体色值（小程序的 SVG 无法继承 currentColor）。
 * emits：无。
 * 依赖：common/icons.js 的 iconUri(name, size, color) → DataURI。
 * 注意：尺寸通过内联 width/height 控制，父级无需额外设置即可保持正比。
 */
import { iconUri } from '../common/icons.js'

export default {
  name: 'AppIcon',
  props: {
    /** 图标键名，对应 common/icons.js 的映射表；不存在时回退到 info */
    name: { type: String, default: 'info' },
    /** 图标边长（px），支持数字或数字字符串，默认 20 */
    size: { type: [Number, String], default: 20 },
    /** 描边颜色，默认墨绿黑 #12211F；必须是具体色值 */
    color: { type: String, default: '#12211F' }
  },
  computed: {
    /**
     * 计算 SVG DataURI
     * @returns {String} 形如 data:image/svg+xml;base64,... 的图片地址
     */
    uri() {
      return iconUri(this.name, Number(this.size) || 20, this.color)
    },
    /**
     * 计算尺寸样式（宽高一致，保持正方形）
     * @returns {String} 行内 style 字符串
     */
    styleStr() {
      const s = Number(this.size) || 20
      return 'width:' + s + 'px;height:' + s + 'px;'
    }
  }
}
</script>
