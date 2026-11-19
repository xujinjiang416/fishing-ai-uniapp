<template>
  <view>
    <!-- 轻提示 -->
    <view v-if="ov.toast.show" class="toast">
      <AppIcon v-if="ov.toast.icon" :name="ov.toast.icon" :size="15" color="#FFFFFF" />
      <text>{{ ov.toast.msg }}</text>
    </view>

    <!-- 通用模态 -->
    <template v-if="ov.modal">
      <view class="mask" @click="onModalMask"></view>
      <view class="modal-wrap">
        <view class="modal" :class="{ 'modal--wide': ov.modal.wide }">
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

    <!-- 会员套餐选择弹窗（替代原「看广告 / 付费」解锁弹窗） -->
    <template v-if="ov.paywall">
      <view class="mask" @click="closePaywall"></view>
      <view class="modal-wrap">
        <view class="modal modal--wide">
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

            <view class="notice notice--info">
              <AppIcon name="sparkles" :size="15" color="#0A6A6C" />
              <text class="grow">开通会员后，{{ ov.paywall.featureLabel }}可无限次查看，且全程无广告。</text>
            </view>
          </view>
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

    <!-- 广告播放器（模拟，无真实广告 SDK） -->
    <template v-if="ov.ad">
      <view class="mask"></view>
      <view class="modal-wrap">
        <view class="modal">
          <view class="ad-stage">
            <text class="ad-stage__badge">AD · 广告</text>
            <view class="ad-stage__close">
              <view class="appbar__btn" style="background: rgba(255,255,255,.16); box-shadow: none" @click="cancelAd">
                <AppIcon name="x" :size="16" color="#FFFFFF" />
              </view>
            </view>
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

    <!-- 位置选择 -->
    <template v-if="ov.location">
      <view class="mask" @click="closeLocation"></view>
      <view class="sheet">
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
 */
import AppIcon from './AppIcon.vue'
import { overlay } from '../common/overlay.js'
import Store from '../common/state.js'
import Api from '../common/api.js'
import { money } from '../common/utils.js'
import * as ui from '../common/ui.js'

const TONE_COLOR = { primary: '#0A6A6C', gold: '#C08A2E', accent: '#E8662B', success: '#1D7A50' }
const NOTICE_COLOR = { info: '#0A6A6C', warn: '#8E6210', gold: '#8C6420' }

export default {
  name: 'AppOverlays',
  components: { AppIcon },
  data() {
    return {
      ov: overlay,
      loc: { p: '', c: '', d: '' },
      adTimer: null,
      provincesData: []
    }
  },
  computed: {
    hasHd() {
      const m = this.ov.modal
      return !!(m && (m.icon || m.title || m.sub))
    },
    hasBd() {
      const m = this.ov.modal
      if (!m) return false
      return !!(m.text || (m.rows && m.rows.length) || (m.benefits && m.benefits.length) || (m.notes && m.notes.length))
    },
    toneColor() {
      return TONE_COLOR[(this.ov.modal && this.ov.modal.iconTone) || 'primary'] || TONE_COLOR.primary
    },
    adLeftSec() {
      const a = this.ov.ad
      return a ? Math.max(0, Math.ceil(a.left / 1000)) : 0
    },
    ringStyle() {
      const a = this.ov.ad
      if (!a) return ''
      const done = 1 - (a.left / a.total)
      const deg = Math.max(0, Math.min(360, done * 360))
      return 'background: conic-gradient(#7FE3D2 ' + deg + 'deg, rgba(255,255,255,.2) 0deg);'
    },
    provinces() {
      return this.provincesData.map(p => p.name)
    },
    cities() {
      const p = this.provincesData.filter(x => x.name === this.loc.p)[0]
      return p ? p.cities.map(c => c.name) : []
    },
    districts() {
      const p = this.provincesData.filter(x => x.name === this.loc.p)[0]
      if (!p) return []
      const c = p.cities.filter(x => x.name === this.loc.c)[0]
      return c ? c.districts : []
    }
  },
  created() {
    this.$watch(() => overlay.ad, v => { if (v) this.startAd() ; else this.stopAd() })
    this.$watch(() => overlay.location, v => {
      if (v) this.loc = { p: v.p, c: v.c, d: v.d }
    })
    this.loadCities()
  },
  beforeUnmount() {
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
    noticeColor(type) {
      return NOTICE_COLOR[type || 'info'] || NOTICE_COLOR.info
    },
    /* ---- 通用模态 ---- */
    onModalMask() {
      const m = this.ov.modal
      if (m && m.dismissable === false) return
      ui.closeModal(null)
    },
    pickButton(b) {
      if (b.close === false) return
      ui.closeModal(b.value)
    },
    /* ---- 付费墙 ---- */
    choose(kind) { ui.choosePaywall(kind) },
    closePaywall() { ui.choosePaywall(null) },
    /* ---- 广告播放器 ---- */
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
    stopAd() {
      if (this.adTimer) { clearInterval(this.adTimer); this.adTimer = null }
    },
    cancelAd() { ui.adCancel() },
    /* ---- 位置选择 ---- */
    closeLocation() { ui.closeLocationSheet(null) },
    pickP(p) {
      this.loc.p = p
      const cs = this.cities
      this.loc.c = cs[0] || ''
      const ds = this.districts
      this.loc.d = ds[0] || ''
    },
    pickC(c) {
      this.loc.c = c
      const ds = this.districts
      this.loc.d = ds[0] || ''
    },
    pickD(d) { this.loc.d = d },
    useGps() {
      // 无逆地理编码服务时，经纬度无法直接映射到省/市/区，引导手动选择
      uni.getLocation({
        type: 'gcj02',
        success: () => ui.toast('已获取定位，请手动选择所在城市到区', 'crosshair'),
        fail: () => ui.toast('定位失败，请手动选择所在城市', 'alert-triangle')
      })
    },
    loadCities() {
      Api.fetchCities().then(res => {
        if (res.code === 0 && Array.isArray(res.data)) this.provincesData = res.data
      })
    },
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
