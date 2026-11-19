<template>
  <view class="rate">
    <view class="rate__layer">
      <AppIcon v-for="i in 5" :key="'b' + i" name="star" :size="size" color="#DCE3E2" />
    </view>
    <view class="rate__fg" :style="'width:' + pct">
      <AppIcon v-for="i in 5" :key="'f' + i" name="star" :size="size" color="#D9971A" />
    </view>
    <text v-if="showValue" class="rate__v">{{ value }}</text>
  </view>
</template>

<script>
/* Rating —— 星级（叠加裁剪实现半星，与原型一致）
 * 用法：<Rating :value="4.7" :size="12" />
 */
import AppIcon from './AppIcon.vue'
import { starsPercent } from '../common/utils.js'

export default {
  name: 'Rating',
  components: { AppIcon },
  props: {
    value: { type: Number, default: 0 },
    size: { type: [Number, String], default: 12 },
    showValue: { type: Boolean, default: false }
  },
  computed: {
    pct() {
      const n = Number(this.value)
      return isNaN(n) ? '0%' : starsPercent(n)
    }
  }
}
</script>
