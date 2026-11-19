<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="每日签到" back />

      <view class="page" style="padding-top: 4px">
        <!-- 头部 -->
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

          <view class="streak-strip mt16">
            <view
              v-for="i in 7"
              :key="i"
              class="streak-strip__cell"
              :class="{ 'is-on': (i - 1) < weekStreak }"
            ></view>
          </view>

          <view class="row row--between mt12">
            <text class="tiny white82">签到即得积分，无需看广告</text>
            <text v-if="isMember" class="tag tag--glass">会员 · 每日 +{{ basePoints }} 分</text>
            <text v-else class="tag tag--glass">积分可抵 ¥{{ money(usableYuan) }}</text>
          </view>
        </view>

        <!-- 签到日历 -->
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
              <view class="day__ic">
                <AppIcon :name="dayIcon(i)" :size="14" :color="dayIconColor(i)" />
              </view>
              <text class="day__p">+{{ basePoints }}</text>
            </view>
          </view>
        </view>

        <!-- 规则 -->
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
            <text class="grow">会员每次签到 +{{ memberPoints }} 积分，非会员每次签到 +{{ normalPoints }} 积分，均无需观看广告。</text>
          </view>
        </view>

        <!-- 本次签到结果 -->
        <view v-if="lastGain" class="notice notice--info mt12">
          <AppIcon name="circle-check" :size="15" color="#0A6A6C" />
          <text class="grow">本次签到获得 +{{ lastGain.points }} 积分，当前积分 {{ points }}。</text>
        </view>

        <!-- 操作按钮（会员 / 非会员均直接签到，无任何前置操作） -->
        <view class="mt16">
          <view v-if="checkedToday" class="btn btn--block btn--lg btn--disabled">
            <text>今日已签到，明天再来</text>
          </view>
          <view v-else class="btn btn--primary btn--block btn--lg" @click="sign">
            <AppIcon name="calendar-check" :size="18" color="#FFFFFF" />
            <text>立即签到 · +{{ pot.total }} 积分</text>
          </view>
        </view>

        <!-- 余额 -->
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

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">{{ pointsPerYuan }} 积分 = 1 元 · 按 {{ pointsPerYuan }} 积分整数倍抵扣 · 单笔最多抵 10 元</text>
          <text class="tiny mt4" style="color: var(--c-ink-4); display: block">积分规则由后台配置，实时同步</text>
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
      lastGain: null,
      days: ['一', '二', '三', '四', '五', '六', '日']
    }
  },
  computed: {
    points() { return Store.points },
    isMember() { return Store.isMember },
    streak() { return Store.data.streak },
    checkedToday() { return Store.data.checkedToday },
    // 当前身份对应的签到积分（会员 / 非会员分别配置）
    basePoints() { return Store.checkinPoints },
    // 会员 / 非会员的签到积分值（用于规则说明）
    memberPoints() { return Store.config.checkin.memberPoints },
    normalPoints() { return Store.config.checkin.normalPoints },
    pointsPerYuan() { return Store.config.pointsPerYuan },
    weekStreak() { return Math.min(this.streak, 7) },
    usableYuan() { return Math.min(10, Math.floor(this.points / this.pointsPerYuan)) },
    pot() { return { base: this.basePoints, total: this.basePoints } },
    doneCount() { return Math.min(this.streak, this.days.length) },
    rules() {
      return [
        { ic: 'calendar-check', t: '每日签到', d: '会员每次 +' + this.memberPoints + ' 积分，非会员每次 +' + this.normalPoints + ' 积分，无需观看广告' },
        { ic: 'crown', t: '开通会员', d: '会员可无限次查看天气与野塘，并享受更高的签到积分' }
      ]
    }
  },
  onLoad() {
    // 先同步后台配置（签到积分规则），再拉取签到状态
    Api.ensureConfig().then(() => this.loadStatus())
  },
  methods: {
    money,
    go(url) { nav(url) },
    loadStatus() {
      Api.fetchCheckinStatus().then(res => {
        if (res.code !== 0 || !res.data) return
        const d = res.data
        Store.data.streak = d.streak
        Store.data.maxStreak = d.maxStreak
        Store.data.checkedToday = !!d.checkedToday
        if (d.days && d.days.length) this.days = d.days
        Store.save()
      })
    },
    isDone(i) { return i < this.doneCount },
    isToday(i) {
      return this.checkedToday ? i === this.doneCount - 1 : i === Math.min(this.doneCount, this.days.length - 1)
    },
    dayIcon(i) { return this.isDone(i) ? 'check' : 'circle-check' },
    dayIconColor(i) { return this.isDone(i) ? '#FFFFFF' : '#6E807E' },
    async sign() {
      if (this.checkedToday) return
      // 无前置操作：直接调用后端签到接口
      this.runCheckin()
    },
    runCheckin() {
      Api.doCheckin().then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '签到失败，请重试', 'alert-triangle'); return }
        const d = res.data || {}
        if (!d.points) { Store.data.checkedToday = true; Store.save(); this.lastGain = d; return }
        Store.addPoints(d.points)
        Store.data.streak = d.streak
        Store.data.checkedToday = true
        Store.save()
        this.lastGain = d
        ui.toast('签到成功 +' + d.points + ' 积分', 'circle-check')
      })
    }
  }
}
</script>

<style>
.white82 { color: rgba(255, 255, 255, .82); }
.big-num { font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1.15; color: #fff; }
.big-unit { font-size: 15px; font-family: var(--font-body); font-weight: 500; }
.tag--glass { background: rgba(255, 255, 255, .22); color: #fff; }
.blance-num { display: block; font-family: var(--font-display); font-size: 27px; font-weight: 700; }
.blance-yuan { font-weight: 700; color: var(--c-gold); }
.btn--disabled { background: var(--c-line-soft); color: var(--c-ink-4); box-shadow: none; }
</style>
