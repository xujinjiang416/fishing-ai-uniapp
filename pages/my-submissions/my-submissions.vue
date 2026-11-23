<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="我的投稿" back right="刷新" @right="refresh" />

      <view class="page">
        <!-- 首屏骨架 -->
        <view v-if="loading" class="list mt12">
          <view v-for="i in 3" :key="i" class="card card--pad">
            <view class="row" style="gap: 12px">
              <view class="skel" style="width: 72px; height: 72px; border-radius: 12px"></view>
              <view class="col grow" style="gap: 8px">
                <view class="skel" style="height: 14px; width: 60%"></view>
                <view class="skel" style="height: 12px; width: 80%"></view>
                <view class="skel" style="height: 12px; width: 40%"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 接口错误 -->
        <view v-else-if="error && !list.length" class="empty">
          <view class="empty__ic"><AppIcon name="alert-triangle" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">{{ error }}</text>
          <text class="tiny mt4" style="display: block">请检查网络后重试</text>
          <view class="btn btn--line mt16" @click="load(true)">重新加载</view>
        </view>

        <!-- 空态 -->
        <view v-else-if="!list.length" class="empty">
          <view class="empty__ic"><AppIcon name="camera" :size="26" color="#9AA9A7" /></view>
          <text class="empty__t">还没有投稿记录</text>
          <text class="tiny mt4" style="display: block">发现新的野塘，欢迎上报给钓友</text>
          <view class="btn btn--primary mt16" @click="goSubmit">上报钓点</view>
        </view>

        <!-- 投稿列表 -->
        <view v-else class="list mt12">
          <view v-for="it in list" :key="it.id" class="card sub-card">
            <view class="row" style="gap: 12px; align-items: flex-start">
              <image
                v-if="coverOf(it)"
                class="sub-cover"
                :src="imgUrl(coverOf(it))"
                mode="aspectFill"
                @click="previewPhotos(it.photos, 0)"
              />
              <view v-else class="sub-cover sub-cover--ph">
                <AppIcon name="image" :size="22" color="#9AA9A7" />
              </view>
              <view class="grow" style="min-width: 0">
                <view class="row row--between" style="align-items: flex-start; gap: 8px">
                  <text class="item__title ellipsis">{{ it.name || '未命名钓点' }}</text>
                  <text class="tag" :class="statusMeta(it.status).cls">{{ statusMeta(it.status).text }}</text>
                </view>
                <view class="item__meta">
                  <view class="row" style="gap: 3px">
                    <AppIcon name="map-pin" :size="12" color="#6E807E" />
                    <text class="num">{{ it.coord || '无坐标' }}</text>
                  </view>
                </view>
                <view class="item__meta">
                  <view class="row" style="gap: 3px">
                    <AppIcon name="clock" :size="12" color="#6E807E" />
                    <text>{{ it.createdAt || '--' }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 照片缩略图 -->
            <scroll-view v-if="(it.photos || []).length" scroll-x class="hscroll mt8" :show-scrollbar="false">
              <view class="hscroll__row">
                <image
                  v-for="(src, i) in it.photos"
                  :key="i"
                  class="sub-thumb"
                  :src="imgUrl(src)"
                  mode="aspectFill"
                  @click="previewPhotos(it.photos, i)"
                />
              </view>
            </scroll-view>

            <!-- 审核意见 -->
            <view v-if="it.reviewNote" class="notice notice--warn mt8">
              <AppIcon name="alert-triangle" :size="15" color="#8E6210" />
              <text class="grow">审核意见：{{ it.reviewNote }}</text>
            </view>

            <view class="sub-ft">
              <text class="tiny">{{ kindText(it.kind) }}</text>
              <view class="row" style="gap: 8px">
                <view v-if="canWithdraw(it)" class="btn btn--line btn--sm" @click="withdraw(it)">撤回</view>
                <view v-if="it.status === 'needs_info'" class="btn btn--primary btn--sm" @click="openSupplement(it)">补充材料</view>
              </view>
            </view>
          </view>
        </view>

        <view class="mt24" style="text-align: center; padding-bottom: 8px">
          <text class="tiny" style="display: block">投稿通过后会进入钓点地图，供钓友查看</text>
        </view>
      </view>
    </view>

    <!-- 补充材料弹层：改照片 / 坐标 / 说明 -->
    <template v-if="supplementOpen">
      <view class="mask" @click="supplementOpen = false"></view>
      <view class="sheet">
        <view class="sheet__grip"></view>
        <view class="row row--between" style="margin-bottom: 10px">
          <text class="sheet__title" style="margin: 0">补充材料</text>
          <view class="appbar__btn" @click="supplementOpen = false">
            <AppIcon name="x" :size="16" color="#12211F" />
          </view>
        </view>

        <text class="form-label">现场照片</text>
        <view class="uploader">
          <view v-for="(src, i) in supplementPhotos" :key="i" class="uploader__wrap">
            <image class="uploader__item" :src="imgUrl(src)" mode="aspectFill" @click="previewSupplement(i)" />
            <view class="uploader__rm" @click.stop="supplementPhotos.splice(i, 1)">
              <AppIcon name="x" :size="12" color="#FFFFFF" />
            </view>
          </view>
          <view v-if="supplementPhotos.length < 6" class="uploader__add" @click="chooseSupplementPhotos">
            <AppIcon name="camera" :size="18" color="#9AA9A7" />
            <text>添加</text>
          </view>
        </view>
        <text v-if="supplementUploading" class="tiny mt8" style="display: block">{{ supplementUploadLabel }}</text>

        <text class="form-label mt12">坐标（lng,lat）</text>
        <input v-model="supplementCoord" class="input" placeholder="如 117.227200,31.820600" placeholder-class="ph" />

        <text class="form-label mt12">说明</text>
        <textarea
          v-model="supplementNote"
          class="textarea"
          maxlength="500"
          placeholder="补充水体、钓位、停车等信息"
          placeholder-class="ph"
        />

        <view class="btn btn--primary btn--block btn--lg mt16" :class="{ 'is-loading': supplementSaving }" @click="saveSupplement">
          <text>{{ supplementSaving ? '' : '提交补充' }}</text>
        </view>
      </view>
    </template>

    <AppOverlays />
  </view>
</template>

<script>
/* 我的投稿（pages/my-submissions/my-submissions）
 * 数据接口：
 *   Api.fetchMySubmissions()                 投稿列表
 *   Api.withdrawSubmission(id)              撤回（pending / needs_info / reviewing）
 *   Api.supplementSubmission(id, payload)   补充照片 / 坐标 / 说明（needs_info）
 *   Api.uploadSpotImage(filePath)           补充材料时上传照片
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { mediaUrl } from '../../common/request.js'
import * as ui from '../../common/ui.js'

/* 投稿状态文案与标签色 */
const STATUS_META = {
  pending: { text: '待审核', cls: 'tag--warn' },
  reviewing: { text: '审核中', cls: 'tag--warn' },
  needs_info: { text: '需补充', cls: 'tag--accent' },
  approved: { text: '已通过', cls: 'tag--success' },
  rejected: { text: '已驳回', cls: 'tag--danger' },
  merged: { text: '已合并', cls: 'tag--primary' },
  withdrawn: { text: '已撤回', cls: 'tag--mute' }
}

export default {
  components: { AppBar, AppIcon, AppOverlays },
  data() {
    return {
      list: [],
      loading: true,
      loaded: false,
      error: '',
      supplementOpen: false,
      supplementId: '',
      supplementPhotos: [],
      supplementCoord: '',
      supplementNote: '',
      supplementSaving: false,
      supplementUploading: false,
      supplementUploadLabel: ''
    }
  },
  onLoad() {
    if (!Store.isLoggedIn) { this.loading = false; ui.toLogin(); return }
    this.load(true)
  },
  onShow() {
    if (!Store.isLoggedIn) return
    // 首次加载失败或从登录页返回时补拉；已有数据则静默刷新
    if (!this.loaded) { if (!this.loading) this.load(true); return }
    if (!this.loading) this.load(false)
  },
  methods: {
    /** 相对图片地址补全为可展示地址 */
    imgUrl(u) { return mediaUrl(u) },
    /** 状态元信息（未命中的状态回退为原值 + 灰色标签） */
    statusMeta(status) {
      return STATUS_META[status] || { text: status || '--', cls: 'tag--mute' }
    },
    /** 投稿类型文案 */
    kindText(kind) {
      return kind === 'update_spot' ? '更新已有钓点' : '新钓点'
    },
    /** 封面：cover 优先，其次首张照片 */
    coverOf(it) {
      return it.cover || ((it.photos && it.photos.length) ? it.photos[0] : '')
    },
    /** 可撤回状态 */
    canWithdraw(it) {
      return ['pending', 'needs_info', 'reviewing'].indexOf(it.status) > -1
    },
    /** 预览投稿照片 */
    previewPhotos(photos, i) {
      const urls = (photos || []).map(mediaUrl)
      if (!urls.length) return
      uni.previewImage({ urls, current: urls[i] || urls[0] })
    },
    /** 加载投稿列表 */
    async load(showSkeleton) {
      if (showSkeleton) this.loading = true
      this.error = ''
      const res = await Api.fetchMySubmissions()
      this.loading = false
      if (res.code !== 0 || !Array.isArray(res.data)) {
        this.error = res.msg || '投稿加载失败，请稍后重试'
        this.list = []
        return
      }
      this.list = res.data
      this.loaded = true
    },
    /** 顶栏刷新 */
    refresh() {
      this.load(false).then(() => ui.toast('投稿已刷新', 'refresh-cw'))
    },
    /** 空态：去上报 */
    goSubmit() { ui.nav('/pages/spot-submit/spot-submit') },
    /** 撤回投稿 */
    async withdraw(it) {
      const yes = await ui.confirm({
        title: '撤回投稿？',
        text: '撤回后本条投稿不再进入审核，需要时可重新提交。',
        okText: '确认撤回',
        cancelText: '再想想'
      })
      if (!yes) return
      const res = await Api.withdrawSubmission(it.id)
      if (res.code !== 0) { ui.toast(res.msg || '撤回失败，请重试', 'alert-triangle'); return }
      const data = res.data || Object.assign({}, it, { status: 'withdrawn' })
      const i = this.list.findIndex(x => x.id === it.id)
      if (i > -1) this.list.splice(i, 1, data)
      ui.toast('已撤回投稿', 'circle-check')
    },
    /** 打开补充材料弹层，带入原有照片 / 坐标 / 说明 */
    openSupplement(it) {
      this.supplementId = it.id
      this.supplementPhotos = (it.photos || []).slice(0, 6)
      this.supplementCoord = it.coord || ''
      this.supplementNote = it.note || ''
      this.supplementUploading = false
      this.supplementUploadLabel = ''
      this.supplementOpen = true
    },
    /** 校验 "lng,lat" 字符串（限定国内范围） */
    validCoord(text) {
      const parts = String(text || '').split(',')
      if (parts.length !== 2) return false
      const lng = Number(parts[0])
      const lat = Number(parts[1])
      return isFinite(lng) && isFinite(lat) && lng >= 73 && lng <= 136 && lat >= 3 && lat <= 54
    },
    /** 补充照片：选图后逐张上传 */
    chooseSupplementPhotos() {
      const remain = 6 - this.supplementPhotos.length
      if (remain <= 0 || this.supplementUploading) return
      uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async res => {
          const paths = res.tempFilePaths || []
          if (!paths.length) return
          this.supplementUploading = true
          for (let k = 0; k < paths.length; k++) {
            this.supplementUploadLabel = '图片上传中 ' + (k + 1) + '/' + paths.length
            const r = await Api.uploadSpotImage(paths[k])
            if (r.code === 0 && r.data && r.data.url) this.supplementPhotos.push(r.data.url)
            else ui.toast(r.msg || '图片上传失败，请重试', 'alert-triangle')
          }
          this.supplementUploading = false
          this.supplementUploadLabel = ''
        },
        fail: () => ui.toast('请授权相册或相机后再上传图片', 'alert-triangle')
      })
    },
    /** 预览补充照片 */
    previewSupplement(i) {
      const urls = this.supplementPhotos.map(mediaUrl)
      if (!urls.length) return
      uni.previewImage({ urls, current: urls[i] || urls[0] })
    },
    /** 提交补充材料 */
    async saveSupplement() {
      if (this.supplementSaving || this.supplementUploading) return
      if (!this.supplementPhotos.length) { ui.toast('请至少保留 1 张现场照片', 'alert-triangle'); return }
      const coord = String(this.supplementCoord || '').replace(/，/g, ',').trim()
      if (coord && !this.validCoord(coord)) { ui.toast('坐标格式应为 lng,lat', 'alert-triangle'); return }
      this.supplementSaving = true
      const payload = {
        photos: this.supplementPhotos.slice(0, 6),
        note: String(this.supplementNote || '').trim()
      }
      if (coord) payload.coord = coord
      const res = await Api.supplementSubmission(this.supplementId, payload)
      this.supplementSaving = false
      if (res.code !== 0 || !res.data) { ui.toast(res.msg || '补充失败，请重试', 'alert-triangle'); return }
      const i = this.list.findIndex(x => x.id === this.supplementId)
      if (i > -1) this.list.splice(i, 1, res.data)
      this.supplementOpen = false
      ui.toast('材料已补充，重新进入审核', 'circle-check')
    }
  }
}
</script>

<style>
.sub-card { padding: 14px 16px; }
.sub-cover { width: 72px; height: 72px; border-radius: var(--r-sm); flex: none; background: var(--c-line-soft); }
.sub-cover--ph { display: flex; align-items: center; justify-content: center; }
.sub-thumb { width: 58px; height: 58px; border-radius: var(--r-xs); flex: none; }
.sub-ft {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--c-line-soft);
}
.form-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.ph { color: var(--c-ink-4); }
</style>
