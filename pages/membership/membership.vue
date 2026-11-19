<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="开通会员" back />

      <view class="page" style="padding-top: 4px">
        <!-- 头部 -->
        <view class="card card--gold card--pad">
          <view class="row" style="gap: 12px">
            <view class="avatar avatar--crown">
              <AppIcon name="crown" :size="22" color="#FFFFFF" />
            </view>
            <view class="grow">
              <view class="row" style="gap: 8px">
                <text style="font-size: 17px; font-weight: 700; color: #fff">渔获 AI 会员</text>
                <text class="tag tag--glass">{{ isMember ? '已开通' : (plan.tag || '推荐') }}</text>
              </view>
              <text class="tiny mt4 mb-head-sub">{{ isMember ? '有效期至 ' + memberExpire + '，续费可叠加时长' : '无限次查天气与野塘 · 全程无广告 · 会员签到积分更高' }}</text>
            </view>
            <view style="text-align: right; flex: none">
              <text class="mb-head-price">¥{{ money(plan.price) }}</text>
              <text class="tiny mb-head-per">/ {{ plan.durationLabel || '期' }}</text>
            </view>
          </view>
          <view class="row mt12" style="gap: 8px; flex-wrap: wrap">
            <text v-for="t in headTags" :key="t" class="tag tag--glass">{{ t }}</text>
          </view>
        </view>

        <!-- 权益对比 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>会员权益对比</text></view>
            <text class="tiny">会员与非会员差异</text>
          </view>
          <view class="plan-cmp">
            <view class="plan-cmp__row plan-cmp__hd">
              <view class="plan-cmp__cell"><text>权益</text></view>
              <view class="plan-cmp__cell"><text>普通用户</text></view>
              <view class="plan-cmp__cell is-member"><text>会员</text></view>
            </view>
            <view v-for="r in rows" :key="r[0]" class="plan-cmp__row">
              <view class="plan-cmp__cell"><text>{{ r[0] }}</text></view>
              <view class="plan-cmp__cell"><text>{{ r[1] }}</text></view>
              <view class="plan-cmp__cell"><text>{{ r[2] }}</text></view>
            </view>
          </view>
        </view>

        <!-- 套餐（全部来自后台配置） -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>选择套餐</text></view>
            <text class="tiny">随时可取消</text>
          </view>
          <view class="col" style="gap: 10px">
            <view
              v-for="p in plans"
              :key="p.id"
              class="price-card"
              :class="{ 'is-on': p.id === selected }"
              @click="pickPlan(p.id)"
            >
              <view class="row row--between" style="align-items: flex-start">
                <view>
                  <view class="row" style="gap: 6px; flex-wrap: wrap">
                    <text style="font-weight: 700">{{ p.name }}</text>
                    <!-- 套餐标签：每个套餐有则展示（后台配置），不再只显示第一个 -->
                    <text v-if="p.tag" class="tag tag--gold">{{ p.tag }}</text>
                    <text v-if="p.id === selected" class="tag tag--primary">已选</text>
                  </view>
                  <text class="tiny mt4" style="display: block">{{ (p.benefits || []).slice(0, 2).join(' · ') || p.durationLabel }}</text>
                </view>
                <view style="text-align: right; flex: none">
                  <text class="price-card__price">¥{{ money(p.price) }}</text>
                  <text class="tiny" style="display: block">{{ p.durationLabel }}</text>
                </view>
              </view>
            </view>
            <view v-if="!plans.length" class="notice notice--info">
              <AppIcon name="info" :size="15" color="#0A6A6C" />
              <text class="grow">暂无可选套餐，请稍后重试或联系客服。</text>
            </view>
          </view>
          <view
            class="btn btn--block btn--lg mt16"
            :class="isMember ? 'btn--gold' : 'btn--primary'"
            @click="activate"
          >
            <AppIcon name="crown" :size="18" color="#FFFFFF" />
            <text>{{ isMember ? '立即续费' : '立即开通' }} · ¥{{ money(plan.price) }}</text>
          </view>
          <text class="tiny mt8 mb-terms">开通即代表同意《会员服务协议》· 原型演示不产生真实扣款</text>
        </view>

        <!-- 常见问题 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>常见问题</text></view>
          </view>
          <view class="card">
            <view v-for="f in faq" :key="f[0]" class="cell" @click="openFaq(f)">
              <view class="cell__icon cell__icon--gold">
                <AppIcon name="info" :size="18" color="#C08A2E" />
              </view>
              <view class="grow"><text class="cell__t">{{ f[0] }}</text></view>
              <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 开通会员页
 * 需求（2、5）：支持从解锁弹窗携带 planId 进入并自动选中对应套餐；
 * 套餐名称 / 权益 / 价格全部来自后台配置，页面不做任何硬编码。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Store from '../../common/state.js'
import Api from '../../common/api.js'
import { money } from '../../common/utils.js'
import * as ui from '../../common/ui.js'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      selected: '',
      plans: [],
      faq: [
        ['如何取消自动续费？', '会员为按月自动续费，可在微信「我 → 服务 → 钱包 → 支付设置 → 自动续费」中随时关闭；关闭后当前周期结束前权益不受影响。'],
        ['会员是否全平台通用？', '同一账号在渔获 AI 小程序内全部功能通用：钓鱼天气、附近野塘、每日签到与观看广告额度同步生效。'],
        ['会员与非会员有什么区别？', '非会员无法查看钓鱼天气与附近野塘；开通会员后可无限次使用全部功能、全程无广告，签到与广告积分也更高。']
      ]
    }
  },
  computed: {
    isMember() { return Store.isMember },
    memberExpire() { return Store.data.memberExpire },
    // 当前选中套餐；未选中时回退到第一个套餐（用空对象兜底，避免报错）
    plan() {
      return this.plans.filter(p => p.id === this.selected)[0] || this.plans[0] || { name: '会员', price: 0, durationLabel: '' }
    },
    memberLimit() { return Store.config.ad.limitMember },
    normalLimit() { return Store.config.ad.limitNormal },
    memberPts() { return Store.config.checkin.memberPoints },
    normalPts() { return Store.config.checkin.normalPoints },
    headTags() {
      return ['无限次使用', '全程无广告', '签到 +' + this.memberPts + ' 分/天', '每日 ' + this.memberLimit + ' 条广告']
    },
    // 权益对比表：数据随后台配置动态生成
    rows() {
      return [
        ['查钓鱼天气', '需开通会员', '无限次'],
        ['附近野塘', '需开通会员', '无限次'],
        ['广告', '会展示', '全程无广告'],
        ['每日签到', '非会员 +' + this.normalPts + ' 分', '会员 +' + this.memberPts + ' 分'],
        ['每日看广告额度', this.normalLimit + ' 条', this.memberLimit + ' 条']
      ]
    }
  },
  onLoad(options) {
    // 从解锁弹窗携带的套餐 id（planId）自动选中
    const pid = options && (options.planId || options.id)
    if (pid) this.selected = decodeURIComponent(pid)
    this.load()
  },
  methods: {
    money,
    pickPlan(id) { this.selected = id },
    async load() {
      // 先同步后台配置（套餐、积分规则）
      await Api.ensureConfig()
      this.plans = Store.plans.slice()
      if (this.plans.length && !this.plans.some(p => p.id === this.selected)) {
        this.selected = this.plans[0].id
      }
      // 再拉取会员状态与套餐（以服务端为准）
      const res = await Api.fetchMembership()
      if (res.code === 0 && res.data) {
        const d = res.data
        Store.setMember(d.isMember)
        if (d.memberExpire) Store.data.memberExpire = d.memberExpire
        Store.save()
        if (d.plans && d.plans.length) {
          this.plans = d.plans
          if (!this.plans.some(p => p.id === this.selected)) this.selected = this.plans[0].id
        }
      }
    },
    fmtDate(d) {
      const p = n => String(n).padStart(2, '0')
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    },
    addDays(src, days) {
      let base = new Date(src)
      if (isNaN(base.getTime())) base = new Date()
      base.setDate(base.getDate() + days)
      return this.fmtDate(base)
    },
    openFaq(f) {
      ui.openModal({
        title: f[0],
        text: f[1],
        buttons: [{ text: '知道了', cls: 'line', value: true }]
      })
    },
    async activate() {
      const p = this.plan
      if (!p || !p.id) { ui.toast('暂无可开通的套餐', 'alert-triangle'); return }
      const renew = this.isMember
      const yes = await ui.confirm({
        title: renew ? '确认续费会员？' : '确认开通会员？',
        text: (renew ? '续费' : '开通') + p.name + ' ¥' + money(p.price) + '\n原型演示，不会产生真实扣款',
        okText: '确认支付 ¥' + money(p.price),
        cancelText: '再想想'
      })
      if (yes) this.doActivate()
    },
    doActivate() {
      const p = this.plan
      const cur = Store.data.memberExpire
      const start = (Store.isMember && cur && new Date(cur) > new Date()) ? cur : this.fmtDate(new Date())
      // 先向后端下单（按所选套餐 id），再落本地状态
      Api.buyMembership(p.id).then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '开通失败，请重试', 'alert-triangle'); return }
        const expire = (res.data && res.data.memberExpire) || this.addDays(start, p.duration || 30)
        Store.setMember(true)
        Store.data.memberExpire = expire
        Store.save()
        this.successModal(expire)
      })
    },
    successModal(expire) {
      ui.openModal({
        icon: 'crown',
        iconTone: 'gold',
        title: '会员权益已生效',
        sub: '有效期至 ' + expire + '，随时可取消自动续费',
        benefits: [
          { ic: 'cloud', t: '无限次查钓鱼天气', d: '非会员需开通会员后才能查看' },
          { ic: 'map-pin', t: '无限次查附近野塘', d: '由近到远实景与钓友真实评价' },
          { ic: 'shield-check', t: '全程无广告', d: '查询与签到不再插播广告' },
          { ic: 'calendar-check', t: '签到积分按会员标准发放', d: '每次签到 +' + this.memberPts + ' 分' },
          { ic: 'play-circle', t: '每日广告额度 ' + this.memberLimit + ' 条', d: '观看广告赚积分更高效' }
        ],
        buttons: [
          { text: '返回我的', cls: 'gold', value: 'profile' },
          { text: '去查天气', cls: 'line', value: 'weather' }
        ],
        dismissable: false
      }).then(v => {
        if (v === 'weather') {
          ui.nav('/pages/weather/weather')
        } else {
          ui.nav('/pages/profile/profile')
        }
      })
    }
  }
}
</script>

<style>
.avatar--crown { background: rgba(255, 255, 255, .22); color: #fff; }
.tag--glass { background: rgba(255, 255, 255, .22); color: #fff; }
.mb-head-sub { display: block; opacity: .94; color: #fff; }
.mb-head-price { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: #fff; }
.mb-head-per { display: block; opacity: .9; color: #fff; }
.mb-terms { display: block; text-align: center; }
</style>
