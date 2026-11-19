<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="商品详情" back />

      <!-- 加载骨架 -->
      <view v-if="!G" class="page" style="padding-top: 8px">
        <view class="skel" style="width: 100%; height: 340px; border-radius: var(--r-lg)"></view>
        <view class="skel mt16" style="height: 20px; width: 60%"></view>
        <view class="skel mt8" style="height: 14px; width: 90%"></view>
        <view class="skel mt16" style="height: 150px; border-radius: var(--r-lg)"></view>
      </view>

      <template v-else>
        <!-- 主图 -->
        <image class="pd-hero" :src="G.img" mode="aspectFill" />

        <view class="page">
          <!-- 价格 / 标题 -->
          <view class="card card--pad pd-head">
            <view class="row pd-price">
              <text class="pd-cur">¥</text>
              <text class="pd-num">{{ money(G.price) }}</text>
              <text class="pd-orig">¥{{ money(G.orig) }}</text>
              <text v-if="save > 0" class="tag tag--accent pd-save">立省 ¥{{ money(save) }}</text>
            </view>
            <text class="pd-title">{{ G.name }}</text>
            <view class="row mt8" style="gap: 6px; flex-wrap: wrap">
              <text v-for="t in G.tags" :key="t" class="tag tag--primary">{{ t }}</text>
            </view>
            <view class="row mt8 pd-meta">
              <view class="row" style="gap: 4px">
                <AppIcon name="trending-up" :size="12" color="#6E807E" />
                <text>{{ G.sales }}</text>
              </view>
              <view class="row" style="gap: 4px">
                <AppIcon name="package" :size="12" color="#6E807E" />
                <text>库存 {{ G.stock }} 件</text>
              </view>
            </view>
          </view>

          <!-- 积分抵扣 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>积分抵扣</text></view>
              <text class="tiny">{{ pointsPerYuan }} 积分 = 1 元</text>
            </view>
            <view class="card card--pad">
              <view class="row row--between">
                <text class="muted">购买数量</text>
                <view class="stepper">
                  <view class="stepper__btn" :class="{ 'is-disabled': qty <= 1 }" @click="dec">
                    <AppIcon name="minus" :size="16" color="#12211F" />
                  </view>
                  <text class="num stepper__qty">{{ qty }}</text>
                  <view class="stepper__btn" :class="{ 'is-disabled': qty >= G.stock }" @click="inc">
                    <AppIcon name="plus" :size="16" color="#12211F" />
                  </view>
                </view>
              </view>

              <view class="hr"></view>

              <view class="points-box">
                <view class="row row--between" style="align-items: flex-start; gap: 8px">
                  <view class="row pt-cur" style="gap: 4px">
                    <AppIcon name="coins" :size="14" color="#8C6420" />
                    <text>可用积分 {{ points }}</text>
                  </view>
                  <text class="pt-label">{{ ptLabel }}</text>
                </view>

                <slider
                  class="mt12"
                  :value="usePoints"
                  :min="0"
                  :max="sliderMax"
                  :step="pointsPerYuan"
                  :disabled="maxUsable <= 0"
                  activeColor="#C08A2E"
                  backgroundColor="#E7D3A6"
                  :block-size="20"
                  @changing="onSlide"
                  @change="onSlide"
                />

                <view class="row mt12" style="gap: 8px; flex-wrap: wrap">
                  <view class="chip" @click="quick(1)"><text>抵 1 元</text></view>
                  <view class="chip" @click="quick(5)"><text>抵 5 元</text></view>
                  <view class="chip" @click="quick('max')"><text>抵满 10 元</text></view>
                </view>
              </view>

              <view class="notice notice--info mt12">
                <AppIcon name="info" :size="15" color="#0A6A6C" />
                <text class="grow">不足 {{ pointsPerYuan }} 积分整数倍部分不可用；单笔最多抵 10 元；抵扣后实付最低 0.01 元。</text>
              </view>
            </view>
          </view>

          <!-- 金额明细 -->
          <view class="section">
            <view class="card card--pad">
              <view class="row row--between">
                <text class="muted">商品金额</text>
                <text class="num">¥{{ total.toFixed(2) }}</text>
              </view>
              <view class="row row--between mt8">
                <text class="muted">积分抵扣</text>
                <text class="num" style="color: var(--c-gold)">-¥{{ deduct.toFixed(2) }}</text>
              </view>
              <view class="hr"></view>
              <view class="row row--between">
                <text style="font-weight: 600">已优惠</text>
                <text style="color: var(--c-accent-d); font-weight: 700">¥{{ deduct.toFixed(2) }}</text>
              </view>
            </view>
          </view>

          <!-- 规格 / 介绍 -->
          <view class="card mt12">
            <view class="cell">
              <view class="cell__icon"><AppIcon name="clipboard-list" :size="18" color="#0A6A6C" /></view>
              <view class="grow">
                <text class="cell__t">规格参数</text>
                <text class="muted mt4" style="display: block; line-height: 1.7">{{ G.spec }}</text>
              </view>
            </view>
            <view class="cell">
              <view class="cell__icon"><AppIcon name="info" :size="18" color="#0A6A6C" /></view>
              <view class="grow">
                <text class="cell__t">商品介绍</text>
                <text class="muted mt4" style="display: block; line-height: 1.7">{{ G.desc }}</text>
              </view>
            </view>
          </view>

          <!-- 服务保障 -->
          <view class="card card--pad mt12">
            <view class="row" style="justify-content: space-around; gap: 6px">
              <view v-for="x in services" :key="x.t" class="col" style="align-items: center; gap: 4px">
                <AppIcon :name="x.ic" :size="20" color="#0A6A6C" />
                <text class="svc-t">{{ x.t }}</text>
              </view>
            </view>
          </view>

          <view style="height: 92px"></view>
        </view>

        <!-- 结算栏 -->
        <view class="checkout-bar">
          <view class="grow">
            <text class="tiny" style="display: block">实付金额</text>
            <view class="row pd-pay" style="align-items: baseline">
              <text class="pd-pay-cur">¥</text>
              <text class="pd-pay-num">{{ pay.toFixed(2) }}</text>
            </view>
          </view>
          <view class="btn btn--accent btn--lg" style="padding: 0 32px" @click="buy">
            <text>立即购买</text>
          </view>
        </view>
      </template>
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

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      goodsId: 'g1',
      G: null,
      qty: 1,
      usePoints: 0,
      maxUsable: 0,
      services: [
        { ic: 'shield-check', t: '正品保障' },
        { ic: 'truck', t: '顺丰包邮' },
        { ic: 'refresh-cw', t: '7 天无理由' }
      ]
    }
  },
  computed: {
    points() { return Store.points },
    isMember() { return Store.isMember },
    pointsPerYuan() { return Store.config.pointsPerYuan },
    total() { return this.G ? +(this.G.price * this.qty).toFixed(2) : 0 },
    deduct() { return this.usePoints / this.pointsPerYuan },
    pay() { return Math.max(0.01, +(this.total - this.deduct).toFixed(2)) },
    save() { return this.G ? Math.max(0, +(this.G.orig - this.G.price).toFixed(2)) : 0 },
    sliderMax() { return Math.max(this.maxUsable, this.pointsPerYuan) },
    ptLabel() {
      return this.usePoints > 0
        ? '使用 ' + this.usePoints + ' 积分抵 ¥' + this.deduct.toFixed(2)
        : '未使用积分抵扣'
    }
  },
  onLoad(options) {
    this.goodsId = (options && options.id) || 'g1'
    this.load()
  },
  methods: {
    money,
    load() {
      Api.fetchGoodsDetail(this.goodsId).then(res => {
        if (res.code !== 0 || !res.data) { ui.toast(res.msg || '商品加载失败，请重试', 'alert-triangle'); return }
        this.G = res.data
        this.calcMax()
        this.usePoints = this.maxUsable // 默认按最大可用积分抵扣
      })
    },
    /* 抵扣上限：可用积分取整数倍 → 封顶 10 元 → 再受商品金额约束（保留 0.01） */
    calcMax() {
      const rate = this.pointsPerYuan
      const total = this.G.price * this.qty
      const avail = Math.floor(Store.points / rate) * rate
      const byCap = 10 * rate // 单笔最多抵 10 元
      const byAmount = Math.floor(Math.max(0, total - 0.01)) * rate
      this.maxUsable = Math.max(0, Math.min(avail, byCap, byAmount))
      if (this.usePoints > this.maxUsable) this.usePoints = this.maxUsable
    },
    inc() { if (this.qty < (this.G.stock || 99)) { this.qty++; this.calcMax() } },
    dec() { if (this.qty > 1) { this.qty--; this.calcMax() } },
    onSlide(e) { this.usePoints = Math.min(Number(e.detail.value), this.maxUsable) },
    quick(v) {
      if (v === 'max') { this.usePoints = this.maxUsable; return }
      this.usePoints = Math.min(Number(v) * this.pointsPerYuan, this.maxUsable)
    },
    async buy() {
      const yes = await ui.confirm({
        title: '确认下单',
        text: this.G.name + ' × ' + this.qty
          + '\n积分抵扣 ' + this.usePoints + ' 分（-¥' + this.deduct.toFixed(2) + '）'
          + '\n实付 ¥' + this.pay.toFixed(2),
        okText: '确认支付 ¥' + this.pay.toFixed(2)
      })
      if (yes) this.doOrder()
    },
    doOrder() {
      Api.createOrder({ goodsId: this.G.id, qty: this.qty, usePoints: this.usePoints }).then(res => {
        if (res.code !== 0 || !res.data) { ui.toast(res.msg || '下单失败，请重试', 'alert-triangle'); return }
        const o = res.data
        // 服务端已扣减积分，本地同步该余额，不再伪造本地订单
        Store.spendPoints(o.usePoints || 0)
        this.qty = 1
        this.usePoints = 0
        this.calcMax()
        this.pay(o)
      })
    },
    pay(o) {
      // 消费后端返回的 payment：真实支付参数则唤起微信支付；原型（mock）直接进入下单成功
      const p = o && o.payment
      if (p && !p.mock && p.timeStamp) {
        uni.requestPayment({
          timeStamp: p.timeStamp, nonceStr: p.nonceStr, package: p.package,
          signType: p.signType || 'RSA', paySign: p.paySign,
          success: () => this.successModal(o),
          fail: () => ui.toast('支付已取消', 'alert-triangle')
        })
      } else {
        this.successModal(o)
      }
    },
    successModal(o) {
      const member = this.isMember
      ui.openModal({
        icon: 'circle-check',
        iconTone: 'primary',
        title: '下单成功',
        sub: '订单号 ' + o.orderNo,
        rows: [
          { k: '商品', v: o.goods },
          { k: '抵扣积分', v: o.usePoints + ' 分', cls: 'gold' },
          { k: '实付金额', v: '¥' + o.payAmount.toFixed(2), cls: 'accent' },
          { k: '订单状态', v: o.status, cls: 'success' }
        ],
        notes: member ? [] : [{
          type: 'gold',
          icon: 'sparkles',
          text: '普通用户开通会员可免看广告、积分更快涨，下次下单更省。'
        }],
        buttons: [
          member ? null : { text: '开通会员再省一笔', cls: 'gold', value: 'member' },
          { text: '返回商城', cls: 'line', value: 'done' }
        ].filter(Boolean),
        dismissable: false
      }).then(v => {
        if (v === 'member') ui.nav('/pages/membership/membership')
        else ui.nav('/pages/shop/shop')
      })
    }
  }
}
</script>

<style>
.pd-hero {
  display: block;
  width: 100%;
  height: 340px;
  background: var(--c-surface-2);
}
.pd-head { margin-top: -16px; position: relative; z-index: 2; }
.pd-price { align-items: baseline; gap: 8px; }
.pd-cur { font-size: 14px; color: var(--c-accent-d); font-weight: 700; }
.pd-num {
  font-size: 26px;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--c-accent-d);
}
.pd-orig { font-size: 12px; color: var(--c-ink-4); text-decoration: line-through; }
.pd-save { margin-left: auto; }
.pd-title { display: block; margin-top: 8px; font-size: 18px; font-weight: 700; line-height: 1.4; }
.pd-meta { gap: 14px; color: var(--c-ink-3); font-size: 12px; }
.stepper__qty { min-width: 24px; text-align: center; font-weight: 700; }
.pt-cur { font-size: 13px; color: #8C6420; }
.pt-label { font-weight: 700; color: #8C6420; font-size: 13px; text-align: right; }
.svc-t { font-size: 11.5px; color: var(--c-ink-3); }
.pd-pay { gap: 1px; }
.pd-pay-cur { font-size: 14px; color: var(--c-accent-d); font-weight: 700; }
.pd-pay-num {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--c-accent-d);
  line-height: 1.2;
}
</style>
