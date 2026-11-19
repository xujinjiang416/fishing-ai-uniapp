<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="我的订单" back right="刷新" @right="refresh" />

      <view class="page">
        <!-- 状态筛选 -->
        <scroll-view scroll-x class="hscroll tabs" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="t in tabs"
              :key="t.key"
              class="chip tab"
              :class="{ 'is-on': tab === t.key }"
              @click="pickTab(t.key)"
            >
              <text>{{ t.label }}</text>
              <text v-if="counts[t.key]" class="tab__count">{{ counts[t.key] }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 加载骨架 -->
        <view v-if="loading" class="list mt12">
          <view v-for="i in 3" :key="i" class="card card--pad">
            <view class="row row--between">
              <view class="skel" style="width: 40%; height: 16px"></view>
              <view class="skel" style="width: 64px; height: 16px"></view>
            </view>
            <view class="row mt12" style="gap: 12px">
              <view class="skel" style="width: 74px; height: 74px; border-radius: 12px"></view>
              <view class="col grow" style="gap: 8px">
                <view class="skel" style="height: 14px; width: 70%"></view>
                <view class="skel" style="height: 12px; width: 48%"></view>
                <view class="skel" style="height: 12px; width: 30%"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 网络异常 -->
        <view v-else-if="error && !orders.length" class="empty">
          <view class="empty__ic">
            <AppIcon name="alert-triangle" :size="26" color="#9AA9A7" />
          </view>
          <text class="empty__t">{{ error }}</text>
          <text class="tiny mt4" style="display: block">请检查网络后重试</text>
          <view class="btn btn--line mt16 retry-btn" @click="load(true)">重新加载</view>
        </view>

        <!-- 空态 -->
        <view v-else-if="!filtered.length" class="empty">
          <view class="empty__ic"><AppIcon name="package" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">{{ orders.length ? '该状态下暂无订单' : '还没有订单' }}</text>
          <text class="tiny mt4" style="display: block">去商城看看钓友都在买什么</text>
          <view class="btn btn--primary mt16 retry-btn" @click="goShop">去商城逛逛</view>
        </view>

        <!-- 订单列表 -->
        <view v-else class="list mt12">
          <view
            v-for="o in filtered"
            :key="o.no"
            class="card order-card"
            hover-class="order-card--hover"
            @click="openDetail(o.no)"
          >
            <view class="oc-hd">
              <view class="row" style="gap: 10px; min-width: 0">
                <view class="oc-ic" :style="'background:' + tint(meta(o.status).color)">
                  <AppIcon :name="meta(o.status).icon" :size="16" :color="meta(o.status).color" />
                </view>
                <view class="grow" style="min-width: 0">
                  <text class="oc-status" :style="'color:' + meta(o.status).color">{{ meta(o.status).text }}</text>
                  <text class="oc-no num ellipsis">{{ o.no }}</text>
                </view>
              </view>
              <text class="oc-amount">¥{{ money(o.amount) }}</text>
            </view>

            <view class="oc-bd">
              <image v-if="o.goodsImg" class="oc-img" :src="o.goodsImg" mode="aspectFill" />
              <view v-else class="oc-img oc-img--ph">
                <AppIcon name="image" :size="22" color="#9AA9A7" />
              </view>
              <view class="grow" style="min-width: 0">
                <text class="oc-title clamp2">{{ o.goods || '商品信息缺失' }}</text>
                <text class="oc-spec ellipsis">{{ o.spec || '--' }}</text>
                <view class="row oc-tags">
                  <text class="tiny">× {{ o.qty }}</text>
                  <text v-if="o.usePoints" class="tag tag--gold">积分抵扣 {{ o.usePoints }}</text>
                </view>
              </view>
            </view>

            <view class="oc-ft">
              <text class="tiny">{{ o.createdAt || o.date || '--' }}</text>
              <view class="btn btn--line oc-btn" @click.stop="openDetail(o.no)">查看详情</view>
            </view>
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">订单数据来自服务器 · 下拉可刷新列表</text>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 我的订单列表
 * 状态口径：待付款 / 待发货 / 待收货 / 已完成 / 已取消（含退款售后）。
 * 商品评价功能已移除，页面不提供任何评价入口或待评价筛选。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import { money, orderStatusMeta } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

const FILTERS = {
  all: null,
  unpaid: ['待支付'],
  unshipped: ['待发货'],
  shipped: ['已发货'],
  cancelled: ['已关闭'],
  refund: ['退款中', '部分退款', '已退款']
}

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      orders: [],
      loading: true,
      error: '',
      tab: 'all',
      tabs: [
        { key: 'all', label: '全部' },
        { key: 'unpaid', label: '待付款' },
        { key: 'unshipped', label: '待发货' },
        { key: 'shipped', label: '待收货' },
        { key: 'cancelled', label: '已取消' },
        { key: 'refund', label: '退款/售后' }
      ]
    }
  },
  computed: {
    filtered() {
      const allow = FILTERS[this.tab]
      if (!allow) return this.orders
      return this.orders.filter(o => allow.indexOf(o.status) > -1)
    },
    counts() {
      const out = {}
      this.orders.forEach(o => {
        Object.keys(FILTERS).forEach(k => {
          const allow = FILTERS[k]
          if (allow && allow.indexOf(o.status) > -1) out[k] = (out[k] || 0) + 1
        })
      })
      return out
    }
  },
  onLoad() {
    this.load(true)
  },
  onShow() {
    // 从登录页 / 详情页返回时刷新；首屏加载中不重复请求
    if (!this.loading) this.load(false)
  },
  onPullDownRefresh() {
    this.load(false).then(() => uni.stopPullDownRefresh())
  },
  methods: {
    money,
    meta(status) { return orderStatusMeta(status) },
    tint(hex) {
      const h = String(hex || '#6E807E').replace('#', '')
      const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',.12)'
    },
    async load(showSkeleton) {
      if (showSkeleton) this.loading = true
      this.error = ''
      const res = await Api.fetchOrders()
      this.loading = false
      if (res.code !== 0 || !Array.isArray(res.data)) {
        this.error = res.msg || '订单加载失败，请稍后重试'
        this.orders = []
      } else {
        this.orders = res.data
      }
    },
    refresh() {
      this.load(false).then(() => ui.toast('订单已刷新', 'refresh-cw'))
    },
    pickTab(key) {
      this.tab = key
    },
    openDetail(no) {
      nav('/pages/order-detail/order-detail?no=' + encodeURIComponent(no))
    },
    goShop() {
      nav('/pages/shop/shop')
    }
  }
}
</script>

<style>
.tabs { margin-top: 4px; }
.tab {
  height: 44px;
  padding: 0 16px;
  font-size: 13.5px;
}
.tab__count {
  margin-left: 2px;
  font-size: 11px;
  opacity: .85;
}
.order-card { padding: 14px 16px; }
.order-card--hover { transform: scale(.99); }
.oc-hd {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.oc-ic {
  width: 34px; height: 34px; border-radius: 11px; flex: none;
  display: flex; align-items: center; justify-content: center;
}
.oc-status { display: block; font-size: 14.5px; font-weight: 700; line-height: 1.35; }
.oc-no { display: block; font-size: 11px; color: var(--c-ink-4); margin-top: 1px; }
.oc-amount {
  font-family: var(--font-display); font-size: 17px; font-weight: 700;
  color: var(--c-ink); flex: none;
}
.oc-bd {
  display: flex; gap: 12px; margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--c-line-soft);
}
.oc-img {
  width: 74px; height: 74px; border-radius: var(--r-sm); flex: none;
  background: var(--c-line-soft);
}
.oc-img--ph { display: flex; align-items: center; justify-content: center; }
.oc-title { display: block; font-size: 14px; font-weight: 600; line-height: 1.45; }
.oc-spec { display: block; margin-top: 3px; font-size: 11.5px; color: var(--c-ink-3); }
.oc-tags { gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.oc-ft {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--c-line-soft);
}
/* 热区：按钮最小高度 44px，符合小程序点击规范 */
.oc-btn { min-height: 44px; min-width: 104px; padding: 0 18px; font-size: 13px; }
.retry-btn { min-height: 44px; min-width: 148px; }
</style>
