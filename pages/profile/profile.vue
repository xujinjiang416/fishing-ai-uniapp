<template>
  <view class="app">
    <view class="app-main">
      <!-- 状态栏占位：高度取系统状态栏高度，避免内容被状态栏 / 刘海遮挡 -->
      <view class="bar-spacer" :style="{ height: statusBarHeight + 'px' }"></view>

      <view class="page" style="padding-top: 12px">
        <!-- 区块：骨架屏 / USER 为空（资料未加载）时展示，占位结构与真实内容一致以减少布局跳动 -->
        <template v-if="!USER">
          <view class="skel" style="height: 96px; border-radius: 22px"></view>
          <view class="skel mt12" style="height: 84px; border-radius: 22px"></view>
          <view v-for="i in 2" :key="i" class="row" style="gap: 12px; padding: 10px 0">
            <view class="skel" style="width: 74px; height: 74px; border-radius: 12px"></view>
            <view class="col grow" style="gap: 8px">
              <view class="skel" style="height: 14px; width: 60%"></view>
              <view class="skel" style="height: 12px; width: 85%"></view>
            </view>
          </view>
        </template>

        <template v-else>
          <!-- 区块：个人信息卡 / 头像、昵称、等级、手机号与会员状态
               布局逻辑：横向排列，文案区自适应；未开通会员时展示开通按钮 -->
          <view class="card card--pad">
            <view class="row" style="gap: 14px; align-items: flex-start">
              <view class="avatar avatar--lg">{{ avatarText }}</view>
              <view class="grow">
                <view class="row" style="gap: 8px">
                  <text style="font-size: 17px; font-weight: 700">{{ nickname }}</text>
                  <text class="tag tag--primary">{{ USER.level || '--' }}</text>
                </view>
                <view class="row tiny mt4" style="gap: 4px">
                  <AppIcon name="smartphone" :size="12" color="#6E807E" />
                  <text>{{ phone }}</text>
                </view>
                <view class="mt8">
                  <text v-if="isMember" class="member-ribbon">
                    <AppIcon name="crown" :size="12" color="#F0D9A6" />
                    会员 · {{ memberExpire }} 到期
                  </text>
                  <view v-else class="row" style="gap: 8px">
                    <text class="tag tag--mute">未开通会员</text>
                    <view class="btn btn--sm btn--gold" @click="go('/pages/membership/membership')">
                      <text>立即开通</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 区块：资产概览 / 三列等宽展示积分、连续签到、收藏数
               注意事项：积分可抵金额按汇率换算并限制单笔 10 元 -->
          <view class="card card--pad mt12">
            <view class="stat-grid">
              <view class="stat">
                <view class="stat__label">
                  <AppIcon name="coins" :size="12" color="#6E807E" />
                  <text>我的积分</text>
                </view>
                <text class="stat__val">{{ points }}</text>
                <text class="stat__hint">可抵 ¥{{ money(usableYuan) }}</text>
              </view>
              <view class="stat">
                <view class="stat__label">
                  <AppIcon name="flame" :size="12" color="#6E807E" />
                  <text>连续签到</text>
                </view>
                <text class="stat__val">{{ streak }}<text class="stat-unit"> 天</text></text>
                <text class="stat__hint">会员签到积分更高</text>
              </view>
              <view class="stat">
                <view class="stat__label">
                  <AppIcon name="bookmark" :size="12" color="#6E807E" />
                  <text>收藏钓点</text>
                </view>
                <text class="stat__val">{{ favorites }}<text class="stat-unit"> 个</text></text>
                <text class="stat__hint">附近的野塘</text>
              </view>
            </view>
          </view>

          <!-- 区块：快捷功能 / 四宫格入口，数据来自 quickItems
               注意事项：收藏项通过 act='fav' 走本地 toast，其余按 url 跳转 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>快捷功能</text></view>
            </view>
            <view class="grid4">
              <view
                v-for="x in quickItems"
                :key="x.t"
                class="quick-tile"
                @click="onQuick(x)"
              >
                <AppIcon :name="x.ic" :size="20" color="#0A6A6C" />
                <text class="quick-tile__t">{{ x.t }}</text>
              </view>
            </view>
          </view>

          <!-- 区块：我的订单 / 展示最近订单列表，点击进入订单详情；无数据时展示空态
               注意事项：订单状态文案与配色由 statusMeta 统一映射 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>我的订单</text></view>
              <view class="section__more" @click="go('/pages/orders/orders')">
                <text>全部订单</text>
                <AppIcon name="chevron-right" :size="13" color="#0A6A6C" />
              </view>
            </view>
            <view v-if="orders.length" class="list">
              <view v-for="o in orders" :key="o.no" class="item" @click="openOrder(o.no)">
                <view class="cell__icon cell__icon--gold item__ic-lg">
                  <AppIcon name="package" :size="20" color="#C08A2E" />
                </view>
                <view class="item__body">
                  <text class="item__title">{{ o.goods }}</text>
                  <view class="item__meta">
                    <view class="row" style="gap: 3px">
                      <AppIcon name="clipboard-list" :size="12" color="#6E807E" />
                      <text>{{ o.no }}</text>
                    </view>
                    <view class="row" style="gap: 3px">
                      <AppIcon name="clock" :size="12" color="#6E807E" />
                      <text>{{ o.date }}</text>
                    </view>
                  </view>
                  <view class="item__meta">
                    <text>实付 ¥{{ money(o.amount) }}</text>
                    <view v-if="o.usePoints" class="row" style="gap: 3px; color: var(--c-gold)">
                      <AppIcon name="coins" :size="12" color="#C08A2E" />
                      <text>抵扣 {{ o.usePoints }} 积分</text>
                    </view>
                  </view>
                </view>
                <text class="tag order-tag" :class="statusMeta(o.status).cls">{{ statusMeta(o.status).text }}</text>
              </view>
            </view>
            <view v-else class="empty">
              <view class="empty__ic"><AppIcon name="package" :size="26" color="#9AA9A7" /></view>
              <text class="empty__t">暂无订单</text>
              <text class="tiny mt4" style="display: block">去商城看看钓友都在买什么</text>
            </view>
          </view>

          <!-- 区块：我的评论 / 展示本人对钓点的评价，支持点击图片预览大图 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>我的评论</text></view>
              <view class="section__more" @click="go('/pages/spots/spots')">
                <text>去野塘</text>
                <AppIcon name="chevron-right" :size="13" color="#0A6A6C" />
              </view>
            </view>
            <view v-if="myComments.length" class="card card--pad">
              <view v-for="c in myComments" :key="c.id" class="comment">
                <view class="avatar avatar--sm">{{ avatarText }}</view>
                <view class="comment__body">
                  <view class="comment__name">
                    <text>{{ nickname }}</text>
                    <text class="tiny">评价了钓点</text>
                  </view>
                  <text class="comment__text">{{ c.text }}</text>
                  <view v-if="c.images && c.images.length" class="comment__imgs">
                    <image
                      v-for="(src, ii) in c.images"
                      :key="ii"
                      class="ci"
                      :src="src"
                      mode="aspectFill"
                      @click="preview(c.images, ii)"
                    />
                  </view>
                  <view class="comment__ft">
                    <view class="row" style="gap: 3px">
                      <AppIcon name="map-pin" :size="12" color="#9AA9A7" />
                      <text>{{ c.spot }}</text>
                    </view>
                    <view class="row" style="gap: 3px">
                      <AppIcon name="clock" :size="12" color="#9AA9A7" />
                      <text>{{ c.date }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty">
              <view class="empty__ic"><AppIcon name="message-circle" :size="26" color="#9AA9A7" /></view>
              <text class="empty__t">还没有发表过评论</text>
              <text class="tiny mt4" style="display: block">去野塘详情页分享你的鱼情</text>
            </view>
          </view>

          <!-- 区块：设置列表 / 位置、收货地址、消息通知、清缓存、关于与退出登录
               注意事项：消息通知为本地开关；清缓存与退出登录均需二次确认 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>设置</text></view>
            </view>
            <view class="card">
              <view class="cell" @click="openLocation">
                <view class="cell__icon"><AppIcon name="map-pin" :size="18" color="#0A6A6C" /></view>
                <view class="grow">
                  <text class="cell__t">位置管理</text>
                  <text class="cell__d">{{ locText }}</text>
                </view>
                <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
              </view>
              <view class="cell" @click="go('/pages/address/address')">
                <view class="cell__icon"><AppIcon name="truck" :size="18" color="#0A6A6C" /></view>
                <view class="grow">
                  <text class="cell__t">收货地址</text>
                  <text class="cell__d">管理下单使用的收货信息</text>
                </view>
                <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
              </view>
              <view class="cell" @click="notifyOn = !notifyOn">
                <view class="cell__icon"><AppIcon name="bell" :size="18" color="#0A6A6C" /></view>
                <view class="grow">
                  <text class="cell__t">消息通知</text>
                  <text class="cell__d">{{ notifyOn ? '已开启鱼情与优惠提醒' : '已关闭消息提醒' }}</text>
                </view>
                <view class="switch" :class="{ 'is-on': notifyOn }">
                  <view class="switch__dot"></view>
                </view>
              </view>
              <view class="cell" @click="resetData">
                <view class="cell__icon"><AppIcon name="refresh-cw" :size="18" color="#0A6A6C" /></view>
                <view class="grow">
                  <text class="cell__t">清除本地缓存</text>
                  <text class="cell__d">重置本机缓存并重新同步账号数据</text>
                </view>
                <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
              </view>
              <view class="cell" @click="about">
                <view class="cell__icon"><AppIcon name="info" :size="18" color="#0A6A6C" /></view>
                <view class="grow">
                  <text class="cell__t">关于我们</text>
                  <text class="cell__d">版本与数据说明</text>
                </view>
                <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
              </view>
              <view class="cell" @click="logout">
                <view class="cell__icon"><AppIcon name="log-out" :size="18" color="#0A6A6C" /></view>
                <view class="grow"><text class="cell__t">退出登录</text></view>
                <view class="cell__arrow"><AppIcon name="chevron-right" :size="18" color="#9AA9A7" /></view>
              </view>
            </view>
          </view>

          <!-- 区块：页脚说明 / 版本信息与数据存储说明 -->
          <view class="mt24" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">渔获 AI · 原型演示版本</text>
            <text class="tiny mt4" style="color: var(--c-ink-4); display: block">账号与积分数据由服务器保存</text>
          </view>
        </template>
      </view>
    </view>

    <AppTabBar page="profile" />
    <AppOverlays />
  </view>
</template>

<script>
/* 个人中心页（pages/profile/profile）
 * 职责：展示当前登录用户的身份、资产、订单与评论，并提供会员、签到、赚积分、地址等入口。
 * 路由参数：无（通过底部 TabBar 进入）
 * 数据接口：
 *   Api.fetchProfile()        用户资料与资产，成功后写入全局 Store
 *   Api.fetchOrders()         我的订单
 *   Api.fetchMyComments()     我的评论
 *   Api.fetchFavorites()      收藏钓点 id 列表
 *   Api.logout()              退出登录
 * 关键交互：
 *   进入页面并行拉取资料与业务数据；未拿到用户前展示骨架屏
 * 业务限制：
 *   - 收藏数取服务端返回的 id 数量，并同步本地收藏集合
 *   - 退出登录需二次确认，成功后清空本地登录态并回到首页
 */
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money, orderStatusMeta } from '../../common/utils.js'
import { statusBarHeight } from '../../common/sys.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppIcon, AppTabBar, AppOverlays },
  data() {
    return {
      // 系统状态栏高度（px），用于顶部占位
      statusBarHeight,
      // 当前用户资料；为空时展示骨架屏，加载成功后赋值
      USER: null,
      // 消息通知开关（本地状态，不持久化）
      notifyOn: true,
      // 我的订单列表，元素结构：{ no, goods, date, amount, usePoints, status }
      orders: [],
      // 我的评论列表，元素结构：{ id, text, images[], spot, date }
      myComments: [],
      // 收藏钓点数量，由 Api.fetchFavorites 返回的 id 数组长度得出
      favoriteCount: 0,
      // 快捷功能配置：url 为跳转路径，act 为本地动作标识
      quickItems: [
        { ic: 'crown', t: '会员中心', url: '/pages/membership/membership' },
        { ic: 'calendar-check', t: '每日签到', url: '/pages/checkin/checkin' },
        { ic: 'play-circle', t: '看广告赚积分', url: '/pages/earn/earn' },
        { ic: 'bookmark', t: '我的收藏', act: 'fav' }
      ]
    }
  },
  computed: {
    // 当前积分余额
    points() { return Store.points },
    // 是否会员：决定信息卡展示会员丝带还是开通按钮
    isMember() { return Store.isMember },
    // 会员到期日
    memberExpire() { return Store.data.memberExpire },
    // 连续签到天数
    streak() { return Store.data.streak },
    // 收藏钓点数量（与模板中的 favorites 对应）
    favorites() { return this.favoriteCount },
    // 头像文字：取本地资料中的 avatarText，缺省展示「钓」
    avatarText() { return Store.data.avatarText || '钓' },
    // 昵称，缺省为「钓友」
    nickname() { return Store.data.nickname || '钓友' },
    // 手机号，缺省展示占位符
    phone() { return Store.data.phone || '--' },
    // 订单列表（供模板渲染）
    orders() { return this.orders },
    // 我的评论列表（供模板渲染）
    myComments() { return this.myComments },
    // 积分汇率：多少积分等于 1 元
    pointsPerYuan() { return Store.config.pointsPerYuan },
    // 位置展示文案：优先展示城市，其次区县，均无则为「未设置」
    locText() {
      const l = Store.location || {}
      const c = l.city || ''
      const d = l.district || ''
      return c || d ? (c + (d ? ' · ' + d : '')) : '未设置'
    },
    // 可抵扣金额（元）：向下取整，单笔最多抵 10 元
    usableYuan() { return Math.min(10, Math.floor(this.points / this.pointsPerYuan)) }
  },
  onLoad() {
    // 并行拉取用户资料与订单 / 评论 / 收藏，缩短首屏等待
    this.loadProfile()
    this.loadBusiness()
  },
  methods: {
    // 暴露金额格式化工具给模板使用
    money,
    /**
     * 页面内跳转
     * @param {string} url 目标页面路径
     * @returns {void}
     */
    go(url) { nav(url) },
    /** 从后端拉取资料并刷新本地身份与资产
     * @returns {void}
     */
    loadProfile() {
      Api.fetchProfile().then(res => {
        if (res.code !== 0 || !res.data) return
        Store.hydrate(res.data)
        this.USER = res.data
      })
    },
    /**
     * 拉取订单、评论与收藏等业务数据
     * @returns {void}
     * 说明：三个接口并行请求，单个失败不影响其余模块渲染
     */
    loadBusiness() {
      Api.fetchOrders().then(res => { if (res.code === 0 && Array.isArray(res.data)) this.orders = res.data })
      Api.fetchMyComments().then(res => { if (res.code === 0 && Array.isArray(res.data)) this.myComments = res.data })
      Api.fetchFavorites().then(res => {
        if (res.code !== 0 || !res.data) return
        const ids = res.data.ids || []
        this.favoriteCount = ids.length
        // 同步本地收藏集合，保证野塘详情页「已收藏」状态正确
        const cur = Store.data.favorites
        cur.splice(0, cur.length, ...ids)
        Store.save()
      })
    },
    // 订单状态映射：统一使用 utils 中的 orderStatusMeta，返回 { text, cls }
    statusMeta(status) { return orderStatusMeta(status) },
    /**
     * 打开订单详情
     * @param {string} no 订单号
     * @returns {void}
     */
    openOrder(no) {
      nav('/pages/order-detail/order-detail?no=' + encodeURIComponent(no))
    },
    /**
     * 快捷功能点击
     * @param {Object} x 快捷项配置 { t, url?, act? }
     * @returns {void}
     * 说明：act === 'fav' 为本地动作（提示收藏数量），其余按 url 跳转
     */
    onQuick(x) {
      if (x.act === 'fav') { ui.toast('共收藏 ' + this.favorites + ' 个钓点'); return }
      nav(x.url)
    },
    /**
     * 预览评论图片
     * @param {string[]} imgs 图片地址数组
     * @param {number} i 当前点击的图片下标
     * @returns {void}
     */
    preview(imgs, i) {
      uni.previewImage({ urls: imgs, current: imgs[i] })
    },
    /**
     * 打开位置选择面板
     * @returns {Promise<void>}
     */
    async openLocation() {
      await ui.locationSheet()
    },
    /**
     * 清除本地缓存
     * @returns {Promise<void>}
     * 步骤：1) 二次确认 → 2) 重置 Store 并清空 USER 触发骨架屏
     *       3) 重新拉取资料以恢复登录态
     */
    async resetData() {
      const yes = await ui.confirm({
        title: '清除本地缓存？',
        text: '将清除本机保存的积分、会员、签到等缓存，随后会重新从服务器同步你的账号数据。',
        okText: '确认清除',
        cancelText: '再想想'
      })
      if (yes) {
        Store.reset()
        this.USER = null
        // 本地缓存清空后重新拉取，顺带恢复登录态
        Api.fetchProfile().then(res => {
          if (res.code !== 0 || !res.data) return
          Store.setSession(res.data)
          this.USER = res.data
        })
        ui.toast('本地缓存已清除', 'refresh-cw')
      }
    },
    /**
     * 关于我们弹窗
     * @returns {void}
     * 说明：说明数据来源与演示属性，不涉及真实交易
     */
    about() {
      ui.openModal({
        title: '关于渔获 AI',
        sub: 'AI 钓鱼助手 · 原型演示版 v1.0.0',
        notes: [
          { type: 'info', icon: 'info', text: '本原型中的天气、鱼情、野塘与商品数据均为大模型与气象源联合生成的演示数据，仅供出钓参考。' },
          { type: 'gold', icon: 'shield-check', text: '账号与积分数据来自后端服务，演示环境不会产生真实交易与扣款。' }
        ],
        buttons: [{ text: '知道了', cls: 'line', value: true }]
      })
    },
    /**
     * 退出登录
     * @returns {Promise<void>}
     * 步骤：1) 二次确认 → 2) 调用后端登出 → 3) 清空本地登录态
     *       4) toast 提示并以 force 方式回到首页
     */
    async logout() {
      const yes = await ui.confirm({
        title: '退出登录？',
        text: '退出后需重新登录才能查看天气、野塘等功能。',
        okText: '退出登录',
        cancelText: '再想想'
      })
      if (!yes) return
      await Api.logout()
      Store.logout()
      ui.toast('已退出登录', 'log-out')
      nav('/pages/index/index', { force: true })
    }
  }
}
</script>

<style>
.bar-spacer { width: 100%; }
.stat-unit { font-size: 11px; font-family: var(--font-body); font-weight: 500; color: var(--c-ink-3); margin-left: 2px; }
/* 快捷入口卡片：纵向居中排列，四列网格由全局 .grid4 控制 */
.quick-tile {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 13px 6px; text-align: center; cursor: pointer;
  background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--r-md);
  box-shadow: var(--sh-sm);
}
.quick-tile__t { font-size: 11.5px; color: var(--c-ink-2); }
.section__more { display: flex; align-items: center; gap: 2px; color: var(--c-primary-d); font-size: 12px; }
.item__ic-lg { width: 44px; height: 44px; border-radius: 13px; }
.item__title { display: block; font-weight: 600; font-size: 13.5px; }
.item__meta { display: flex; gap: 12px; margin-top: 4px; font-size: 11.5px; color: var(--c-ink-3); align-items: center; }
.order-tag { align-self: flex-start; }
/* 评论之间用 1px 细线分隔，避免额外嵌套容器 */
.comment + .comment { border-top: 1px solid var(--c-line-soft); }
</style>
