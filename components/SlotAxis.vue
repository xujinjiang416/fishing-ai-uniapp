<template>
  <scroll-view scroll-x class="slot-axis" :show-scrollbar="false">
    <view class="slot-axis__row">
      <view v-for="(s, i) in slots" :key="s.time" class="slot" :class="{ 'is-now': i === nowIdx }">
        <text class="slot__time">{{ s.time }}</text>
        <text class="slot__lvl" :class="lvlColor(s.level)">{{ s.name }}</text>
        <view class="slot__bar">
          <view :class="lvlBg(s.level)" :style="'width:' + s.p + '%;height:100%;border-radius:3px'"></view>
        </view>
        <text class="slot__p">概率 {{ s.p }}%</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
/* SlotAxis —— 全天时段渔获概率轴 */
import { lvlBg, lvlColor } from '../common/utils.js'

export default {
  name: 'SlotAxis',
  props: {
    slots: { type: Array, default: () => [] },
    nowIdx: { type: Number, default: -1 }
  },
  methods: {
    lvlBg, lvlColor
  }
}
</script>
