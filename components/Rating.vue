<template>
  <!-- 区块：星级容器 / 用两层星标叠放，前景层按百分比裁切宽度来表达评分 -->
  <view class="rate">
    <!-- 底层：5 颗灰色空星（铺满整行，作为背景刻度） -->
    <view class="rate__layer">
      <AppIcon v-for="i in 5" :key="'b' + i" name="star" :size="size" color="#DCE3E2" />
    </view>
    <!-- 前景层：5 颗金色实星，宽度 = pct，超出部分被父级裁切 -->
    <view class="rate__fg" :style="'width:' + pct">
      <AppIcon v-for="i in 5" :key="'f' + i" name="star" :size="size" color="#D9971A" />
    </view>
    <!-- 可选数值：showValue 为 true 时在星标后显示原始分值 -->
    <text v-if="showValue" class="rate__v">{{ value }}</text>
  </view>
</template>

<script>
/* Rating —— 星级（叠加裁剪实现半星，与原型一致）
 * 用法：<Rating :value="4.7" :size="12" />
 *
 * 职责：只读星级展示（不支持点击打分），通过前景层宽度裁切表现非整星评分。
 * props：
 *   - value     Number        评分值，默认 0，理论范围 0~5；
 *   - size      Number|String 单颗星边长（px），默认 12；
 *   - showValue Boolean       是否在星标右侧显示数值，默认 false。
 * emits：无。
 * 依赖：common/utils.js 的 starsPercent（把分值换算为宽度百分比）。
 */
import AppIcon from './AppIcon.vue'
import { starsPercent } from '../common/utils.js'

export default {
  name: 'Rating',
  components: { AppIcon },
  props: {
    /** 评分值（0~5），超出范围时仍按 starsPercent 计算宽度 */
    value: { type: Number, default: 0 },
    /** 单颗星边长（px），支持数字或数字字符串 */
    size: { type: [Number, String], default: 12 },
    /** 是否在星标右侧显示原始分值 */
    showValue: { type: Boolean, default: false }
  },
  computed: {
    /**
     * 前景层宽度百分比
     * @returns {String} 形如 '80%'；value 非数字时为 '0%'
     */
    pct() {
      const n = Number(this.value)
      return isNaN(n) ? '0%' : starsPercent(n)
    }
  }
}
</script>
