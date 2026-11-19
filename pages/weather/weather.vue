<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="钓鱼天气" back right="切换位置" @right="openLocation" />

      <view class="page">
        <!-- 位置 -->
        <view class="card card--pad mt12 loc-card" @click="openLocation">
          <view class="row" style="gap: 10px; min-width: 0; align-items: center">
            <view class="cell__icon"><AppIcon name="crosshair" :size="18" color="#0A6A6C" /></view>
            <view class="grow" style="min-width: 0">
              <text class="ellipsis" style="display: block; font-size: 14px; font-weight: 600">{{ locLine }}</text>
              <text class="tiny">{{ W.placeDetail || '点击切换定位 / 选择城市到区' }}</text>
            </view>
          </view>
          <AppIcon name="chevron-right" :size="18" color="#9AA9A7" />
        </view>

        <!-- 日期切换：今天 / 明天 / 后天 -->
        <view class="day-tabs mt12">
          <view
            v-for="(d, i) in days"
            :key="d.date"
            class="day-tab"
            :class="{ 'day-tab--on': i === dayIdx }"
            @click="pickDay(i)"
          >
            <text class="day-tab__label">{{ d.label }}</text>
            <text class="day-tab__md">{{ d.md }}</text>
          </view>
        </view>

        <!-- 加载骨架 -->
        <template v-if="loading">
          <view class="skel mt16" style="height: 150px; border-radius: 22px"></view>
          <view class="grid3 mt16">
            <view class="skel" style="height: 92px"></view>
            <view class="skel" style="height: 92px"></view>
            <view class="skel" style="height: 92px"></view>
          </view>
          <view class="skel mt16" style="height: 280px; border-radius: 26px"></view>
        </template>

        <template v-else>
          <!-- 未开通会员提示（已移除看广告 / ¥1.99 解锁） -->
          <view v-if="locked" class="card card--pad mt12 reveal" style="text-align: center; --d: 0">
            <view class="icon-badge" style="width: 48px; height: 48px; margin: 0 auto 10px; background: var(--c-primary-l)">
              <AppIcon name="lock" :size="22" color="#0A6A6C" />
            </view>
            <text class="unlock-title">结果已生成，开通会员后查看</text>
            <text class="muted mt4" style="display: block">开通会员即可无限次查看钓鱼天气与鱼情研判，全程无广告</text>
            <view class="btn btn--primary btn--block btn--lg mt12" @click="unlock">
              <AppIcon name="crown" :size="18" color="#FFFFFF" />
              <text>开通会员查看</text>
            </view>
          </view>

          <view :class="{ 'lock-blur': locked }">
            <!-- 当前实况 -->
            <view class="card card--pad mt12 reveal" style="--d: 0">
              <view class="row row--between" style="align-items: flex-start">
                <view class="row" style="gap: 12px">
                  <view class="cell__icon" style="width: 52px; height: 52px; border-radius: 16px">
                    <AppIcon :name="W.conditionIcon" :size="28" color="#0A6A6C" />
                  </view>
                  <view>
                    <text style="font-size: 15px; font-weight: 600; display: block">{{ W.condition }}</text>
                    <text class="tiny mt4" style="display: block">体感 {{ W.tempFeel }}℃ · 水温 {{ W.waterTemp }}℃</text>
                    <view class="row mt4" style="gap: 3px">
                      <AppIcon name="clock" :size="11" color="#9AA9A7" />
                      <text class="tiny">{{ W.updated }}</text>
                    </view>
                  </view>
                </view>
                <view style="text-align: right; flex: none">
                  <view class="row" style="align-items: baseline; justify-content: flex-end">
                    <text class="wx-temp">{{ W.temp }}</text>
                    <text class="wx-unit">℃</text>
                  </view>
                  <text class="tiny mt4" style="display: block">{{ W.tempMin }}℃ ~ {{ W.tempMax }}℃</text>
                </view>
              </view>
              <view class="hr"></view>
              <view class="row row--between">
                <view class="row" style="gap: 3px">
                  <AppIcon name="sunrise" :size="13" color="#6E807E" />
                  <text class="tiny">日出 {{ W.sunrise }} · 日落 {{ W.sunset }}</text>
                </view>
                <view class="row" style="gap: 3px">
                  <AppIcon name="gauge" :size="13" color="#6E807E" />
                  <text class="tiny">气压 {{ W.pressure }} hPa</text>
                </view>
              </view>
            </view>

            <!-- 气象要素 -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>气象要素</text></view>
                <text class="section__more">影响鱼口的关键指标</text>
              </view>
              <view class="grid2">
                <view v-for="m in metricsTop" :key="m.k" class="metric">
                  <view class="metric__k">
                    <AppIcon :name="m.ic" :size="13" color="#6E807E" />
                    <text>{{ m.k }}</text>
                  </view>
                  <view class="row" style="align-items: baseline; gap: 2px">
                    <text class="metric__v" :style="m.color ? 'color:' + m.color : ''">{{ m.v }}</text>
                    <text v-if="m.u" class="metric__u">{{ m.u }}</text>
                  </view>
                  <text v-if="m.hint" class="tiny">{{ m.hint }}</text>
                </view>
              </view>

              <!-- 气压趋势小图 -->
              <view class="card card--pad mt12 reveal" style="--d: 1">
                <view class="row row--between">
                  <view class="row" style="gap: 6px">
                    <AppIcon name="gauge" :size="16" color="#12211F" />
                    <text style="font-size: 14px; font-weight: 600">近 6 小时气压趋势</text>
                  </view>
                  <view class="tag" :class="pressureUp ? 'tag--success' : 'tag--warn'">
                    <AppIcon :name="pressureUp ? 'trending-up' : 'refresh-cw'" :size="12" :color="pressureUp ? '#1D7A50' : '#A97410'" />
                    <text>{{ pressureUp ? '上升 ' : '变化 ' }}{{ W.pressure6h }} hPa</text>
                  </view>
                </view>
                <view class="row" style="align-items: flex-end; gap: 6px; height: 66px; margin-top: 12px">
                  <view
                    v-for="(b, i) in pressureBars"
                    :key="i"
                    class="grow"
                    :style="'height:' + b.h + '%;background:' + (b.last ? 'var(--c-accent)' : 'var(--c-primary)') + ';opacity:' + b.opacity + ';border-radius:5px 5px 2px 2px'"
                  ></view>
                </view>
                <view class="row row--between mt4">
                  <text class="tiny">5 小时前</text>
                  <text class="tiny">当前 {{ W.pressure }} hPa</text>
                </view>
                <text class="muted mt8" style="display: block">气压稳中有升，水体溶氧持续补充，鱼群开口意愿强，是难得的好天。</text>
              </view>

              <view class="grid3 mt12">
                <view v-for="m in metricsMid" :key="m.k" class="metric">
                  <view class="metric__k">
                    <AppIcon :name="m.ic" :size="13" color="#6E807E" />
                    <text>{{ m.k }}</text>
                  </view>
                  <view class="row" style="align-items: baseline; gap: 2px">
                    <text class="metric__v" :style="m.color ? 'color:' + m.color : ''">{{ m.v }}</text>
                    <text v-if="m.u" class="metric__u">{{ m.u }}</text>
                  </view>
                  <text v-if="m.hint" class="tiny">{{ m.hint }}</text>
                </view>
              </view>

              <view class="grid3 mt12">
                <view v-for="m in metricsBottom" :key="m.k" class="metric">
                  <view class="metric__k">
                    <AppIcon :name="m.ic" :size="13" color="#6E807E" />
                    <text>{{ m.k }}</text>
                  </view>
                  <view class="row" style="align-items: baseline; gap: 2px">
                    <text class="metric__v" :style="m.color ? 'color:' + m.color : ''">{{ m.v }}</text>
                    <text v-if="m.u" class="metric__u">{{ m.u }}</text>
                  </view>
                  <text v-if="m.hint" class="tiny">{{ m.hint }}</text>
                </view>
              </view>

              <view class="grid2 mt12">
                <view v-for="m in metricsExtra" :key="m.k" class="metric">
                  <view class="metric__k">
                    <AppIcon :name="m.ic" :size="13" color="#6E807E" />
                    <text>{{ m.k }}</text>
                  </view>
                  <view class="row" style="align-items: baseline; gap: 2px">
                    <text class="metric__v">{{ m.v }}</text>
                  </view>
                  <text v-if="m.hint" class="tiny">{{ m.hint }}</text>
                </view>
              </view>

              <view class="grid2 mt12">
                <view class="metric">
                  <view class="metric__k">
                    <AppIcon name="sunrise" :size="13" color="#6E807E" />
                    <text>上午黄金窗口</text>
                  </view>
                  <text class="metric__v">{{ W.goldenAm }}</text>
                </view>
                <view class="metric">
                  <view class="metric__k">
                    <AppIcon name="sunrise" :size="13" color="#6E807E" />
                    <text>下午黄金窗口</text>
                  </view>
                  <text class="metric__v">{{ W.goldenPm }}</text>
                </view>
              </view>

              <view class="metric mt12">
                <view class="metric__k">
                  <AppIcon name="compass" :size="13" color="#6E807E" />
                  <text>潮汐 · 日月潮</text>
                </view>
                <text class="metric__v">{{ W.solunar }}</text>
                <text class="tiny">日月引潮力决定当日整体鱼口基线</text>
              </view>
            </view>

            <!-- 渔获海报 -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>渔获海报</text></view>
                <view class="section__more">
                  <AppIcon name="sparkles" :size="13" color="#6E807E" />
                  <text>AI 结论</text>
                </view>
              </view>
              <CatchPoster :weather="W" :verdict="V" :date="days[dayIdx].date" />
              <view class="poster-actions">
                <view class="btn btn--line grow" @click="savePoster">
                  <AppIcon name="download" :size="18" color="#3D4F4D" />
                  <text>保存图片</text>
                </view>
                <view class="btn btn--primary grow" @click="sharePoster">
                  <AppIcon name="share" :size="18" color="#FFFFFF" />
                  <text>分享给钓友</text>
                </view>
              </view>
            </view>

            <!-- 鱼情评分（基于真实天气 + 大模型研判） -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>鱼情评分</text></view>
                <view class="section__more">
                  <AppIcon name="flame" :size="13" color="#6E807E" />
                  <text>{{ aiGenerated ? '大模型研判' : '规则研判' }}</text>
                </view>
              </view>

              <view class="card card--pad">
                <!-- 总分 -->
                <view class="score-hero">
                  <view class="grow">
                    <view class="row" style="gap: 8px; align-items: baseline">
                      <text class="score-num">{{ verdictScore }}</text>
                      <text class="score-max">/ 100</text>
                      <text class="tag" :class="scoreTone">{{ verdictLevel }}</text>
                    </view>
                    <text v-if="verdictAdvice" class="tiny mt6" style="line-height: 1.5; display: block">{{ verdictAdvice }}</text>
                  </view>
                  <view class="score-ring" :style="'--p:' + verdictScore"></view>
                </view>

                <!-- 四维打分 -->
                <view class="hr mt12"></view>
                <view v-for="d in dimensions" :key="d.key" class="dim">
                  <view class="row row--between">
                    <text class="dim__name">{{ d.name }}</text>
                    <text class="dim__score">{{ d.score }}</text>
                  </view>
                  <view class="dim__bar">
                    <view class="dim__fill" :style="{ width: d.pct + '%' }"></view>
                  </view>
                  <text class="tiny dim__reason">{{ d.reason }}</text>
                </view>

                <!-- 适宜鱼种 + 总体依据 -->
                <view v-if="species.length" class="row mt12" style="gap: 6px; flex-wrap: wrap; align-items: center">
                  <text class="tiny" style="color: var(--c-ink-3)">适宜鱼种</text>
                  <text v-for="s in species" :key="s" class="tag tag--primary">{{ s }}</text>
                </view>
                <view v-if="verdictReason" class="notice notice--info mt12">
                  <AppIcon name="info" :size="15" color="#0A6A6C" />
                  <text class="grow">{{ verdictReason }}</text>
                </view>
              </view>
            </view>

            <!-- 全天时段 -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>全天时段口型</text></view>
                <text class="section__more">左右滑动 · 例如 16:00-18:00 狂口</text>
              </view>
              <SlotAxis :slots="SLOTS" :nowIdx="nowIdx" />
            </view>

            <!-- AI 建议 -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>AI 出钓建议</text></view>
                <view class="section__more">
                  <AppIcon name="sparkles" :size="13" color="#6E807E" />
                  <text>大模型生成</text>
                </view>
              </view>
              <view class="card card--pad">
                <view class="col" style="gap: 12px">
                  <view v-for="x in tips" :key="x.t" class="row" style="gap: 10px; align-items: flex-start">
                    <view class="cell__icon" style="width: 32px; height: 32px; border-radius: 10px">
                      <AppIcon :name="x.ic" :size="17" color="#0A6A6C" />
                    </view>
                    <view class="grow">
                      <text style="font-size: 13.5px; font-weight: 600; display: block">{{ x.t }}</text>
                      <text class="muted" style="display: block; margin-top: 2px; line-height: 1.6">{{ x.d }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <view class="mt16">
              <view class="btn btn--primary btn--block btn--lg" @click="goSpots">
                <AppIcon name="map-pin" :size="18" color="#FFFFFF" />
                <text>查看附近野塘</text>
              </view>
            </view>
          </view>

          <view class="mt16" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">数据由大模型与气象源联合生成，仅供出钓参考</text>
            <text class="tiny mt4" style="color: var(--c-ink-4); display: block">渔获 AI · 原型演示，不产生真实交易与扣款</text>
          </view>
        </template>
      </view>
    </view>

    <AppTabBar page="weather" />
    <AppOverlays />
  </view>
</template>

<script>
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import CatchPoster from '../../components/CatchPoster.vue'
import SlotAxis from '../../components/SlotAxis.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { nowSlotIndex, ymd } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

const PRESSURE_6H = [1015.4, 1016.2, 1016.9, 1017.6, 1018.1, 1018.6]
const DAY_TABS = ['今天', '明天', '后天']

/** 第 i 天的日期对象：0 今天 / 1 明天 / 2 后天 */
function dayAt(i) {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return d
}
const MOON_AGE = {
  '新月': '月龄约 0 天', '蛾眉月': '月龄约 4 天', '上弦月': '月龄约 7 天', '盈凸月': '月龄约 11 天',
  '满月': '月龄约 15 天', '亏凸月': '月龄约 19 天', '下弦月': '月龄约 22 天', '残月': '月龄约 26 天'
}

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays, CatchPoster, SlotAxis },
  data() {
    return { loading: true, W: {}, V: {}, SLOTS: [], nowIdx: 0, dayIdx: 0 }
  },
  computed: {
    days() {
      return DAY_TABS.map((label, i) => {
        const d = dayAt(i)
        return { label, date: ymd(d), md: d.getMonth() + 1 + '/' + d.getDate() }
      })
    },
    locked() { return !Store.isUnlocked('weather') },
    locLine() {
      const l = Store.location
      return l.province + ' ' + l.city + ' ' + l.district
    },
    pressureUp() { return this.W.pressureTrend === 'up' },
    pressureBars() {
      const vals = PRESSURE_6H
      const min = Math.min.apply(null, vals)
      const max = Math.max.apply(null, vals)
      const span = (max - min) || 1
      return vals.map((v, i) => ({
        h: 32 + Math.round((v - min) / span * 66),
        opacity: i === vals.length - 1 ? 1 : (0.4 + i * 0.1),
        last: i === vals.length - 1
      }))
    },
    metricsTop() {
      const W = this.W
      const upColor = W.pressureTrend === 'up' ? 'var(--c-success)' : (W.pressureTrend === 'down' ? 'var(--c-danger)' : 'inherit')
      const trendTxt = W.pressureTrend === 'up'
        ? ('较 6 小时前上升 ' + W.pressure6h + ' hPa')
        : (W.pressureTrend === 'down' ? ('较 6 小时前下降 ' + W.pressure6h + ' hPa') : '近 6 小时基本持平')
      return [
        { ic: 'gauge', k: '气压', v: W.pressure, u: 'hPa', color: upColor, hint: trendTxt },
        { ic: 'wind', k: '风向 · 风力', v: W.windDir, u: ' ' + W.windLevel, hint: '风速 ' + W.windSpeed + ' m/s' }
      ]
    },
    metricsMid() {
      const W = this.W
      const rainColor = W.rainProb >= 60 ? 'var(--c-warn)' : ''
      return [
        { ic: 'droplet', k: '相对湿度', v: W.humidity, u: '%' },
        { ic: 'cloud', k: '云量', v: W.cloudCover, u: '%' },
        { ic: 'cloud-rain', k: '降水概率', v: W.rainProb, u: '%', color: rainColor }
      ]
    },
    metricsBottom() {
      const W = this.W
      const uvTxt = W.uv <= 2 ? '弱' : (W.uv <= 5 ? '中等' : (W.uv <= 7 ? '强' : (W.uv <= 10 ? '很强' : '极强')))
      const aqiColor = W.aqi <= 50 ? 'var(--c-success)' : (W.aqi <= 100 ? 'var(--c-warn)' : 'var(--c-danger)')
      return [
        { ic: 'sun', k: '紫外线', v: W.uv, hint: '强度 ' + uvTxt },
        { ic: 'eye', k: '能见度', v: W.visibility, u: 'km' },
        { ic: 'waves', k: '空气质量', v: W.aqi, color: aqiColor, hint: 'AQI ' + W.aqiText }
      ]
    },
    metricsExtra() {
      const W = this.W
      const moonAge = MOON_AGE[W.moonPhase] || ('月龄约 ' + Math.round(W.moonIllum / 100 * 29.5) + ' 天')
      return [
        { ic: 'moon', k: '月相', v: W.moonPhase, hint: moonAge + ' · 亮面 ' + W.moonIllum + '%' },
        { ic: 'sunrise', k: '日出 / 日落', v: W.sunrise + ' / ' + W.sunset }
      ]
    },
    // ---- 鱼情评分（由后端真实天气 + 大模型/规则引擎生成）----
    verdictScore() { return this.V.score != null ? this.V.score : 0 },
    verdictLevel() { return this.V.name || '—' },
    aiGenerated() { return !!this.V.aiGenerated },
    // 评分维度（含进度条百分比），旧缓存无该字段时回退空数组
    dimensions() {
      return (this.V.dimensions || []).map(d => ({
        key: d.key,
        name: d.name,
        score: d.score || 0,
        reason: d.reason || '',
        pct: Math.max(0, Math.min(100, d.score || 0))
      }))
    },
    species() { return this.V.species || [] },
    verdictReason() { return this.V.reason || '' },
    verdictAdvice() { return this.V.advice || '' },
    // 按总分取标签色调（与鱼情等级联动）
    scoreTone() {
      const s = this.verdictScore
      if (s >= 88) return 'tag--gold'
      if (s >= 72) return 'tag--success'
      if (s >= 58) return 'tag--accent'
      return 'tag--mute'
    },
    tips() {
      const W = this.W
      return [
        { ic: 'compass', t: '钓位朝向', d: '主攻北岸与东岸背风向阳处；' + W.windDir + '天选下风口缓流湾，水深 1.5-2 米最稳。' },
        { ic: 'target', t: '钓法与钓层', d: '早晚攻浅滩拉饵钓底抢口；午后鱼下潜，改钓深水或离底 20-30cm，信号更实。' },
        { ic: 'fish', t: '饵料搭配', d: '早口用腥香拉饵（腥六香四）快诱，' + W.waterTemp + '℃水温下腥味穿透更好；午后换谷物本味搓饵，酒米少打勤补。' },
        { ic: 'ruler', t: '线组配置', d: '主线 1.0 + 子线 0.6、袖钩 4 号、吃铅 1.5g 细长漂；口轻时换 0.4 子线更跟口。' },
        { ic: 'clock', t: '黄金窗口', d: '上午 ' + W.goldenAm + '、下午 ' + W.goldenPm + ' 两段重点作钓，优先占位。' },
        { ic: 'alert-triangle', t: '需避开', d: '11:30-14:00 鱼基本停口，别急着收竿，补窝休息、减少抛竿频率。' },
        { ic: 'info', t: '注意事项', d: '昼夜温差约 ' + (W.tempMax - W.tempMin) + '℃，注意保暖；气压回升期别频繁挪位，守住一个窝子等鱼进窝。' }
      ]
    }
  },
  onLoad() {
    this.load()
  },
  onUnload() {
    // 离开页面时回退路由栈（由 AppBar 处理），此处无需额外清理
  },
  methods: {
    load() {
      this.loading = true
      this.nowIdx = 0
      const l = Store.location
      Api.fetchWeather({
        place: l.province + ' ' + l.city + ' ' + l.district,
        placeDetail: '3 公里范围内野塘',
        date: this.days[this.dayIdx].date
      }).then(res => {
        if (res.code !== 0 || !res.data) { this.loading = false; return }
        this.W = res.data.weather
        this.V = res.data.verdict
        this.SLOTS = res.data.slots
        // 只有「今天」才标出当前时段，未来日期不标
        this.nowIdx = this.dayIdx === 0 ? nowSlotIndex(this.SLOTS) : -1
        this.loading = false
      })
    },
    pickDay(i) {
      if (i === this.dayIdx) return
      this.dayIdx = i
      this.load()
    },
    go(url) { nav(url) },
    async openLocation() {
      await ui.locationSheet()
      this.load()
    },
    async unlock() {
      const ok = await ui.requireUnlock({
        feature: 'weather',
        title: '开通会员查看钓鱼天气',
        sub: '开通会员即可无限次查看钓鱼天气与鱼情研判，全程无广告',
        featureLabel: '钓鱼天气查询'
      })
      if (ok) this.load()
    },
    savePoster() {
      ui.toast('原型演示：真实版将把海报保存到手机相册', 'download')
    },
    sharePoster() {
      ui.toast('原型演示：真实版将生成分享图并唤起微信分享', 'share')
    },
    async goSpots() {
      const ok = await ui.requireUnlock({
        feature: 'spots',
        title: '开通会员查看附近野塘',
        sub: '开通会员即可无限次查看附近野塘，全程无广告',
        featureLabel: '附近野塘查询'
      })
      if (ok) nav('/pages/spots/spots')
    }
  }
}
</script>

<style>
.loc-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.day-tabs { display: flex; gap: 8px; }
.day-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 8px 0; border-radius: 14px; background: var(--c-surface);
  border: 1px solid var(--c-line);
}
.day-tab--on { background: var(--c-primary-l); border-color: var(--c-primary); }
.day-tab__label { font-size: 14px; font-weight: 600; color: var(--c-ink-2); }
.day-tab__md { font-size: 11px; color: var(--c-ink-3); }
.day-tab--on .day-tab__label { color: var(--c-primary-d); }
.day-tab--on .day-tab__md { color: var(--c-primary); }
.wx-temp { font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1; }
.wx-unit { font-size: 15px; font-weight: 500; margin-left: 1px; }
.metric__u { font-size: 11px; color: var(--c-ink-3); }
.unlock-title { display: block; font-family: var(--font-display); font-size: 17px; font-weight: 700; }

/* ---- 鱼情评分 ---- */
.score-hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.score-num { font-family: var(--font-display); font-size: 44px; font-weight: 700; line-height: 1; color: var(--c-ink); }
.score-max { font-size: 13px; color: var(--c-ink-4); }
.score-ring {
  width: 54px; height: 54px; border-radius: 50%; flex: none;
  background: conic-gradient(var(--c-accent) calc(var(--p, 0) * 1%), var(--c-line-soft) 0);
  display: flex; align-items: center; justify-content: center;
}
.score-ring::after {
  content: ''; width: 40px; height: 40px; border-radius: 50%; background: var(--c-surface);
}
.dim { margin-top: 12px; }
.dim__name { font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.dim__score { font-family: var(--font-mono, 'SF Mono', monospace); font-size: 14px; font-weight: 700; color: var(--c-ink); }
.dim__bar { height: 6px; border-radius: 4px; background: var(--c-line-soft); margin-top: 6px; overflow: hidden; }
.dim__fill { height: 100%; border-radius: 4px; background: var(--grad-water); transition: width .4s ease; }
.dim__reason { display: block; margin-top: 4px; line-height: 1.5; color: var(--c-ink-4); }
</style>
