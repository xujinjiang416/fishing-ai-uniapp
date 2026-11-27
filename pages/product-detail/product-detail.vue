<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="商品详情" back />

      <!-- 区块：加载骨架 / 主图 + 两行文本 + 详情卡占位 / G 为 null 即展示，防止首屏空白 -->
      <view v-if="!G" class="page" style="padding-top: 8px">
        <view class="skel" style="width: 100%; height: 340px; border-radius: var(--r-lg)"></view>
        <view class="skel mt16" style="height: 20px; width: 60%"></view>
        <view class="skel mt8" style="height: 14px; width: 90%"></view>
        <view class="skel mt16" style="height: 150px; border-radius: var(--r-lg)"></view>
      </view>

      <template v-else>
        <!-- 区块：商品主图 / 通栏 340px 定高切图 / 无图时由占位背景兜底 -->
        <image class="pd-hero" :src="G.img" mode="aspectFill" />

        <view class="page">
          <!-- 区块：价格与标题 / 现价 + 划线原价 + 立省标签 + 标签行 + 销量库存 / 负 margin 上移覆盖主图 -->
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

          <!-- 区块：收货地址 / 已选则展示收件信息，未选则展示告警态与「新增」 / 支付前置条件 -->
          <view class="card card--pad addr-card" @click="openAddressPicker">
            <view v-if="selectedAddress" class="row" style="gap: 12px; align-items: flex-start">
              <view class="addr-ic"><AppIcon name="map-pin" :size="18" color="#0A6A6C" /></view>
              <view class="grow" style="min-width: 0">
                <view class="row" style="gap: 8px; flex-wrap: wrap">
                  <text class="addr-name">{{ selectedAddress.receiver }}</text>
                  <text class="addr-phone num">{{ selectedAddress.phone }}</text>
                  <text v-if="selectedAddress.isDefault" class="tag tag--primary">默认</text>
                </view>
                <text class="addr-text">{{ selectedAddress.fullAddress }}</text>
              </view>
              <AppIcon name="chevron-right" :size="18" color="#9AA9A7" />
            </view>
            <view v-else class="row" style="gap: 12px">
              <view class="addr-ic addr-ic--warn">
                <AppIcon name="alert-triangle" :size="18" color="#A97410" />
              </view>
              <view class="grow" style="min-width: 0">
                <text class="addr-name">请添加收货地址</text>
                <text class="addr-text">下单前需填写有效收货信息</text>
              </view>
              <view class="btn btn--ghost btn--sm addr-add" @click.stop="addNewAddress">新增</view>
            </view>
          </view>

          <!-- 区块：积分抵扣 / 数量步进器 + 积分滑杆 + 快捷抵扣 / 步长为汇率，超上限自动夹紧 -->
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
                  :step="1"
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
                  <view class="chip" @click="quick('max')"><text>按上限抵扣</text></view>
                </view>
              </view>

              <view class="notice notice--info mt12">
                <AppIcon name="info" :size="15" color="#0A6A6C" />
                <text class="grow">{{ pointsPerYuan }} 积分 = 1 元；单笔最多抵 {{ maxYuan }} 元，不限商品品类；积分充足时可足额抵扣至 0 元。</text>
              </view>
            </view>
          </view>

          <!-- 区块：金额明细 / 商品金额、积分抵扣、已优惠三行 / 抵扣金额由 usePoints 实时计算 -->
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

          <!-- 区块：规格与介绍 / 两行信息单元 / 文案过长时自然换行，不做截断 -->
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

          <!-- 区块：配送与售后规则 / 与后端全商品统一配置保持一致 -->
          <view class="notice notice--info mt12">
            <AppIcon name="info" :size="15" color="#0A6A6C" />
            <view class="grow">
              <text class="policy-line">{{ shopPolicy.deliveryPolicy }}</text>
              <text class="policy-line">{{ shopPolicy.afterSalePolicy }}</text>
            </view>
          </view>

          <!-- 占位：为 fixed 结算栏留出高度，避免最后一张卡片被遮挡 -->
          <view style="height: 92px"></view>
        </view>

        <!-- 区块：结算栏 / fixed 吸底（含 env 安全区 padding），左侧实付、右侧购买 / 高度与上方 92px 占位对应 -->
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

    <!-- 全局：全局浮层（登录/解锁/确认弹窗） -->
    <AppOverlays />
  </view>
</template>

<script>
/* 商品详情页
 * 路由参数：id —— 商品 ID（缺省 'g1'）
 * 数据接口：Api.fetchGoodsDetail(id)、Api.fetchAddresses()、Api.createOrder({ goodsId, qty, usePoints, addressId })
 * 关键交互：数量加减、积分滑杆/快捷抵扣、选择收货地址、确认下单、拉起支付
 * 业务限制：数量 1 ~ 库存；积分按整数抵扣、单笔封顶 10 元，积分充足可 0 元购；下单必须有有效地址
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money } from '../../common/utils.js'
import { nav } from '../../common/nav.js'
import * as ui from '../../common/ui.js'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      goodsId: 'g1', // 商品 ID，来自路由参数 ?id=，缺省 g1（演示数据）
      G: null, // 商品详情对象：price/orig/name/tags/sales/stock/spec/desc/img 等；null 时展示骨架
      qty: 1, // 购买数量，取值 1 ~ G.stock（库存上限）
      usePoints: 0, // 本次抵扣使用的整数积分，不再要求 150 的整数倍
      maxUsable: 0, // 当前可抵扣积分上限（可用积分/10 元封顶/商品金额三者取最小）
      addresses: [], // 收货地址列表
      selectedAddressId: 0 // 已选地址 ID，0 表示未选择
    }
  },
  computed: {
    /** 当前可用积分（来自本地 Store，真实值以后端为准）
     * @returns {number}
     */
    points() { return Store.points },
    /** 是否会员，影响成功弹窗中的会员引导 */
    isMember() { return Store.isMember },
    /** 积分兑换汇率：多少积分抵 1 元（后端配置下发）
     * @returns {number}
     */
    pointsPerYuan() { return Store.config.pointsPerYuan },
    /** 商品金额小计 = 单价 × 数量，保留两位；未加载时按 0
     * @returns {number}
     */
    total() { return this.G ? +(this.G.price * this.qty).toFixed(2) : 0 },
    /** 积分抵扣金额（元）= 使用积分 / 汇率
     * @returns {number}
     */
    deduct() { return this.usePoints / this.pointsPerYuan },
    /** 实付金额：总价减抵扣，积分充足时可降至 0 元
     * @returns {number}
     */
    pay() { return Math.max(0, +(this.total - this.deduct).toFixed(2)) },
    /** 相对原价的立省金额，原价缺失或低于现价时为 0
     * @returns {number}
     */
    save() { return this.G ? Math.max(0, +(this.G.orig - this.G.price).toFixed(2)) : 0 },
    /** 滑杆最大值：至少保留一个步长，避免 slider 因 max=0 无法渲染
     * @returns {number}
     */
    sliderMax() { return Math.max(this.maxUsable, 1) },
    /** 单笔全局抵扣上限（元），来自后台配置 */
    maxYuan() {
      const cap = (Store.config.pointsRules && Store.config.pointsRules.globalCap) || 1500
      return +(cap / this.pointsPerYuan).toFixed(2)
    },
    /** 抵扣文案：显示已用积分与折算金额
     * @returns {string}
     */
    ptLabel() {
      return this.usePoints > 0
        ? '使用 ' + this.usePoints + ' 积分抵 ¥' + this.deduct.toFixed(2)
        : '未使用积分抵扣'
    },
    /** 当前选中的地址对象，未选中返回 null
     * @returns {Object|null}
     */
    selectedAddress() {
      return this.addresses.filter(a => a.id === this.selectedAddressId)[0] || null
    },
    /** 全商品统一的配送与售后政策，商品响应优先、公共配置兜底 */
    shopPolicy() {
      const config = Store.config.shop
      return {
        deliveryPolicy: (this.G && this.G.deliveryPolicy) || config.deliveryPolicy,
        afterSalePolicy: (this.G && this.G.afterSalePolicy) || config.afterSalePolicy
      }
    }
  },
  /**
   * 读取路由参数并加载商品
   * @param {Object} options 页面参数，options.id 为商品 ID
   */
  onLoad(options) {
    this.goodsId = (options && options.id) || 'g1'
    this.load()
  },
  onShow() {
    // 从地址列表 / 新增地址返回时，自动选中并刷新
    this.loadAddresses()
  },
  methods: {
    money,
    /**
     * 加载收货地址并按优先级确定默认选中项
     * 优先级：地址页回传的待选 ID > 当前已选（仍存在）> 默认地址 > 列表首项
     */
    async loadAddresses() {
      const res = await Api.fetchAddresses()
      if (res.code !== 0 || !Array.isArray(res.data)) {
        this.addresses = []
        this.selectedAddressId = 0
        return
      }
      this.addresses = res.data

      let pending = 0
      try {
        pending = Number(uni.getStorageSync('fishai.pendingAddressId') || 0)
        if (pending) uni.removeStorageSync('fishai.pendingAddressId')
      } catch (e) { /* ignore */ }

      if (pending && this.addresses.some(a => a.id === pending)) {
        this.selectedAddressId = pending
        return
      }
      if (this.selectedAddressId && this.addresses.some(a => a.id === this.selectedAddressId)) {
        return
      }
      const def = this.addresses.filter(a => a.isDefault)[0] || this.addresses[0]
      this.selectedAddressId = def ? def.id : 0
    },
    /** 打开地址选择：无地址时直接进入新增页，有地址则跳地址列表的选择模式 */
    openAddressPicker() {
      if (!this.addresses.length) { this.addNewAddress(); return }
      nav('/pages/address/address?select=1')
    },
    /** 跳转新增地址页（select=1 选择模式，back=1 保存后返回本页） */
    addNewAddress() {
      nav('/pages/address-edit/address-edit?select=1&back=1')
    },
    /** 拉取商品详情，成功后计算抵扣上限并默认拉满可用积分 */
    load() {
      Api.fetchGoodsDetail(this.goodsId).then(res => {
        if (res.code !== 0 || !res.data) { ui.toast(res.msg || '商品加载失败，请重试', 'alert-triangle'); return }
        this.G = res.data
        this.calcMax()
        this.usePoints = this.maxUsable // 默认按最大可用积分抵扣
      })
    },
    /* 抵扣上限：可用积分 / 全局 10 元上限 / 商品金额三重取最小 */
    calcMax() {
      const rate = this.pointsPerYuan
      const total = +(this.G.price * this.qty).toFixed(2)
      const rules = Store.config.pointsRules || {}
      const globalCap = Number(rules.globalCap || 1500)
      // 按整数积分足额抵扣；金额换算四舍五入，避免 9.9 元等浮点误差
      const byAmount = Math.round(total * rate)
      this.maxUsable = Math.max(0, Math.min(Store.points, globalCap, byAmount))
      // 数量减少后，已选积分可能超限，回退到上限
      if (this.usePoints > this.maxUsable) this.usePoints = this.maxUsable
    },
    /** 数量 +1，上限为库存（缺省 99），变动后重算抵扣上限 */
    inc() { if (this.qty < (this.G.stock || 99)) { this.qty++; this.calcMax() } },
    /** 数量 -1，下限为 1，变动后重算抵扣上限 */
    dec() { if (this.qty > 1) { this.qty--; this.calcMax() } },
    /**
     * 滑杆拖动/松手回调，按步长取整后再夹紧到上限
     * @param {Object} e 滑块事件，e.detail.value 为当前值
     */
    onSlide(e) { this.usePoints = Math.min(Number(e.detail.value), this.maxUsable) },
    /**
     * 快捷抵扣：'max' 拉满，数字则按「元 × 汇率」换算后夹紧
     * @param {number|string} v 抵扣元数或 'max'
     */
    quick(v) {
      if (v === 'max') { this.usePoints = this.maxUsable; return }
      this.usePoints = Math.min(Number(v) * this.pointsPerYuan, this.maxUsable)
    },
    /**
     * 立即购买：先校验地址，再弹确认框展示订单摘要，确认后创建订单
     * 未选地址 → 询问是否去填写；取消确认 → 不产生订单
     */
    async buy() {
      // 支付前置校验：必须已选择有效收货地址
      if (!this.selectedAddress) {
        const go = await ui.confirm({
          title: '请先填写收货地址',
          text: '下单前需要填写有效的收货信息，是否现在去填写？',
          okText: '去填写',
          cancelText: '取消'
        })
        if (go) this.addNewAddress()
        return
      }
      const yes = await ui.confirm({
        title: '确认下单',
        text: this.G.name + ' × ' + this.qty
          + '\n收货人 ' + this.selectedAddress.receiver + ' ' + this.selectedAddress.phone
          + '\n' + this.selectedAddress.fullAddress
          + '\n积分抵扣 ' + this.usePoints + ' 分（-¥' + this.deduct.toFixed(2) + '）'
          + '\n' + this.shopPolicy.deliveryPolicy
          + '\n' + this.shopPolicy.afterSalePolicy
          + '\n实付 ¥' + this.pay.toFixed(2),
        okText: '确认支付 ¥' + this.pay.toFixed(2)
      })
      if (yes) this.doOrder()
    },
    /**
     * 创建订单：提交商品/数量/积分/地址
     * 1002 表示地址失效，需重新选择；成功后同步积分余额并进入支付流程
     */
    doOrder() {
      if (!this.selectedAddress) { this.openAddressPicker(); return }
      Api.createOrder({
        goodsId: this.G.id,
        qty: this.qty,
        usePoints: this.usePoints,
        addressId: this.selectedAddress.id
      }).then(res => {
        if (res.code === 1002) {
          // 地址被删除 / 失效：引导重新选择
          ui.toast(res.msg || '收货地址无效，请重新选择', 'alert-triangle')
          this.loadAddresses()
          return
        }
        if (res.code !== 0 || !res.data) { ui.toast(res.msg || '下单失败，请重试', 'alert-triangle'); return }
        const o = res.data
        // 服务端已扣减积分，本地同步该余额，不再伪造本地订单
        Store.spendPoints(o.usePoints || 0)
        Api.track('order_create', { orderNo: o.orderNo, usePoints: o.usePoints || 0, goodsId: this.G.id }, 'shop')
        this.qty = 1
        this.usePoints = 0
        this.calcMax()
        this.payOrder(o)
      })
    },
    /**
     * 发起支付：真实环境唤起微信支付，原型环境直接进入成功弹窗
     * @param {Object} o 后端返回的订单，o.payment 为支付参数
     */
    payOrder(o) {
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
    /**
     * 下单成功弹窗：展示订单号、抵扣积分、实付与状态
     * 非会员追加「开通会员」按钮，关闭后统一回到商城
     * @param {Object} o 订单对象
     */
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
/* 主图：定高 340px 通栏，aspectFill 裁切填充 */
.pd-hero {
  display: block;
  width: 100%;
  height: 340px;
  background: var(--c-surface-2);
}
/* 价格卡上移 16px 压住主图下沿，形成叠压层次 */
.pd-head { margin-top: -16px; position: relative; z-index: 2; }
.addr-card { margin-top: 12px; }
.addr-ic {
  width: 34px; height: 34px; border-radius: 11px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-primary-l);
}
.addr-ic--warn { background: #FCF3E0; }
.addr-name { font-size: 14px; font-weight: 700; }
.addr-phone { font-size: 12px; color: var(--c-ink-3); }
.addr-text {
  display: block; margin-top: 3px; font-size: 12px; line-height: 1.55;
  color: var(--c-ink-3); word-break: break-all;
}
/* 新增按钮：最小高度 44px，保证点击热区 */
.addr-add { min-height: 44px; min-width: 76px; flex: none; }
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
.policy-line { display: block; line-height: 1.7; }
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
