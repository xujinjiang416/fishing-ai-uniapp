<template>
  <!-- 区块：页面根容器 / app-main 预留底部 tabbar 空间，浮层组件挂在最外层 -->
  <view class="app">
    <view class="app-main">
      <!-- 区块：加载骨架 / loading 期间用灰块占位，保持与真实卡片相近的高度避免跳动 -->
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
        <!-- 区块：Hero 头图 / 顶部叠大图 + 定位胶囊与「赚积分」入口，文案底部留白避开下压的概览卡 -->
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
            <text class="hero__sub">{{ heroSub }}</text>
          </view>
        </view>

        <view class="page" style="margin-top: -26px; position: relative; z-index: 2">
          <!-- 区块：未登录引导 / 不发起天气查询，先让用户登录 -->
          <view v-if="needLogin" class="card card--pad reveal" style="--d: 1; text-align: center">
            <view class="cell__icon" style="width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 15px">
              <AppIcon name="user" :size="22" color="#0A6A6C" />
            </view>
            <text style="display: block; font-size: 16px; font-weight: 700">请先登录</text>
            <text class="muted mt4" style="display: block; line-height: 1.6">登录后才能查看对应地点的天气与出钓指数</text>
            <view class="btn btn--primary btn--block btn--lg mt12" @click="goLogin">
              <AppIcon name="user" :size="18" color="#FFFFFF" />
              <text>去登录</text>
            </view>
          </view>

          <!-- 区块：已登录但未选点时的引导 / 不发起天气查询，先让用户选择位置 -->
          <view v-if="needLocation" class="card card--pad reveal" style="--d: 1; text-align: center">
            <view class="cell__icon" style="width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 15px">
              <AppIcon name="map-pin" :size="22" color="#0A6A6C" />
            </view>
            <text style="display: block; font-size: 16px; font-weight: 700">请先选择位置</text>
            <text class="muted mt4" style="display: block; line-height: 1.6">未登录时需要先选择省/市/区，才能获取对应地点的天气与出钓指数</text>
            <view class="btn btn--primary btn--block btn--lg mt12" @click="openLocation">
              <AppIcon name="crosshair" :size="18" color="#FFFFFF" />
              <text>选择位置</text>
            </view>
          </view>

          <!-- 区块：今日概览卡 / 出水色底，左侧指数与 AI 短评，右侧天气要素，底部最佳时段与全预报入口 -->
          <view v-if="!needLogin && !needLocation" class="card card--water card--pad reveal" style="--d: 1">
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
              <text class="tiny" style="color: rgba(255,255,255,.72)">开通会员后可无限次查看天气与钓点</text>
            </view>
          </view>

          <!-- 区块：核心功能列表 / 按使用频次排序，卡片点击走 goFeature 做会员鉴权；未解锁显示锁提示 -->
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

          <!-- 区块：积分 / 签到 / 看广告 / 两列卡片 + 一条通栏广告入口，数据均来自 Store -->
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

          <!-- 区块：会员卡片 / isMember 时展示权益生效态，否则展示首个套餐的价格与开通入口 -->
          <view class="section">
            <view v-if="isMember" class="card card--gold card--pad reveal" style="--d: 6">
              <view class="row" style="gap: 12px">
                <view class="avatar" style="background: rgba(255,255,255,.22)">
                  <AppIcon name="crown" :size="22" color="#FFFFFF" />
                </view>
                <view class="grow">
                  <text style="font-weight: 700; display: block">会员权益生效中</text>
                  <text class="tiny" style="opacity: .9; display: block">无限次查天气与钓点 · 全程免广告 · 签到免广告</text>
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

          <!-- 区块：出钓工具入口 / 四宫格，weather 与 spots 工具需会员，清单类工具直接跳转 -->
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

          <!-- 区块：广告位 / 仅非会员展示，点击进入「赚积分」页领取广告任务 -->
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

          <!-- 区块：页脚说明 / 免责声明与演示标识，底部额外留白避开 tabbar -->
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
/* 首页 —— FishCast 主入口
 *
 * 职责：展示今日出钓指数概览、核心功能入口（天气 / 钓点）、积分签到、会员与工具区。
 * props/emits：页面级组件，无 props、无 emits。
 * 数据来源：
 *   - Api.ensureConfig()：同步后台配置（签到 / 广告额度 / 会员套餐）；
 *   - Api.fetchWeather({ place, placeDetail })：W 天气、V 研判、SLOTS 时段轴；
 *   - Api.fetchAdCreatives()：首页广告位素材（取第一条）；
 *   - Store：位置、积分、签到、会员状态等本地状态。
 * 关键交互：
 *   - 点击定位胶囊 → ui.locationSheet() 选省市区，关闭后重新拉取天气；
 *   - 点击功能 / 工具 → ui.requireUnlock() 鉴权，通过后跳转，未开通则引导会员页；
 *   - 会员能力通过 Store.isUnlocked(feature) 判断。
 * 注意事项：本页为图标 + 卡片式布局，样式依赖全局 token（--c-* 变量），页面内 style 只做局部微调。
 */
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
      // 首屏加载中标记：true 时渲染骨架屏
      loading: true,
      // 未登录时置 true：展示登录引导，不发起天气查询
      needLogin: false,
      // 已登录但未选点时置 true：展示选点引导，不发起天气查询
      needLocation: false,
      // 天气实况（condition / temp / pressure / windDir / windLevel 等），来自 fetchWeather
      W: {},
      // 鱼情研判结论（score / name / advice），来自 fetchWeather
      V: {},
      // 全天时段概率轴数据，当前仅用于取「最佳时段」（best 计算属性）
      SLOTS: [],
      // 暴露全局状态到模板，便于直接读 Store.xxx（避免每处都写 this.Store）
      Store,
      // Hero 头图背景（本地静态图资源）
      heroImg: IMG.lakeHero,
      // 首页广告位素材对象 { brand, slogan, cta }，接口失败时保持空串
      ad: { brand: '', slogan: '', cta: '' },
      /* 核心功能配置：
       * feature = 鉴权用功能键（weather / spots）；href = 目标页；icon = AppIcon 键名；
       * title / desc / tags = 展示文案；badge / badgeCls = 角标文案与样式；
       * lockTitle = 未解锁弹窗标题；d = 入场动画延迟序号 */
      features: [
        {
          feature: 'weather', href: '/pages/weather/weather', icon: 'cloud',
          title: '钓鱼天气查询', badge: 'AI 预报', badgeCls: 'tag--accent',
          desc: '定位或选城市到区 · 气压/降水量/风向全指标 · 全天时段鱼口概率',
          tags: ['爆户 / 连杆 / 停口', '图片形式结果', '黄金时段提醒'],
          lockTitle: '解锁「钓鱼天气查询」', d: 2
        },
        {
          feature: 'spots', href: '/pages/spots/spots', icon: 'map-pin',
          title: '附近钓点查询', badge: '实时更新', badgeCls: 'tag--primary',
          desc: '真实水域的钓点实景 · 位置一键复制导航 · 钓友真实评价',
          tags: ['实景图片', '评论可传图', '真实水域'],
          lockTitle: '解锁「附近钓点查询」', d: 3
        }
      ],
      /* 出钓工具配置：ic = 图标键名，t = 名称，href = 目标页，lock = 需鉴权的功能键（null 表示免鉴权） */
      tools: [
        { ic: 'sunrise', t: '黄金时段', href: '/pages/weather/weather', lock: 'weather' },
        { ic: 'map-pin', t: '附近钓点', href: '/pages/spots/spots', lock: 'spots' },
        { ic: 'compass', t: '钓位朝向', href: '/pages/weather/weather', lock: 'weather' },
        { ic: 'clipboard-list', t: '出钓清单', href: '/pages/profile/profile', lock: null }
      ]
    }
  },
  computed: {
    /** 是否会员：决定会员卡形态、广告位与锁定提示的显隐 */
    isMember() { return Store.isMember },
    /**
     * 首页定位展示文案
     * @returns {String} 形如「杭州·西湖」，城市去掉「市」后缀
     */
    locText() {
      const l = Store.location
      if (!l.city && !l.district) return '选择位置'
      return String(l.city).replace('市', '') + '·' + l.district
    },
    /** Hero 副标题：未登录提示登录，未选点提示先选位置 */
    heroSub() {
      if (this.needLogin) return '登录后即可查看本地鱼情与出钓指数'
      if (this.needLocation) return '请先选择位置，AI 才能开始研判本地鱼情'
      return '定位已就绪，AI 正在为你研判今日鱼情'
    },
    /**
     * Hero 顶部安全区偏移：状态栏高度 + 10px 视觉留白
     * @returns {String} 行内 style 字符串
     */
    heroTopStyle() { return 'padding-top:' + (statusBarHeight + 10) + 'px' },
    /**
     * 最佳时段：优先取第 2 个时段，缺失时回退第 1 个或空对象
     * （时段轴按概率排序，第 1 个为全天最高/最早，业务上以第 2 个为「次优可守」时段）
     * @returns {Object} { time, name }
     */
    best() { return this.SLOTS[1] || this.SLOTS[0] || { time: '', name: '' } },
    /**
     * 概览卡 AI 短评（截断 18 字，避免换行挤压缩略布局）
     * @returns {String} 短文案
     */
    adviceShort() { return String(this.V.advice || '').slice(0, 18) },
    /**
     * 积分进度条百分比：20 分对应 1%，上限 100
     * @returns {Number} 0~100
     */
    pointsPct() { return Math.min(100, Store.data.points / 20) },
    // 广告积分 / 额度 / 套餐均以后台配置为准
    /** 单条广告奖励积分（后台配置） */
    adPoints() { return Store.adPoints },
    /** 会员每日广告额度（后台配置） */
    memberLimit() { return Store.config.ad.limitMember },
    /** 非会员每日广告额度（后台配置） */
    normalLimit() { return Store.config.ad.limitNormal },
    /** 当前身份下的签到积分（会员/非会员不同，由 Store 计算） */
    checkinPoints() { return Store.checkinPoints },
    /** 首个会员套餐（用于会员卡展示价格），无套餐时为 null */
    memberPlan() { return (Store.plans && Store.plans[0]) || null },
    // 会员卡片标题：套餐信息取自后台配置
    /**
     * 会员卡标题：有套餐时拼「¥价格 / 时长」，否则仅「开通会员」
     * @returns {String} 标题文案
     */
    memberTitle() {
      const p = this.memberPlan
      if (!p) return '开通会员'
      return '开通会员 · ¥' + money(p.price) + ' / ' + (p.durationLabel || '')
    },
    /** 积分兑换比例：多少积分抵 1 元（后台配置） */
    pointsPerYuan() { return Store.config.pointsPerYuan },
    /** 会员权益标签列表（由配置动态拼接） */
    memberTags() {
      return ['无限次查询', '全程无广告', '签到 +' + this.checkinPoints + ' 分/天', '每日 ' + this.memberLimit + ' 条广告']
    },
    /**
     * 签到卡副文案
     * @returns {String} 「今日已签到」或「今日待签到 · +N 分」
     */
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
  onShow() {
    // 从登录页 / 选点弹层返回后，若仍处于引导态则重新检查并加载
    if (this.needLogin || this.needLocation) this.load()
  },
  methods: {
    money,
    /**
     * 拉取首页天气与研判
     * 分步：① 读取 Store 当前省市区拼成 place；② 请求天气接口；
     *       ③ 校验 code 与 data；④ 分别落到 W / V / SLOTS 并结束 loading。
     * @returns {void}
     */
    load() {
      const l = Store.location || {}
      // 未登录时不发起天气查询，先引导用户登录
      if (!Store.isLoggedIn) {
        this.loading = false
        this.needLogin = true
        this.needLocation = false
        ui.toast('请先登录', 'user')
        return
      }
      // 已登录但没有省/市/区时，不发起天气查询，先引导用户选择位置
      if (!(l.province || l.city || l.district)) {
        this.loading = false
        this.needLogin = false
        this.needLocation = true
        ui.toast('请先选择位置', 'map-pin')
        return
      }
      this.needLogin = false
      this.needLocation = false
      this.loading = true
      Api.fetchWeather({
        place: l.province + ' ' + l.city + ' ' + l.district,
        placeDetail: '3 公里范围内钓点'
      }).then(res => {
        if (res.code !== 0 || !res.data) { this.loading = false; return }
        this.W = res.data.weather
        this.V = res.data.verdict
        this.SLOTS = res.data.slots
        this.loading = false
      })
    },
    /**
     * 拉取广告素材：取列表第一条作为首页广告位；失败时保持占位空串
     * @returns {void}
     */
    loadAd() {
      Api.fetchAdCreatives().then(res => {
        if (res.code === 0 && res.data && res.data.length) this.ad = res.data[0]
      })
    },
    /**
     * 站内跳转（统一走 nav，便于统一处理登录态与 tab 页）
     * @param {String} url 目标页面路径
     * @returns {void}
     */
    go(url) { nav(url) },
    /**
     * 打开位置选择弹层，关闭后按新位置重新拉取天气
     * @returns {Promise<void>}
     */
    async openLocation() {
      const loc = await ui.locationSheet()
      if (loc) this.needLocation = false
      this.load()
    },
    /** 跳转登录页 */
    goLogin() { ui.toLogin() },
    /**
     * 带会员鉴权的功能跳转：未解锁时弹出套餐选择，用户选择后前往会员页
     * @param {String} feature 功能键 weather | spots
     * @param {String} href    鉴权通过后的目标页面
     * @param {String} title   未解锁弹窗标题
     * @returns {Promise<void>}
     */
    async goFeature(feature, href, title) {
      const ok = await ui.requireUnlock({
        feature,
        title: title || '开通会员',
        sub: '开通会员后可无限次使用对应功能，且全程无广告',
        featureLabel: feature === 'weather' ? '钓鱼天气查询' : '附近钓点查询'
      })
      if (ok) nav(href)
    },
    /**
     * 点击出钓工具：有 lock 的走鉴权，无 lock 的直接跳转
     * @param {Object} x 工具配置 { ic, t, href, lock }
     * @returns {void}
     */
    onTool(x) {
      if (x.lock) {
        this.goFeature(x.lock, x.href, x.lock === 'weather' ? '开通会员查看钓鱼天气' : '开通会员查看附近钓点')
      } else {
        nav(x.href)
      }
    }
  }
}
</script>

<style>
/* 页面级局部样式：仅覆盖首页特有元素，通用卡片 / 网格 / 按钮样式来自全局设计系统 */
/* 上移 hero 文案，避免被下方 -26px 上叠的概览卡遮住 */
.hero__body { bottom: 36px; }
/* 概览卡内的超大出钓指数与天气要素字号 */
.ov-score { font-family: var(--font-display); font-size: 42px; font-weight: 700; line-height: 1; color: #fff; }
.ov-cond { font-size: 13px; color: #fff; }
/* 积分 / 连续天数的大号数字 */
.big-num { font-family: var(--font-display); font-size: 27px; font-weight: 700; margin-top: 4px; display: block; }
/* 会员卡内头像文字 */
.avatar__t { color: #fff; font-weight: 700; font-size: 12px; }
/* 四宫格工具卡：纵向居中排列，图标与文字间距 6px */
.tool-cell {
  border: 1px solid var(--c-line);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 13px 6px;
}
.tool-cell__t { font-size: 11.5px; color: var(--c-ink-2); }
/* 首页广告位：浅水蓝渐变底，与会员金色卡形成区分 */
.ad-slot { background: linear-gradient(120deg, #F7FBFA, #EEF6F5); }
</style>
