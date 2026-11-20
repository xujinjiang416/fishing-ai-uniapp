<template>
  <!-- 区块：浮层根节点 / 所有浮层平铺在此，靠 overlay 状态控制显隐，页面只需在最外层引入一次 -->
  <view>
    <!-- 区块：轻提示 Toast / 顶部居中短暂浮现，无遮罩、不阻断操作；1.8s 后由 ui.js 自动关闭 -->
    <view v-if="ov.toast.show" class="toast">
      <AppIcon v-if="ov.toast.icon" :name="ov.toast.icon" :size="15" color="#FFFFFF" />
      <text>{{ ov.toast.msg }}</text>
    </view>

    <!-- 区块：通用模态 / 遮罩 + 居中卡片，由 ui.openModal 的配置驱动（头部/正文/按钮三段式） -->
    <template v-if="ov.modal">
      <!-- 遮罩：点击关闭；modal.dismissable === false 时 onModalMask 会拦截 -->
      <view class="mask" @click="onModalMask"></view>
      <view class="modal-wrap">
        <view class="modal" :class="{ 'modal--wide': ov.modal.wide }">
          <!-- 头部：图标徽标 + 主标题 + 副标题；三者皆空时整块不渲染（hasHd 控制） -->
          <view v-if="hasHd" class="modal__hd">
            <view
              v-if="ov.modal.icon"
              class="icon-badge modal__icon"
              :class="'tone-' + (ov.modal.iconTone || 'primary')"
            >
              <AppIcon :name="ov.modal.icon" :size="24" :color="toneColor" />
            </view>
            <text v-if="ov.modal.title" class="modal__title">{{ ov.modal.title }}</text>
            <text v-if="ov.modal.sub" class="modal__sub">{{ ov.modal.sub }}</text>
          </view>

          <!-- 正文：说明文字 / 键值行（rows）/ 权益列表（benefits）/ 提示条（notes），任一非空才渲染 -->
          <view v-if="hasBd" class="modal__bd">
            <text v-if="ov.modal.text" class="modal__text">{{ ov.modal.text }}</text>
            <view v-if="ov.modal.rows && ov.modal.rows.length" class="modal__rows">
              <view v-for="(r, i) in ov.modal.rows" :key="i" class="row row--between modal__row">
                <text class="k">{{ r.k }}</text>
                <text class="v" :class="r.cls">{{ r.v }}</text>
              </view>
            </view>
            <view v-for="(b, i) in (ov.modal.benefits || [])" :key="'bf' + i" class="benefit">
              <view class="benefit__ic">
                <AppIcon :name="b.ic || 'check'" :size="16" color="#C08A2E" />
              </view>
              <view class="grow">
                <text class="benefit__t">{{ b.t }}</text>
                <text class="benefit__d">{{ b.d }}</text>
              </view>
            </view>
            <view
              v-for="(n, i) in (ov.modal.notes || [])"
              :key="'nt' + i"
              class="notice"
              :class="'notice--' + (n.type || 'info')"
            >
              <AppIcon :name="n.icon || 'info'" :size="15" :color="noticeColor(n.type)" />
              <text class="grow">{{ n.text }}</text>
            </view>
          </view>

          <!-- 底部按钮区：竖向排列；无正文时上提贴合头部（modal__ft 的 top 修饰类） -->
          <view
            v-if="ov.modal.buttons && ov.modal.buttons.length"
            class="modal__ft"
            :class="{ 'modal__ft--top': !hasBd }"
          >
            <view
              v-for="(b, i) in ov.modal.buttons"
              :key="'bt' + i"
              class="btn btn--block"
              :class="'btn--' + (b.cls || 'primary')"
              @click="pickButton(b)"
            >
              <text>{{ b.text }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 区块：会员套餐弹窗 / 由 ui.planSelector 触发；点击遮罩 => 取消返回 null，选择套餐 => 返回 planId -->
    <template v-if="ov.paywall">
      <view class="mask" @click="closePaywall"></view>
      <view class="modal-wrap">
        <view class="modal modal--wide">
          <!-- 弹窗头部：皇冠徽标 + 标题 + 副标题（文案由调用方传入） -->
          <view class="paywall__hero">
            <view class="paywall__icon">
              <AppIcon name="crown" :size="22" color="#FFFFFF" />
            </view>
            <text class="paywall__title">{{ ov.paywall.title }}</text>
            <text class="paywall__sub">{{ ov.paywall.sub }}</text>
          </view>
          <view class="modal__bd pw-list">
            <!-- 后台配置的全部会员套餐：名称 / 权益说明 / 定价 -->
            <view
              v-for="(p, i) in ov.paywall.plans"
              :key="p.id"
              class="opt"
              :class="{ 'is-reco': i === 0 }"
              @click="choose(p.id)"
            >
              <view class="opt__ic opt__ic--member">
                <AppIcon :name="p.icon || 'crown'" :size="20" color="#FFFFFF" />
              </view>
              <view class="grow">
                <view class="row" style="gap: 6px; align-items: center; flex-wrap: wrap">
                  <text class="opt__t">{{ p.name }}</text>
                  <!-- 套餐标签：每个套餐有则展示（后台配置） -->
                  <text v-if="p.tag" class="tag tag--gold" style="font-size: 10.5px">{{ p.tag }}</text>
                </view>
                <text class="opt__d">{{ benefitLine(p) }}</text>
              </view>
              <view style="text-align: right; flex: none">
                <text class="opt__price">¥{{ money(p.price) }}</text>
                <text class="tiny" style="display: block">{{ p.durationLabel }}</text>
              </view>
            </view>

            <!-- 套餐为空时的兜底提示（避免配置缺失导致空白） -->
            <view v-if="!ov.paywall.plans || !ov.paywall.plans.length" class="notice notice--info">
              <AppIcon name="info" :size="15" color="#0A6A6C" />
              <text class="grow">暂无可选套餐，点击下方按钮前往开通会员页面查看最新套餐。</text>
            </view>

            <!-- 权益说明：用 featureLabel 指出当前被拦截的功能 -->
            <view class="notice notice--info">
              <AppIcon name="sparkles" :size="15" color="#0A6A6C" />
              <text class="grow">开通会员后，{{ ov.paywall.featureLabel }}可无限次查看，且全程无广告。</text>
            </view>
          </view>
          <!-- 底部操作：主按钮传空 planId 表示直接去开通页；次按钮等价于取消 -->
          <view class="modal__ft">
            <view class="btn btn--primary btn--block" @click="choose('')">
              <text>前往开通会员</text>
            </view>
            <view class="btn btn--line btn--block mt8" @click="closePaywall">
              <text>暂不使用</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 区块：广告播放器（模拟，无真实广告 SDK）/ 每 100ms 递减一次剩余毫秒，播完一条切下一条创意 -->
    <template v-if="ov.ad">
      <view class="mask"></view>
      <view class="modal-wrap">
        <view class="modal">
          <view class="ad-stage">
            <text class="ad-stage__badge">AD · 广告</text>
            <!-- 关闭按钮：中途退出返回 false，不发放权益 -->
            <view class="ad-stage__close">
              <view class="appbar__btn" style="background: rgba(255,255,255,.16); box-shadow: none" @click="cancelAd">
                <AppIcon name="x" :size="16" color="#FFFFFF" />
              </view>
            </view>
            <!-- 广告舞台：品牌名 / 标语 / 倒计时圆环（conic-gradient 按进度填色） -->
            <view class="ad-stage__body">
              <text class="ad-stage__brand">{{ ov.ad.creative.brand }}</text>
              <text class="ad-stage__slogan">{{ ov.ad.creative.slogan }}</text>
              <view class="ad-ring" :style="ringStyle">
                <view class="ad-ring__hole">
                  <text class="ad-ring__num">{{ adLeftSec }}</text>
                </view>
              </view>
              <text class="ad-tip">观看中，{{ adLeftSec }} 秒后可获得权益</text>
            </view>
            <!-- 进度点：已看完 / 当前播放 / 待播放 三态 -->
            <view class="ad-dots">
              <view
                v-for="i in ov.ad.count"
                :key="i"
                class="ad-dot"
                :class="{ 'is-done': (i - 1) < ov.ad.index, 'is-now': (i - 1) === ov.ad.index }"
              ></view>
            </view>
            <text class="ad-progress">第 {{ ov.ad.index + 1 }} / {{ ov.ad.count }} 个广告</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 区块：位置选择底部弹层 / 省 → 市 → 区三级联动，选到区即可确认 -->
    <template v-if="ov.location">
      <view class="mask" @click="closeLocation"></view>
      <view class="sheet">
        <!-- 顶部拖拽条：纯装饰，提示可下拉/上滑关闭的弹层形态 -->
        <view class="sheet__grip"></view>
        <view class="row row--between" style="margin-bottom: 12px">
          <text class="sheet__title" style="margin: 0">选择钓点位置</text>
          <view class="appbar__btn" @click="closeLocation">
            <AppIcon name="x" :size="16" color="#12211F" />
          </view>
        </view>
        <view class="btn btn--primary btn--block" @click="useGps">
          <AppIcon name="crosshair" :size="18" color="#FFFFFF" />
          <text>使用手机定位</text>
        </view>
        <!-- 省级：横向滚动的 chip 列表，选中即重置市/区默认值 -->
        <text class="tiny loc-label">省份</text>
        <scroll-view scroll-x class="hscroll" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="p in provinces"
              :key="p"
              class="chip"
              :class="{ 'is-on': p === loc.p }"
              @click="pickP(p)"
            >
              <text>{{ p }}</text>
            </view>
          </view>
        </scroll-view>
        <!-- 市级：依赖已选省份的 cities 计算属性 -->
        <text class="tiny loc-label">城市</text>
        <scroll-view scroll-x class="hscroll" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="c in cities"
              :key="c"
              class="chip"
              :class="{ 'is-on': c === loc.c }"
              @click="pickC(c)"
            >
              <text>{{ c }}</text>
            </view>
          </view>
        </scroll-view>
        <!-- 区县级：依赖已选省 + 市的 districts 计算属性 -->
        <text class="tiny loc-label">区 / 县（精确到区）</text>
        <scroll-view scroll-x class="hscroll" :show-scrollbar="false">
          <view class="hscroll__row">
            <view
              v-for="d in districts"
              :key="d"
              class="chip"
              :class="{ 'is-on': d === loc.d }"
              @click="pickD(d)"
            >
              <text>{{ d }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="notice notice--info mt12">
          <AppIcon name="info" :size="15" color="#0A6A6C" />
          <text class="grow">选到区即可，AI 会结合该区气象与水域特征推导当日鱼情与时段口型。</text>
        </view>
        <!-- 确认按钮：写回 Store（已登录时同步后端）并 resolve 位置对象 -->
        <view class="btn btn--accent btn--block btn--lg mt12" @click="confirmLocation">
          <text>确定位置</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
/* AppOverlays —— 全局浮层宿主（每个页面在最外层包含一次）
 * 承载：轻提示 / 通用模态 / 付费墙 / 广告播放器 / 位置选择
 * 触发方式统一走 common/ui.js 的语义化 API。
 *
 * props：无（数据源为 common/overlay.js 的响应式单例 overlay）。
 * emits：无（结果通过各浮层配置里的 _resolve 回传给 Promise 调用方）。
 * 数据来源：
 *   - common/overlay.js 的 overlay：五个浮层槽位（toast / modal / paywall / ad / location）；
 *   - Api.fetchCities()：省 / 市 / 区三级地址树；
 *   - Store.setLocation / Api.saveLocation：确认位置后的本地与后端落库。
 * 生命周期要点：
 *   - created 中监听 overlay.ad（开/停计时器）与 overlay.location（回填当前已选位置）；
 *   - beforeUnmount 清理广告计时器，避免页面销毁后定时器泄漏。
 * 注意：本组件只做渲染与交互转发，不承载业务判断；解锁鉴权统一在 ui.requireUnlock。
 */
import AppIcon from './AppIcon.vue'
import { overlay } from '../common/overlay.js'
import Store from '../common/state.js'
import Api from '../common/api.js'
import { money } from '../common/utils.js'
import * as ui from '../common/ui.js'

/* 模态图标徽标色调映射：iconTone 键名 → 实际色值 */
const TONE_COLOR = { primary: '#0A6A6C', gold: '#C08A2E', accent: '#E8662B', success: '#1D7A50' }
/* 提示条（notes）类型 → 图标/文字色；未知类型回退 info */
const NOTICE_COLOR = { info: '#0A6A6C', warn: '#8E6210', gold: '#8C6420' }

export default {
  name: 'AppOverlays',
  components: { AppIcon },
  data() {
    return {
      // 直接引用全局浮层状态单例，模板中即可响应式读取（不拷贝，保证与 ui.js 同步）
      ov: overlay,
      // 位置选择弹层内的临时选择值：p 省 / c 市 / d 区，确认后才写回 Store
      loc: { p: '', c: '', d: '' },
      // 广告倒计时句柄（setInterval），用于停止/重启，避免重复计时
      adTimer: null,
      // 省市区三级地址树（Api.fetchCities 返回），驱动三个计算属性
      provincesData: []
    }
  },
  computed: {
    /**
     * 模态是否渲染头部
     * @returns {Boolean} icon / title / sub 任一存在即为 true
     */
    hasHd() {
      const m = this.ov.modal
      return !!(m && (m.icon || m.title || m.sub))
    },
    /**
     * 模态是否渲染正文
     * @returns {Boolean} text / rows / benefits / notes 任一非空即为 true
     */
    hasBd() {
      const m = this.ov.modal
      if (!m) return false
      return !!(m.text || (m.rows && m.rows.length) || (m.benefits && m.benefits.length) || (m.notes && m.notes.length))
    },
    /**
     * 模态头部图标颜色：按 iconTone 取值，缺省 primary
     * @returns {String} 十六进制色值
     */
    toneColor() {
      return TONE_COLOR[(this.ov.modal && this.ov.modal.iconTone) || 'primary'] || TONE_COLOR.primary
    },
    /**
     * 当前广告剩余秒数（向上取整，最小 0）
     * @returns {Number} 剩余秒数；无广告时为 0
     */
    adLeftSec() {
      const a = this.ov.ad
      return a ? Math.max(0, Math.ceil(a.left / 1000)) : 0
    },
    /**
     * 广告倒计时圆环样式：按已播放比例生成 conic-gradient 扇区角度
     * @returns {String} 行内 background 声明；无广告时返回空串
     */
    ringStyle() {
      const a = this.ov.ad
      if (!a) return ''
      const done = 1 - (a.left / a.total)
      const deg = Math.max(0, Math.min(360, done * 360))
      return 'background: conic-gradient(#7FE3D2 ' + deg + 'deg, rgba(255,255,255,.2) 0deg);'
    },
    /** 全部省份名列表（供省级 chip 渲染） */
    provinces() {
      return this.provincesData.map(p => p.name)
    },
    /** 当前省份下的城市名列表；未选省时为空数组 */
    cities() {
      const p = this.provincesData.filter(x => x.name === this.loc.p)[0]
      return p ? p.cities.map(c => c.name) : []
    },
    /** 当前省 + 市下的区县列表；省市未选全时为空数组 */
    districts() {
      const p = this.provincesData.filter(x => x.name === this.loc.p)[0]
      if (!p) return []
      const c = p.cities.filter(x => x.name === this.loc.c)[0]
      return c ? c.districts : []
    }
  },
  created() {
    // 广告浮层出现即开始倒计时，消失即停止（含被外部 adDone/adCancel 清空的情况）
    this.$watch(() => overlay.ad, v => { if (v) this.startAd() ; else this.stopAd() })
    // 位置弹层打开时，用当前已保存的位置初始化三级选择，避免每次从空开始
    this.$watch(() => overlay.location, v => {
      if (v) this.loc = { p: v.p, c: v.c, d: v.d }
    })
    this.loadCities()
  },
  beforeUnmount() {
    // 页面销毁时务必清理计时器
    this.stopAd()
  },
  methods: {
    money,
    /** 套餐权益说明：取前 3 条权益拼接展示，无权益时回退时长标签 */
    benefitLine(p) {
      const list = (p && p.benefits) || []
      if (list.length) return list.slice(0, 3).join(' · ')
      return (p && p.durationLabel) || ''
    },
    /**
     * 提示条颜色：按类型映射，未匹配回退 info
     * @param {String} type 提示类型 info | warn | gold
     * @returns {String} 十六进制色值
     */
    noticeColor(type) {
      return NOTICE_COLOR[type || 'info'] || NOTICE_COLOR.info
    },
    /* ---- 通用模态 ---- */
    /**
     * 遮罩点击：dismissable === false 时禁止关闭（如强确认弹窗）
     * @returns {void}
     */
    onModalMask() {
      const m = this.ov.modal
      if (m && m.dismissable === false) return
      ui.closeModal(null)
    },
    /**
     * 点击模态按钮：关闭并把按钮 value resolve 给 openModal 的 Promise
     * @param {Object} b 按钮配置 { text, cls, value, close }
     * @returns {void}
     */
    pickButton(b) {
      if (b.close === false) return
      ui.closeModal(b.value)
    },
    /* ---- 付费墙 ---- */
    /**
     * 选择套餐：回传套餐 id（空串表示直接去开通页）
     * @param {String} kind 套餐 id
     * @returns {void}
     */
    choose(kind) { ui.choosePaywall(kind) },
    /**
     * 关闭套餐弹窗：回传 null，调用方视为取消
     * @returns {void}
     */
    closePaywall() { ui.choosePaywall(null) },
    /* ---- 广告播放器 ---- */
    /**
     * 启动广告倒计时（先停旧计时器防止叠加）
     * 流程：每 100ms 扣减 left → 扣到 0 则 index+1 →
     *       未播完全部则重置 left 并轮播下一条创意；播完则停止并回调 ui.adDone。
     * @returns {void}
     */
    startAd() {
      this.stopAd()
      this.adTimer = setInterval(() => {
        const a = overlay.ad
        if (!a) { this.stopAd(); return }
        a.left -= 100
        if (a.left > 0) return
        a.index += 1
        if (a.index >= a.count) {
          this.stopAd()
          ui.adDone()
        } else {
          a.left = a.total
          const creatives = a.creatives || []
          a.creative = creatives.length ? creatives[a.index % creatives.length] : { brand: '', slogan: '', cta: '' }
        }
      }, 100)
    },
    /**
     * 停止并清空广告计时器（幂等）
     * @returns {void}
     */
    stopAd() {
      if (this.adTimer) { clearInterval(this.adTimer); this.adTimer = null }
    },
    /**
     * 用户中途关闭广告：回传 false，不发放权益
     * @returns {void}
     */
    cancelAd() { ui.adCancel() },
    /* ---- 位置选择 ---- */
    /**
     * 关闭位置弹层：回传 null 表示未选择
     * @returns {void}
     */
    closeLocation() { ui.closeLocationSheet(null) },
    /**
     * 选省份：自动联动到该省首个城市与首个区县，保证三级始终有效
     * @param {String} p 省份名
     * @returns {void}
     */
    pickP(p) {
      this.loc.p = p
      const cs = this.cities
      this.loc.c = cs[0] || ''
      const ds = this.districts
      this.loc.d = ds[0] || ''
    },
    /**
     * 选城市：自动联动到该市首个区县
     * @param {String} c 城市名
     * @returns {void}
     */
    pickC(c) {
      this.loc.c = c
      const ds = this.districts
      this.loc.d = ds[0] || ''
    },
    /**
     * 选区县
     * @param {String} d 区县名
     * @returns {void}
     */
    pickD(d) { this.loc.d = d },
    /**
     * 使用手机定位：仅校验定位权限并提示，不做逆地理编码
     * （无逆地理编码服务时经纬度无法映射到省/市/区，故引导手动选择）
     * @returns {void}
     */
    useGps() {
      // 无逆地理编码服务时，经纬度无法直接映射到省/市/区，引导手动选择
      uni.getLocation({
        type: 'gcj02',
        success: () => ui.toast('已获取定位，请手动选择所在城市到区', 'crosshair'),
        fail: () => ui.toast('定位失败，请手动选择所在城市', 'alert-triangle')
      })
    },
    /**
     * 拉取省市区地址树；仅 code === 0 且 data 为数组时采用
     * @returns {void}
     */
    loadCities() {
      Api.fetchCities().then(res => {
        if (res.code === 0 && Array.isArray(res.data)) this.provincesData = res.data
      })
    },
    /**
     * 确认位置：写入 Store（已登录则同步后端）→ 关闭弹层回传 location → toast 提示
     * @returns {void}
     */
    confirmLocation() {
      const loc = { province: this.loc.p, city: this.loc.c, district: this.loc.d }
      Store.setLocation(loc)
      // 已登录时同步到后端，未登录只落本地
      if (Store.isLoggedIn) Api.saveLocation(loc)
      ui.closeLocationSheet(Store.location)
      ui.toast('已切换到 ' + this.loc.c + this.loc.d, 'circle-check')
    }
  }
}
</script>
