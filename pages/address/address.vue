<template>
  <view class="app">
    <view class="app-main">
      <AppBar :title="selectMode ? '选择收货地址' : '收货地址'" back />

      <view class="page" style="padding-top: 4px">
        <!-- 加载骨架 -->
        <view v-if="loading" class="list mt8">
          <view v-for="i in 3" :key="i" class="card card--pad">
            <view class="skel" style="height: 16px; width: 45%"></view>
            <view class="skel mt8" style="height: 14px; width: 80%"></view>
            <view class="skel mt8" style="height: 12px; width: 60%"></view>
          </view>
        </view>

        <!-- 网络异常 -->
        <view v-else-if="error" class="empty">
          <view class="empty__ic"><AppIcon name="alert-triangle" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">{{ error }}</text>
          <text class="tiny mt4" style="display: block">请检查网络后重试</text>
          <view class="btn btn--line mt16 hit-btn" @click="load">重新加载</view>
        </view>

        <!-- 空态 -->
        <view v-else-if="!list.length" class="empty">
          <view class="empty__ic"><AppIcon name="map-pin" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">还没有收货地址</text>
          <text class="tiny mt4" style="display: block">添加地址后即可下单购买</text>
          <view class="btn btn--primary mt16 hit-btn" @click="goEdit()">新增收货地址</view>
        </view>

        <!-- 地址列表 -->
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

        <view class="mt16" style="height: 72px"></view>
      </view>
    </view>

    <!-- 底部新增按钮 -->
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
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

const PENDING_ADDRESS_KEY = 'fishai.pendingAddressId'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      selectMode: false,
      list: [],
      loading: true,
      error: ''
    }
  },
  onLoad(options) {
    this.selectMode = !!(options && String(options.select) === '1')
  },
  onShow() {
    this.load()
  },
  methods: {
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
    onCardTap(a) {
      if (this.selectMode) {
        this.pick(a)
      } else {
        this.goEdit(a.id)
      }
    },
    pick(a) {
      try { uni.setStorageSync(PENDING_ADDRESS_KEY, String(a.id)) } catch (e) { /* ignore */ }
      uni.navigateBack()
    },
    goEdit(id) {
      const q = []
      if (id) q.push('id=' + encodeURIComponent(id))
      if (this.selectMode) {
        q.push('select=1')
        q.push('back=' + (id ? 2 : 2))
      }
      nav('/pages/address-edit/address-edit' + (q.length ? '?' + q.join('&') : ''))
    },
    async setDefault(a) {
      const res = await Api.setDefaultAddress(a.id)
      if (res.code !== 0) { ui.toast(res.msg || '设置失败，请重试', 'alert-triangle'); return }
      ui.toast('已设为默认地址', 'circle-check')
      this.load()
    },
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
.addr-item { padding: 14px 16px; }
.addr-item--hover { transform: scale(.99); }
.addr-item.is-default { border-color: var(--c-primary); background: linear-gradient(180deg, #FFFFFF, #F4FBFA); }
.addr-name { font-size: 15px; font-weight: 700; }
.addr-phone { font-size: 13px; color: var(--c-ink-2); }
.addr-text {
  display: block; margin-top: 6px; font-size: 13px; line-height: 1.6;
  color: var(--c-ink-2); word-break: break-all;
}
.addr-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--c-line-soft);
}
.addr-del { color: var(--c-danger); }
/* 热区：最小 44px 高，符合小程序点击规范 */
.hit-btn { min-height: 44px; min-width: 96px; padding: 0 16px; font-size: 13px; }
.addr-actions .hit-btn { min-width: 84px; }
.addr-foot {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 0;
  width: 100%; max-width: var(--app-w); z-index: 50;
  padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(244, 247, 246, .94);
  border-top: 1px solid var(--c-line-soft);
  backdrop-filter: blur(8px);
}
</style>
