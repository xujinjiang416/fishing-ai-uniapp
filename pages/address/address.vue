<template>
  <view class="app">
    <view class="app-main">
      <AppBar :title="selectMode ? '选择收货地址' : '收货地址'" back />

      <view class="page" style="padding-top: 4px">
        <!-- 区块：加载骨架 / loading 为 true 时渲染 3 张占位卡，占位高度贴近真实卡片，避免加载完成后布局跳动 -->
        <view v-if="loading" class="list mt8">
          <view v-for="i in 3" :key="i" class="card card--pad">
            <view class="skel" style="height: 16px; width: 45%"></view>
            <view class="skel mt8" style="height: 14px; width: 80%"></view>
            <view class="skel mt8" style="height: 12px; width: 60%"></view>
          </view>
        </view>

        <!-- 区块：网络异常空态 / 接口失败时展示 error 文案，点击「重新加载」再次调用 load() -->
        <view v-else-if="error" class="empty">
          <view class="empty__ic"><AppIcon name="alert-triangle" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">{{ error }}</text>
          <text class="tiny mt4" style="display: block">请检查网络后重试</text>
          <view class="btn btn--line mt16 hit-btn" @click="load">重新加载</view>
        </view>

        <!-- 区块：空态 / 无地址时展示引导文案，按钮调用 goEdit()（不带 id 即新增） -->
        <view v-else-if="!list.length" class="empty">
          <view class="empty__ic"><AppIcon name="map-pin" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">还没有收货地址</text>
          <text class="tiny mt4" style="display: block">添加地址后即可下单购买</text>
          <view class="btn btn--primary mt16 hit-btn" @click="goEdit()">新增收货地址</view>
        </view>

        <!-- 区块：地址列表 / v-for 渲染地址卡片，is-default 高亮默认地址
             布局逻辑：姓名、手机号、默认标签同行排列，右侧箭头仅在选择模式出现
             注意事项：卡片内操作按钮统一 @click.stop，避免冒泡触发整卡点击 -->
        <view v-else class="list mt8">
          <view
            v-for="a in list"
            :key="a.id"
            class="card addr-item"
            :class="{ 'is-default': a.isDefault }"
            hover-class="addr-item--hover"
            @click="onCardTap(a)"
          >
            <view class="row" style="gap: 8px; align-items: flex-start">
              <text class="addr-name">{{ a.receiver }}</text>
              <text class="addr-phone num">{{ a.phone }}</text>
              <text v-if="a.isDefault" class="tag tag--primary">默认</text>
              <view class="grow"></view>
              <AppIcon v-if="selectMode" name="chevron-right" :size="18" color="#9AA9A7" />
            </view>
            <text class="addr-text">{{ a.fullAddress }}</text>

            <view class="addr-actions">
              <view
                v-if="!a.isDefault"
                class="btn btn--line btn--sm hit-btn"
                @click.stop="setDefault(a)"
              >设为默认</view>
              <view class="btn btn--line btn--sm hit-btn" @click.stop="goEdit(a.id)">编辑</view>
              <view class="btn btn--line btn--sm hit-btn addr-del" @click.stop="remove(a)">删除</view>
            </view>
          </view>
        </view>

        <!-- 区块：底部留白 / 高度 72px，用于抵消下方 fixed 底栏，防止最后一张卡片被遮挡 -->
        <view class="mt16" style="height: 72px"></view>
      </view>
    </view>

    <!-- 区块：底部操作栏 / fixed 吸底展示「新增收货地址」，与列表顶部入口等价
         注意事项：底部 padding 叠加 env(safe-area-inset-bottom) 适配全面屏安全区 -->
    <view class="addr-foot">
      <view class="btn btn--primary btn--block btn--lg" @click="goEdit()">
        <AppIcon name="plus" :size="18" color="#FFFFFF" />
        <text>新增收货地址</text>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 收货地址列表
 * - 默认模式：管理（编辑 / 删除 / 设为默认）
 * - 选择模式（select=1）：点击地址即选中并返回支付页
 *
 * 路由参数：
 *   select=1  从确认订单页进入选择模式，选中结果写入本地缓存后返回
 * 数据接口：
 *   Api.fetchAddresses()        获取地址列表
 *   Api.setDefaultAddress(id)   设为默认地址
 *   Api.deleteAddress(id)       删除地址
 * 关键交互：
 *   onShow 每次重新拉取，保证编辑 / 删除后返回时列表最新
 * 业务限制：
 *   同一账号仅一个默认地址（由服务端保证），默认地址卡片高亮展示
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

/* 选择模式下保存的地址 id，供确认订单页读取并自动选中（与地址编辑页保持同一 key） */
const PENDING_ADDRESS_KEY = 'fishai.pendingAddressId'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      // 选择模式：true 时点击卡片即选中并返回；由 onLoad 读取 query.select 决定
      selectMode: false,
      // 地址列表，元素结构由后端返回：{ id, receiver, phone, province, city, district, fullAddress, isDefault }
      list: [],
      // 首屏加载中标记，用于渲染骨架屏
      loading: true,
      // 接口错误文案，非空时展示网络异常空态
      error: ''
    }
  },
  onLoad(options) {
    // 选择模式：确认订单页以 ?select=1 进入
    this.selectMode = !!(options && String(options.select) === '1')
  },
  onShow() {
    // 每次显示都重新拉取，保证从新增 / 编辑页返回后列表与默认地址状态最新
    this.load()
  },
  methods: {
    /**
     * 拉取收货地址列表
     * @returns {Promise<void>}
     * 说明：code !== 0 或 data 非数组时进入异常空态并清空列表，避免展示脏数据
     */
    async load() {
      this.loading = true
      this.error = ''
      const res = await Api.fetchAddresses()
      this.loading = false
      if (res.code !== 0 || !Array.isArray(res.data)) {
        this.error = res.msg || '收货地址加载失败'
        this.list = []
        return
      }
      this.list = res.data
    },
    /**
     * 地址卡片点击
     * @param {Object} a 地址对象
     * 说明：选择模式选中并返回上一页，普通模式进入该地址的编辑页
     */
    onCardTap(a) {
      if (this.selectMode) {
        this.pick(a)
      } else {
        this.goEdit(a.id)
      }
    },
    /**
     * 选中地址并返回上一页（仅选择模式）
     * @param {Object} a 地址对象
     * 说明：id 转字符串写入本地缓存，由确认订单页读取；缓存写入失败可忽略（降级为不自动选中）
     */
    pick(a) {
      try { uni.setStorageSync(PENDING_ADDRESS_KEY, String(a.id)) } catch (e) { /* ignore */ }
      uni.navigateBack()
    },
    /**
     * 跳转新增 / 编辑地址页
     * @param {number|string} [id] 地址 id，缺省表示新增
     * 说明：选择模式下透传 select=1 与 back=2，保存后可直接返回两页（编辑页 → 本页 → 确认订单页）
     */
    goEdit(id) {
      const q = []
      if (id) q.push('id=' + encodeURIComponent(id))
      if (this.selectMode) {
        q.push('select=1')
        q.push('back=' + (id ? 2 : 2))
      }
      nav('/pages/address-edit/address-edit' + (q.length ? '?' + q.join('&') : ''))
    },
    /**
     * 设为默认地址
     * @param {Object} a 地址对象
     * @returns {Promise<void>}
     * 说明：成功后重新拉取列表，默认态以服务端返回为准
     */
    async setDefault(a) {
      const res = await Api.setDefaultAddress(a.id)
      if (res.code !== 0) { ui.toast(res.msg || '设置失败，请重试', 'alert-triangle'); return }
      ui.toast('已设为默认地址', 'circle-check')
      this.load()
    },
    /**
     * 删除地址
     * @param {Object} a 地址对象
     * @returns {Promise<void>}
     * 说明：先二次确认（弹窗展示收货人与详细地址，避免误删），确认后再调用删除接口并刷新列表
     */
    async remove(a) {
      const yes = await ui.confirm({
        title: '删除收货地址',
        text: '确认删除「' + a.receiver + ' ' + a.fullAddress + '」？',
        okText: '确认删除',
        cancelText: '取消'
      })
      if (!yes) return
      const res = await Api.deleteAddress(a.id)
      if (res.code !== 0) { ui.toast(res.msg || '删除失败，请重试', 'alert-triangle'); return }
      ui.toast('地址已删除', 'circle-check')
      this.load()
    }
  }
}
</script>

<style>
/* 地址卡片：上下 14px、左右 16px 内边距；hover-class 提供轻微缩放反馈 */
.addr-item { padding: 14px 16px; }
.addr-item--hover { transform: scale(.99); }
/* 默认地址：主色描边 + 浅色渐变底，与普通地址形成视觉区分 */
.addr-item.is-default { border-color: var(--c-primary); background: linear-gradient(180deg, #FFFFFF, #F4FBFA); }
.addr-name { font-size: 15px; font-weight: 700; }
.addr-phone { font-size: 13px; color: var(--c-ink-2); }
.addr-text {
  display: block; margin-top: 6px; font-size: 13px; line-height: 1.6;
  color: var(--c-ink-2); word-break: break-all;
}
/* 操作行：顶部细分割线与地址信息区分离，允许换行避免窄屏溢出 */
.addr-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--c-line-soft);
}
.addr-del { color: var(--c-danger); }
/* 热区：最小 44px 高，符合小程序点击规范 */
.hit-btn { min-height: 44px; min-width: 96px; padding: 0 16px; font-size: 13px; }
.addr-actions .hit-btn { min-width: 84px; }
/* 底部操作栏：fixed 吸底并水平居中，宽度限制在 --app-w 内；
   底部 padding 叠加 env(safe-area-inset-bottom) 适配全面屏安全区 */
.addr-foot {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 0;
  width: 100%; max-width: var(--app-w); z-index: 50;
  padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(244, 247, 246, .94);
  border-top: 1px solid var(--c-line-soft);
  backdrop-filter: blur(8px);
}
</style>
