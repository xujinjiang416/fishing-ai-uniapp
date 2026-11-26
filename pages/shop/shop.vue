<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="渔获商城" right="积分明细" @right="onRight" />

      <view class="page">
        <!-- 区块：我的积分 / 积分余额 + 折算金额 + 会员状态 / 非会员展示开通入口与横幅 -->
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

        <!-- 区块：分类 / 横向滚动的胶囊标签 / 选中即切换并重新请求 -->
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

        <!-- 区块：商品列表 / 双列网格，含骨架、空态、商品卡三种分支 / 卡片展示前 2 个标签 -->
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
                  <text>最多可抵 ¥{{ money(maxDeduct) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 区块：积分抵扣规则 / 金色提示条 / 文案随 pointsPerYuan 动态拼接 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>积分抵扣规则</text></view>
          </view>
          <view class="notice notice--gold">
            <AppIcon name="percent" :size="16" color="#8C6420" />
            <view class="grow">
              <text class="rule-line">· {{ pointsPerYuan }} 积分 = 1 元，按整数积分抵扣，不再限制积分倍数；</text>
              <text class="rule-line">· 单笔订单最多抵 {{ maxYuan }} 元（即 {{ pointsPerYuan * maxYuan }} 积分），不限商品品类；</text>
              <text class="rule-line">· 订单不足 {{ maxYuan }} 元且积分充足时，可足额抵扣至 0 元。</text>
              <text class="rule-line rule-ex">示例：商品 20 元 + {{ pointsPerYuan * maxYuan }} 积分 → 抵 {{ maxYuan }} 元，实付 10 元。</text>
            </view>
          </view>
        </view>

        <!-- 区块：服务保障与页脚 / 三列图标 + 免责说明 / 预留底部安全间距，避免被标签栏遮挡 -->
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
            <text class="tiny" style="display: block">渔获 AI 商城 · {{ pointsPerYuan }} 积分 = 1 元，单笔最多抵 {{ maxYuan }} 元</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 全局：底部标签栏 + 全局浮层 -->
    <AppTabBar page="shop" />
    <AppOverlays />
  </view>
</template>

<script>
/* 商城首页（底部 Tab 页，无路由参数）
 * 数据接口：Api.fetchGoods({ cat }) —— 按分类拉取商品；积分/汇率/会员态来自本地 Store（初值取自后端 /config）
 * 关键交互：分类切换、商品卡跳详情、会员开通入口、右上「积分明细」说明
 * 业务限制：pointsPerYuan 积分 = 1 元，按整数积分抵扣，单笔订单最多抵 maxYuan，足额抵扣可 0 元购
 */
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
      cats: ['全部', '鱼竿', '渔轮', '饵料', '工具', '装备'], // 商品分类，'全部' 作为默认项
      cat: '全部', // 当前选中分类，切换后重新请求列表
      goods: [], // 当前分类下的商品列表
      loading: true, // 商品骨架开关
      services: [ // 服务保障文案（静态展示）
        { ic: 'shield-check', t: '正品保障' },
        { ic: 'truck', t: '顺丰包邮' },
        { ic: 'refresh-cw', t: '7 天无理由' }
      ]
    }
  },
  computed: {
    /** 当前可用积分（本地 Store 缓存，真实值以后端为准）
     * @returns {number}
     */
    points() { return Store.points },
    /** 是否会员，影响会员横幅与开通入口的展示 */
    isMember() { return Store.isMember },
    /** 积分汇率：多少积分抵 1 元（后端配置下发，禁止写死）
     * @returns {number}
     */
    pointsPerYuan() { return Store.config.pointsPerYuan },
    /** 单笔全局抵扣上限（元），来自后台配置 */
    maxYuan() {
      const cap = (Store.config.pointsRules && Store.config.pointsRules.globalCap) || 1500
      return +(cap / this.pointsPerYuan).toFixed(2)
    },
    /** 每件商品最多可抵金额（元）：积分可兑金额与全局封顶取小
     * @returns {number}
     */
    maxDeduct() { return Math.min(this.maxYuan, this.points / this.pointsPerYuan) }
  },
  onLoad() {
    this.loadGoods()
  },
  methods: {
    money,
    /**
     * 页面跳转
     * @param {string} url 目标路径
     */
    go(url) { nav(url) },
    /**
     * 打开商品详情
     * @param {string} id 商品 ID
     */
    open(id) { nav('/pages/product-detail/product-detail?id=' + id) },
    /** 顶栏「积分明细」：原型阶段以 toast 说明兑换规则 */
    onRight() { ui.toast('积分明细：' + this.pointsPerYuan + ' 积分 = 1 元，单笔最多抵 ' + this.maxYuan + ' 元') },
    /**
     * 切换分类，分类未变化时不重复请求
     * @param {string} c 分类名
     */
    pickCat(c) {
      if (c === this.cat) return
      this.cat = c
      this.loadGoods()
    },
    /** 按当前分类拉取商品列表，失败时结束骨架并保持空列表 */
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
/* 积分数字：展示字体 + 30px 主视觉字号 */
.points-num {
  display: block;
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}
/* 非会员横幅：浅金底通栏，整行可点进会员页 */
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
