<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="上报钓点" back />

      <view class="page" style="padding-top: 4px">
        <!-- 区块：投稿表单 / 名称、水域、收费、鱼种、说明、位置与现场照片 -->
        <view class="card card--pad">
          <!-- 名称：可留空，由审核人员补充 -->
          <view class="form-item">
            <text class="form-label">钓点名称</text>
            <input
              v-model="name"
              class="input"
              maxlength="64"
              placeholder="可留空，审核后会补充规范名称"
              placeholder-class="ph"
            />
          </view>

          <!-- 水域类型：单选胶囊，默认野塘 -->
          <view class="form-item">
            <text class="form-label">水域类型</text>
            <view class="chips">
              <view
                v-for="w in WATER_TYPES"
                :key="w"
                class="chip"
                :class="{ 'is-on': water === w }"
                @click="water = w"
              >
                <text>{{ w }}</text>
              </view>
            </view>
          </view>

          <!-- 收费：免费 / 收费 / 需登记，非免费时可补充具体金额 -->
          <view class="form-item">
            <text class="form-label">收费情况</text>
            <view class="chips">
              <view
                v-for="p in PAY_TYPES"
                :key="p"
                class="chip"
                :class="{ 'is-on': payMode === p }"
                @click="payMode = p"
              >
                <text>{{ p }}</text>
              </view>
            </view>
            <input
              v-if="payMode !== '免费'"
              v-model="payText"
              class="input mt8"
              maxlength="32"
              placeholder="补充收费说明，如 30 元/天"
              placeholder-class="ph"
            />
          </view>

          <!-- 鱼种：逗号分隔，提交时拆分数组，下方实时预览标签 -->
          <view class="form-item">
            <text class="form-label">常见鱼种</text>
            <input
              v-model="fishInput"
              class="input"
              maxlength="80"
              placeholder="逗号分隔，如 鲫鱼，鲤鱼，草鱼"
              placeholder-class="ph"
            />
            <view v-if="fishList.length" class="chips mt8">
              <text v-for="f in fishList" :key="f" class="tag tag--primary">{{ f }}</text>
            </view>
          </view>

          <!-- 说明：现场情况、钓位、停车、避坑经验等 -->
          <view class="form-item">
            <text class="form-label">情况说明</text>
            <textarea
              v-model="note"
              class="textarea"
              maxlength="500"
              placeholder="描述水体、钓位、停车、是否有人管理等信息，越详细越容易通过"
              placeholder-class="ph"
            />
          </view>
        </view>

        <!-- 区块：位置选择 / 优先地图选点，失败时可手动填写经纬度 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>位置</text></view>
            <text class="tiny">坐标格式 lng,lat</text>
          </view>
          <view class="card card--pad">
            <view class="row" style="gap: 10px; align-items: flex-start">
              <AppIcon name="map-pin" :size="18" color="#0A6A6C" />
              <view class="grow">
                <text class="loc-name">{{ locationName || '尚未地图选点' }}</text>
                <text class="tiny mt4" style="display: block">{{ address || '可手动填写下方经纬度' }}</text>
              </view>
              <view class="btn btn--line btn--sm" @click="chooseOnMap">
                <AppIcon name="compass" :size="14" color="#3D4F4D" />
                <text>地图选点</text>
              </view>
            </view>

            <view class="hr"></view>
            <view class="row" style="gap: 10px">
              <view class="grow">
                <text class="tiny">经度 lng</text>
                <input
                  v-model="lngText"
                  class="input input--coord mt4"
                  type="digit"
                  placeholder="如 117.227200"
                  placeholder-class="ph"
                />
              </view>
              <view class="grow">
                <text class="tiny">纬度 lat</text>
                <input
                  v-model="latText"
                  class="input input--coord mt4"
                  type="digit"
                  placeholder="如 31.820600"
                  placeholder-class="ph"
                />
              </view>
            </view>
            <view class="notice notice--info mt12">
              <AppIcon name="info" :size="15" color="#0A6A6C" />
              <text class="grow">最终坐标：{{ coord || '经纬度不合法' }}</text>
            </view>
          </view>
        </view>

        <!-- 区块：现场照片 / 最多 6 张，逐张上传并显示进度 -->
        <view class="section">
          <view class="section__head">
            <view class="section__title"><text>现场照片</text></view>
            <text class="tiny">{{ doneCount }} / 6 已上传</text>
          </view>
          <view class="card card--pad">
            <view class="uploader">
              <view v-for="(p, i) in photos" :key="i" class="uploader__wrap">
                <image class="uploader__item" :src="p.local || p.url" mode="aspectFill" @click="previewPhoto(i)" />
                <view v-if="p.status === 'uploading'" class="up-mask">
                  <text>{{ p.progress }}%</text>
                </view>
                <view v-else-if="p.status === 'fail'" class="up-mask up-mask--fail">
                  <text>失败</text>
                </view>
                <view v-else class="uploader__rm" @click.stop="removePhoto(i)">
                  <AppIcon name="x" :size="12" color="#FFFFFF" />
                </view>
              </view>
              <view v-if="photos.length < 6" class="uploader__add" @click="choosePhotos">
                <AppIcon name="camera" :size="18" color="#9AA9A7" />
                <text>添加照片</text>
              </view>
            </view>
            <text v-if="uploading" class="tiny mt8" style="display: block">{{ uploadLabel || '图片上传中…' }}</text>
            <view class="notice notice--warn mt12">
              <AppIcon name="shield-check" :size="15" color="#8E6210" />
              <text class="grow">请上传现场实拍照片，至少 1 张；盗图或模糊照片会导致审核不通过。</text>
            </view>
          </view>
        </view>

        <!-- 提交：成功后跳转我的投稿 -->
        <view class="mt16">
          <view class="btn btn--primary btn--block btn--lg" :class="{ 'is-loading': submitting }" @click="submit">
            <text>{{ submitting ? '' : '提交审核' }}</text>
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">提交后进入人工审核，可在「我的投稿」查看进度</text>
        </view>
      </view>
    </view>

    <!-- 地图选点浮层：自绘高德瓦片（GCJ-02），不依赖地图 SDK Key，H5 与小程序一致 -->
    <view v-if="pickerShow" class="picker">
      <view class="picker__bar">
        <text class="picker__title">地图选点</text>
        <view class="picker__close" @click="closePicker">
          <AppIcon name="x" :size="16" color="#3D4F4D" />
        </view>
      </view>

      <view
        id="picker-map"
        class="picker__map"
        @touchstart="onPickerTouchStart"
        @touchmove.stop.prevent="onPickerTouchMove"
        @touchend="onPickerTouchEnd"
        @touchcancel="onPickerTouchEnd"
        @click="onPickerClick"
      >
        <!-- 瓦片与图钉同属一层：拖拽时只位移图层，松手后再换算中心点 -->
        <view class="picker__layer" :style="pickerLayerStyle">
          <image
            v-for="t in pickerTiles"
            :key="t.key"
            class="picker__tile"
            :src="t.src"
            :style="'left:' + t.x + 'px;top:' + t.y + 'px'"
          />
          <view v-if="pickerPin" class="picker__pin" :style="pickerPinStyle"></view>
        </view>

        <view class="picker__zoom" @touchstart.stop @mousedown.stop>
          <view class="picker__zbtn" @click.stop="zoomPicker(1)"><text>＋</text></view>
          <view class="picker__zbtn" @click.stop="zoomPicker(-1)"><text>－</text></view>
        </view>

        <view class="picker__hint"><text>点击放置钓点，拖动地图查看周边</text></view>
      </view>

      <view class="picker__foot">
        <view class="grow">
          <text class="tiny">已选坐标</text>
          <text class="picker__coord">{{ pickerCoord || '尚未选点' }}</text>
        </view>
        <view class="row" style="gap: 10px">
          <view class="btn btn--line btn--sm" @click="closePicker"><text>取消</text></view>
          <view class="btn btn--primary btn--sm" :class="{ 'is-loading': !pickerPin }" @click="confirmPicker">
            <text>确定选点</text>
          </view>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 上报钓点（pages/spot-submit/spot-submit）
 * 数据接口：
 *   Api.uploadSpotImage(filePath)   逐张上传现场照片，返回 /static 相对地址
 *   Api.submitSpot(payload)         提交新钓点投稿（kind=new_spot）
 * 位置策略：H5 使用内置瓦片地图选点（uni.chooseLocation 需要地图 SDK Key，未配置会直接失败）；
 *           小程序 / App 优先系统选点，失败时回退到内置地图；也可直接手填经纬度。
 *           初始中心优先取 Store.location 的 lat/lng，缺失时使用默认中心。
 * 登录策略：未登录直接走 nav 的登录守卫（跳登录页）。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import * as ui from '../../common/ui.js'

/* 水域类型选项 */
const WATER_TYPES = ['野塘', '河段', '湖泊', '水库', '沟渠', '其他']
/* 收费类型选项 */
const PAY_TYPES = ['免费', '收费', '需登记']
/* 默认中心（合肥市蜀山区），Store.location 无坐标时兜底 */
const DEFAULT_CENTER = { lat: 31.8206, lng: 117.2272 }

/* 高德路网瓦片模板（GCJ-02）；与 pages/spots/spots.vue 同一套自绘地图引擎，无需 SDK Key */
const TILE_URL = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
const TILE_SIZE = 256
const PICKER_MIN_Z = 5
const PICKER_MAX_Z = 18

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
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      name: '',
      water: WATER_TYPES[0],
      payMode: '免费',
      payText: '',
      fishInput: '',
      note: '',
      region: '',
      address: '',
      locationName: '',
      lngText: '',
      latText: '',
      photos: [], // { local, url, status: uploading|done|fail, progress }
      uploading: false,
      uploadLabel: '',
      submitting: false,
      pickerShow: false, // 内置地图选点浮层
      pickerZ: 15, // 选点地图缩放级别
      pickerCenter: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }, // 地图中心
      pickerSize: { w: 0, h: 0 }, // 地图可视区域尺寸
      pickerRect: { left: 0, top: 0 }, // 地图容器视口偏移（用于触摸坐标换算）
      pickerPin: null, // 已选坐标 { lng, lat }
      pickerDrag: null, // 拖拽起点 { sx, sy, center }
      pickerOffset: { x: 0, y: 0 }, // 拖拽过程中的图层位移
      pickerMoved: false, // 本次手势是否发生拖动（用于区分拖动与点击）
      pickerSuppressClick: false, // 拖拽结束后抑制浏览器补发的 click
      WATER_TYPES,
      PAY_TYPES
    }
  },
  computed: {
    /** 鱼种输入拆分（逗号 / 顿号 / 空格），最多 8 个 */
    fishList() {
      return String(this.fishInput || '')
        .split(/[,，、\s]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8)
    },
    /** 收费最终文案：免费固定，其余取补充说明或类型本身 */
    payValue() {
      if (this.payMode === '免费') return '免费'
      const t = String(this.payText || '').trim()
      return t || this.payMode
    },
    /** 规范坐标 "lng,lat"，不合法时返回空串 */
    coord() {
      const lng = Number(this.lngText)
      const lat = Number(this.latText)
      if (!this.validCoord(lng, lat)) return ''
      return lng.toFixed(6) + ',' + lat.toFixed(6)
    },
    /** 已成功上传的照片数量 */
    doneCount() {
      return this.photos.filter(p => p.status === 'done').length
    },
    /** 选点地图当前缩放级别下整个世界宽度（像素） */
    pickerWorld() {
      return TILE_SIZE * Math.pow(2, this.pickerZ)
    },
    /** 选点地图视口左上角的世界像素坐标 */
    pickerOrigin() {
      return {
        left: lngToX(this.pickerCenter.lng, this.pickerWorld) - this.pickerSize.w / 2,
        top: latToY(this.pickerCenter.lat, this.pickerWorld) - this.pickerSize.h / 2
      }
    },
    /** 需要渲染的瓦片（视口外扩一圈，避免边缘露白） */
    pickerTiles() {
      if (!this.pickerSize.w || !this.pickerSize.h) return []
      const world = this.pickerWorld
      const count = Math.pow(2, this.pickerZ)
      const { left, top } = this.pickerOrigin
      const margin = TILE_SIZE
      const x0 = Math.floor((left - margin) / TILE_SIZE)
      const x1 = Math.floor((left + this.pickerSize.w + margin) / TILE_SIZE)
      const y0 = Math.floor((top - margin) / TILE_SIZE)
      const y1 = Math.floor((top + this.pickerSize.h + margin) / TILE_SIZE)
      const out = []
      for (let ty = y0; ty <= y1; ty++) {
        if (ty < 0 || ty >= count) continue
        for (let tx = x0; tx <= x1; tx++) {
          if (tx < 0 || tx >= count) continue
          out.push({
            key: this.pickerZ + '-' + tx + '-' + ty,
            src: TILE_URL
              .replace('{s}', String((tx + ty) % 4 + 1))
              .replace('{x}', String(tx))
              .replace('{y}', String(ty))
              .replace('{z}', String(this.pickerZ)),
            x: tx * TILE_SIZE - left,
            y: ty * TILE_SIZE - top
          })
        }
      }
      return out
    },
    /** 图钉在视口内的位置 */
    pickerPinStyle() {
      if (!this.pickerPin) return 'display:none'
      const { left, top } = this.pickerOrigin
      const x = lngToX(this.pickerPin.lng, this.pickerWorld) - left
      const y = latToY(this.pickerPin.lat, this.pickerWorld) - top
      return 'left:' + x + 'px;top:' + y + 'px'
    },
    /** 已选坐标文案 */
    pickerCoord() {
      if (!this.pickerPin) return ''
      return this.pickerPin.lng.toFixed(6) + ',' + this.pickerPin.lat.toFixed(6)
    },
    /** 拖拽中的图层位移（松手后清零并折算中心点） */
    pickerLayerStyle() {
      const { x, y } = this.pickerOffset
      if (!x && !y) return ''
      return 'transform:translate3d(' + x + 'px,' + y + 'px,0)'
    }
  },
  onLoad() {
    // 未登录先跳登录页；表单仍完成初始化，登录返回后可继续填写
    if (!Store.isLoggedIn) ui.toLogin()
    const loc = Store.location || {}
    this.region = String((loc.city || loc.province || '') + (loc.district || '')).trim()
    // 兼容 location 中存在 lat/lng 或 coord 的情况；都没有时用默认中心
    const locCoord = String(loc.coord || '').split(',')
    const lat = Number(loc.lat != null ? loc.lat : locCoord[1])
    const lng = Number(loc.lng != null ? loc.lng : locCoord[0])
    const center = this.validCoord(lng, lat) ? { lng, lat } : DEFAULT_CENTER
    this.lngText = center.lng.toFixed(6)
    this.latText = center.lat.toFixed(6)
  },
  onUnload() {
    // 页面卸载时释放鼠标拖拽监听，避免残留
    this.detachDragListeners()
  },
  methods: {
    /**
     * 坐标合法性（限定国内范围，与后端一致）
     * @param {number} lng 经度
     * @param {number} lat 纬度
     * @returns {boolean}
     */
    validCoord(lng, lat) {
      return isFinite(lng) && isFinite(lat) && lng >= 73 && lng <= 136 && lat >= 3 && lat <= 54
    },
    /** 地图选点：H5 没有地图 SDK Key，直接用内置瓦片地图；小程序 / App 优先系统选点，失败回退 */
    chooseOnMap() {
      const isH5 = typeof document !== 'undefined'
      if (isH5 || typeof uni.chooseLocation !== 'function') {
        this.openPicker()
        return
      }
      uni.chooseLocation({
        success: res => {
          const lng = Number(res.longitude)
          const lat = Number(res.latitude)
          if (!this.validCoord(lng, lat)) {
            ui.toast('选点坐标无效，请重新选择', 'alert-triangle')
            return
          }
          this.lngText = lng.toFixed(6)
          this.latText = lat.toFixed(6)
          this.locationName = res.name || ''
          this.address = res.address || res.name || ''
        },
        // 系统选点不可用（未配置 Key / 未授权）时回退到内置地图
        fail: () => this.openPicker()
      })
    },
    /** 打开内置地图选点，默认居中到当前有效坐标 */
    openPicker() {
      const lng = Number(this.lngText)
      const lat = Number(this.latText)
      const center = this.validCoord(lng, lat) ? { lng, lat } : { ...DEFAULT_CENTER }
      this.pickerCenter = center
      this.pickerPin = { lng: center.lng, lat: center.lat }
      this.pickerZ = 15
      this.pickerShow = true
      this.$nextTick(this.measurePicker)
    },
    /** 测量地图容器尺寸与视口偏移（DOM 渲染完成后调用；未取到尺寸时重试） */
    measurePicker(tries = 3) {
      setTimeout(() => {
        uni.createSelectorQuery()
          .in(this)
          .select('#picker-map')
          .boundingClientRect(rect => {
            if (rect && rect.width && rect.height) {
              this.pickerSize = { w: rect.width, h: rect.height }
              this.pickerRect = { left: rect.left, top: rect.top }
              this.attachDragListeners()
            } else if (tries > 0) {
              this.measurePicker(tries - 1)
            }
          })
          .exec()
      }, 50)
    },
    /** 统一读取事件坐标：touches → clientX/Y → detail.x/y */
    pointOf(e) {
      if (!e) return null
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
      const cx = t ? t.clientX : e.clientX
      const cy = t ? t.clientY : e.clientY
      if (typeof cx === 'number' && typeof cy === 'number') return { x: cx, y: cy }
      const d = e.detail || {}
      if (typeof d.x === 'number' && typeof d.y === 'number') return { x: d.x, y: d.y }
      return null
    },
    /** 开始拖拽：记录起点与当时的中心点 */
    beginDrag(pt) {
      if (!pt) return
      this.pickerDrag = { sx: pt.x, sy: pt.y, center: { ...this.pickerCenter } }
      this.pickerMoved = false
      this.pickerOffset = { x: 0, y: 0 }
    },
    /** 拖拽中：只位移图层，超过阈值才判定为拖动 */
    moveDrag(pt) {
      if (!this.pickerDrag || !pt) return
      const dx = pt.x - this.pickerDrag.sx
      const dy = pt.y - this.pickerDrag.sy
      if (!this.pickerMoved && Math.abs(dx) + Math.abs(dy) > 6) this.pickerMoved = true
      if (this.pickerMoved) this.pickerOffset = { x: dx, y: dy }
    },
    /**
     * 结束拖拽：发生拖动则折算新中心，否则视为点击落点
     * @param {{x:number,y:number}|null} pt 结束点坐标
     */
    endDrag(pt) {
      if (!this.pickerDrag) return
      const drag = this.pickerDrag
      const moved = this.pickerMoved
      const offset = this.pickerOffset
      this.pickerDrag = null
      this.pickerMoved = false
      this.pickerOffset = { x: 0, y: 0 }
      if (moved) {
        const world = this.pickerWorld
        const lng = xToLng(lngToX(drag.center.lng, world) - offset.x, world)
        const lat = yToLat(latToY(drag.center.lat, world) - offset.y, world)
        if (this.validCoord(lng, lat)) this.pickerCenter = { lng, lat }
        // 拖拽结束后浏览器可能补发 click，避免误落图钉
        this.pickerSuppressClick = true
        setTimeout(() => { this.pickerSuppressClick = false }, 300)
        return
      }
      const p = pt || { x: drag.sx, y: drag.sy }
      this.placePin(p.x, p.y)
    },
    /** 触摸拖拽（移动端） */
    onPickerTouchStart(e) { this.beginDrag(this.pointOf(e)) },
    onPickerTouchMove(e) { this.moveDrag(this.pointOf(e)) },
    onPickerTouchEnd(e) { this.endDrag(this.pointOf(e)) },
    /** H5 桌面：uni-view 不透传 mousedown/mousemove，改用 window 原生事件实现鼠标拖拽 */
    attachDragListeners() {
      if (typeof window === 'undefined' || this._winDragBound) return
      this._onWinMouseDown = e => {
        if (!this.pickerShow || !this.pickerSize.w) return
        if (e.target && e.target.closest && e.target.closest('.picker__zoom')) return
        const left = this.pickerRect.left
        const top = this.pickerRect.top
        if (e.clientX < left || e.clientX > left + this.pickerSize.w) return
        if (e.clientY < top || e.clientY > top + this.pickerSize.h) return
        this.beginDrag({ x: e.clientX, y: e.clientY })
        if (e.cancelable) e.preventDefault()
      }
      this._onWinMouseMove = e => {
        if (this.pickerDrag) this.moveDrag({ x: e.clientX, y: e.clientY })
      }
      this._onWinMouseUp = e => {
        if (this.pickerDrag) this.endDrag({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousedown', this._onWinMouseDown, true)
      window.addEventListener('mousemove', this._onWinMouseMove, true)
      window.addEventListener('mouseup', this._onWinMouseUp, true)
      this._winDragBound = true
    },
    /** 移除桌面拖拽监听 */
    detachDragListeners() {
      if (typeof window === 'undefined' || !this._winDragBound) return
      window.removeEventListener('mousedown', this._onWinMouseDown, true)
      window.removeEventListener('mousemove', this._onWinMouseMove, true)
      window.removeEventListener('mouseup', this._onWinMouseUp, true)
      this._winDragBound = false
      this._onWinMouseDown = null
      this._onWinMouseMove = null
      this._onWinMouseUp = null
    },
    /** 关闭选点浮层并释放桌面拖拽监听 */
    closePicker() {
      this.pickerShow = false
      this.detachDragListeners()
    },
    /** 点击落点（未发生拖动时生效） */
    onPickerClick(e) {
      if (this.pickerSuppressClick) {
        this.pickerSuppressClick = false
        return
      }
      const pt = this.pointOf(e)
      if (pt) this.placePin(pt.x, pt.y)
    },
    /**
     * 将视口坐标换算为经纬度并移动图钉
     * @param {number} clientX 视口 X
     * @param {number} clientY 视口 Y
     */
    placePin(clientX, clientY) {
      if (!this.pickerSize.w || !this.pickerSize.h) return
      const world = this.pickerWorld
      const { left, top } = this.pickerOrigin
      const wx = left + clientX - this.pickerRect.left
      const wy = top + clientY - this.pickerRect.top
      const lng = xToLng(wx, world)
      const lat = yToLat(wy, world)
      if (!this.validCoord(lng, lat)) return
      this.pickerPin = { lng, lat }
    },
    /**
     * 缩放选点地图
     * @param {number} delta +1 放大，-1 缩小
     */
    zoomPicker(delta) {
      const z = Math.min(PICKER_MAX_Z, Math.max(PICKER_MIN_Z, this.pickerZ + delta))
      if (z === this.pickerZ) return
      this.pickerZ = z
      if (!this.pickerPin) this.pickerPin = { ...this.pickerCenter }
      this.pickerCenter = { lng: this.pickerPin.lng, lat: this.pickerPin.lat }
    },
    /** 确认选点：回填经纬度并关闭浮层 */
    confirmPicker() {
      if (!this.pickerPin) {
        ui.toast('请先点击地图选择位置', 'alert-triangle')
        return
      }
      this.lngText = this.pickerPin.lng.toFixed(6)
      this.latText = this.pickerPin.lat.toFixed(6)
      this.locationName = '地图选点'
      this.address = ''
      this.closePicker()
    },
    /** 选择现场照片，按剩余名额限制数量 */
    choosePhotos() {
      const remain = 6 - this.photos.length
      if (remain <= 0 || this.uploading) return
      uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: res => this.uploadPhotos(res.tempFilePaths || []),
        fail: () => ui.toast('请授权相册或相机后再上传图片', 'alert-triangle')
      })
    },
    /**
     * 逐张上传图片并回写 url / 进度 / 失败状态
     * @param {string[]} paths 本地临时文件路径
     * @returns {Promise<void>}
     */
    async uploadPhotos(paths) {
      if (!paths.length) return
      this.uploading = true
      for (let k = 0; k < paths.length; k++) {
        if (this.photos.length >= 6) break
        const idx = this.photos.length
        this.photos.push({ local: paths[k], url: '', status: 'uploading', progress: 0 })
        this.uploadLabel = '图片上传中 ' + (idx + 1) + '/' + this.photos.length
        const res = await Api.uploadSpotImage(paths[k], percent => {
          if (this.photos[idx]) this.photos[idx].progress = percent
          this.uploadLabel = '图片上传中 ' + (idx + 1) + '/' + this.photos.length + ' · ' + percent + '%'
        })
        if (!this.photos[idx]) continue
        if (res.code === 0 && res.data && res.data.url) {
          this.photos[idx].url = res.data.url
          this.photos[idx].status = 'done'
          this.photos[idx].progress = 100
        } else {
          this.photos[idx].status = 'fail'
          ui.toast(res.msg || '图片上传失败，请重试', 'alert-triangle')
        }
      }
      this.uploading = false
      this.uploadLabel = ''
    },
    /** 预览已选照片（本地临时图优先） */
    previewPhoto(i) {
      const urls = this.photos.map(p => p.local || p.url).filter(Boolean)
      if (!urls.length) return
      uni.previewImage({ urls, current: urls[i] })
    },
    /** 移除照片（上传中的不可移除） */
    removePhoto(i) {
      if (this.photos[i] && this.photos[i].status === 'uploading') return
      this.photos.splice(i, 1)
    },
    /** 提交投稿：校验图片与坐标后调用后端 */
    async submit() {
      if (this.submitting) return
      if (!Store.isLoggedIn) { ui.toLogin(); return }
      if (this.uploading) { ui.toast('图片仍在上传中，请稍候', 'alert-triangle'); return }
      const photos = this.photos.filter(p => p.status === 'done' && p.url).map(p => p.url)
      if (!photos.length) { ui.toast('请至少上传 1 张现场照片', 'alert-triangle'); return }
      if (!this.coord) { ui.toast('请填写有效的经纬度', 'alert-triangle'); return }
      this.submitting = true
      const res = await Api.submitSpot({
        kind: 'new_spot',
        name: String(this.name || '').trim() || null,
        region: this.region,
        coord: this.coord,
        address: this.address,
        water: this.water,
        fish: this.fishList,
        pay: this.payValue,
        note: String(this.note || '').trim(),
        photos,
        cover: photos[0]
      })
      this.submitting = false
      if (res.code !== 0 || !res.data) {
        ui.toast(res.msg || '提交失败，请稍后重试', 'alert-triangle')
        return
      }
      ui.toast('投稿已提交，等待审核', 'circle-check')
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/my-submissions/my-submissions' })
      }, 350)
    }
  }
}
</script>

<style>
/* 表单项：与地址编辑页保持同一视觉 */
.form-item { padding: 12px 0; }
.form-item + .form-item { border-top: 1px solid var(--c-line-soft); }
.form-item .input { height: 46px; line-height: normal; padding-top: 0; padding-bottom: 0; }
.form-item .textarea { min-height: 96px; line-height: 1.6; }
.form-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.ph { color: var(--c-ink-4); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.loc-name { display: block; font-size: 14px; font-weight: 600; line-height: 1.4; }
/* 经纬度输入：沿用 .form-item 内输入框的高度覆盖，避免 uni-input 内部高度塌陷导致文字不可见 */
.input--coord { height: 46px; line-height: normal; padding-top: 0; padding-bottom: 0; }
/* 图片上传中的遮罩：显示百分比 / 失败态 */
.up-mask {
  position: absolute; left: 0; top: 0; width: 72px; height: 72px; border-radius: var(--r-xs);
  background: rgba(18,33,31,.55); color: #fff; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.up-mask--fail { background: rgba(195,50,54,.72); }
/* 地图选点浮层：自绘瓦片，不依赖地图 SDK */
.picker {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 95;
  background: #F5F7F6; display: flex; flex-direction: column;
}
.picker__bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: #fff; border-bottom: 1px solid var(--c-line-soft);
}
.picker__title { font-size: 15px; font-weight: 600; color: var(--c-ink); }
.picker__close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
.picker__map {
  position: relative; flex: 1; overflow: hidden; background: #E7EDE9;
  user-select: none; -webkit-user-select: none; touch-action: none; cursor: grab;
}
.picker__layer { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.picker__tile { position: absolute; width: 256px; height: 256px; }
.picker__pin {
  position: absolute; width: 16px; height: 16px; border-radius: 50%;
  background: #0A6A6C; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35);
  transform: translate(-50%, -50%); z-index: 3;
}
.picker__zoom { position: absolute; right: 12px; top: 12px; z-index: 4; display: flex; flex-direction: column; gap: 8px; }
.picker__zbtn {
  width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,.95);
  box-shadow: 0 2px 8px rgba(0,0,0,.12); display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #2C3D3B;
}
.picker__hint {
  position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
  padding: 6px 12px; border-radius: 999px; background: rgba(18,33,31,.62);
  color: #fff; font-size: 12px; z-index: 4; pointer-events: none;
}
.picker__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px; background: #fff; border-top: 1px solid var(--c-line-soft);
}
.picker__coord { display: block; margin-top: 4px; font-size: 14px; font-weight: 600; color: var(--c-ink); }
</style>
