<template>
  <view class="tabbar">
    <view
      v-for="it in items"
      :key="it.key"
      class="tabbar__item"
      :class="{ 'is-active': it.key === active }"
      @click="go(it)"
    >
      <AppIcon :name="it.icon" :size="21" :color="it.key === active ? '#0A6A6C' : '#9AA9A7'" />
      <text class="tabbar__label">{{ it.label }}</text>
    </view>
  </view>
</template>

<script>
/* AppTabBar —— 自定义底部导航（跨端一致，图标使用 AppIcon）
 * 用法：每个 tab 页在最外层放 <AppTabBar page="index" />
 */
import AppIcon from './AppIcon.vue'
import { NAV_MAP, nav } from '../common/nav.js'

export default {
  name: 'AppTabBar',
  components: { AppIcon },
  props: {
    /** 当前页面 key：index | weather | spots | spot-detail | shop | product-detail | profile | checkin | earn | membership */
    page: { type: String, default: 'index' }
  },
  data() {
    return {
      items: [
        { key: 'home', label: '首页', icon: 'home', url: '/pages/index/index' },
        { key: 'spots', label: '野塘', icon: 'map-pin', url: '/pages/spots/spots' },
        { key: 'shop', label: '商城', icon: 'shopping-bag', url: '/pages/shop/shop' },
        { key: 'profile', label: '我的', icon: 'user', url: '/pages/profile/profile' }
      ]
    }
  },
  computed: {
    active() {
      return NAV_MAP[this.page] || 'home'
    }
  },
  methods: {
    go(it) {
      if (it.key === this.active) return
      nav(it.url)
    }
  }
}
</script>
