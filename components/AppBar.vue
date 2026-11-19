<template>
  <view class="appbar" :class="{ 'appbar--solid': solid, 'appbar--transparent': transparent }" :style="barStyle">
    <view v-if="back" class="appbar__btn" :class="{ 'appbar__btn--hollow': hollow }" @click="onBack">
      <AppIcon name="arrow-left" :size="20" :color="hollow ? '#FFFFFF' : '#12211F'" />
    </view>
    <text class="appbar__title" :style="titleStyle">{{ title }}</text>
    <view class="appbar__spacer"></view>
    <slot name="right">
      <text v-if="right" class="appbar__right" :style="rightStyle" @click="$emit('right')">{{ right }}</text>
    </slot>
  </view>
</template>

<script>
/* AppBar —— 页面标题栏（自定义导航，自带状态栏高度占位）
 */
import AppIcon from './AppIcon.vue'
import { statusBarHeight } from '../common/sys.js'
import { back as navBack } from '../common/nav.js'

export default {
  name: 'AppBar',
  components: { AppIcon },
  props: {
    title: { type: String, default: '' },
    back: { type: Boolean, default: false },
    solid: { type: Boolean, default: false },
    transparent: { type: Boolean, default: false },
    /** 浮在深色图片上时用描边白色按钮 + 白色标题 */
    hollow: { type: Boolean, default: false },
    right: { type: String, default: '' },
    dark: { type: Boolean, default: false }
  },
  emits: ['right'],
  computed: {
    barStyle() {
      const h = statusBarHeight
      return h ? 'padding-top:' + h + 'px;box-sizing:content-box;' : ''
    },
    titleStyle() {
      return this.hollow || this.dark ? 'color:#FFFFFF;' : ''
    },
    rightStyle() {
      return this.hollow || this.dark ? 'color:#FFFFFF;' : ''
    }
  },
  methods: {
    onBack() {
      this.$emit('back')
      navBack()
    }
  }
}
</script>
