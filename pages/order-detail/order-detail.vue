<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="订单详情" back />

      <!-- 区块：加载骨架 / 状态卡 + 详情卡 + 金额卡的占位 / 仅 loading 时展示 -->
      <view v-if="loading" class="page" style="padding-top: 6px">
        <view class="skel" style="height: 168px; border-radius: var(--r-lg)"></view>
        <view class="skel mt12" style="height: 190px; border-radius: var(--r-lg)"></view>
        <view class="skel mt12" style="height: 120px; border-radius: var(--r-lg)"></view>
      </view>

      <!-- 区块：加载失败空态 / 错误图标 + 重试按钮 / 仅在无缓存的 order 时展示 -->
      <view v-else-if="error && !order" class="empty">
        <view class="empty__ic"><AppIcon name="alert-triangle" :size="26" color="#9AA9A7" /></view>
        <text class="empty__t">{{ error }}</text>
        <text class="tiny mt4" style="display: block">请检查网络后重试</text>
        <view class="btn btn--line mt16 retry-btn" @click="load">重新加载</view>
      </view>

      <template v-else-if="order">
        <view class="page" style="padding-top: 4px">
          <!-- 区块：状态与流转 / 状态图标 + 文案 + 节点进度条 / 节点少于 4 个时收窄宽度 -->
          <view class="card card--pad status-card">
            <view class="row" style="gap: 12px; align-items: flex-start">
              <view class="st-ic" :style="'background:' + tint(meta.color)">
                <AppIcon :name="meta.icon" :size="24" :color="meta.color" />
              </view>
              <view class="grow">
                <view class="row" style="gap: 8px; flex-wrap: wrap">
                  <text class="st-t">{{ meta.text }}</text>
                  <text class="tag" :class="meta.cls">{{ meta.text }}</text>
                </view>
                <text class="st-d">{{ meta.desc }}</text>
              </view>
            </view>

            <view class="flow mt16" :class="{ 'flow--short': flow.length < 4 }">
              <view
                v-for="(n, i) in flow"
                :key="n.key"
                class="flow__seg"
                :class="'is-' + n.state"
              >
                <view
                  v-if="i < flow.length - 1"
                  class="flow__line"
                  :class="{ 'is-done': n.state === 'done' }"
                ></view>
                <view class="flow__dot">
                  <AppIcon v-if="n.state === 'done'" name="check" :size="11" color="#FFFFFF" />
                  <text v-else class="flow__num">{{ i + 1 }}</text>
                </view>
                <text class="flow__t">{{ n.text }}</text>
              </view>
            </view>
          </view>

          <!-- 区块：退款提示 / 通栏告警条 / 仅在已退款或申请被驳回时出现 -->
          <view v-if="showRefund" class="notice notice--warn mt12">
            <AppIcon name="coins" :size="15" color="#8E6210" />
            <text class="grow">
              <text v-if="order.refundStatus === 'rejected'">退款申请已驳回</text>
              <text v-else>已退款 ¥{{ money(order.refundAmount || 0) }}</text>
              <text v-if="order.refundReason"> · {{ order.refundReason }}</text>
            </text>
          </view>

          <!-- 区块：物流信息 / 四态切换（加载中 / 失败重试 / 暂无 / 已发货信息）/ 只展示单号与电话，不展示轨迹 -->
          <view class="card card--pad mt12">
            <view class="row row--between">
              <view class="card__title">
                <AppIcon name="truck" :size="16" color="#0A6A6C" />
                <text>物流信息</text>
              </view>
              <view class="lg-refresh" :class="{ 'is-loading': lgLoading }" @click="refreshLogistics">
                <view v-if="lgLoading" class="spin"></view>
                <AppIcon v-else name="refresh-cw" :size="14" color="#0A6A6C" />
                <text>{{ lgLoading ? '刷新中' : '刷新' }}</text>
              </view>
            </view>

            <!-- 加载中 -->
            <view v-if="lgLoading" class="lg-state">
              <view class="spin spin--lg"></view>
              <text class="lg-state__t">正在获取物流信息…</text>
            </view>

            <!-- 加载失败 -->
            <view v-else-if="lgError" class="lg-state">
              <AppIcon name="alert-triangle" :size="24" color="#E8662B" />
              <text class="lg-state__t">{{ lgError }}</text>
              <view class="btn btn--line lg-retry" @click="refreshLogistics">重试</view>
            </view>

            <!-- 暂无物流 -->
            <view v-else-if="!hasLogistics" class="lg-state">
              <AppIcon name="package" :size="24" color="#9AA9A7" />
              <text class="lg-state__t">暂无物流信息</text>
              <text class="tiny">商家发货后，可在此查看物流公司与运单号</text>
            </view>

            <!-- 物流信息 -->
            <view v-else>
              <view class="kv">
                <text class="kv__k">物流公司</text>
                <text class="kv__v">{{ lg.company || '--' }}</text>
              </view>
              <view class="kv">
                <text class="kv__k">运单号</text>
                <view class="row kv__v" style="gap: 6px; justify-content: flex-end">
                  <text class="num break">{{ lg.no }}</text>
                  <view class="mini-hit" @click="copyNo">
                    <AppIcon name="copy" :size="13" color="#0A6A6C" />
                    <text>复制</text>
                  </view>
                </view>
              </view>
              <view class="kv">
                <text class="kv__k">官方查询电话</text>
                <view class="row kv__v" style="gap: 6px; justify-content: flex-end">
                  <text class="num">{{ lg.phone || '--' }}</text>
                  <view v-if="lg.phone" class="mini-hit" @click="callPhone">
                    <AppIcon name="smartphone" :size="13" color="#0A6A6C" />
                    <text>拨打</text>
                  </view>
                </view>
              </view>
              <view class="notice notice--info mt12">
                <AppIcon name="info" :size="15" color="#0A6A6C" />
                <text class="grow">仅展示承运商与运单号，请使用运单号前往物流官方渠道（官网 / 客服电话）查询详细进度。</text>
              </view>
            </view>

            <text v-if="lgUpdatedAt" class="tiny lg-time">最后刷新 {{ lgUpdatedAt }}</text>
          </view>

          <!-- 区块：商品信息 / 左侧缩略图 + 右侧名称、规格、单价与数量 / 缺图时展示占位块 -->
          <view class="card card--pad mt12">
            <view class="row" style="gap: 12px; align-items: flex-start">
              <image v-if="order.goodsImg" class="gd-img" :src="order.goodsImg" mode="aspectFill" />
              <view v-else class="gd-img gd-img--ph">
                <AppIcon name="image" :size="22" color="#9AA9A7" />
              </view>
              <view class="grow" style="min-width: 0">
                <text class="gd-name clamp2">{{ order.goods || '商品信息缺失' }}</text>
                <text class="gd-spec ellipsis">{{ order.spec || '--' }}</text>
                <view class="row row--between mt8">
                  <text class="gd-price">¥{{ money(order.price) }}</text>
                  <text class="tiny">× {{ order.qty }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 区块：金额明细 / 商品金额、积分抵扣、实付、退款 / 抵扣额由 total - amount 反推 -->
          <view class="card card--pad mt12">
            <view class="kv">
              <text class="kv__k">商品金额</text>
              <text class="kv__v num">¥{{ money(order.total) }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">积分抵扣</text>
              <text class="kv__v num" style="color: var(--c-gold)">
                {{ order.usePoints ? order.usePoints + ' 积分（-¥' + money((order.total || 0) - (order.amount || 0)) + '）' : '未使用' }}
              </text>
            </view>
            <view class="hr" style="margin: 10px 0"></view>
            <view class="kv">
              <text class="kv__k" style="font-weight: 600; color: var(--c-ink)">实付金额</text>
              <text class="kv__v num pay-amt">¥{{ money(order.amount) }}</text>
            </view>
            <view v-if="order.refundAmount" class="kv">
              <text class="kv__k">退款金额</text>
              <text class="kv__v num" style="color: var(--c-danger)">¥{{ money(order.refundAmount) }}</text>
            </view>
          </view>

          <!-- 区块：收货信息 / 收件人、电话、地址、配送方式 / 长地址允许换行折行 -->
          <view class="card card--pad mt12">
            <view class="card__title" style="margin-bottom: 6px">
              <AppIcon name="map-pin" :size="16" color="#0A6A6C" />
              <text>收货信息</text>
            </view>
            <view class="kv">
              <text class="kv__k">收货人</text>
              <text class="kv__v">{{ order.receiver || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">联系电话</text>
              <text class="kv__v num">{{ order.receiverPhone || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">收货地址</text>
              <text class="kv__v break">{{ order.address || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">配送方式</text>
              <text class="kv__v">{{ order.deliveryType || '--' }}</text>
            </view>
          </view>

          <!-- 区块：订单信息 / 编号、下单/支付/发货/完成/取消各节点时间 / 时间字段缺失时对应行不渲染 -->
          <view class="card card--pad mt12">
            <view class="card__title" style="margin-bottom: 6px">
              <AppIcon name="clipboard-list" :size="16" color="#0A6A6C" />
              <text>订单信息</text>
            </view>
            <view class="kv">
              <text class="kv__k">订单编号</text>
              <view class="row kv__v" style="gap: 6px; justify-content: flex-end">
                <text class="num break">{{ order.no }}</text>
                <view class="mini-hit" @click="copyOrderNo">
                  <AppIcon name="copy" :size="13" color="#0A6A6C" />
                  <text>复制</text>
                </view>
              </view>
            </view>
            <view class="kv">
              <text class="kv__k">下单时间</text>
              <text class="kv__v">{{ order.createdAt || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">支付方式</text>
              <text class="kv__v">{{ order.payMethod || '--' }}</text>
            </view>
            <view class="kv">
              <text class="kv__k">支付时间</text>
              <text class="kv__v">{{ order.paidAt || '--' }}</text>
            </view>
            <view v-if="order.shippedAt" class="kv">
              <text class="kv__k">发货时间</text>
              <text class="kv__v">{{ order.shippedAt }}</text>
            </view>
            <view v-if="order.completedAt" class="kv">
              <text class="kv__k">完成时间</text>
              <text class="kv__v">{{ order.completedAt }}</text>
            </view>
            <view v-if="order.closedAt" class="kv">
              <text class="kv__k">取消时间</text>
              <text class="kv__v">{{ order.closedAt }}</text>
            </view>
          </view>

          <!-- 区块：页脚说明 / 居中免责声明 / 预留底部安全间距 -->
          <view class="mt24" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">物流信息仅供参考，请以承运商官方查询结果为准</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 全局：全局浮层（登录/解锁/弹窗） -->
    <AppOverlays />
  </view>
</template>

<script>
/* 订单详情
 * 路由参数：no —— 订单编号（必填，decodeURIComponent 后用于请求）
 * 数据接口：Api.fetchOrderDetail(no) 订单主体、Api.fetchOrderLogistics(no) 物流信息
 * 1) 完整状态流转（待付款 → 待发货 → 待收货 → 已完成；取消 / 退款分支）
 * 2) 物流模块仅展示：物流公司、运单号、官方查询电话（不含任何轨迹节点）
 * 3) 支持手动刷新物流信息，覆盖加载中 / 加载失败重试 / 暂无物流三种状态
 * 商品评价功能已移除：订单完成后直接进入「已完成」，无评价入口或引导。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import { money, orderStatusMeta, orderFlow } from '../../common/utils.js'
import * as ui from '../../common/ui.js'

/**
 * 两位补零（时间展示用）
 * @param {number} n 待格式化的数值（0-99）
 * @returns {string} 补零后的两位字符串
 */
function pad2(n) { return n < 10 ? '0' + n : String(n) }
/** 生成 HH:mm:ss 格式的当前时刻，用于展示物流刷新时间
 * @returns {string}
 */
function nowTime() {
  const d = new Date()
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
}

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      no: '', // 订单编号，来自路由参数 ?no=（已解码）
      order: null, // 订单数据：status/goods/qty/total/amount/收货信息/各节点时间等
      loading: true, // 首屏骨架开关
      error: '', // 加载失败文案，与 order 同时为空时展示错误空态
      lg: { company: '', no: '', phone: '', deliveryType: '', shippedAt: '' }, // 物流信息：公司/运单号/查询电话/配送方式/发货时间
      lgLoading: false, // 物流请求中，控制刷新按钮与加载态
      lgError: '', // 物流请求失败文案
      lgUpdatedAt: '' // 最近一次刷新物流的时刻（HH:mm:ss）
    }
  },
  computed: {
    /** 状态展示元信息（文案/图标/颜色/标签类名），未知状态走兜底
     * @returns {Object}
     */
    meta() {
      return orderStatusMeta(this.order ? this.order.status : '')
    },
    /** 状态流转节点序列，每项含 state: done / current / todo
     * @returns {Object[]}
     */
    flow() {
      return orderFlow(this.order ? this.order.status : '')
    },
    /** 是否已有物流（以运单号存在为准）
     * @returns {boolean}
     */
    hasLogistics() {
      return !!(this.lg && this.lg.no)
    },
    /** 是否展示退款提示条：存在退款金额或退款被驳回
     * @returns {boolean}
     */
    showRefund() {
      const o = this.order
      if (!o) return false
      return !!(o.refundAmount || o.refundStatus === 'rejected')
    }
  },
  /**
   * 读取订单号并加载详情；缺失订单号时直接进入错误态
   * @param {Object} options 页面参数，options.no 为订单编号
   */
  onLoad(options) {
    this.no = (options && options.no) ? decodeURIComponent(options.no) : ''
    if (!this.no) {
      this.loading = false
      this.error = '订单号缺失'
      return
    }
    this.load()
  },
  methods: {
    money,
    /**
     * 将十六进制色值转为 12% 透明度的 rgba，用于状态图标底色
     * @param {string} hex 形如 #RRGGBB 或 #RGB
     * @returns {string}
     */
    tint(hex) {
      const h = String(hex || '#6E807E').replace('#', '')
      const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',.12)'
    },
    /** 拉取订单详情，并把物流相关字段拆到 lg 对象中 */
    async load() {
      this.loading = true
      this.error = ''
      const res = await Api.fetchOrderDetail(this.no)
      this.loading = false
      if (res.code !== 0 || !res.data) {
        this.error = res.msg || '订单加载失败，请稍后重试'
        return
      }
      this.order = res.data
      this.lg = {
        company: res.data.logisticsCompany || '',
        no: res.data.logisticsNo || '',
        phone: res.data.logisticsPhone || '',
        deliveryType: res.data.deliveryType || '',
        shippedAt: res.data.shippedAt || ''
      }
      this.lgError = ''
    },
    /**
     * 手动刷新物流：同一时刻只允许一次请求
     * 成功覆盖 lg 并记录刷新时刻；失败仅展示错误态，保留原有订单信息
     */
    async refreshLogistics() {
      if (this.lgLoading) return
      this.lgLoading = true
      this.lgError = ''
      const res = await Api.fetchOrderLogistics(this.no)
      this.lgLoading = false
      if (res.code !== 0 || !res.data) {
        this.lgError = res.msg || '物流信息获取失败，请稍后重试'
        return
      }
      this.lg = {
        company: res.data.company || '',
        no: res.data.no || '',
        phone: res.data.phone || '',
        deliveryType: res.data.deliveryType || '',
        shippedAt: res.data.shippedAt || ''
      }
      this.lgUpdatedAt = nowTime()
      ui.toast('物流信息已刷新', 'refresh-cw')
    },
    /** 复制运单号，提示前往官方渠道查询 */
    copyNo() {
      if (this.lg.no) ui.copy(this.lg.no, '运单号已复制，可前往物流官方渠道查询')
    },
    /** 拨打物流官方查询电话，失败时回退为提示手动拨打 */
    callPhone() {
      if (!this.lg.phone) return
      uni.makePhoneCall({
        phoneNumber: String(this.lg.phone),
        fail: () => ui.toast('拨号未完成，可手动拨打 ' + this.lg.phone, 'smartphone')
      })
    },
    /** 复制订单编号到剪贴板 */
    copyOrderNo() {
      if (this.order) ui.copy(this.order.no, '订单编号已复制')
    }
  }
}
</script>

<style>
/* 状态卡：允许溢出，避免当前节点外圈光晕被卡片裁剪 */
.status-card { overflow: visible; }
.st-ic {
  width: 46px; height: 46px; border-radius: 14px; flex: none;
  display: flex; align-items: center; justify-content: center;
}
.st-t { font-family: var(--font-display); font-size: 21px; font-weight: 700; line-height: 1.25; }
.st-d { display: block; margin-top: 3px; font-size: 12.5px; color: var(--c-ink-3); line-height: 1.5; }

/* 状态流转：flex 等分节点，连接线绝对定位在节点之间 */
.flow { display: flex; align-items: flex-start; }
/* 已取消等少于 4 个节点的场景收窄整行，避免节点间距过大 */
.flow--short { max-width: 66%; }
.flow__seg {
  position: relative; flex: 1; min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.flow__line {
  position: absolute; top: 10px; left: 50%; width: 100%; height: 2px;
  background: var(--c-line); z-index: 0;
}
.flow__line.is-done { background: var(--c-primary); }
.flow__dot {
  position: relative; z-index: 1;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-line-soft); color: var(--c-ink-4);
  font-size: 10.5px; font-weight: 700;
}
.flow__seg.is-done .flow__dot { background: var(--c-primary); color: #fff; }
.flow__seg.is-current .flow__dot {
  background: var(--c-primary); color: #fff;
  box-shadow: 0 0 0 4px rgba(15, 141, 141, .16);
}
.flow__t {
  font-size: 10.5px; color: var(--c-ink-4); text-align: center;
  line-height: 1.3; white-space: nowrap;
}
.flow__seg.is-done .flow__t { color: var(--c-ink-2); }
.flow__seg.is-current .flow__t { color: var(--c-primary-d); font-weight: 700; }

/* 物流 */
.lg-refresh {
  display: inline-flex; align-items: center; gap: 4px;
  min-height: 44px; padding: 0 8px; margin: -10px -8px -10px 0;
  font-size: 12.5px; color: var(--c-primary-d); font-weight: 600;
}
.lg-refresh.is-loading { opacity: .6; }
.lg-state {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 26px 12px 18px; text-align: center;
}
.lg-state__t { font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.lg-retry { min-height: 44px; min-width: 128px; margin-top: 6px; }
.spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(15, 141, 141, .22); border-top-color: var(--c-primary);
  animation: spin .7s linear infinite;
}
.spin--lg {
  width: 26px; height: 26px; border-width: 3px;
  border-color: var(--c-line); border-top-color: var(--c-primary);
}
@keyframes spin { to { transform: rotate(360deg); } }
.lg-time { display: block; margin-top: 10px; text-align: right; }

/* 键值行 */
.kv {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 14px; padding: 8px 0; font-size: 13px;
}
.kv + .kv { border-top: 1px solid var(--c-line-soft); }
.kv__k { color: var(--c-ink-3); flex: none; }
.kv__v { color: var(--c-ink); font-weight: 500; text-align: right; max-width: 68%; }
.break { word-break: break-all; }
.mini-hit {
  display: inline-flex; align-items: center; gap: 3px;
  min-height: 44px; padding: 0 6px; margin: -12px -6px -12px 0;
  color: var(--c-primary-d); font-size: 12px; font-weight: 600; flex: none;
}
.pay-amt { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--c-accent-d); }

/* 商品 */
.gd-img { width: 84px; height: 84px; border-radius: var(--r-sm); flex: none; background: var(--c-line-soft); }
.gd-img--ph { display: flex; align-items: center; justify-content: center; }
.gd-name { display: block; font-size: 14.5px; font-weight: 600; line-height: 1.45; }
.gd-spec { display: block; margin-top: 4px; font-size: 11.5px; color: var(--c-ink-3); }
.gd-price { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--c-accent-d); }
.retry-btn { min-height: 44px; min-width: 148px; }

/* 超小屏适配：状态节点更紧凑，避免文字挤压 */
@media (max-width: 340px) {
  .flow__t { font-size: 9.5px; }
  .flow__dot { width: 20px; height: 20px; }
  .flow__line { top: 9px; }
  .kv { gap: 10px; }
  .kv__v { max-width: 64%; }
}
</style>
