<template>
  <!-- 区块：整条底部导航 / 四项均分，选中项高亮主色，当前 tab 重复点击不跳转 -->
  <view class="tabbar">
    <view
      v-for="it in items"
      :key="it.key"
      class="tabbar__item"
      :class="{ 'is-active': it.key === active }"
      @click="go(it)"
    >
      <!-- 图标：选中用主色 #0A6A6C，未选中用灰绿 #9AA9A7 -->
      <AppIcon :name="it.icon" :size="21" :color="it.key === active ? '#0A6A6C' : '#9AA9A7'" />
      <text class="tabbar__label">{{ it.label }}</text>
    </view>
  </view>
</template>

<script>
/* AppTabBar —— 自定义底部导航（跨端一致，图标使用 AppIcon）
 * 用法：每个 tab 页在最外层放 <AppTabBar page="index" />
 *
 * 职责：4 个一级入口（首页 / 野塘 / 商城 / 我的）的固定底栏，负责高亮与跳转。
 * props：
 *   - page String 当前页面 key（index | weather | spots | spot-detail | shop |
 *                product-detail | profile | checkin | earn | membership），默认 'index'；
 *                仅用于经 NAV_MAP 换算高亮项，不参与跳转。
 * emits：无。
 * 依赖：common/nav.js 的 NAV_MAP（页面 key → 一级 tab key）与 nav（统一跳转）。
 * 注意：内部用 key 与 url 分离，二级页（如 spot-detail）也能正确高亮所属一级 tab。
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
      /* Tab 配置表：key 用于高亮比对，label 为文案，icon 为 AppIcon 键名，url 为跳转路径 */
      items: [
        { key: 'home', label: '首页', icon: 'home', url: '/pages/index/index' },
        { key: 'spots', label: '野塘', icon: 'map-pin', url: '/pages/spots/spots' },
        { key: 'shop', label: '商城', icon: 'shopping-bag', url: '/pages/shop/shop' },
        { key: 'profile', label: '我的', icon: 'user', url: '/pages/profile/profile' }
      ]
    }
  },
  computed: {
    /**
     * 当前应高亮的一级 tab key
     * @returns {String} home | spots | shop | profile，未知 page 回退 home
     */
    active() {
      return NAV_MAP[this.page] || 'home'
    }
  },
  methods: {
    /**
     * 点击 tab：已处于该 tab 时忽略，避免重复入栈
     * @param {Object} it tab 配置项 { key, label, icon, url }
     * @returns {void}
     */
    go(it) {
      if (it.key === this.active) return
      nav(it.url)
    }
  }
}
</script>
