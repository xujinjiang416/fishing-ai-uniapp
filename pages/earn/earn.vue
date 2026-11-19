<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="看广告赚积分" back />

      <view class="page" style="padding-top: 4px">
        <!-- 顶部进度 -->
        <view class="card card--water card--pad">
          <view class="row row--between" style="align-items: flex-start">
            <view>
              <text class="tiny white82" style="display: block">今日已看广告</text>
              <text class="big-num">{{ watched }}<text class="big-unit"> / {{ limit }} 条</text></text>
            </view>
            <view style="text-align: right">
              <text class="tiny white82" style="display: block">每条奖励</text>
              <text class="big-num">+{{ perAd }}<text class="big-unit"> 积分</text></text>
            </view>
          </view>

          <view class="bar mt16 bar--glass">
            <view class="bar__fill bar__fill--accent" :style="{ width: pct + '%' }"></view>
          </view>

          <view class="dots-wrap mt12">
            <view
              v-for="i in limit"
              :key="i"
              class="dot"
              :class="{ 'is-on': (i - 1) < watched }"
            ></view>
          </view>

          <view class="row row--between mt12">
            <text class="tiny white82">今日已得 +{{ earnedToday }} 积分</text>
            <text class="tiny white82">剩余可看 {{ left }} 条</text>
          </view>

          <view v-if="left <= 0" class="btn btn--block btn--lg mt16 btn--disabled">
            <text>今日额度已用完，明天再来</text>
          </view>
          <view v-else class="btn btn--block btn--lg mt16 btn--white" @click="watch">
            <AppIcon name="play-circle" :size="18" color="#0A6A6C" />
            <text>立即观看（+{{ perAd }} 积分）</text>
          </view>
        </view>

        <!-- 升级会员（套餐信息来自后台配置） -->
        <view v-if="!isMember" class="card card--gold card--pad mt12">
          <view class="row row--between" style="align-items: flex-start">
            <view class="grow">
              <view class="row" style="gap: 6px">
                <text style="font-weight: 700; font-size: 15px; color: #fff">{{ memberTitle }}</text>
                <text v-if="memberPlan && memberPlan.tag" class="tag tag--glass">{{ memberPlan.tag }}</text>
              </view>
              <text class="tiny mt4 up-hint">{{ upHint }}</text>
            </view>
            <view class="btn btn--sm btn--white" @click="go('/pages/membership/membership')">
              <text>立即开通</text>
            </view>
          </view>
        </view>

        <!-- 积分怎么用 -->
        <view class="card card--pad mt12">
          <view class="card__title" style="margin-bottom: 8px">
            <AppIcon name="coins" :size="16" color="#0A6A6C" />
            <text>积分怎么用</text>
          </view>
          <view v-for="g in guides" :key="g.t" class="row" style="gap: 10px; padding: 6px 0">
            <view class="cell__icon" :class="g.gold ? 'cell__icon--gold' : ''" style="width: 30px; height: 30px; border-radius: 9px">
              <AppIcon :name="g.ic" :size="16" :color="g.gold ? '#C08A2E' : '#0A6A6C'" />
            </view>
            <view class="grow">
              <text class="cell__t">{{ g.t }}</text>
              <text class="cell__d">{{ g.d }}</text>
            </view>
          </view>
          <view class="row row--between mt12">
            <view>
              <text class="tiny" style="display: block">当前积分</text>
              <view class="row" style="gap: 6px; align-items: baseline">
                <text class="blance-num">{{ points }}</text>
                <text class="tiny">可抵 ¥{{ money(usableYuan) }}</text>
              </view>
            </view>
            <view class="btn btn--line btn--sm" @click="go('/pages/shop/shop')">
              <AppIcon name="shopping-bag" :size="16" color="#3D4F4D" />
              <text>去商城</text>
            </view>
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">广告为演示素材，观看不计入真实广告平台</text>
          <text class="tiny mt4" style="color: var(--c-ink-4); display: block">原型演示 · 数据仅存于本机</text>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
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
    return {}
  },
  computed: {
    points() { return Store.points },
    isMember() { return Store.isMember },
    // 单次广告积分 / 每日额度均来自后台配置（禁止硬编码）
    perAd() { return Store.adPoints },
    adSeconds() { return Store.adSeconds },
    limit() { return Store.adsLimit },
    watched() { return Store.adsWatchedToday },
    left() { return Store.adsLeftToday },
    earnedToday() { return this.watched * this.perAd },
    pointsPerYuan() { return Store.config.pointsPerYuan },
    usableYuan() { return Math.min(10, Math.floor(this.points / this.pointsPerYuan)) },
    pct() { return this.limit ? Math.min(100, Math.round(this.watched / this.limit * 100)) : 0 },
    memberLimit() { return Store.config.ad.limitMember },
    normalLimit() { return Store.config.ad.limitNormal },
    // 展示用套餐（取后台配置的第一个套餐）
    memberPlan() { return (Store.plans && Store.plans[0]) || null },
    // 会员卡片标题：套餐信息取自后台配置
    memberTitle() {
      const p = this.memberPlan
      if (!p) return '开通会员'
      return '开通会员 · ¥' + money(p.price) + ' / ' + (p.durationLabel || '')
    },
    guides() {
      return [
        { ic: 'percent', gold: true, t: '商城积分抵扣', d: this.pointsPerYuan + ' 积分 = 1 元，仅支持该积分的整数倍抵扣，单笔最多抵 10 元' },
        { ic: 'play-circle', t: '额度说明', d: '普通用户每日 ' + this.normalLimit + ' 条，会员每日 ' + this.memberLimit + ' 条，次日 0 点重置' }
      ]
    },
    upHint() {
      return this.left <= 0
        ? '今日 ' + this.normalLimit + ' 条额度已用完，开通会员可提升至每日 ' + this.memberLimit + ' 条'
        : '会员每日可看 ' + this.memberLimit + ' 条，还能无限次查天气与野塘'
    }
  },
  onLoad() {
    // 同步后台广告积分配置（缓存过期会自动重新拉取）
    Api.ensureConfig()
  },
  methods: {
    money,
    go(url) { nav(url) },
    async watch() {
      if (this.left <= 0) return
      const ok = await ui.singleAd({ seconds: this.adSeconds })
      if (!ok) return
      /* rewardAd 内部已调用 Store.addAdWatch()，此处不再重复计数 */
      Api.rewardAd().then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '领取失败，请重试', 'alert-triangle'); return }
        const d = res.data || {}
        if (!d.points) return
        Store.addPoints(d.points)
        ui.toast('获得 ' + d.points + ' 积分', 'circle-check')
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
.bar--glass { background: rgba(255, 255, 255, .22); }
.dots-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.dot { width: 11px; height: 11px; border-radius: 50%; background: rgba(255, 255, 255, .28); }
.dot.is-on { background: #7FE3D2; }
.btn--white { background: #fff; color: #0A6A6C; box-shadow: none; }
.btn--white text { color: #0A6A6C; }
.btn--disabled { background: var(--c-line-soft); color: var(--c-ink-4); box-shadow: none; }
.up-hint { display: block; opacity: .92; color: #fff; }
.blance-num { font-family: var(--font-display); font-size: 21px; font-weight: 700; }
</style>
