<template>
  <view class="app">
    <view class="app-main">
      <AppBar :title="isEdit ? '编辑收货地址' : '新增收货地址'" back />

      <view class="page" style="padding-top: 4px">
        <!-- 区块：地址表单 / 所有字段收拢在一张卡片内，表单项之间用 1px 分割线分隔 -->
        <view class="card card--pad">
          <!-- 表单项：收货人 / 必填，最多 32 字 -->
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

          <!-- 表单项：联系电话 / 必填，仅数字且最长 11 位，提交时由 PHONE_RE 严格校验 -->
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

          <!-- 表单项：所在地区 / 省市区三级联动，数据来自 Api.fetchCities()
               注意事项：数据未加载完成时 picker 置灰禁用，避免空选项 -->
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

          <!-- 表单项：详细地址 / 必填，最多 120 字，auto-height 随内容自适应 -->
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

          <!-- 表单项：默认地址开关 / 使用自定义 switch（非原生组件），点击直接切换 form.isDefault -->
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

        <!-- 区块：填写提示 / 说明手机号与详细地址的填写要求，降低配送失败概率 -->
        <view class="notice notice--info mt12">
          <AppIcon name="shield-check" :size="15" color="#0A6A6C" />
          <text class="grow">请填写真实有效的收货信息，手机号用于配送联系，地址需精确到门牌号。</text>
        </view>

        <!-- 区块：底部操作栏 / 保存按钮随表单流式排列（非 fixed）；saving 时置 loading 态并拦截重复提交
             按钮文案：选择模式为「保存并使用」，普通模式为「保存」 -->
        <view class="mt16">
          <view class="btn btn--primary btn--block btn--lg" :class="{ 'is-loading': saving }" @click="save">
            <text>{{ saving ? '' : (selectMode ? '保存并使用' : '保存') }}</text>
          </view>
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
 *
 * 路由参数：
 *   id        地址 id，存在即为编辑模式
 *   select=1  选择模式，保存成功后把地址 id 写入本地缓存供支付页读取
 *   back      保存成功后 navigateBack 的层级，默认 1
 * 数据接口：
 *   Api.fetchCities()                     省市区数据
 *   Api.fetchAddress(id)                  编辑模式下回填地址
 *   Api.createAddress(payload) / Api.updateAddress(id, payload)  保存
 * 校验规则：
 *   收货人非空；手机号匹配 PHONE_RE；省市区必须完整；详细地址非空且不少于 2 个字符
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'

/* 手机号校验：大陆 11 位，1 开头、第二位 3-9 */
const PHONE_RE = /^1[3-9]\d{9}$/
/* 选择模式下保存的地址 id，与地址列表页使用同一 key，供支付页读取后自动选中 */
const PENDING_ADDRESS_KEY = 'fishai.pendingAddressId'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      // 编辑模式：由路由 id 是否大于 0 决定
      isEdit: false,
      // 当前编辑的地址 id，0 表示新增
      addressId: 0,
      // 选择模式：从支付流程进入，保存后自动选中该地址并返回
      selectMode: false,
      // 保存后返回的页面层级，最小为 1
      backDelta: 1,
      // 提交中标记：避免重复点击保存按钮
      saving: false,
      // 省市区原始数据，结构：[{ name, cities: [{ name, districts: string[] }] }]
      provincesData: [],
      // picker 三级显示文本（省 / 市 / 区名称数组）
      regionRange: [[], [], []],
      // picker 三级选中下标，默认 [0, 0, 0]
      regionIndex: [0, 0, 0],
      // 已选地区展示文案，空串表示尚未选择
      regionText: '',
      // 表单字段：提交前由 validate() 统一裁剪空格并校验
      form: {
        // 收货人：必填，最长 32 字
        receiver: '',
        // 联系电话：必填，11 位大陆手机号
        phone: '',
        // 详细地址：必填，最长 120 字
        detail: '',
        // 是否设为默认地址
        isDefault: false
      }
    }
  },
  onLoad(options) {
    options = options || {}
    // 解析路由参数：id 决定编辑 / 新增，select 决定是否为选择模式
    this.addressId = Number(options.id || 0)
    this.isEdit = !!this.addressId
    this.selectMode = String(options.select) === '1'
    this.backDelta = Math.max(1, Number(options.back || 1))
    this.init()
  },
  methods: {
    /**
     * 页面初始化
     * @returns {Promise<void>}
     * 说明：必须先把省市区数据准备好，编辑模式下才有数据可用于地址回填定位
     */
    async init() {
      await this.loadCities()
      if (this.isEdit) await this.loadAddress()
      else this.buildRange()
    },
    /**
     * 拉取省市区三级数据
     * @returns {Promise<void>}
     * 说明：失败时仅提示，不阻塞页面渲染；成功后重置下标并重建 picker 选项
     */
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
    /**
     * 编辑模式下拉取地址详情并回填表单
     * @returns {Promise<void>}
     * 说明：省市区分开回填，交由 applyRegion 反查三级下标后再生成 display 文案
     */
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
    /**
     * 根据当前三级下标重建 picker 的 range
     * @returns {void}
     * 说明：下标会被裁剪到合法范围，防止切换省 / 市后下级数据变短导致越界
     */
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
    /* 编辑时按已有省/市/区定位下标
     * @param {string} province 省名称
     * @param {string} city 市名称
     * @param {string} district 区名称
     * @returns {void}
     * 说明：匹配失败时回退到 0，保证 picker 始终有合法选中项
     */
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
    /**
     * picker 列滚动回调（未点击确定前触发）
     * @param {Object} e 事件对象，e.detail.column 为列下标，e.detail.value 为该列新下标
     * @returns {void}
     */
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
    /**
     * picker 确认选择回调
     * @param {Object} e 事件对象，e.detail.value 为三级下标数组
     * @returns {void}
     * 说明：省 / 市 / 区任一缺失时清空展示文案并提示补全
     */
    onRegionChange(e) {
      const val = (e.detail.value || []).map(Number)
      this.regionIndex = [val[0] || 0, val[1] || 0, val[2] || 0]
      this.buildRange()
      const p = this.provincesData[this.regionIndex[0]]
      if (!p) return
      // 依据级联索引取出当前市、区县；任一缺失则视为未选完整地址
      const city = (p.cities || [])[this.regionIndex[1]]
      const district = city ? (city.districts || [])[this.regionIndex[2]] : ''
      if (city && district) {
        this.regionText = p.name + ' ' + city.name + ' ' + district
      } else {
        this.regionText = ''
        ui.toast('请选择完整的省 / 市 / 区', 'alert-triangle')
      }
    },
    /**
     * 读取当前选中的省市区
     * @returns {{province: string, city: string, district: string}|null} 三级完整时返回对象，否则返回 null
     */
    currentRegion() {
      const p = this.provincesData[this.regionIndex[0]]
      if (!p) return null
      const city = (p.cities || [])[this.regionIndex[1]]
      const district = city ? (city.districts || [])[this.regionIndex[2]] : ''
      if (!city || !district) return null
      return { province: p.name, city: city.name, district }
    },
    /**
     * 表单校验并生成提交数据
     * @returns {Object|null} 校验通过返回后端所需 payload，任一字段不合法返回 null（已 toast 提示）
     * 校验顺序：收货人 → 手机号 → 省市区 → 详细地址（非空且至少 2 字）
     */
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
    /**
     * 保存地址
     * @returns {Promise<void>}
     * 步骤：1) 防重复提交 → 2) 校验并组装 payload → 3) 按模式调用新增 / 更新接口
     *       4) 失败提示并保留表单 → 5) 成功后选择模式回传 id 并返回，普通模式直接返回
     */
    async save() {
      if (this.saving) return
      const payload = this.validate()
      if (!payload) return
      this.saving = true
      // 编辑走 update，新增走 create，返回结构需包含地址 id
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
        // 选择模式：把地址 id 写入本地缓存，支付页返回后据此自动选中
        try { uni.setStorageSync(PENDING_ADDRESS_KEY, String(res.data.id)) } catch (e) { /* ignore */ }
        // 延迟 300ms 返回，保证 toast 能被用户看到
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
/* 表单项：上下 12px 内边距；相邻项之间用 1px 细线分隔，避免使用额外边框元素 */
.form-item { padding: 12px 0; }
.form-item + .form-item { border-top: 1px solid var(--c-line-soft); }
/* 行式表单项（默认地址开关）：横向布局，文案区自适应撑满 */
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
/* 地区选择行：最小 46px 高，与 input 保持一致；placeholder 态复用 is-ph 置灰 */
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
