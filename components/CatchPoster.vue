<template>
  <view class="catch-poster">
    <image class="catch-poster__bg" :src="img" mode="aspectFill" />
    <view class="catch-poster__mask"></view>
    <view class="catch-poster__in">
      <text class="catch-poster__brand">AI 渔获预报 · FISHCAST</text>
      <text class="catch-poster__date">{{ dateText }} · {{ weather.place }}</text>
      <text class="catch-poster__level" :class="levelCls">{{ verdict.name }}</text>
      <view class="catch-poster__score">
        <text class="catch-poster__score-num">{{ verdict.score }}</text>
        <text class="catch-poster__score-lbl">出钓指数 / 100</text>
      </view>
      <text class="catch-poster__why">{{ verdict.advice }}</text>
      <view class="catch-poster__chips">
        <text v-for="(t, i) in verdict.highlights" :key="i" class="pc">{{ t }}</text>
      </view>
      <view class="catch-poster__ft">
        <view class="catch-poster__meter">
          <view class="catch-poster__meter-in" :style="'width:' + verdict.score + '%'"></view>
        </view>
        <text class="catch-poster__updated">{{ updatedText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
/* CatchPoster —— 渔获预报海报（结果卡） */
import { today, dateWeek, IMG } from '../common/utils.js'

export default {
  name: 'CatchPoster',
  props: {
    weather: { type: Object, default: () => ({}) },
    verdict: { type: Object, default: () => ({}) },
    // 当前查看的日期（'2026-11-07'）；为空表示今天
    date: { type: String, default: '' }
  },
  data() {
    return { img: IMG.weatherPoster }
  },
  computed: {
    dateText() { return this.date ? dateWeek(this.date) : today() },
    updatedText() { return String(this.weather.updated || '').replace(' 更新', '') },
    levelCls() {
      if (this.verdict.level === 'explode') return 'is-explode'
      if (this.verdict.level === 'hot') return 'is-hot'
      return 'is-slow'
    }
  }
}
</script>
