<template>
  <view class="app">
    <view class="app-main">
      <AppBar :title="isEdit ? '编辑收货地址' : '新增收货地址'" back />

      <view class="page" style="padding-top: 4px">
        <view class="card card--pad">
          <!-- 收货人 -->
          <view class="form-item">
            <text class="form-label">收货人<text class="req">*</text></text>
            <input
              v-model="form.receiver"
              class="input"
              maxlength="32"
              placeholder="请填写收货人姓名"
              placeholder-class="ph"
            />
          </view>

          <!-- 手机号 -->
          <view class="form-item">
            <text class="form-label">联系电话<text class="req">*</text></text>
            <input
              v-model="form.phone"
              class="input"
              type="number"
              maxlength="11"
              placeholder="请填写 11 位手机号"
              placeholder-class="ph"
            />
          </view>

          <!-- 省市区 -->
          <view class="form-item">
            <text class="form-label">所在地区<text class="req">*</text></text>
            <picker
              mode="multiSelector"
              :range="regionRange"
              :value="regionIndex"
              :disabled="!provincesData.length"
              @columnchange="onColumnChange"
              @change="onRegionChange"
            >
              <view class="picker-row">
                <text class="picker-value" :class="{ 'is-ph': !regionText }">
                  {{ regionText || (provincesData.length ? '请选择省 / 市 / 区' : '地区数据加载中…') }}
                </text>
                <AppIcon name="chevron-down" :size="16" color="#9AA9A7" />
              </view>
            </picker>
          </view>

          <!-- 详细地址 -->
          <view class="form-item">
            <text class="form-label">详细地址<text class="req">*</text></text>
            <textarea
              v-model="form.detail"
              class="textarea"
              :maxlength="120"
              placeholder="街道、门牌号、小区楼栋等"
              placeholder-class="ph"
              auto-height
            />
          </view>

          <!-- 默认地址 -->
          <view class="form-item form-item--row">
            <view class="grow">
              <text class="form-label" style="margin-bottom: 0">设为默认地址</text>
              <text class="form-hint">下单时将自动选中该地址</text>
            </view>
            <view class="switch" :class="{ 'is-on': form.isDefault }" @click="form.isDefault = !form.isDefault">
              <view class="switch__dot"></view>
            </view>
          </view>
        </view>

        <view class="notice notice--info mt12">
          <AppIcon name="shield-check" :size="15" color="#0A6A6C" />
          <text class="grow">请填写真实有效的收货信息，手机号用于配送联系，地址需精确到门牌号。</text>
        </view>

        <view class="mt16">
          <view class="btn btn--primary btn--block btn--lg" :class="{ 'is-loading': saving }" @click="save">
            <text>{{ saving ? '' : (selectMode ? '保存并使用' : '保存') }}</text>
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">地址信息将保存到服务器，多端同步</text>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 新增 / 编辑收货地址
 * - 省市区三级联动（数据来自 GET /api/cities）
 * - 手机号 / 必填字段 / 行政区划合法性前端校验
 * - select=1：从支付流程进入，保存后自动选中新地址并返回支付页
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'

const PHONE_RE = /^1[3-9]\d{9}$/
const PENDING_ADDRESS_KEY = 'fishai.pendingAddressId'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      isEdit: false,
      addressId: 0,
      selectMode: false,
      backDelta: 1,
      saving: false,
      provincesData: [],
      regionRange: [[], [], []],
      regionIndex: [0, 0, 0],
      regionText: '',
      form: {
        receiver: '',
        phone: '',
        detail: '',
        isDefault: false
      }
    }
  },
  onLoad(options) {
    options = options || {}
    this.addressId = Number(options.id || 0)
    this.isEdit = !!this.addressId
    this.selectMode = String(options.select) === '1'
    this.backDelta = Math.max(1, Number(options.back || 1))
    this.init()
  },
  methods: {
    async init() {
      await this.loadCities()
      if (this.isEdit) await this.loadAddress()
      else this.buildRange()
    },
    async loadCities() {
      const res = await Api.fetchCities()
      if (res.code !== 0 || !Array.isArray(res.data) || !res.data.length) {
        ui.toast('地区数据加载失败，请稍后重试', 'alert-triangle')
        return
      }
      this.provincesData = res.data
      this.regionIndex = [0, 0, 0]
      this.buildRange()
    },
    async loadAddress() {
      const res = await Api.fetchAddress(this.addressId)
      if (res.code !== 0 || !res.data) {
        ui.toast(res.msg || '地址加载失败', 'alert-triangle')
        return
      }
      const a = res.data
      this.form.receiver = a.receiver || ''
      this.form.phone = a.phone || ''
      this.form.detail = a.detail || ''
      this.form.isDefault = !!a.isDefault
      this.applyRegion(a.province, a.city, a.district)
    },
    buildRange() {
      const p = this.provincesData
      if (!p.length) {
        this.regionRange = [[], [], []]
        return
      }
      const pi = Math.min(this.regionIndex[0] || 0, p.length - 1)
      const province = p[pi]
      const cities = province.cities || []
      const ci = Math.min(this.regionIndex[1] || 0, Math.max(cities.length - 1, 0))
      const city = cities[ci]
      const districts = city ? (city.districts || []) : []
      const di = Math.min(this.regionIndex[2] || 0, Math.max(districts.length - 1, 0))
      this.regionIndex = [pi, ci, di]
      this.regionRange = [
        p.map(x => x.name),
        cities.map(x => x.name),
        districts
      ]
    },
    /* 编辑时按已有省/市/区定位下标 */
    applyRegion(province, city, district) {
      const p = this.provincesData
      if (!p.length) return
      let pi = p.findIndex(x => x.name === province)
      if (pi < 0) pi = 0
      const cities = p[pi].cities || []
      let ci = cities.findIndex(x => x.name === city)
      if (ci < 0) ci = 0
      const districts = cities[ci] ? (cities[ci].districts || []) : []
      let di = districts.indexOf(district)
      if (di < 0) di = 0
      this.regionIndex = [pi, ci, di]
      this.buildRange()
      this.regionText = province + ' ' + city + ' ' + district
    },
    onColumnChange(e) {
      const col = Number(e.detail.column)
      const val = Number(e.detail.value)
      const idx = this.regionIndex.slice()
      idx[col] = val
      // 切换省 / 市时，下级重置到第一项
      if (col === 0) { idx[1] = 0; idx[2] = 0 }
      if (col === 1) { idx[2] = 0 }
      this.regionIndex = idx
      this.buildRange()
    },
    onRegionChange(e) {
      const val = (e.detail.value || []).map(Number)
      this.regionIndex = [val[0] || 0, val[1] || 0, val[2] || 0]
      this.buildRange()
      const p = this.provincesData[this.regionIndex[0]]
      if (!p) return
      const city = (p.cities || [])[this.regionIndex[1]]
      const district = city ? (city.districts || [])[this.regionIndex[2]] : ''
      if (city && district) {
        this.regionText = p.name + ' ' + city.name + ' ' + district
      } else {
        this.regionText = ''
        ui.toast('请选择完整的省 / 市 / 区', 'alert-triangle')
      }
    },
    currentRegion() {
      const p = this.provincesData[this.regionIndex[0]]
      if (!p) return null
      const city = (p.cities || [])[this.regionIndex[1]]
      const district = city ? (city.districts || [])[this.regionIndex[2]] : ''
      if (!city || !district) return null
      return { province: p.name, city: city.name, district }
    },
    validate() {
      const receiver = String(this.form.receiver || '').trim()
      if (!receiver) { ui.toast('请填写收货人姓名', 'alert-triangle'); return null }
      const phone = String(this.form.phone || '').trim()
      if (!PHONE_RE.test(phone)) { ui.toast('请输入正确的 11 位手机号', 'alert-triangle'); return null }
      const region = this.currentRegion()
      if (!region) { ui.toast('请选择完整的省 / 市 / 区', 'alert-triangle'); return null }
      const detail = String(this.form.detail || '').trim()
      if (!detail) { ui.toast('请填写详细地址', 'alert-triangle'); return null }
      if (detail.length < 2) { ui.toast('详细地址过短，请补充门牌号等信息', 'alert-triangle'); return null }
      return {
        receiver,
        phone,
        province: region.province,
        city: region.city,
        district: region.district,
        detail,
        isDefault: !!this.form.isDefault
      }
    },
    async save() {
      if (this.saving) return
      const payload = this.validate()
      if (!payload) return
      this.saving = true
      const res = this.isEdit
        ? await Api.updateAddress(this.addressId, payload)
        : await Api.createAddress(payload)
      this.saving = false
      if (res.code !== 0 || !res.data) {
        ui.toast(res.msg || '保存失败，请重试', 'alert-triangle')
        return
      }
      ui.toast(this.isEdit ? '地址已更新' : '地址已添加', 'circle-check')
      if (this.selectMode) {
        try { uni.setStorageSync(PENDING_ADDRESS_KEY, String(res.data.id)) } catch (e) { /* ignore */ }
        setTimeout(() => {
          // 防止返回层级超过页面栈（深链进入时降级为返回上一页）
          const stack = getCurrentPages().length
          const delta = Math.min(this.backDelta, Math.max(stack - 1, 1))
          uni.navigateBack({ delta })
        }, 300)
      } else {
        setTimeout(() => uni.navigateBack(), 300)
      }
    }
  }
}
</script>

<style>
.form-item { padding: 12px 0; }
.form-item + .form-item { border-top: 1px solid var(--c-line-soft); }
.form-item--row { display: flex; align-items: center; gap: 12px; }
/* uni-app 的 input 默认高度偏小，显式指定高度避免文字被裁切 */
.form-item .input {
  height: 46px;
  line-height: normal;
  padding-top: 0;
  padding-bottom: 0;
}
.form-item .textarea { min-height: 72px; line-height: 1.6; }
.form-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.req { color: var(--c-danger); margin-left: 2px; }
.form-hint { display: block; font-size: 11px; color: var(--c-ink-4); margin-top: 2px; }
.picker-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  min-height: 46px; padding: 0 13px;
  border: 1px solid var(--c-line); border-radius: var(--r-sm);
  background: var(--c-surface-2);
}
.picker-value { font-size: 14px; color: var(--c-ink); }
.picker-value.is-ph { color: var(--c-ink-4); }
.ph { color: var(--c-ink-4); }
</style>
