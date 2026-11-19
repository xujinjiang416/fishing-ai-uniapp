<template>
  <view class="app">
    <view class="app-main">
      <!-- 加载骨架 -->
      <view v-if="loading" class="page" style="padding-top: 16px; padding-left: 16px; padding-right: 16px">
        <view class="skel" style="height: 232px; border-radius: 28px"></view>
        <view class="skel mt16" style="height: 150px; border-radius: 22px"></view>
        <view class="mt16">
          <view v-for="i in 2" :key="i" class="row" style="gap: 12px; padding: 10px 0">
            <view class="skel" style="width: 74px; height: 74px; border-radius: 12px"></view>
            <view class="col grow" style="gap: 8px">
              <view class="skel" style="height: 14px; width: 60%"></view>
              <view class="skel" style="height: 12px; width: 85%"></view>
              <view class="skel" style="height: 12px; width: 40%"></view>
            </view>
          </view>
        </view>
      </view>

      <template v-else>
        <!-- Hero -->
        <view class="hero reveal" style="--d: 0">
          <image class="hero__img" :src="heroImg" mode="aspectFill" />
          <view class="hero__mask"></view>
          <view class="hero__top" :style="heroTopStyle">
            <view class="loc-pill" @click="openLocation">
              <AppIcon name="crosshair" :size="15" color="#FFFFFF" />
              <text>{{ locText }}</text>
              <AppIcon name="chevron-down" :size="14" color="#FFFFFF" />
            </view>
            <view class="grow"></view>
            <view class="loc-pill" style="padding: 0 10px" @click="go('/pages/earn/earn')">
              <AppIcon name="gift" :size="16" color="#FFFFFF" />
              <text>赚积分</text>
            </view>
          </view>
          <view class="hero__body">
            <text class="hero__eyebrow">FishCast · AI 钓鱼助手</text>
            <text class="hero__title">今天去哪甩一杆？</text>
            <text class="hero__sub">定位已就绪，AI 正在为你研判今日鱼情</text>
          </view>
        </view>

        <view class="page" style="margin-top: -26px; position: relative; z-index: 2">
          <!-- 今日概览 -->
          <view class="card card--water card--pad reveal" style="--d: 1">
            <view class="row row--between" style="align-items: flex-start">
              <view>
                <text class="tiny" style="color: rgba(255,255,255,.78)">今日出钓指数</text>
                <view class="row" style="align-items: baseline; gap: 10px; margin-top: 2px">
                  <text class="ov-score">{{ V.score }}</text>
                  <text class="tag" style="background: rgba(255,255,255,.22); color: #fff; font-size: 13px">{{ V.name }}</text>
                </view>
                <text class="tiny" style="color: rgba(255,255,255,.8); margin-top: 2px">AI 研判：{{ adviceShort }}…</text>
              </view>
              <view style="text-align: right; flex: none">
                <text class="tiny ov-cond">{{ W.condition }}</text>
                <text class="tiny" style="color: rgba(255,255,255,.82)">{{ W.temp }}℃ · {{ W.pressure }}hPa</text>
                <text class="tiny" style="color: rgba(255,255,255,.82)">{{ W.windDir }}{{ W.windLevel }}</text>
              </view>
            </view>
            <view class="hr" style="background: rgba(255,255,255,.22)"></view>
            <view class="row row--between">
              <view class="row" style="gap: 4px">
                <AppIcon name="sunrise" :size="14" color="#FFFFFF" />
                <text class="tiny" style="color: rgba(255,255,255,.9)">最佳时段 {{ best.time }} · {{ best.name }}</text>
              </view>
              <view class="btn btn--sm" style="background: #fff; color: #0A6A6C" @click="goFeature('weather', '/pages/weather/weather', '开通会员查看钓鱼天气')">
                <text>查看全天预报</text>
              </view>
            </view>
            <view v-if="!isMember" class="row" style="gap: 4px; margin-top: 8px">
              <AppIcon name="lock" :size="12" color="rgba(255,255,255,.72)" />
              <text class="tiny" style="color: rgba(255,255,255,.72)">开通会员后可无限次查看天气与野塘</text>
            </view>
          </view>

          <!-- 核心功能 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>核心功能</text></view>
              <text class="section__more">按使用频次推荐</text>
            </view>
            <view class="col" style="gap: 10px">
              <view v-for="f in features" :key="f.feature" class="card card--pad reveal" :style="'--d:' + f.d" @click="goFeature(f.feature, f.href, f.lockTitle)">
                <view class="row" style="gap: 12px; align-items: flex-start">
                  <view class="cell__icon" style="width: 46px; height: 46px; border-radius: 15px">
                    <AppIcon :name="f.icon" :size="24" color="#0A6A6C" />
                  </view>
                  <view class="grow">
                    <view class="row" style="gap: 6px">
                      <text class="item__title">{{ f.title }}</text>
                      <text class="tag" :class="f.badgeCls">{{ f.badge }}</text>
                    </view>
                    <text class="muted mt4" style="line-height: 1.5; display: block">{{ f.desc }}</text>
                    <view class="row mt8" style="gap: 5px; flex-wrap: wrap">
                      <text v-for="t in f.tags" :key="t" class="tag tag--mute">{{ t }}</text>
                    </view>
                    <view v-if="!Store.isUnlocked(f.feature)" class="row mt12" style="gap: 6px">
                      <AppIcon name="lock" :size="13" color="#9AA9A7" />
                      <text class="tiny">开通会员后可无限次使用</text>
                    </view>
                    <view v-else class="row mt12" style="gap: 6px">
                      <AppIcon name="circle-check" :size="13" color="#2E9E6B" />
                      <text class="tiny" style="color: var(--c-success)">会员权益已生效，可直接使用</text>
                    </view>
                  </view>
                  <view style="align-self: center">
                    <AppIcon name="chevron-right" :size="18" color="#9AA9A7" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 积分 / 签到 -->
          <view class="section">
            <view class="grid2">
              <view class="card card--pad reveal" style="--d: 4" @click="go('/pages/shop/shop')">
                <view class="row row--between">
                  <text class="tiny">我的积分</text>
                  <AppIcon name="coins" :size="16" color="#12211F" />
                </view>
                <text class="big-num">{{ Store.data.points }}</text>
                <text class="tiny" style="color: var(--c-gold)">可抵 {{ money(Store.points / pointsPerYuan) }} 元 · {{ pointsPerYuan }} 分 = 1 元</text>
                <view class="bar mt8">
                  <view class="bar__fill bar__fill--gold" :style="'width:' + pointsPct + '%'"></view>
                </view>
              </view>
              <view class="card card--pad reveal" style="--d: 5" @click="go('/pages/checkin/checkin')">
                <view class="row row--between">
                  <text class="tiny">连续签到</text>
                  <AppIcon name="flame" :size="16" color="#12211F" />
                </view>
                <view class="row" style="align-items: baseline; margin-top: 4px">
                  <text class="big-num">{{ Store.data.streak }}</text>
                  <text style="font-size: 13px; color: var(--c-ink-3); margin-left: 2px">天</text>
                </view>
                <text class="tiny" style="color: var(--c-ink-3)">{{ checkinHint }}</text>
                <view class="streak-strip mt8">
                  <view v-for="i in 7" :key="i" class="streak-strip__cell" :class="{ 'is-on': (i - 1) < Store.data.streak }"></view>
                </view>
              </view>
            </view>
            <view class="card card--pad reveal mt12" style="--d: 5" @click="go('/pages/earn/earn')">
              <view class="row" style="gap: 12px">
                <view class="cell__icon cell__icon--accent" style="width: 44px; height: 44px; border-radius: 14px">
                  <AppIcon name="play-circle" :size="22" color="#E8662B" />
                </view>
                <view class="grow">
                  <text class="item__title" style="display: block">看广告赚积分</text>
                  <text class="muted mt4" style="display: block">每条广告 +{{ adPoints }} 积分 · {{ isMember ? '会员每日可看 ' + memberLimit + ' 条' : '每日最多 ' + normalLimit + ' 条' }}</text>
                </view>
                <text class="tag tag--accent">+{{ Store.adsLeftToday * adPoints }} 分待领</text>
              </view>
            </view>
          </view>

          <!-- 会员 -->
          <view class="section">
            <view v-if="isMember" class="card card--gold card--pad reveal" style="--d: 6">
              <view class="row" style="gap: 12px">
                <view class="avatar" style="background: rgba(255,255,255,.22)">
                  <AppIcon name="crown" :size="22" color="#FFFFFF" />
                </view>
                <view class="grow">
                  <text style="font-weight: 700; display: block">会员权益生效中</text>
                  <text class="tiny" style="opacity: .9; display: block">无限次查天气与野塘 · 全程免广告 · 签到免广告</text>
                </view>
              </view>
            </view>
            <view v-else class="card card--gold card--pad reveal" style="--d: 6">
              <view class="row row--between" style="align-items: flex-start">
                <view class="grow">
                  <view class="row" style="gap: 6px">
                    <text style="font-weight: 700; font-size: 15px">{{ memberTitle }}</text>
                    <text v-if="memberPlan && memberPlan.tag" class="tag" style="background: rgba(255,255,255,.24); color: #fff">{{ memberPlan.tag }}</text>
                  </view>
                  <text class="tiny mt4" style="opacity: .92; display: block">无限次使用 · 无任何广告 · 会员签到 +{{ checkinPoints }} 分/天 · 广告额度 {{ memberLimit }} 条/日</text>
                </view>
                <view class="btn btn--sm" style="background: #fff; color: var(--c-gold)" @click="go('/pages/membership/membership')">
                  <text>立即开通</text>
                </view>
              </view>
              <view class="row mt12" style="gap: 8px; flex-wrap: wrap">
                <text v-for="t in memberTags" :key="t" class="tag" style="background: rgba(255,255,255,.2); color: #fff">{{ t }}</text>
              </view>
            </view>
          </view>

          <!-- 出钓工具 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>出钓工具</text></view>
            </view>
            <view class="grid4">
              <view
                v-for="x in tools"
                :key="x.t"
                class="card card--pad reveal tool-cell"
                style="--d: 7"
                @click="onTool(x)"
              >
                <AppIcon :name="x.ic" :size="20" color="#0A6A6C" />
                <text class="tool-cell__t">{{ x.t }}</text>
              </view>
            </view>
          </view>

          <!-- 广告位 -->
          <view v-if="!isMember" class="section">
            <view class="card card--pad reveal ad-slot" style="--d: 8" @click="go('/pages/earn/earn')">
              <view class="row" style="gap: 10px">
                <text class="tag tag--mute">广告</text>
                <view class="grow">
                  <text style="font-size: 13.5px; font-weight: 600; display: block">{{ ad.brand }}</text>
                  <text class="tiny">{{ ad.slogan }}</text>
                </view>
                <view class="btn btn--sm btn--ghost"><text>{{ ad.cta }}</text></view>
              </view>
            </view>
          </view>

          <view class="mt24" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">渔获 AI · 数据由大模型与气象源联合生成，仅供出钓参考</text>
            <text class="tiny mt4" style="color: var(--c-ink-4); display: block">原型演示 · 不产生真实交易与扣款</text>
          </view>
        </view>
      </template>
    </view>

    <AppTabBar page="index" />
    <AppOverlays />
  </view>
</template>

<script>
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money, IMG } from '../../common/utils.js'
import { statusBarHeight } from '../../common/sys.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppIcon, AppTabBar, AppOverlays },
  data() {
    return {
      loading: true,
      W: {},
      V: {},
      SLOTS: [],
      Store,
      heroImg: IMG.lakeHero,
      ad: { brand: '', slogan: '', cta: '' },
      features: [
        {
          feature: 'weather', href: '/pages/weather/weather', icon: 'cloud',
          title: '钓鱼天气查询', badge: 'AI 预报', badgeCls: 'tag--accent',
          desc: '定位或选城市到区 · 气压/水温/风向全指标 · 全天时段鱼口概率',
          tags: ['爆户 / 狂口 / 停口', '图片形式结果', '黄金时段提醒'],
          lockTitle: '解锁「钓鱼天气查询」', d: 2
        },
        {
          feature: 'spots', href: '/pages/spots/spots', icon: 'map-pin',
          title: '附近野塘查询', badge: '实时更新', badgeCls: 'tag--primary',
          desc: '由近到远的野塘实景 · 位置一键复制导航 · 钓友真实评价',
          tags: ['实景图片', '评论可传图', '距离排序'],
          lockTitle: '解锁「附近野塘查询」', d: 3
        }
      ],
      tools: [
        { ic: 'sunrise', t: '黄金时段', href: '/pages/weather/weather', lock: 'weather' },
        { ic: 'map-pin', t: '附近野塘', href: '/pages/spots/spots', lock: 'spots' },
        { ic: 'compass', t: '钓位朝向', href: '/pages/weather/weather', lock: 'weather' },
        { ic: 'clipboard-list', t: '出钓清单', href: '/pages/profile/profile', lock: null }
      ]
    }
  },
  computed: {
    isMember() { return Store.isMember },
    locText() {
      const l = Store.location
      return String(l.city).replace('市', '') + '·' + l.district
    },
    heroTopStyle() { return 'padding-top:' + (statusBarHeight + 10) + 'px' },
    best() { return this.SLOTS[1] || this.SLOTS[0] || { time: '', name: '' } },
    adviceShort() { return String(this.V.advice || '').slice(0, 18) },
    pointsPct() { return Math.min(100, Store.data.points / 20) },
    // 广告积分 / 额度 / 套餐均以后台配置为准
    adPoints() { return Store.adPoints },
    memberLimit() { return Store.config.ad.limitMember },
    normalLimit() { return Store.config.ad.limitNormal },
    checkinPoints() { return Store.checkinPoints },
    memberPlan() { return (Store.plans && Store.plans[0]) || null },
    // 会员卡片标题：套餐信息取自后台配置
    memberTitle() {
      const p = this.memberPlan
      if (!p) return '开通会员'
      return '开通会员 · ¥' + money(p.price) + ' / ' + (p.durationLabel || '')
    },
    pointsPerYuan() { return Store.config.pointsPerYuan },
    memberTags() {
      return ['无限次查询', '全程无广告', '签到 +' + this.checkinPoints + ' 分/天', '每日 ' + this.memberLimit + ' 条广告']
    },
    checkinHint() {
      const d = Store.data
      if (d.checkedToday) return '今日已签到'
      return '今日待签到 · +' + this.checkinPoints + ' 分'
    }
  },
  onLoad() {
    // 同步后台配置（签到 / 广告 / 套餐），保证首页展示与后台一致
    Api.ensureConfig().then(() => {
      this.load()
      this.loadAd()
    })
  },
  methods: {
    money,
    load() {
      this.loading = true
      const l = Store.location
      Api.fetchWeather({
        place: l.province + ' ' + l.city + ' ' + l.district,
        placeDetail: '3 公里范围内野塘'
      }).then(res => {
        if (res.code !== 0 || !res.data) { this.loading = false; return }
        this.W = res.data.weather
        this.V = res.data.verdict
        this.SLOTS = res.data.slots
        this.loading = false
      })
    },
    loadAd() {
      Api.fetchAdCreatives().then(res => {
        if (res.code === 0 && res.data && res.data.length) this.ad = res.data[0]
      })
    },
    go(url) { nav(url) },
    async openLocation() {
      await ui.locationSheet()
      this.load()
    },
    async goFeature(feature, href, title) {
      const ok = await ui.requireUnlock({
        feature,
        title: title || '开通会员',
        sub: '开通会员后可无限次使用对应功能，且全程无广告',
        featureLabel: feature === 'weather' ? '钓鱼天气查询' : '附近野塘查询'
      })
      if (ok) nav(href)
    },
    onTool(x) {
      if (x.lock) {
        this.goFeature(x.lock, x.href, x.lock === 'weather' ? '开通会员查看钓鱼天气' : '开通会员查看附近野塘')
      } else {
        nav(x.href)
      }
    }
  }
}
</script>

<style>
/* 上移 hero 文案，避免被下方 -26px 上叠的概览卡遮住 */
.hero__body { bottom: 36px; }
.ov-score { font-family: var(--font-display); font-size: 42px; font-weight: 700; line-height: 1; color: #fff; }
.ov-cond { font-size: 13px; color: #fff; }
.big-num { font-family: var(--font-display); font-size: 27px; font-weight: 700; margin-top: 4px; display: block; }
.avatar__t { color: #fff; font-weight: 700; font-size: 12px; }
.tool-cell {
  border: 1px solid var(--c-line);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 13px 6px;
}
.tool-cell__t { font-size: 11.5px; color: var(--c-ink-2); }
.ad-slot { background: linear-gradient(120deg, #F7FBFA, #EEF6F5); }
</style>
