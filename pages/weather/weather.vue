<template>
  <!-- 区块：页面根容器 / app-main 预留底部 tabbar，浮层组件挂在最外层 -->
  <view class="app">
    <view class="app-main">
      <!-- 区块：顶部导航 / 标题 + 右侧「切换位置」，返回由 AppBar 处理 -->
      <AppBar title="钓鱼天气" back right="切换位置" @right="openLocation" />

      <view class="page">
        <!-- 区块：位置卡 / 展示当前省市区与定位详情，整卡可点击切换位置 -->
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

        <!-- 区块：日期切换 / 今天、明天、后天三档，切换即重新拉取对应日期数据 -->
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

        <!-- 区块：未登录引导 / 不发起天气查询，先让用户登录 -->
        <view v-if="needLogin" class="card card--pad mt16 reveal" style="text-align: center">
          <view class="cell__icon" style="width: 48px; height: 48px; margin: 0 auto 10px">
            <AppIcon name="user" :size="22" color="#0A6A6C" />
          </view>
          <text class="unlock-title">请先登录</text>
          <text class="muted mt4" style="display: block; line-height: 1.6">登录后才能查看对应地点的天气与鱼情研判</text>
          <view class="btn btn--primary btn--block btn--lg mt12" @click="goLogin">
            <AppIcon name="user" :size="18" color="#FFFFFF" />
            <text>去登录</text>
          </view>
        </view>

        <!-- 区块：已登录但未选点时的引导 / 不发起天气查询，先让用户选择位置 -->
        <view v-else-if="needLocation" class="card card--pad mt16 reveal" style="text-align: center">
          <view class="cell__icon" style="width: 48px; height: 48px; margin: 0 auto 10px">
            <AppIcon name="map-pin" :size="22" color="#0A6A6C" />
          </view>
          <text class="unlock-title">请先选择位置</text>
          <text class="muted mt4" style="display: block; line-height: 1.6">选择省/市/区后，才能获取对应地点的天气与鱼情研判</text>
          <view class="btn btn--primary btn--block btn--lg mt12" @click="openLocation">
            <AppIcon name="crosshair" :size="18" color="#FFFFFF" />
            <text>选择位置</text>
          </view>
        </view>

        <!-- 区块：加载骨架 / 实况卡 + 三列指标 + 海报的等高占位，减少数据回填时的布局跳动 -->
        <template v-else-if="loading">
          <view class="skel mt16" style="height: 150px; border-radius: 22px"></view>
          <view class="grid3 mt16">
            <view class="skel" style="height: 92px"></view>
            <view class="skel" style="height: 92px"></view>
            <view class="skel" style="height: 92px"></view>
          </view>
          <view class="skel mt16" style="height: 280px; border-radius: 26px"></view>
        </template>

        <template v-else>
          <!-- 区块：未开通会员遮罩 / 结果已生成但锁定，只展示开通入口（已移除看广告 / ¥1.99 解锁），下方内容整体模糊（lock-blur） -->
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

          <!-- 区块：结果主体 / 非会员时加 lock-blur 模糊，但不阻断页面滚动 -->
          <view :class="{ 'lock-blur': locked }">
            <!-- 区块：当前实况卡 / 天气状况、体感、更新时间、温度区间、日出日落与气压 -->
            <view class="card card--pad mt12 reveal" style="--d: 0">
              <view class="row row--between" style="align-items: flex-start">
                <view class="row" style="gap: 12px">
                  <view class="cell__icon" style="width: 52px; height: 52px; border-radius: 16px">
                    <AppIcon :name="W.conditionIcon" :size="28" color="#0A6A6C" />
                  </view>
                  <view>
                    <text style="font-size: 15px; font-weight: 600; display: block">{{ W.condition }}</text>
                    <text class="tiny mt4" style="display: block">体感 {{ W.tempFeel }}℃</text>
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

            <!-- 区块：气象要素 / 影响鱼口的关键指标，按 2 列 + 3 列多段分组展示 -->
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

            <!-- 区块：渔获海报 / 海报组件 + 保存、分享两个模拟操作 -->
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

            <!-- 区块：鱼情评分 / 总分环 + 四维进度条 + 适宜鱼种 + 总体依据；数据来自大模型或规则兜底 -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>鱼情评分</text></view>
                <view class="section__more">
                  <AppIcon name="flame" :size="13" color="#6E807E" />
                  <text>{{ aiGenerated ? '大模型研判' : '规则研判' }}</text>
                </view>
              </view>

              <view class="card card--pad">
                <!-- 总分：大号分数 + 等级标签 + AI 建议；右侧环形进度由 CSS 变量 p 控制 -->
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

                <!-- 四维打分：每维一条进度条 + 简短理由 -->
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

                <!-- 适宜鱼种：标签列表；总体依据：info 提示条（两者为空时不渲染） -->
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

            <!-- 区块：全天时段口型 / 横向滚动时段轴，nowIdx 高亮当前时段（未来日期为 -1） -->
            <view class="section">
              <view class="section__head">
                <view class="section__title"><text>全天时段口型</text></view>
                <text class="section__more">左右滑动 · 例如 16:00-18:00 连杆</text>
              </view>
              <SlotAxis :slots="SLOTS" :nowIdx="nowIdx" />
            </view>

            <!-- 区块：AI 出钓建议 / 固定 7 条建议模板，其中风向、温差等取自实时天气 -->
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

            <!-- 区块：底部引导按钮 / 跳转附近钓点（同样需会员鉴权） -->
            <view class="mt16">
              <view class="btn btn--primary btn--block btn--lg" @click="goSpots">
                <AppIcon name="map-pin" :size="18" color="#FFFFFF" />
                <text>查看附近钓点</text>
              </view>
            </view>
          </view>

        </template>
      </view>
    </view>

    <AppTabBar page="weather" />
    <AppOverlays />
  </view>
</template>

<script>
/* 钓鱼天气页
 *
 * 职责：按「省市区 + 日期」展示天气实况、气象要素、渔获海报、鱼情评分、时段轴与出钓建议。
 * props/emits：页面级组件，无 props、无 emits。
 * 数据来源：Api.fetchWeather({ place, placeDetail, date }) → { weather, verdict, slots }；
 *           位置与会员态来自 Store；解锁弹窗走 ui.requireUnlock。
 * 关键状态：
 *   - W / V / SLOTS：天气实况、研判结论、全天时段；
 *   - dayIdx：0 今天 / 1 明天 / 2 后天；
 *   - nowIdx：当前时段下标，仅「今天」生效；
 *   - locked：非会员时为 true，主体加 lock-blur 并顶部展示开通引导。
 * 关键交互：切换日期重新拉请求；点击位置卡或右上角切换省市区；开通会员成功后重新加载。
 * 注意：页面为长列表结构，海报与评分均依赖 W/V，二者需保证同一接口同批返回。
 */
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

/* 日期切换标签：索引即 dayIdx（0 今天 / 1 明天 / 2 后天） */
const DAY_TABS = ['今天', '明天', '后天']

/** 第 i 天的日期对象：0 今天 / 1 明天 / 2 后天 */
function dayAt(i) {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return d
}
/* 月相 → 月龄文案映射；未命中时按亮面百分比折算月龄作为兜底 */
const MOON_AGE = {
  '新月': '月龄约 0 天', '蛾眉月': '月龄约 4 天', '上弦月': '月龄约 7 天', '盈凸月': '月龄约 11 天',
  '满月': '月龄约 15 天', '亏凸月': '月龄约 19 天', '下弦月': '月龄约 22 天', '残月': '月龄约 26 天'
}

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays, CatchPoster, SlotAxis },
  data() {
    // loading 加载态；needLogin 未登录；needLocation 已登录未选点；W 天气实况；V 研判结论；SLOTS 全天时段；nowIdx 当前时段下标；dayIdx 选中日期
    return { loading: true, needLogin: false, needLocation: false, W: {}, V: {}, SLOTS: [], nowIdx: 0, dayIdx: 0 }
  },
  computed: {
    /**
     * 三个日期选项
     * @returns {Array<{label: String, date: String, md: String}>}
     *          date 为 'YYYY-MM-DD'（请求参数），md 为 'M/D'（展示用）
     */
    days() {
      return DAY_TABS.map((label, i) => {
        const d = dayAt(i)
        return { label, date: ymd(d), md: d.getMonth() + 1 + '/' + d.getDate() }
      })
    },
    /** 是否锁定：非会员即锁定（当前所有内容均属 weather 功能） */
    locked() { return !Store.isUnlocked('weather') },
    /**
     * 位置整行文案
     * @returns {String} 形如「浙江省 杭州市 西湖区」
     */
    locLine() {
      const l = Store.location
      const s = [l.province, l.city, l.district].filter(Boolean).join(' ')
      return s || '未选择位置'
    },
    /**
     * 气象要素第一组（2 列）：气压、风向风力
     * @returns {Array<{ic, k, v, u, hint}>}
     */
    metricsTop() {
      const W = this.W
      return [
        { ic: 'gauge', k: '气压', v: W.pressure, u: 'hPa' },
        { ic: 'wind', k: '风向 · 风力', v: W.windDir, u: ' ' + W.windLevel, hint: '风速 ' + W.windSpeed + ' m/s' }
      ]
    },
    /**
     * 气象要素第二组（3 列）：湿度、云量、降水量（有降水时高亮警示色）
     * @returns {Array<{ic, k, v, u, color?, hint?}>}
     */
    metricsMid() {
      const W = this.W
      const rainfall = W.rainfall != null ? W.rainfall : 0
      const rainColor = rainfall > 0 ? 'var(--c-warn)' : ''
      return [
        { ic: 'droplet', k: '相对湿度', v: W.humidity, u: '%' },
        { ic: 'cloud', k: '云量', v: W.cloudCover, u: '%' },
        { ic: 'cloud-rain', k: '降水量', v: rainfall, u: 'mm', color: rainColor, hint: '今日累计' }
      ]
    },
    /**
     * 气象要素第三组（3 列）：紫外线（0-2 弱 … >10 极强）、能见度、空气质量（按 AQI 分段着色）
     * @returns {Array<{ic, k, v, u, color, hint}>}
     */
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
    /**
     * 补充要素（2 列）：月相（附月龄与亮面）与日出日落
     * 月龄优先查 MOON_AGE 映射，缺失时按 moonIllum 折算（29.5 天周期）。
     * @returns {Array<{ic, k, v, hint?}>}
     */
    metricsExtra() {
      const W = this.W
      const moonAge = MOON_AGE[W.moonPhase] || ('月龄约 ' + Math.round(W.moonIllum / 100 * 29.5) + ' 天')
      return [
        { ic: 'moon', k: '月相', v: W.moonPhase, hint: moonAge + ' · 亮面 ' + W.moonIllum + '%' },
        { ic: 'sunrise', k: '日出 / 日落', v: W.sunrise + ' / ' + W.sunset }
      ]
    },
    // ---- 鱼情评分（由后端真实天气 + 大模型/规则引擎生成）----
    /** 总分，缺失时按 0 处理 */
    verdictScore() { return this.V.score != null ? this.V.score : 0 },
    /** 评分等级名称（如「连杆」），缺失时显示占位符 */
    verdictLevel() { return this.V.name || '—' },
    /** 是否由大模型生成（false 表示规则引擎兜底），用于标题右侧标注 */
    aiGenerated() { return !!this.V.aiGenerated },
    // 评分维度（含进度条百分比），旧缓存无该字段时回退空数组
    /**
     * 四维评分列表
     * @returns {Array<{key, name, score, reason, pct}>} pct 已限制在 0~100 用于进度条宽度
     */
    dimensions() {
      return (this.V.dimensions || []).map(d => ({
        key: d.key,
        name: d.name,
        score: d.score || 0,
        reason: d.reason || '',
        pct: Math.max(0, Math.min(100, d.score || 0))
      }))
    },
    /** 适宜鱼种列表 */
    species() { return this.V.species || [] },
    /** 总体研判依据（info 提示条） */
    verdictReason() { return this.V.reason || '' },
    /** AI 出钓建议正文（评分卡内短句） */
    verdictAdvice() { return this.V.advice || '' },
    // 按总分取标签色调（与鱼情等级联动）
    /**
     * 分数段对应的标签配色类
     * @returns {String} ≥90 gold / ≥75 success / ≥56 accent / 其余 mute
     */
    scoreTone() {
      const s = this.verdictScore
      if (s >= 90) return 'tag--gold'
      if (s >= 75) return 'tag--success'
      if (s >= 56) return 'tag--accent'
      return 'tag--mute'
    },
    /**
     * AI 出钓建议清单（7 条：钓位 / 钓法 / 饵料 / 线组 / 窗口 / 避让 / 注意）
     * 其中风向、黄金窗口与温差取自 W，其余为固定文案模板。
     * @returns {Array<{ic: String, t: String, d: String}>}
     */
    tips() {
      const W = this.W
      return [
        { ic: 'compass', t: '钓位朝向', d: '主攻北岸与东岸背风向阳处；' + W.windDir + '天选下风口缓流湾，水深 1.5-2 米最稳。' },
        { ic: 'target', t: '钓法与钓层', d: '早晚攻浅滩拉饵钓底抢口；午后鱼下潜，改钓深水或离底 20-30cm，信号更实。' },
        { ic: 'fish', t: '饵料搭配', d: '早口用腥香拉饵（腥六香四）快诱；午后换谷物本味搓饵，酒米少打勤补。' },
        { ic: 'ruler', t: '线组配置', d: '主线 1.0 + 子线 0.6、袖钩 4 号、吃铅 1.5g 细长漂；口轻时换 0.4 子线更跟口。' },
        { ic: 'clock', t: '黄金窗口', d: '上午 ' + W.goldenAm + '、下午 ' + W.goldenPm + ' 两段重点作钓，优先占位。' },
        { ic: 'alert-triangle', t: '需避开', d: '11:30-14:00 鱼基本停口，别急着收竿，补窝休息、减少抛竿频率。' },
        { ic: 'info', t: '注意事项', d: '昼夜温差约 ' + (W.tempMax - W.tempMin) + '℃，注意保暖；气压回升期别频繁挪位，守住一个窝子等鱼进窝。' }
      ]
    }
  },
  onLoad() {
    // 首次进入即拉取「今天」的数据
    this.load()
  },
  onShow() {
    // 从登录页 / 选点弹层返回后，若仍处于引导态则重新检查并加载
    if (this.needLogin || this.needLocation) this.load()
  },
  onUnload() {
    // 离开页面时回退路由栈（由 AppBar 处理），此处无需额外清理
  },
  methods: {
    /**
     * 拉取所选日期的天气与研判
     * 分步：① 置加载态并重置 nowIdx；② 用 Store 位置 + 当前日期拼参数；
     *       ③ 校验返回；④ 回填 W/V/SLOTS；⑤ 仅「今天」计算当前时段下标，未来日期置 -1。
     * @returns {void}
     */
    load() {
      const l = Store.location || {}
      // 未登录时不发起天气查询，先引导用户登录
      if (!Store.isLoggedIn) {
        this.loading = false
        this.needLogin = true
        this.needLocation = false
        this.nowIdx = 0
        ui.toast('请先登录', 'user')
        return
      }
      // 已登录但没有省/市/区时，不发起天气查询，先引导用户选择位置
      if (!(l.province || l.city || l.district)) {
        this.loading = false
        this.needLogin = false
        this.needLocation = true
        this.nowIdx = 0
        ui.toast('请先选择位置', 'map-pin')
        return
      }
      this.needLogin = false
      this.needLocation = false
      this.loading = true
      this.nowIdx = 0
      Api.fetchWeather({
        place: l.province + ' ' + l.city + ' ' + l.district,
        placeDetail: '3 公里范围内钓点',
        date: this.days[this.dayIdx].date
      }).then(res => {
        if (res.code !== 0 || !res.data) { this.loading = false; return }
        this.W = res.data.weather
        this.V = res.data.verdict
        this.SLOTS = res.data.slots
        // 只有「今天」才标出当前时段，未来日期不标
        this.nowIdx = this.dayIdx === 0 ? nowSlotIndex(this.SLOTS) : -1
        this.loading = false
        Api.track('weather_query', { locked: !!res.data.locked, date: this.days[this.dayIdx].date }, 'weather')
      })
    },
    /**
     * 切换日期：同一天点击忽略，否则更新索引并重新加载
     * @param {Number} i 0 今天 / 1 明天 / 2 后天
     * @returns {void}
     */
    pickDay(i) {
      if (i === this.dayIdx) return
      this.dayIdx = i
      this.load()
    },
    /**
     * 站内跳转（统一走 nav）
     * @param {String} url 目标页面
     * @returns {void}
     */
    go(url) { nav(url) },
    /**
     * 打开位置选择弹层，关闭后按新位置重新加载
     * @returns {Promise<void>}
     */
    async openLocation() {
      const loc = await ui.locationSheet()
      if (loc) this.needLocation = false
      this.load()
    },
    /** 跳转登录页 */
    goLogin() { ui.toLogin() },
    /**
     * 开通会员引导：弹套餐选择，选择后跳会员页；返回 true（已是会员）则重新加载解锁内容
     * @returns {Promise<void>}
     */
    async unlock() {
      const ok = await ui.requireUnlock({
        feature: 'weather',
        title: '开通会员查看钓鱼天气',
        sub: '开通会员即可无限次查看钓鱼天气与鱼情研判，全程无广告',
        featureLabel: '钓鱼天气查询'
      })
      if (ok) this.load()
    },
    /**
     * 保存海报（原型阶段仅 toast 提示，真实版下载到相册）
     * @returns {void}
     */
    savePoster() {
      ui.toast('保存海报功能即将开放', 'download')
    },
    /**
     * 分享海报（原型阶段仅 toast 提示，真实版生成分享图并唤起微信）
     * @returns {void}
     */
    sharePoster() {
      ui.toast('微信分享功能即将开放', 'share')
    },
    /**
     * 跳转附近钓点（需 spots 功能鉴权）
     * @returns {Promise<void>}
     */
    async goSpots() {
      const ok = await ui.requireUnlock({
        feature: 'spots',
        title: '开通会员查看附近钓点',
        sub: '开通会员即可无限次查看附近钓点，全程无广告',
        featureLabel: '附近钓点查询'
      })
      if (ok) nav('/pages/spots/spots')
    }
  }
}
</script>

<style>
/* 页面级局部样式：仅覆盖天气页特有元素，卡片 / 网格 / 按钮等通用样式来自全局设计系统 */
/* 位置卡：左右两端对齐，中间文本区可省略（ellipsis），保证长地名不撑破 */
.loc-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
/* 日期切换：三档等宽平分，选中态换主色底与主色边框 */
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
/* 总分行：左侧文字与右侧圆环两端对齐 */
.score-hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.score-num { font-family: var(--font-display); font-size: 44px; font-weight: 700; line-height: 1; color: var(--c-ink); }
.score-max { font-size: 13px; color: var(--c-ink-4); }
/* 环形评分：conic-gradient 按 --p（0~100 分）填充强调色，::after 挖空中心形成圆环 */
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
