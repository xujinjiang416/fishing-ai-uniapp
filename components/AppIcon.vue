<template>
  <image class="ic" :src="uri" :style="styleStr" />
</template>

<script>
/* AppIcon —— 全站唯一图标出口（Lucide 线性图标，渲染为 SVG DataURI）
 * 用法：<AppIcon name="fish" :size="20" color="#0A6A6C" />
 */
import { iconUri } from '../common/icons.js'

export default {
  name: 'AppIcon',
  props: {
    name: { type: String, default: 'info' },
    size: { type: [Number, String], default: 20 },
    color: { type: String, default: '#12211F' }
  },
  computed: {
    uri() {
      return iconUri(this.name, Number(this.size) || 20, this.color)
    },
    styleStr() {
      const s = Number(this.size) || 20
      return 'width:' + s + 'px;height:' + s + 'px;'
    }
  }
}
</script>
