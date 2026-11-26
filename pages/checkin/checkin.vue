<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="每日签到" back />

      <view class="page" style="padding-top: 4px">
        <!-- 区块：签到头部 / 水纹卡片展示本周连签天数与今日可得积分
             布局逻辑：左右两端对齐，左侧连签、右侧今日积分；下方为 7 格进度与身份标签 -->
        <view class="card card--water card--pad">
          <view class="row row--between" style="align-items: flex-start">
            <view>
              <text class="tiny white82" style="display: block">本周连续签到</text>
              <text class="big-num">{{ weekStreak }}<text class="big-unit"> 天</text></text>
            </view>
            <view style="text-align: right">
              <text class="tiny white82" style="display: block">{{ checkedToday ? '今日已得' : '今日可得' }}</text>
              <text class="big-num">{{ pot.total }}<text class="big-unit"> 积分</text></text>
            </view>
          </view>

          <!-- 连签进度：7 格代表周一到周日，已签天数点亮，仅作展示不参与计算 -->
          <view class="streak-strip mt16">
            <view
              v-for="i in 7"
              :key="i"
              class="streak-strip__cell"
              :class="{ 'is-on': (i - 1) < weekStreak }"
            ></view>
          </view>

          <view class="row row--between mt12">
            <text class="tiny white82">签到即得积分</text>
            <text v-if="isMember" class="tag tag--glass">会员 · 每日 +{{ basePoints }} 分</text>
            <text v-else class="tag tag--glass">积分可抵 ¥{{ money(usableYuan) }}</text>
          </view>
        </view>

        <!-- 区块：签到日历 / 按后端返回的 days 渲染 7 天，is-done 标记已签、is-today 标记今日
             注意事项：每格积分文案使用 basePoints，随会员身份变化 -->
        <view class="card card--pad mt12">
          <view class="row row--between" style="margin-bottom: 12px">
            <view class="card__title">
              <AppIcon name="calendar-check" :size="16" color="#0A6A6C" />
              <text>连续签到日历</text>
            </view>
            <text class="tag" :class="isMember ? 'tag--gold' : 'tag--mute'">{{ isMember ? '会员积分' : '普通用户' }}</text>
          </view>
          <view class="checkin-grid">
            <view
              v-for="(d, i) in days"
              :key="i"
              class="day"
              :class="{ 'is-done': isDone(i), 'is-today': isToday(i) }"
            >
              <text class="day__n">周{{ d }}</text>
              <text v-if="isPast(i)" class="day__status">{{ dayStatus(i) }}</text>
              <view v-else class="day__ic">
                <AppIcon :name="dayIcon(i)" :size="14" :color="dayIconColor(i)" />
              </view>
              <text class="day__p">+{{ basePoints }}</text>
            </view>
          </view>
        </view>

        <!-- 区块：签到规则 / 列表展示 rules 配置项；底部金色提示说明会员与非会员的分值差异 -->
        <view class="card card--pad mt12">
          <view class="card__title" style="margin-bottom: 6px">
            <AppIcon name="info" :size="16" color="#0A6A6C" />
            <text>签到规则</text>
          </view>
          <view v-for="r in rules" :key="r.t" class="row" style="gap: 10px; padding: 8px 0">
            <view class="cell__icon" style="width: 30px; height: 30px; border-radius: 9px">
              <AppIcon :name="r.ic" :size="16" color="#0A6A6C" />
            </view>
            <view class="grow">
              <text class="cell__t">{{ r.t }}</text>
              <text class="cell__d">{{ r.d }}</text>
            </view>
          </view>
          <view class="notice notice--gold mt8">
            <AppIcon name="sparkles" :size="15" color="#8C6420" />
            <text class="grow">会员每次签到 +{{ memberPoints }} 积分，非会员每次签到 +{{ normalPoints }} 积分。</text>
          </view>
        </view>

        <!-- 区块：本次签到结果 / 仅在 lastGain 有值时展示，提示本次获得积分与当前余额 -->
        <view v-if="lastGain" class="notice notice--info mt12">
          <AppIcon name="circle-check" :size="15" color="#0A6A6C" />
          <text class="grow">本次签到获得 +{{ lastGain.points }} 积分{{ lastGain.bonus ? '（含周日双倍奖励）' : '' }}，当前积分 {{ points }}。</text>
        </view>

        <view v-if="weekBonusAvailable" class="notice notice--gold mt12">
          <AppIcon name="gift" :size="15" color="#8C6420" />
          <text class="grow">本周已连续签到 6 天，今天签到可获得双倍积分。</text>
        </view>

        <!-- 区块：签到操作 / 今日已签到展示置灰按钮，否则展示可点击的签到按钮
             注意事项：会员与非会员均直接签到，无广告等前置操作 -->
        <view class="mt16">
          <view v-if="checkedToday" class="btn btn--block btn--lg btn--disabled">
            <text>今日已签到，明天再来</text>
          </view>
          <view v-else class="btn btn--primary btn--block btn--lg" @click="sign">
            <AppIcon name="calendar-check" :size="18" color="#FFFFFF" />
            <text>立即签到 · +{{ pot.total }} 积分</text>
          </view>
        </view>

        <!-- 区块：积分余额 / 展示当前积分与可抵金额，并提供去商城、看广告两个入口 -->
        <view class="card card--pad mt12">
          <view class="row row--between">
            <view>
              <text class="tiny" style="display: block">当前积分余额</text>
              <text class="blance-num">{{ points }}</text>
            </view>
            <view style="text-align: right">
              <text class="tiny" style="display: block">可用于抵扣</text>
              <text class="blance-yuan">¥{{ money(usableYuan) }}</text>
            </view>
          </view>
          <view class="grid2 mt12">
            <view class="btn btn--line" @click="go('/pages/shop/shop')">
              <AppIcon name="shopping-bag" :size="16" color="#3D4F4D" />
              <text>去商城抵扣</text>
            </view>
            <view class="btn btn--ghost" @click="go('/pages/earn/earn')">
              <AppIcon name="play-circle" :size="16" color="#0A6A6C" />
              <text>看广告赚积分</text>
            </view>
          </view>
        </view>

        <!-- 区块：页脚说明 / 说明积分汇率与单笔抵扣上限，数据随后台配置实时同步 -->
        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">{{ pointsPerYuan }} 积分 = 1 元 · 单笔最多抵 {{ maxYuan }} 元 · 积分充足可 0 元购</text>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 每日签到页
 * 需求（3、5）：签到不再需要看广告 —— 会员与非会员都可以直接签到；
 * 会员每次 +N 分、非会员每次 +M 分（N/M 来自后台积分配置，页面禁止硬编码）。
 *
 * 路由参数：无
 * 数据接口：
 *   Api.ensureConfig()         同步积分配置（会员 / 非会员签到分值、积分汇率）
 *   Api.fetchCheckinStatus()   拉取连签天数与今日是否已签到
 *   Api.doCheckin()            执行签到并返回本次获得积分
 * 业务限制：
 *   - 每日仅可签到一次，checkedToday 为 true 时按钮置灰
 *   - 连签天数 streak 用于日历展示，本周最多展示 7 天
 *   - 积分抵扣：pointsPerYuan 积分 = 1 元，按整数积分抵扣，单笔最多抵 maxYuan，可足额抵至 0 元
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      // 本次签到结果：{ points, streak }，null 表示本次进入页面尚未签到
      lastGain: null,
      // 日历星期文案，默认周一至周日；后端返回 days 时以其为准
      days: ['一', '二', '三', '四', '五', '六', '日'],
      // 今日下标（周一为 0）与本周每天的真实签到状态
      todayIndex: (new Date().getDay() + 6) % 7,
      weekChecked: Array(7).fill(false),
      // 今日可领/已领积分与周日双倍资格，由签到状态接口下发
      rewardPoints: null,
      weekBonusAvailable: false
    }
  },
  computed: {
    // 当前积分余额（来自全局 Store，签到后同步更新）
    points() { return Store.points },
    // 是否会员：决定签到积分档位与页面标签样式
    isMember() { return Store.isMember },
    // 连续签到天数（服务端返回）
    streak() { return Store.data.streak },
    // 今日是否已签到：为 true 时签到按钮置灰
    checkedToday() { return Store.data.checkedToday },
    // 当前身份对应的签到积分（会员 / 非会员分别配置）
    basePoints() { return Store.checkinPoints },
    // 会员 / 非会员的签到积分值（用于规则说明）
    memberPoints() { return Store.config.checkin.memberPoints },
    normalPoints() { return Store.config.checkin.normalPoints },
    // 积分汇率：多少积分等于 1 元（后台配置）
    pointsPerYuan() { return Store.config.pointsPerYuan },
    // 本周连续签到天数：服务端按自然周计算，每周一归零
    weekStreak() { return Math.min(this.streak, 7) },
    /** 单笔全局抵扣上限（元），来自后台配置 */
    maxYuan() {
      const cap = (Store.config.pointsRules && Store.config.pointsRules.globalCap) || 1500
      return +(cap / this.pointsPerYuan).toFixed(2)
    },
    // 可抵扣金额（元）：按积分汇率换算，且不超过全局上限
    usableYuan() { return Math.min(this.maxYuan, this.points / this.pointsPerYuan) },
    // 本次签到可得积分：满足自然周条件时，周日为双倍积分
    pot() { return { base: this.basePoints, total: this.rewardPoints === null ? this.basePoints : this.rewardPoints } },
    // 签到规则文案：分值全部来自后台配置，避免前端硬编码
    rules() {
      return [
        { ic: 'calendar-check', t: '每日签到', d: '会员每次 +' + this.memberPoints + ' 积分，非会员每次 +' + this.normalPoints + ' 积分' },
        { ic: 'gift', t: '周日双倍奖励', d: '周一至周六连续签到，周日签到可获双倍积分；每周一重新计算' },
        { ic: 'crown', t: '开通会员', d: '会员可无限次查看天气与钓点，并享受更高的签到积分' }
      ]
    }
  },
  onLoad() {
    // 先同步后台配置（签到积分规则），再拉取签到状态
    Api.ensureConfig().then(() => this.loadStatus())
  },
  methods: {
    // 暴露金额格式化工具给模板使用
    money,
    /**
     * 页面内跳转
     * @param {string} url 目标页面路径
     * @returns {void}
     */
    go(url) { nav(url) },
    /**
     * 拉取签到状态（连签天数、今日是否已签、日历天数文案）
     * @returns {void}
     * 说明：仅 code === 0 且有 data 时覆盖本地状态，失败时沿用已有缓存
     */
    loadStatus() {
      Api.fetchCheckinStatus().then(res => {
        if (res.code !== 0 || !res.data) return
        const d = res.data
        Store.data.streak = d.streak
        Store.data.maxStreak = d.maxStreak
        Store.data.checkedToday = !!d.checkedToday
        if (d.days && d.days.length) this.days = d.days
        this.todayIndex = d.todayIndex
        this.weekChecked = d.weekChecked.map(Boolean)
        this.rewardPoints = d.rewardPoints
        this.weekBonusAvailable = !!d.weekBonusAvailable
        Store.save()
      })
    },
    /**
     * 判断第 i 天是否已签到
     * @param {number} i 天数下标（从 0 开始）
     * @returns {boolean}
     */
    isDone(i) { return !!this.weekChecked[i] },
    /**
     * 判断第 i 天是否早于今天
     * @param {number} i 天数下标（从 0 开始）
     * @returns {boolean}
     */
    isPast(i) { return i < this.todayIndex },
    /**
     * 过去日期的签到文字：已签与漏签均明确标注
     * @param {number} i 天数下标（从 0 开始）
     * @returns {string}
     */
    dayStatus(i) {
      if (!this.isPast(i)) return ''
      return this.isDone(i) ? '已签到' : '未签到'
    },
    /**
     * 判断第 i 天是否为「今日」高亮格
     * @param {number} i 天数下标（从 0 开始）
     * @returns {boolean}
     * 说明：按实际星期高亮今天，与本周已连续签到多少天无关
     */
    isToday(i) {
      return i === this.todayIndex
    },
    /**
     * 日历格图标
     * @param {number} i 天数下标
     * @returns {string} 已签为 check，未签为 circle-check
     */
    dayIcon(i) { return this.isDone(i) ? 'check' : 'circle-check' },
    /**
     * 日历格图标颜色
     * @param {number} i 天数下标
     * @returns {string} 已签为白色，未签为灰色
     */
    dayIconColor(i) { return this.isDone(i) ? '#FFFFFF' : '#6E807E' },
    /**
     * 点击签到（本地防重后调用后端）
     * @returns {Promise<void>}
     */
    async sign() {
      if (this.checkedToday) return
      // 无前置操作：直接调用后端签到接口
      this.runCheckin()
    },
    /**
     * 执行签到请求并同步本地积分 / 连签状态
     * @returns {void}
     * 步骤：1) 失败 toast 提示 → 2) 后端返回 0 积分时仅标记已签到
     *       3) 正常返回时累加积分、更新连签与今日状态并持久化
     */
    runCheckin() {
      Api.doCheckin().then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '签到失败，请重试', 'alert-triangle'); return }
        const d = res.data || {}
        this.$set(this.weekChecked, this.todayIndex, true)
        this.rewardPoints = d.points
        this.weekBonusAvailable = false
        Store.data.streak = d.streak
        Store.data.checkedToday = true
        if (!d.points) { Store.save(); this.lastGain = d; return }
        Store.addPoints(d.points)
        Store.save()
        this.lastGain = d
        Api.track('checkin', { points: d.points, streak: d.streak }, 'checkin')
        ui.toast((d.bonus ? '周日双倍签到成功 +' : '签到成功 +') + d.points + ' 积分', 'circle-check')
      })
    }
  }
}
</script>

<style>
/* 水纹卡片内的辅助文字 / 数字排版：数字使用展示字体，单位缩小为正文 */
.white82 { color: rgba(255, 255, 255, .82); }
.big-num { font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1.15; color: #fff; }
.big-unit { font-size: 15px; font-family: var(--font-body); font-weight: 500; }
.tag--glass { background: rgba(255, 255, 255, .22); color: #fff; }
.blance-num { display: block; font-family: var(--font-display); font-size: 27px; font-weight: 700; }
.blance-yuan { font-weight: 700; color: var(--c-gold); }
.btn--disabled { background: var(--c-line-soft); color: var(--c-ink-4); box-shadow: none; }
.day__status { width: 100%; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 13px; background: var(--c-line-soft); color: var(--c-ink-3); font-size: 10px; font-weight: 600; }
.day.is-done .day__status { background: var(--c-primary); color: #fff; }
</style>
