<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="渔获商城" right="积分明细" @right="onRight" />

      <view class="page">
        <!-- 我的积分 -->
        <view class="card card--pad">
          <view class="row row--between" style="align-items: flex-start">
            <view>
              <text class="tiny" style="display: block">我的积分</text>
              <text class="points-num">{{ points }}</text>
              <view class="row tiny" style="gap: 3px; color: var(--c-gold)">
                <AppIcon name="coins" :size="12" color="#C08A2E" />
                <text>可抵 {{ money(points / pointsPerYuan) }} 元 · {{ pointsPerYuan }} 积分 = 1 元</text>
              </view>
            </view>
            <text v-if="isMember" class="member-ribbon">
              <AppIcon name="crown" :size="12" color="#F0D9A6" />
              会员权益生效中
            </text>
            <view v-else class="btn btn--gold btn--sm" @click="go('/pages/membership/membership')">
              <AppIcon name="crown" :size="14" color="#FFFFFF" />
              <text>开通会员</text>
            </view>
          </view>

          <view
            v-if="!isMember"
            class="row mt12 member-tip"
            @click="go('/pages/membership/membership')"
          >
            <AppIcon name="crown" :size="18" color="#8C6420" />
            <text class="grow member-tip__t">开通会员 免广告 · 积分更快涨</text>
            <AppIcon name="chevron-right" :size="16" color="#8C6420" />
          </view>
        </view>

        <!-- 分类 -->
        <scroll-view scroll-x class="hscroll mt14" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="c in cats"
              :key="c"
              class="chip"
              :class="{ 'is-on': c === cat }"
              @click="pickCat(c)"
            >
              <text>{{ c }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 商品列表 -->
        <view class="section">
          <view v-if="loading" class="goods-grid">
            <view v-for="i in 4" :key="i">
              <view class="skel" style="width: 100%; height: 176px; border-radius: var(--r-md)"></view>
              <view class="skel mt8" style="height: 14px"></view>
              <view class="skel mt8" style="height: 12px; width: 60%"></view>
            </view>
          </view>

          <view v-else-if="!goods.length" class="empty">
            <view class="empty__ic"><AppIcon name="shopping-bag" :size="26" color="#9AA9A7" /></view>
            <text class="empty__t">该分类暂无商品</text>
            <text class="tiny mt4" style="display: block">换个分类看看吧</text>
          </view>

          <view v-else class="goods-grid">
            <view
              v-for="g in goods"
              :key="g.id"
              class="goods"
              @click="open(g.id)"
            >
              <image class="goods__img" :src="g.img" mode="aspectFill" />
              <view class="goods__bd">
                <text class="goods__t clamp2">{{ g.name }}</text>
                <view class="goods__tags">
                  <text v-for="t in g.tags.slice(0, 2)" :key="t" class="tag tag--mute">{{ t }}</text>
                </view>
                <view class="goods__price">
                  <text class="price-cur">¥</text>
                  <text class="price-num">{{ money(g.price) }}</text>
                  <text class="price-orig">¥{{ money(g.orig) }}</text>
                </view>
                <text class="tiny mt4" style="display: block">{{ g.sales }}</text>
                <view v-if="maxDeduct > 0" class="goods__pts">
                  <AppIcon name="coins" :size="12" color="#C08A2E" />
                  <text>最多可抵 ¥{{ maxDeduct }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 积分抵扣规则 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>积分抵扣规则</text></view>
          </view>
          <view class="notice notice--gold">
            <AppIcon name="percent" :size="16" color="#8C6420" />
            <view class="grow">
              <text class="rule-line">· {{ pointsPerYuan }} 积分 = 1 元，仅支持 {{ pointsPerYuan }} 积分的整数倍抵扣；</text>
              <text class="rule-line">· 单笔订单最多抵 10 元（即 {{ pointsPerYuan * 10 }} 积分）；</text>
              <text class="rule-line">· 不足 {{ pointsPerYuan }} 整数倍的积分暂不可用。</text>
              <text class="rule-line rule-ex">示例：商品 20 元 + {{ pointsPerYuan }} 积分 → 抵 1 元，实付 19 元。</text>
            </view>
          </view>
        </view>

        <!-- 服务保障 -->
        <view class="section">
          <view class="card card--pad">
            <view class="row" style="justify-content: space-around; gap: 6px">
              <view v-for="x in services" :key="x.t" class="col" style="align-items: center; gap: 4px">
                <AppIcon :name="x.ic" :size="20" color="#0A6A6C" />
                <text class="svc-t">{{ x.t }}</text>
              </view>
            </view>
          </view>
          <view class="mt16" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">渔获 AI 商城 · {{ pointsPerYuan }} 积分 = 1 元，按 {{ pointsPerYuan }} 积分整数倍抵扣</text>
            <text class="tiny mt4" style="color: var(--c-ink-4); display: block">原型演示 · 不产生真实交易</text>
          </view>
        </view>
      </view>
    </view>

    <AppTabBar page="shop" />
    <AppOverlays />
  </view>
</template>

<script>
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays },
  data() {
    return {
      cats: ['全部', '鱼竿', '渔轮', '饵料', '工具', '装备'],
      cat: '全部',
      goods: [],
      loading: true,
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
    maxDeduct() { return Math.min(10, Math.floor(this.points / this.pointsPerYuan)) }
  },
  onLoad() {
    this.loadGoods()
  },
  methods: {
    money,
    go(url) { nav(url) },
    open(id) { nav('/pages/product-detail/product-detail?id=' + id) },
    onRight() { ui.toast('积分明细：' + this.pointsPerYuan + ' 积分 = 1 元，按 ' + this.pointsPerYuan + ' 积分整数倍抵扣') },
    pickCat(c) {
      if (c === this.cat) return
      this.cat = c
      this.loadGoods()
    },
    loadGoods() {
      this.loading = true
      Api.fetchGoods({ cat: this.cat }).then(res => {
        if (res.code !== 0 || !res.data) { this.loading = false; return }
        this.goods = res.data
        this.loading = false
      })
    }
  }
}
</script>

<style>
.points-num {
  display: block;
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}
.member-tip {
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: var(--c-gold-l);
  color: #8C6420;
}
.member-tip__t { font-weight: 600; font-size: 13.5px; }
.price-cur { font-size: 11px; color: var(--c-accent-d); font-weight: 700; }
.price-num {
  color: var(--c-accent-d);
  font-size: 17px;
  font-family: var(--font-display);
  font-weight: 700;
}
.price-orig { font-size: 11px; color: var(--c-ink-4); margin-left: 5px; text-decoration: line-through; }
.svc-t { font-size: 11.5px; color: var(--c-ink-3); }
.rule-line { display: block; line-height: 1.7; }
.rule-ex { color: var(--c-ink-3); }
.mt14 { margin-top: 14px; }
</style>
