<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="附近野塘" back right="定位" @right="openLocation" />

      <view class="page">
        <!-- 区块：搜索框 / 图标 + 输入框单行布局 / 输入即触发防抖查询，回车确认 -->
        <view class="search-box">
          <AppIcon name="search" :size="18" color="#6E807E" />
          <input
            class="input input--flush"
            :value="keyword"
            confirm-type="search"
            placeholder="搜塘名 / 鱼种，如「鲫鱼」"
            placeholder-class="ph"
            @input="onInput"
          />
        </view>

        <!-- 区块：快捷筛选 / 横向滚动的胶囊按钮 / 纯本地过滤，不触发请求 -->
        <scroll-view scroll-x class="hscroll mt12" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="c in chips"
              :key="c.k"
              class="chip"
              :class="{ 'is-on': c.k === view }"
              @click="view = c.k"
            >
              <text>{{ c.t }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 区块：排序 / 三段式分段控件 / 切换后本地重排，不重新请求 -->
        <view class="segmented mt12">
          <view
            v-for="s in sorts"
            :key="s.k"
            class="segmented__btn"
            :class="{ 'is-on': s.k === sort }"
            @click="sort = s.k"
          >
            <text>{{ s.t }}</text>
          </view>
        </view>

        <!-- 区块：数据来源说明 / 通栏提示条 / 解释 AI 整理与评论区封面规则 -->
        <view class="notice notice--info mt12">
          <AppIcon name="sparkles" :size="15" color="#0A6A6C" />
          <text class="grow">钓点由大模型结合地图与钓友数据整理；塘口没有实景图时，会自动取评论区第一张图作为封面。</text>
        </view>

        <!-- 区块：未开通会员提示 / 锁定说明卡 + 解锁按钮 / 下方列表同步加 lock-blur 不可操作（已移除看广告 / ¥1.99 解锁） -->
        <view v-if="locked" class="card card--pad mt12" style="text-align: center">
          <view class="icon-badge" style="width: 48px; height: 48px; margin: 0 auto 10px; background: var(--c-primary-l)">
            <AppIcon name="lock" :size="22" color="#0A6A6C" />
          </view>
          <text class="unlock-title">附近野塘已找到，开通会员后查看</text>
          <text class="muted mt4" style="display: block">开通会员即可无限次查看附近野塘，全程无广告</text>
          <view class="btn btn--primary btn--block btn--lg mt12" @click="unlock">
            <AppIcon name="crown" :size="18" color="#FFFFFF" />
            <text>开通会员查看</text>
          </view>
        </view>

        <!-- 区块：钓点列表 / 骨架、空态、分组列表三分支 / 锁定态整体加模糊遮罩 -->
        <view class="section" :class="{ 'lock-blur': locked }">
          <!-- 子区块：加载骨架 / AI 整理提示 + 四行条目占位 / 首次查询耗时较长时给出文案安抚 -->
          <view v-if="loading">
            <view class="row" style="gap: 6px; padding: 2px 2px 12px">
              <AppIcon name="sparkles" :size="15" color="#0A6A6C" />
              <text class="tiny">AI 正在整理 {{ placeText }} 的钓点，首次查询需要一会儿…</text>
            </view>
            <view v-for="i in 4" :key="i" class="row" style="gap: 12px; padding: 10px 0">
              <view class="skel" style="width: 74px; height: 74px; border-radius: 12px"></view>
              <view class="col grow" style="gap: 8px">
                <view class="skel" style="height: 14px; width: 60%"></view>
                <view class="skel" style="height: 12px; width: 85%"></view>
                <view class="skel" style="height: 12px; width: 40%"></view>
              </view>
            </view>
          </view>

          <!-- 子区块：空态 / 无匹配结果 / 提示更换关键词或清除筛选 -->
          <view v-else-if="!rows.length" class="empty">
            <view class="empty__ic"><AppIcon name="search" :size="26" color="#9AA9A7" /></view>
            <text class="empty__t">没有找到匹配的野塘</text>
            <text class="tiny mt4" style="display: block">换个关键词，或清除筛选条件再试试</text>
          </view>

          <!-- 子区块：列表 / 分组标题行与钓点条目混排 / 条目左侧缩略图，右侧名称、评分、距离、评论数、鱼种、水情 -->
          <template v-else>
            <template v-for="(r, i) in rows" :key="i">
              <text v-if="r.type === 'group'" class="group-title">{{ r.text }}</text>
              <view v-else class="item mb10" @click="openSpot(r.spot.id)">
                <!-- 缩略图：无实景图走占位块，评论实景在图上叠加角标 -->
                <view v-if="!r.spot.cover || r.spot.coverFrom === 'none'" class="item__thumb thumb-empty">
                  <AppIcon name="fish" :size="18" color="#0A6A6C" />
                  <text class="thumb-empty__t">暂无实景图</text>
                </view>
                <view v-else class="thumb-wrap">
                  <image class="item__thumb" :src="r.spot.cover" mode="aspectFill" />
                  <text v-if="r.spot.coverFrom === 'comment'" class="tag tag--accent thumb-flag">评论实景</text>
                </view>

                <view class="item__body">
                  <view class="row" style="gap: 6px">
                    <text class="item__title ellipsis grow">{{ r.spot.name }}</text>
                    <text class="tag" :class="payCls(r.spot.pay)">{{ r.spot.pay }}</text>
                  </view>
                  <view class="item__meta">
                    <view class="row" style="gap: 3px">
                      <Rating :value="r.spot.rating" :size="12" />
                      <text class="num" style="font-weight: 600; color: var(--c-ink-2)">{{ ratingText(r.spot.rating) }}</text>
                    </view>
                    <view class="row" style="gap: 3px">
                      <AppIcon name="navigation" :size="12" color="#6E807E" />
                      <text>{{ r.spot.dist }} km</text>
                    </view>
                    <view class="row" style="gap: 3px">
                      <AppIcon name="message-circle" :size="12" color="#6E807E" />
                      <text>{{ r.spot.commentCount }} 条评论</text>
                    </view>
                  </view>
                  <view class="row" style="gap: 5px; flex-wrap: wrap">
                    <text v-for="f in r.spot.fish" :key="f" class="tag tag--mute">{{ f }}</text>
                  </view>
                  <view class="row tiny" style="gap: 5px">
                    <AppIcon name="ruler" :size="11" color="#9AA9A7" />
                    <text>{{ r.spot.water }}</text>
                    <text>·</text>
                    <text>{{ r.spot.bottom }}</text>
                  </view>
                </view>
              </view>
            </template>
          </template>
        </view>

        <!-- 区块：页脚说明 / 居中免责声明 / 预留底部安全间距，避免被标签栏遮挡 -->
        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">以上钓点信息由 AI 整理，出行前请留意当地禁钓规定与天气水情</text>
          <text class="tiny mt4" style="color: var(--c-ink-4); display: block">渔获 AI · 原型演示数据，仅供出钓参考</text>
        </view>
      </view>
    </view>

    <!-- 全局：底部标签栏 + 全局浮层 -->
    <AppTabBar page="spots" />
    <AppOverlays />
  </view>
</template>

<script>
/* 附近野塘列表（底部 Tab 页，无路由参数）
 * 数据接口：Api.fetchSpots({ keyword, province, city, district })；定位取自 Store.location
 * 关键交互：关键词搜索（320ms 防抖）、快捷筛选、排序、切换定位、会员解锁
 * 业务限制：非会员进入时列表锁定（内容模糊不可点）；无实景图时以评论图作封面并标注「评论实景」
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Rating from '../../components/Rating.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { distGroup, ratingText } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays, Rating },
  data() {
    return {
      ALL: [], // 服务端返回的原始钓点数组（未筛选、未排序）
      view: 'all', // 快捷筛选：all / free / near / real / comment
      sort: 'dist', // 排序方式：dist 距离 / rating 评分 / comments 评论数
      keyword: '', // 搜索关键词（已 trim），参与服务端查询
      loading: true, // 骨架开关
      loaded: false, // 是否已完成过至少一次成功加载，决定 onShow 是否静默刷新
      kwTimer: null, // 搜索防抖定时器句柄，输入时需清除上一次
      chips: [ // 快捷筛选标签，k 与 v === view 时高亮
        { k: 'all', t: '全部' },
        { k: 'free', t: '免费' },
        { k: 'near', t: '离家近' },
        { k: 'real', t: '有实景图' },
        { k: 'comment', t: '评论区实景' }
      ],
      sorts: [
        { k: 'dist', t: '距离最近' },
        { k: 'rating', t: '评分最高' },
        { k: 'comments', t: '评论最多' }
      ]
    }
  },
  computed: {
    /** 列表是否锁定：非会员不可查看
     * @returns {boolean}
     */
    locked() { return !Store.isUnlocked('spots') },
    /** 定位展示文案：城市 + 区县，缺省为「附近」
     * @returns {string}
     */
    placeText() {
      const l = Store.location || {}
      return (l.city || '') + (l.district || '') || '附近'
    },
    /** 筛选 + 排序后的钓点列表（本地计算，不请求接口）
     * 步骤：1) 按快捷筛选过滤；2) 按排序字段重排
     * @returns {Object[]}
     */
    filtered() {
      let arr = this.ALL.slice()
      // 1) 快捷筛选：免费 / 3 公里内 / 有官方实景 / 评论实景
      const v = this.view
      if (v === 'free') arr = arr.filter(s => (s.pay || '').indexOf('免费') > -1)
      else if (v === 'near') arr = arr.filter(s => s.dist <= 3)
      else if (v === 'real') arr = arr.filter(s => !!s.cover && s.coverFrom !== 'comment' && s.coverFrom !== 'none')
      else if (v === 'comment') arr = arr.filter(s => s.coverFrom === 'comment')

      // 2) 排序：距离升序 / 评分降序 / 评论数降序
      const st = this.sort
      if (st === 'dist') arr.sort((a, b) => a.dist - b.dist)
      else if (st === 'rating') arr.sort((a, b) => b.rating - a.rating)
      else arr.sort((a, b) => b.commentCount - a.commentCount)
      return arr
    },
    /** 渲染行：按距离排序时插入分组标题行，其余排序不分组
     * 输出元素形如 { type: 'group', text } 或 { type: 'item', spot }
     * @returns {Object[]}
     */
    rows() {
      const out = []
      let lastGroup = ''
      this.filtered.forEach(s => {
        // 距离排序时，档位变化即插入一条分组标题
        if (this.sort === 'dist') {
          const g = distGroup(s.dist)
          if (g !== lastGroup) {
            lastGroup = g
            out.push({ type: 'group', text: g })
          }
        }
        out.push({ type: 'item', spot: s })
      })
      return out
    }
  },
  onLoad() {
    this.fetchSpots()
  },
  /** 从详情页返回时静默刷新：评论新增实景图后，封面要能跟着补上 */
  onShow() {
    if (this.loaded) this.fetchSpots(true)
  },
  methods: {
    /**
     * 收费标签样式：「需登记」用告警色，其余用成功色
     * @param {string} pay 收费说明文案
     * @returns {string} 标签类名
     */
    payCls(pay) { return (pay || '').indexOf('需登记') > -1 ? 'tag--warn' : 'tag--success' },
    /**
     * 页面跳转
     * @param {string} url 目标路径
     */
    go(url) { nav(url) },
    /**
     * 打开钓点详情
     * @param {string} id 钓点 ID
     */
    openSpot(id) { nav('/pages/spot-detail/spot-detail?id=' + encodeURIComponent(id)) },
    /**
     * 搜索输入：更新关键词并按 320ms 防抖发起查询
     * @param {Object} e 输入事件，e.detail.value 为输入值
     */
    onInput(e) {
      this.keyword = String((e.detail && e.detail.value) || '').trim()
      if (this.kwTimer) clearTimeout(this.kwTimer)
      this.kwTimer = setTimeout(() => this.fetchSpots(), 320)
    },
    /**
     * 拉取钓点列表
     * @param {boolean} silent 静默刷新：不点亮骨架，失败保留旧数据
     */
    fetchSpots(silent) {
      if (!silent) this.loading = true
      const loc = Store.location || {}
      Api.fetchSpots({
        keyword: this.keyword,
        province: loc.province,
        city: loc.city,
        district: loc.district
      }).then(res => {
        if (!silent) this.loading = false
        if (res.code !== 0 || !res.data) return
        this.ALL = res.data
        this.loaded = true
      })
    },
    /** 打开定位选择面板，确认后按新位置重新查询 */
    async openLocation() {
      await ui.locationSheet()
      this.fetchSpots()
    },
    /** 会员解锁校验：通过后重新拉取列表，取消则保持锁定态 */
    async unlock() {
      const ok = await ui.requireUnlock({
        feature: 'spots',
        title: '开通会员查看附近野塘',
        sub: '开通会员即可无限次查看附近野塘，全程无广告',
        featureLabel: '附近野塘查询'
      })
      if (ok) this.fetchSpots()
    }
  }
}
</script>

<style>
.ph { color: var(--c-ink-4); font-size: 14px; }
.mb10 { margin-bottom: 10px; }
/* 分组标题：距离档位分隔行，左右留 2px 对齐列表缩进 */
.group-title { display: block; margin: 8px 2px; font-size: 12.5px; font-weight: 600; color: var(--c-ink-3); }
/* 无图占位：竖排图标 + 文字，渐变底填补缩略图区域 */
.thumb-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  background: linear-gradient(160deg, var(--c-primary-l), var(--c-line-soft));
}
.thumb-empty__t { font-size: 9.5px; color: var(--c-ink-3); }
/* 缩略图容器：relative 作为「评论实景」角标的定位参照 */
.thumb-wrap { position: relative; flex: none; }
/* 角标：绝对定位在缩略图左下角 */
.thumb-flag { position: absolute; left: 4px; bottom: 4px; }
.unlock-title { display: block; font-family: var(--font-display); font-size: 17px; font-weight: 700; }
</style>
