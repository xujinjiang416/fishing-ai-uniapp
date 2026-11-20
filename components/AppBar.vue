<template>
  <!-- 区块：整条标题栏 / 自定义导航（solid、transparent 控制底色，barStyle 预留状态栏高度） -->
  <view class="appbar" :class="{ 'appbar--solid': solid, 'appbar--transparent': transparent }" :style="barStyle">
    <!-- 区块：左侧返回按钮 / 由 hollow 决定白描边样式；点击后先派发 back 事件再回退路由 -->
    <view v-if="back" class="appbar__btn" :class="{ 'appbar__btn--hollow': hollow }" @click="onBack">
      <AppIcon name="arrow-left" :size="20" :color="hollow ? '#FFFFFF' : '#12211F'" />
    </view>
    <!-- 区块：居中标题 / 深色底（hollow、dark）时自动切白字 -->
    <text class="appbar__title" :style="titleStyle">{{ title }}</text>
    <!-- 区块：右侧占位 / 与左侧返回按钮等宽，保证标题真正居中 -->
    <view class="appbar__spacer"></view>
    <!-- 区块：右侧操作区 / 优先使用 right 具名插槽，未提供插槽时回退为 right 文本按钮 -->
    <slot name="right">
      <text v-if="right" class="appbar__right" :style="rightStyle" @click="$emit('right')">{{ right }}</text>
    </slot>
  </view>
</template>

<script>
/* AppBar —— 页面标题栏（自定义导航，自带状态栏高度占位）
 *
 * 职责：替代原生导航栏，提供左返回、居中标题、右侧操作区，跨端表现一致。
 * props：
 *   - title        String  标题文案，默认 ''；
 *   - back         Boolean 是否显示左侧返回按钮，默认 false；
 *   - solid        Boolean 是否使用不透明底色样式，默认 false；
 *   - transparent  Boolean 是否使用透明底色样式，默认 false；
 *   - hollow       Boolean 浮在深色图片上时为白描边按钮 + 白字，默认 false；
 *   - right        String  右侧文本操作入口，默认 ''（也可用 right 插槽完全自定义）；
 *   - dark         Boolean 深色背景下标题与右侧文本转白，默认 false。
 * emits：back（点击返回时派发）、right（点击右侧文本时派发）。
 * 依赖：common/sys.js 的 statusBarHeight（设备状态栏高度）、common/nav.js 的 back（路由回退）。
 * 注意：状态栏高度通过 padding-top 写入，配合 box-sizing:content-box 不压缩内容高度。
 */
import AppIcon from './AppIcon.vue'
import { statusBarHeight } from '../common/sys.js'
import { back as navBack } from '../common/nav.js'

export default {
  name: 'AppBar',
  components: { AppIcon },
  props: {
    /** 标题文案，默认空串 */
    title: { type: String, default: '' },
    /** 是否显示左侧返回按钮（点击派发 back 事件并回退路由） */
    back: { type: Boolean, default: false },
    /** 是否使用不透明实色底（滚动后固定顶栏时使用） */
    solid: { type: Boolean, default: false },
    /** 是否使用透明底（叠在 Hero 图上时使用） */
    transparent: { type: Boolean, default: false },
    /** 浮在深色图片上时用描边白色按钮 + 白色标题 */
    hollow: { type: Boolean, default: false },
    /** 右侧文本操作文案；留空则不渲染默认右侧按钮 */
    right: { type: String, default: '' },
    /** 深色背景下标题与右侧文本转白 */
    dark: { type: Boolean, default: false }
  },
  emits: ['right'],
  computed: {
    /**
     * 顶部内边距样式：按设备状态栏高度预留空间
     * @returns {String} 行内 style 字符串，无状态栏高度时返回空串
     */
    barStyle() {
      const h = statusBarHeight
      return h ? 'padding-top:' + h + 'px;box-sizing:content-box;' : ''
    },
    /**
     * 标题颜色：深色图/深色底（hollow、dark）时转白
     * @returns {String} 行内 style 字符串
     */
    titleStyle() {
      return this.hollow || this.dark ? 'color:#FFFFFF;' : ''
    },
    /**
     * 右侧文本颜色：与标题保持一致的深色底白字规则
     * @returns {String} 行内 style 字符串
     */
    rightStyle() {
      return this.hollow || this.dark ? 'color:#FFFFFF;' : ''
    }
  },
  methods: {
    /**
     * 返回按钮点击：先通知父级（可拦截做二次确认），再执行路由回退
     * @returns {void}
     */
    onBack() {
      this.$emit('back')
      navBack()
    }
  }
}
</script>
