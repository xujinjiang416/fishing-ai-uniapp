<template>
  <!-- 区块：渔获海报整卡 / 背景图 + 遮罩 + 文案层，按 3:4 比例用于截图分享 -->
  <view class="catch-poster">
    <!-- 背景图：用 aspectFill 铺满，遮罩层负责压暗以保证白字可读 -->
    <image class="catch-poster__bg" :src="img" mode="aspectFill" />
    <view class="catch-poster__mask"></view>
    <!-- 文案层：品牌 → 日期/地点 → 结论等级 → 分数 → 建议 → 亮点标签 → 进度条 -->
    <view class="catch-poster__in">
      <text class="catch-poster__brand">AI 渔获预报 · FISHCAST</text>
      <text class="catch-poster__date">{{ dateText }} · {{ weather.place }}</text>
      <text class="catch-poster__level" :class="levelCls">{{ verdict.name }}</text>
      <view class="catch-poster__score">
        <text class="catch-poster__score-num">{{ verdict.score }}</text>
        <text class="catch-poster__score-lbl">出钓指数 / 100</text>
      </view>
      <text class="catch-poster__why">{{ verdict.advice }}</text>
      <!-- 亮点标签：由 verdict.highlights 数组渲染（气压 / 风向 / 时段等关键结论） -->
      <view class="catch-poster__chips">
        <text v-for="(t, i) in verdict.highlights" :key="i" class="pc">{{ t }}</text>
      </view>
      <!-- 底部：分数进度条（宽度 = 分数百分比）+ 数据更新时间 -->
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
/* CatchPoster —— 渔获预报海报（结果卡）
 *
 * 职责：把天气接口返回的 weather + verdict 组装成一张可截图分享的「渔获预报」卡片。
 * props：
 *   - weather Object 天气实况（用到 place、updated），默认 {}；
 *   - verdict Object 研判结论（用到 name / score / advice / highlights / level），默认 {}；
 *   - date    String 查看的日期 'YYYY-MM-DD'，默认 '' 表示今天。
 * emits：无（纯展示组件）。
 * 数据来源：Api.fetchWeather 返回的 res.data.weather 与 res.data.verdict（由父页面传入）。
 * 注意：level 仅识别 explode / hot，其余统一按 slow 着色。
 */
import { today, dateWeek, IMG } from '../common/utils.js'

export default {
  name: 'CatchPoster',
  props: {
    /** 天气实况数据，使用 place（地点名）与 updated（更新时间文案） */
    weather: { type: Object, default: () => ({}) },
    /** 鱼情研判结论，使用 name / score / advice / highlights / level */
    verdict: { type: Object, default: () => ({}) },
    // 当前查看的日期（'2026-11-07'）；为空表示今天
    date: { type: String, default: '' }
  },
  data() {
    return { img: IMG.weatherPoster }
  },
  computed: {
    /**
     * 顶部日期文案
     * @returns {String} 形如「2026-11-07 周六」；未传 date 时取今天
     */
    dateText() { return this.date ? dateWeek(this.date) : today() },
    /**
     * 去掉「 更新」后缀的更新时间
     * @returns {String} 纯时间文案
     */
    updatedText() { return String(this.weather.updated || '').replace(' 更新', '') },
    /**
     * 结论等级对应的文字色调类
     * @returns {String} is-explode | is-hot | is-slow（未知等级归为 slow）
     */
    levelCls() {
      if (this.verdict.level === 'explode') return 'is-explode'
      if (this.verdict.level === 'hot') return 'is-hot'
      return 'is-slow'
    }
  }
}
</script>
