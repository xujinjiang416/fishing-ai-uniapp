<template>
  <view class="app map-page">
    <view class="app-main map-main">
      <AppBar title="钓点" back solid right="定位" @right="locate" />

      <!-- 区块：地图容器 / 全屏铺满，瓦片与标记共用同一图层，拖拽时整体位移 -->
      <view class="map-wrap">
        <view
          class="map-layer"
          :style="layerStyle"
          @click="onMapClick"
          @touchstart="onTouchStart"
          @touchmove.stop="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
          @mousedown="onMouseDown"
        >
          <!-- 瓦片：高德路网底图（GCJ-02），按 256px 网格铺满视口外扩一圈 -->
          <image
            v-for="t in tiles"
            :key="t.key"
            class="tile"
            :src="t.src"
            :style="'left:' + t.x + 'px;top:' + t.y + 'px'"
            mode="scaleToFill"
          />

          <!-- 标记：每个钓点一个图钉，点击弹出底部详情卡片 -->
          <view
            v-for="m in markers"
            :key="m.id"
            class="marker"
            :class="{ 'is-active': m.active }"
            :style="'left:' + m.x + 'px;top:' + m.y + 'px'"
            @click.stop="selectSpot(m)"
          >
            <view class="marker__pin"></view>
            <text v-if="m.active" class="marker__name">{{ m.spot.name }}</text>
          </view>
        </view>

        <!-- 区块：搜索框 / 悬浮在地图上方，输入即服务端过滤钓点 -->
        <view class="search-float">
          <AppIcon name="search" :size="17" color="#6E807E" />
          <input
            class="search-input"
            :value="keyword"
            confirm-type="search"
            placeholder="搜钓点名 / 鱼种，如「鲫鱼」"
            placeholder-class="ph"
            @input="onInput"
          />
          <view v-if="keyword" class="search-clear" @click="clearKeyword">
            <AppIcon name="x" :size="14" color="#6E807E" />
          </view>
        </view>

        <!-- 区块：地图控件 / 缩放与全览，垂直居中贴右侧 -->
        <view class="map-ctrl">
          <view class="ctrl-btn" @click="zoom(1)">
            <AppIcon name="plus" :size="18" color="#12211F" />
          </view>
          <view class="ctrl-btn" @click="zoom(-1)">
            <AppIcon name="minus" :size="18" color="#12211F" />
          </view>
          <view class="ctrl-btn" @click="fitAll">
            <AppIcon name="compass" :size="18" color="#12211F" />
          </view>
        </view>

        <!-- 区块：底图与数据来源说明 / 满足地图版权署名 -->
        <view class="map-meta">底图 © 高德地图 · 钓点数据 高德 / OpenStreetMap</view>

        <!-- 区块：加载态 / 首次查询较慢时给出文案安抚 -->
        <view v-if="loading" class="map-mask">
          <view class="map-mask__card">
            <AppIcon name="sparkles" :size="15" color="#0A6A6C" />
            <text>正在加载{{ placeText }}钓点…</text>
          </view>
        </view>

        <!-- 区块：空态 / 该范围内没有符合条件的水域 -->
        <view v-else-if="!locked && !ALL.length" class="map-mask">
          <view class="map-mask__card">
            <AppIcon name="search" :size="15" color="#6E807E" />
            <text>该区域内暂无钓点，换个搜索词或选择其他区域试试</text>
          </view>
        </view>

        <!-- 区块：会员锁定 / 未解锁时隐藏标记并提示开通 -->
        <view v-if="locked" class="lock-mask">
          <view class="card card--pad lock-card">
            <view class="icon-badge lock-card__ic">
              <AppIcon name="lock" :size="20" color="#0A6A6C" />
            </view>
            <text class="lock-card__title">开通会员查看附近钓点</text>
            <text class="tiny mt4">会员可无限次查看钓点地图、位置与详情</text>
            <view class="btn btn--primary btn--block mt12" @click="unlock">开通会员查看</view>
          </view>
        </view>

        <!-- 区块：钓点详情卡片 / 点击标记后从底部弹出 -->
        <view v-if="selected && !locked" class="spot-card">
          <view class="spot-card__hd">
            <text class="spot-card__title">{{ selected.name }}</text>
            <text class="tag" :class="payCls(selected.pay)">{{ selected.pay }}</text>
            <view class="spot-card__x" @click="selected = null">
              <AppIcon name="x" :size="15" color="#6E807E" />
            </view>
          </view>

          <view class="spot-card__loc">
            <AppIcon name="map-pin" :size="13" color="#0A6A6C" />
            <text class="spot-card__addr">{{ selected.address || '（暂无地址）' }}</text>
          </view>

          <view class="spot-card__tags">
            <text class="tag tag--mute">{{ selected.water }}</text>
            <text v-for="f in fishList" :key="f" class="tag tag--mute">{{ f }}</text>
            <view class="grow"></view>
            <Rating :value="selected.rating" :size="12" />
            <text class="tiny">{{ ratingText(selected.rating) }}</text>
          </view>

          <text class="spot-card__note">{{ selected.note || '暂无简介' }}</text>

          <view class="btn btn--primary btn--block mt8" @click="openSpot(selected.id)">
            <AppIcon name="map-pin" :size="15" color="#FFFFFF" />
            <text>查看钓点详情</text>
          </view>
        </view>
      </view>

      <AppTabBar page="spots" />
    </view>
    <AppOverlays />
  </view>
</template>

<script>
/* 钓点地图（底部 Tab 页，无路由参数）
 * 数据接口：Api.fetchSpots({ keyword, province, city, district })；定位取自 Store.location
 * 关键交互：地图拖拽 / 双指或按钮缩放 / 全览所有标记 / 定位当前位置 / 搜索 / 点击标记看详情
 * 实现说明：
 *   - 使用高德路网栅格瓦片（GCJ-02）自绘地图，不依赖地图 SDK Key，H5 与小程序表现一致；
 *   - 钓点坐标为 GCJ-02（高德 POI 原生、OSM 已在后端转换），与瓦片坐标系一致；
 *   - 拖拽期间只对图层做 transform，松手后再折算中心点，避免频繁重算瓦片；
 *   - 未解锁会员时隐藏标记并展示解锁卡片，沿用原有会员权益。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Rating from '../../components/Rating.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { ratingText } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

/* 高德路网瓦片模板（GCJ-02）：s 为 1~4 的镜像编号，x/y/z 为瓦片行列号 */
const TILE_URL = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
const TILE_SIZE = 256
const MIN_Z = 3
const MAX_Z = 18

/** 经度 -> 世界像素 X（Web 墨卡托） */
function lngToX(lng, world) {
  return (lng + 180) / 360 * world
}

/** 纬度 -> 世界像素 Y（Web 墨卡托） */
function latToY(lat, world) {
  const rad = lat * Math.PI / 180
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * world
}

/** 世界像素 X -> 经度 */
function xToLng(x, world) {
  return x / world * 360 - 180
}

/** 世界像素 Y -> 纬度 */
function yToLat(y, world) {
  const n = Math.PI * (1 - 2 * y / world)
  return Math.atan(Math.sinh(n)) * 180 / Math.PI
}

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays, Rating },
  data() {
    return {
      ALL: [], // 服务端返回的钓点数组
      keyword: '', // 搜索关键词（服务端过滤）
      loading: true, // 首屏加载态
      loaded: false, // 是否完成过至少一次加载，决定 onShow 是否静默刷新
      kwTimer: null, // 搜索防抖定时器
      z: 12, // 当前缩放级别
      center: { lat: 31.8206, lng: 117.2272 }, // 地图中心（默认合肥市蜀山区）
      mapSize: { w: 360, h: 480 }, // 地图可视区域尺寸（挂载后按真实节点测量）
      dragStart: null, // 拖拽起点 { x, y, center }
      dragOffset: { x: 0, y: 0 }, // 拖拽过程中的图层位移
      pinchStart: 0, // 双指缩放基准间距
      moved: false, // 本次触摸是否发生了拖动（用于区分拖动与点击）
      needsFit: false, // 数据就绪后是否需要自动全览一次（尺寸测量完成后执行）
      selected: null // 当前打开的钓点
    }
  },
  computed: {
    /** 是否锁定：非会员不可查看钓点 */
    locked() { return !Store.isUnlocked('spots') },
    /** 定位文案：城市 + 区县 */
    placeText() {
      const l = Store.location || {}
      return (l.city || '') + (l.district || '') || '附近'
    },
    /** 当前缩放级别下整个世界的像素宽度 */
    worldSize() { return TILE_SIZE * Math.pow(2, this.z) },
    /** 视口左上角对应的世界像素坐标 */
    origin() {
      return {
        left: lngToX(this.center.lng, this.worldSize) - this.mapSize.w / 2,
        top: latToY(this.center.lat, this.worldSize) - this.mapSize.h / 2
      }
    },
    /** 需要渲染的瓦片（视口外扩一圈，拖拽时不露白） */
    tiles() {
      const world = this.worldSize
      const count = Math.pow(2, this.z)
      const { left, top } = this.origin
      const margin = TILE_SIZE
      const x0 = Math.floor((left - margin) / TILE_SIZE)
      const x1 = Math.floor((left + this.mapSize.w + margin) / TILE_SIZE)
      const y0 = Math.floor((top - margin) / TILE_SIZE)
      const y1 = Math.floor((top + this.mapSize.h + margin) / TILE_SIZE)
      const out = []
      for (let ty = y0; ty <= y1; ty++) {
        if (ty < 0 || ty >= count) continue
        for (let tx = x0; tx <= x1; tx++) {
          if (tx < 0 || tx >= count) continue
          out.push({
            key: this.z + '-' + tx + '-' + ty,
            src: TILE_URL
              .replace('{s}', String((tx + ty) % 4 + 1))
              .replace('{x}', String(tx))
              .replace('{y}', String(ty))
              .replace('{z}', String(this.z)),
            x: tx * TILE_SIZE - left,
            y: ty * TILE_SIZE - top
          })
        }
      }
      return out
    },
    /** 当前视口内可见的钓点标记 */
    markers() {
      if (this.locked) return []
      const { left, top } = this.origin
      const world = this.worldSize
      const out = []
      this.ALL.forEach((s, i) => {
        const p = this.parseCoord(s.coord)
        if (!p) return
        const x = lngToX(p.lng, world) - left
        const y = latToY(p.lat, world) - top
        if (x < -30 || y < -46 || x > this.mapSize.w + 30 || y > this.mapSize.h + 16) return
        out.push({ id: i, x, y, spot: s, active: !!(this.selected && this.selected.id === s.id) })
      })
      return out
    },
    /** 图层位移样式（拖拽时整体平移） */
    layerStyle() {
      if (!this.dragOffset.x && !this.dragOffset.y) return ''
      return 'transform:translate(' + this.dragOffset.x + 'px,' + this.dragOffset.y + 'px);'
    },
    /** 详情卡片中的鱼种（最多 3 个） */
    fishList() {
      const fish = (this.selected && this.selected.fish) || []
      return fish.slice(0, 3)
    }
  },
  onLoad() {
    this.fetchSpots()
  },
  /** 从详情页返回时静默刷新，保留当前地图视角 */
  onShow() {
    if (this.loaded) this.fetchSpots(true)
  },
  mounted() {
    this.$nextTick(this.measure)
    // #ifdef H5
    window.addEventListener('resize', this.measure)
    // #endif
  },
  beforeUnmount() {
    if (this.kwTimer) clearTimeout(this.kwTimer)
    // #ifdef H5
    window.removeEventListener('resize', this.measure)
    // #endif
  },
  methods: {
    // 模板中使用的 utils 函数必须挂到 methods：小程序端非内联渲染无法直接访问模块内导入
    ratingText,
    /**
     * 收费标签样式：「需登记」用告警色，其余用成功色
     * @param {string} pay 收费说明文案
     * @returns {string} 标签类名
     */
    payCls(pay) { return (pay || '').indexOf('需登记') > -1 ? 'tag--warn' : 'tag--success' },
    /**
     * 解析 "lng,lat" 坐标串
     * @param {string} coord 坐标文本
     * @returns {{lng: number, lat: number}|null} 合法坐标或 null
     */
    parseCoord(coord) {
      const parts = String(coord || '').split(',')
      if (parts.length !== 2) return null
      const lng = Number(parts[0])
      const lat = Number(parts[1])
      if (!isFinite(lng) || !isFinite(lat)) return null
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
      return { lng, lat }
    },
    /** 测量地图容器尺寸（三端统一），保证投影与标记定位准确 */
    measure() {
      uni.createSelectorQuery().in(this).select('.map-wrap').boundingClientRect(rect => {
        if (!rect || !rect.width || !rect.height) return
        this.mapSize = { w: rect.width, h: rect.height }
        this.fitIfNeeded()
      }).exec()
    },
    /** 仅在首次数据就绪后自动全览，窗口尺寸变化时不打断用户视角 */
    fitIfNeeded() {
      if (!this.needsFit || !this.ALL.length) return
      this.needsFit = false
      this.fitAll()
    },
    /**
     * 拉取钓点数据
     * @param {boolean} silent 静默刷新：保留地图视角，不展示加载态
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
        if (res.code !== 0 || !res.data) {
          if (res.code !== 0) ui.toast(res.msg || '钓点加载失败', 'alert-triangle')
          return
        }
        this.ALL = res.data
        this.loaded = true
        // 刷新后保持已选钓点的最新对象；不存在则关闭卡片
        if (this.selected) {
          const id = this.selected.id
          this.selected = this.ALL.filter(s => s.id === id)[0] || null
        }
        this.needsFit = !silent
        if (!silent) this.$nextTick(this.fitIfNeeded)
      })
    },
    /** 搜索输入：320ms 防抖后请求服务端过滤 */
    onInput(e) {
      this.keyword = String((e.detail && e.detail.value) || '').trim()
      if (this.kwTimer) clearTimeout(this.kwTimer)
      this.kwTimer = setTimeout(() => this.fetchSpots(), 320)
    },
    /** 清空搜索并重新加载该区域全部钓点 */
    clearKeyword() {
      this.keyword = ''
      if (this.kwTimer) clearTimeout(this.kwTimer)
      this.fetchSpots()
    },
    /**
     * 缩放
     * @param {number} step +1 放大 / -1 缩小
     */
    zoom(step) {
      if (this.dragStart) this.endDrag()
      const z = Math.max(MIN_Z, Math.min(MAX_Z, this.z + step))
      if (z !== this.z) this.z = z
    },
    /** 自动缩放并居中，让全部钓点都在可视范围内 */
    fitAll() {
      const points = this.ALL.map(s => this.parseCoord(s.coord)).filter(Boolean)
      if (!points.length) return
      const lngs = points.map(p => p.lng)
      const lats = points.map(p => p.lat)
      const minLng = Math.min.apply(null, lngs)
      const maxLng = Math.max.apply(null, lngs)
      const minLat = Math.min.apply(null, lats)
      const maxLat = Math.max.apply(null, lats)
      const w = this.mapSize.w
      const h = this.mapSize.h
      let z = 16
      for (; z > MIN_Z; z--) {
        const world = TILE_SIZE * Math.pow(2, z)
        const dx = Math.abs(lngToX(maxLng, world) - lngToX(minLng, world))
        const dy = Math.abs(latToY(minLat, world) - latToY(maxLat, world))
        if (dx <= w * 0.82 && dy <= h * 0.6) break
      }
      const world = TILE_SIZE * Math.pow(2, z)
      const cx = (lngToX(minLng, world) + lngToX(maxLng, world)) / 2
      const cy = (latToY(minLat, world) + latToY(maxLat, world)) / 2
      this.z = z
      this.center = { lng: xToLng(cx, world), lat: yToLat(cy, world) }
    },
    /** 定位当前位置（GCJ-02，与底图一致） */
    locate() {
      uni.getLocation({
        type: 'gcj02',
        success: res => {
          this.center = { lat: res.latitude, lng: res.longitude }
          if (this.z < 14) this.z = 14
          ui.toast('已定位到当前位置', 'crosshair')
        },
        fail: () => ui.toast('定位失败，请检查定位权限', 'alert-triangle')
      })
    },
    /** 点击标记：打开钓点卡片 */
    selectSpot(m) {
      this.moved = false
      this.selected = m.spot
    },
    /** 点击地图空白处：关闭卡片（拖动结束的点击不触发） */
    onMapClick() {
      if (this.moved) {
        this.moved = false
        return
      }
      this.selected = null
    },
    /** 打开钓点详情页 */
    openSpot(id) { nav('/pages/spot-detail/spot-detail?id=' + encodeURIComponent(id)) },
    /** 会员解锁：成功后重新加载并显示标记 */
    async unlock() {
      const ok = await ui.requireUnlock({
        feature: 'spots',
        title: '开通会员查看附近钓点',
        sub: '开通会员即可无限次查看钓点地图与详情，全程无广告',
        featureLabel: '附近钓点查询'
      })
      if (ok) this.fetchSpots()
    },
    /* ---- 拖拽与缩放 ---- */
    /** 计算两个触点间距（双指缩放用） */
    distance(a, b) {
      const dx = (a.clientX || 0) - (b.clientX || 0)
      const dy = (a.clientY || 0) - (b.clientY || 0)
      return Math.sqrt(dx * dx + dy * dy)
    },
    /** 记录拖拽起点 */
    beginDrag(x, y) {
      this.moved = false
      this.dragStart = { x, y, center: { lat: this.center.lat, lng: this.center.lng } }
    },
    /** 结束拖拽：把位移折算进中心点并复位图层 */
    endDrag() {
      if (this.dragStart) {
        const dx = this.dragOffset.x
        const dy = this.dragOffset.y
        if (dx || dy) {
          const world = this.worldSize
          const left = lngToX(this.dragStart.center.lng, world) - this.mapSize.w / 2 - dx
          const top = latToY(this.dragStart.center.lat, world) - this.mapSize.h / 2 - dy
          this.center = {
            lng: xToLng(left + this.mapSize.w / 2, world),
            lat: yToLat(top + this.mapSize.h / 2, world)
          }
        }
      }
      this.dragStart = null
      this.dragOffset = { x: 0, y: 0 }
      this.pinchStart = 0
    },
    /** 触摸开始：单指进入拖拽，双指进入缩放 */
    onTouchStart(e) {
      const touches = e.touches || e.changedTouches || []
      if (!touches.length) return
      if (touches.length >= 2) {
        this.endDrag()
        this.pinchStart = this.distance(touches[0], touches[1])
        return
      }
      this.beginDrag(touches[0].clientX, touches[0].clientY)
    },
    /** 触摸移动：单指平移，双指按间距变化分级缩放 */
    onTouchMove(e) {
      const touches = e.touches || []
      if (touches.length >= 2) {
        this.handlePinch(touches)
        return
      }
      if (!this.dragStart || !touches.length) return
      const dx = touches[0].clientX - this.dragStart.x
      const dy = touches[0].clientY - this.dragStart.y
      this.dragOffset = { x: dx, y: dy }
      if (Math.abs(dx) + Math.abs(dy) > 6) this.moved = true
    },
    /** 触摸结束 */
    onTouchEnd() {
      this.endDrag()
    },
    /** 双指缩放：间距放大 35% 进一级，缩小 26% 退一级 */
    handlePinch(touches) {
      const d = this.distance(touches[0], touches[1])
      if (!this.pinchStart) {
        this.pinchStart = d
        return
      }
      if (d / this.pinchStart >= 1.35) {
        this.pinchStart = d
        this.zoom(1)
      } else if (d / this.pinchStart <= 0.74) {
        this.pinchStart = d
        this.zoom(-1)
      }
    },
    /** 桌面端鼠标拖拽（仅 H5 生效） */
    onMouseDown(e) {
      // #ifdef H5
      this.beginDrag(e.clientX, e.clientY)
      const move = ev => {
        const dx = ev.clientX - this.dragStart.x
        const dy = ev.clientY - this.dragStart.y
        this.dragOffset = { x: dx, y: dy }
        if (Math.abs(dx) + Math.abs(dy) > 6) this.moved = true
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        this.endDrag()
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
      // #endif
    }
  }
}
</script>

<style>
/* 搜索框占位文案 */
.ph { color: var(--c-ink-4); font-size: 14px; }

/* 页面骨架：整屏地图，顶部标题栏 + 底部 TabBar 之间铺满 */
.map-page { min-height: 100vh; overflow: hidden; }
.map-main {
  height: 100vh;
  min-height: 0;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
}
.map-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: #DDE7E4;
}

/* 地图图层：瓦片 + 标记，拖拽时整体位移 */
.map-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}
.tile {
  position: absolute;
  width: 256px;
  height: 256px;
  -webkit-user-drag: none;
}

/* 标记：32×34 的点击盒，底边中点即坐标点；图钉尖端精确落在该点上 */
.marker {
  position: absolute;
  width: 32px;
  height: 34px;
  margin-left: -16px;
  margin-top: -34px;
}
.marker__pin {
  position: absolute;
  left: 5px;
  top: 7px;
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--grad-water);
  border: 2px solid #FFFFFF;
  box-shadow: 0 3px 8px rgba(9, 32, 36, .32);
}
.marker.is-active .marker__pin {
  background: var(--grad-dawn);
  box-shadow: 0 0 0 4px rgba(255, 122, 61, .28), 0 3px 8px rgba(9, 32, 36, .32);
}
.marker__name {
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 180px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(18, 33, 31, .88);
  color: #FFFFFF;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 悬浮搜索框 */
.search-float {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, .96);
  box-shadow: var(--sh-md);
}
.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  font-size: 14px;
  color: var(--c-ink);
}
.search-clear {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  background: var(--c-line-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 地图控件 */
.map-ctrl {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ctrl-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, .96);
  box-shadow: var(--sh-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 版权署名 */
.map-meta {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 4;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, .78);
  color: var(--c-ink-3);
  font-size: 10px;
  line-height: 1.6;
}

/* 加载与空态遮罩 */
.map-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 64px;
  bottom: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 28px;
  pointer-events: none;
}
.map-mask__card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, .96);
  box-shadow: var(--sh-md);
  color: var(--c-ink-2);
  font-size: 13px;
  line-height: 1.5;
}

/* 会员锁定 */
.lock-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 64px;
  bottom: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  background: rgba(232, 240, 238, .72);
}
.lock-card { width: 100%; max-width: 340px; text-align: center; }
.lock-card__ic {
  width: 46px;
  height: 46px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: var(--c-primary-l);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lock-card__title { display: block; font-family: var(--font-display); font-size: 17px; font-weight: 700; }

/* 钓点详情卡片 */
.spot-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 8;
  padding: 14px 14px 12px;
  border-radius: var(--r-md);
  background: var(--c-surface);
  box-shadow: var(--sh-lg);
}
.spot-card__hd { display: flex; align-items: center; gap: 8px; }
.spot-card__title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spot-card__x {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: var(--c-line-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.spot-card__loc { display: flex; align-items: flex-start; gap: 6px; margin-top: 8px; }
.spot-card__addr { flex: 1; min-width: 0; font-size: 12.5px; color: var(--c-ink-3); line-height: 1.5; }
.spot-card__tags { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.spot-card__note {
  display: -webkit-box;
  margin-top: 8px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--c-ink-2);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 桌面端：地图页保持手机栏宽居中，卡片不贴屏幕两侧 */
@media (min-width: 600px) {
  .spot-card { left: 16px; right: 16px; bottom: 16px; }
  .search-float { left: 16px; right: 16px; top: 16px; }
}
</style>
