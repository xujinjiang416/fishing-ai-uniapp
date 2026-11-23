<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="我的收藏" back right="刷新" @right="refresh" />

      <view class="page">
        <!-- 首屏骨架 -->
        <view v-if="loading" class="list mt12">
          <view v-for="i in 3" :key="i" class="card fav-card">
            <view class="skel" style="width: 84px; height: 84px; border-radius: 12px"></view>
            <view class="col grow" style="gap: 8px">
              <view class="skel" style="height: 14px; width: 55%"></view>
              <view class="skel" style="height: 12px; width: 80%"></view>
              <view class="skel" style="height: 12px; width: 35%"></view>
            </view>
          </view>
        </view>

        <!-- 接口错误 -->
        <view v-else-if="error" class="empty">
          <view class="empty__ic"><AppIcon name="alert-triangle" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">{{ error }}</text>
          <text class="tiny mt4" style="display: block">请检查网络后重试</text>
          <view class="btn btn--line mt16" @click="load(true)">重新加载</view>
        </view>

        <!-- 空态 -->
        <view v-else-if="!spots.length" class="empty">
          <view class="empty__ic"><AppIcon name="bookmark" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">还没有收藏钓点</text>
          <text class="tiny mt4" style="display: block">在钓点详情页点击收藏，方便下次快速找到</text>
          <view class="btn btn--primary mt16" @click="goSpots">去钓点地图</view>
        </view>

        <!-- 收藏列表 -->
        <view v-else class="list mt12">
          <view
            v-for="s in spots"
            :key="s.id"
            class="card fav-card"
            hover-class="fav-card--hover"
            @click="openSpot(s.id)"
          >
            <image v-if="s.cover" class="fav-img" :src="imgUrl(s.cover)" mode="aspectFill" />
            <view v-else class="fav-img fav-img--ph">
              <AppIcon name="image" :size="22" color="#9AA9A7" />
            </view>
            <view class="grow" style="min-width: 0">
              <view class="row row--between" style="gap: 8px">
                <text class="item__title ellipsis">{{ s.name }}</text>
                <text class="tag" :class="(s.pay || '').indexOf('免费') > -1 ? 'tag--success' : 'tag--gold'">{{ s.pay || '--' }}</text>
              </view>
              <view class="row mt4" style="gap: 5px; align-items: flex-start">
                <AppIcon name="map-pin" :size="12" color="#6E807E" />
                <text class="tiny ellipsis" style="line-height: 1.5">{{ s.address || '暂无地址' }}</text>
              </view>
              <view v-if="s.fish && s.fish.length" class="row mt8" style="gap: 6px; flex-wrap: wrap">
                <text v-for="f in s.fish.slice(0, 3)" :key="f" class="tag tag--mute">{{ f }}</text>
              </view>
            </view>
            <AppIcon name="chevron-right" :size="18" color="#9AA9A7" />
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">收藏数据与账号绑定，多端同步</text>
        </view>
      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 我的收藏（pages/favorites/favorites）
 * 数据接口：Api.fetchFavorites() -> { ids, spots }
 * 行为：进入即拉取；成功后同步本地 Store.favorites，保证详情页收藏态一致；
 *       点击卡片进入钓点详情。
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { mediaUrl } from '../../common/request.js'
import * as ui from '../../common/ui.js'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      spots: [],
      loading: true,
      loaded: false,
      error: ''
    }
  },
  onLoad() {
    if (!Store.isLoggedIn) { this.loading = false; ui.toLogin(); return }
    this.load(true)
  },
  onShow() {
    if (!Store.isLoggedIn) return
    // 从详情页返回时刷新收藏态；首次加载中不重复请求
    if (this.loaded && !this.loading) this.load(false)
    else if (!this.loaded && !this.loading) this.load(true)
  },
  methods: {
    /** 相对图片地址补全为可展示地址 */
    imgUrl(u) { return mediaUrl(u) },
    /** 加载收藏列表，并同步本地收藏集合 */
    async load(showSkeleton) {
      if (showSkeleton) this.loading = true
      this.error = ''
      const res = await Api.fetchFavorites()
      this.loading = false
      if (res.code !== 0 || !res.data) {
        this.error = res.msg || '收藏加载失败，请稍后重试'
        this.spots = []
        return
      }
      this.spots = res.data.spots || []
      this.loaded = true
      const ids = res.data.ids || []
      const cur = Store.data.favorites
      cur.splice(0, cur.length, ...ids)
      Store.save()
    },
    /** 顶栏刷新 */
    refresh() {
      this.load(false).then(() => ui.toast('收藏已刷新', 'refresh-cw'))
    },
    /** 打开钓点详情 */
    openSpot(id) {
      ui.nav('/pages/spot-detail/spot-detail?id=' + encodeURIComponent(id))
    },
    /** 空态：去钓点地图 */
    goSpots() {
      ui.nav('/pages/spots/spots')
    }
  }
}
</script>

<style>
.fav-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
}
.fav-card--hover { transform: scale(.99); }
.fav-img { width: 84px; height: 84px; border-radius: var(--r-sm); flex: none; background: var(--c-line-soft); }
.fav-img--ph { display: flex; align-items: center; justify-content: center; }
</style>
