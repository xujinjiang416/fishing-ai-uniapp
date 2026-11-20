<template>
  <!-- 区块：全天时段轴 / 横向滚动，每个时段一格，当前时段高亮 -->
  <scroll-view scroll-x class="slot-axis" :show-scrollbar="false">
    <view class="slot-axis__row">
      <!-- 单项：时间 → 等级文案 → 概率条（宽度 = p%）→ 概率数值 -->
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
/* SlotAxis —— 全天时段渔获概率轴
 *
 * 职责：横向展示一天内各时段（如 06:00-08:00）的鱼口等级与概率，供天气页使用。
 * props：
 *   - slots  Array  时段列表，元素结构 { time: '06:00-08:00', level: 'explode|hot|fair|slow|stop', name: '等级文案', p: 概率百分比 0~100 }，默认 []；
 *   - nowIdx Number 当前时段在 slots 中的下标，-1 表示不高亮（查看未来日期时使用），默认 -1。
 * emits：无（纯展示组件）。
 * 依赖：common/utils.js 的 lvlBg / lvlColor（等级 → 概率条背景类 / 文字色类）。
 * 注意：外层 scroll-view 横向滚动，容器需给定宽度或父级 flex 约束，否则可能撑破布局。
 */
import { lvlBg, lvlColor } from '../common/utils.js'

export default {
  name: 'SlotAxis',
  props: {
    /** 时段列表：[{ time, level, name, p }]，p 为 0~100 的概率百分比 */
    slots: { type: Array, default: () => [] },
    /** 当前时段下标；-1 表示不高亮任何时段 */
    nowIdx: { type: Number, default: -1 }
  },
  methods: {
    /* 等级 → 样式工具函数直接挂到实例上供模板调用（避免在模板里写映射表） */
    lvlBg, lvlColor
  }
}
</script>
