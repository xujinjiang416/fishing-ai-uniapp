<template>
  <view class="app">
    <view class="app-main">
      <!-- 区块：加载骨架 / 头图 + 信息卡 + 两行列表的占位 / 仅在 loading 时展示，避免首屏白闪 -->
      <view v-if="loading" class="page" style="padding-top: 6px">
        <view class="skel" style="height: 260px; border-radius: 0; margin: 0 -16px"></view>
        <view class="skel mt16" style="height: 118px; border-radius: 22px"></view>
        <view v-for="i in 2" :key="i" class="row mt16" style="gap: 12px">
          <view class="skel" style="width: 74px; height: 74px; border-radius: 12px"></view>
          <view class="col grow" style="gap: 8px">
            <view class="skel" style="height: 14px; width: 60%"></view>
            <view class="skel" style="height: 12px; width: 85%"></view>
          </view>
        </view>
      </view>

      <template v-else>
        <!-- 区块：封面来源提示 / 通栏通知条 / 仅在封面取自评论或暂无实景图时出现 -->
        <view v-if="coverNotice" style="padding: 12px 16px 0">
          <view class="notice notice--info">
            <AppIcon :name="coverNoticeIcon" :size="15" color="#0A6A6C" />
            <text class="grow">{{ coverNotice }}</text>
          </view>
        </view>

        <!-- 区块：图集 / 顶部大图 + 底部缩略图横滑切换 / 无图时走占位块；返回按钮悬浮于图上层 -->
        <view class="hero-wrap">
          <view class="gallery-hero">
            <image v-if="heroImg" class="gallery-hero__img" :src="heroImg" mode="aspectFill" @click="previewImage(gi)" />
            <view v-else class="gallery-hero__ph">
              <AppIcon name="image" :size="40" color="rgba(255,255,255,.82)" />
            </view>
            <view class="gallery-hero__mask"></view>
          </view>
          <view class="hero-strip-wrap">
            <scroll-view v-if="gallery.length > 1" scroll-x class="gallery-strip" :show-scrollbar="false">
              <view class="gallery-strip__row">
                <image
                  v-for="(g, i) in gallery"
                  :key="i"
                  class="gs-item"
                  :class="{ 'is-on': i === gi }"
                  :src="imgUrl(g)"
                  mode="aspectFill"
                  @click="gi = i"
                />
              </view>
            </scroll-view>
          </view>
          <view class="hero-appbar">
            <AppBar back hollow transparent />
          </view>
        </view>

        <view class="page" style="padding-top: 14px">
          <!-- 区块：基本信息卡 / 标题与评分 + 收藏按钮 + 标签行 + 三项指标网格 / 收藏为本地即时态 -->
          <view class="card card--pad reveal" style="--d: 0">
            <view class="row row--between" style="align-items: flex-start; gap: 10px">
              <view class="grow">
                <text class="h2">{{ S.name }}</text>
                <view class="row mt4" style="gap: 8px; flex-wrap: wrap">
                  <Rating :value="S.rating" :size="13" />
                  <text style="font-weight: 700; color: var(--c-warn); font-size: 13px">{{ ratingText(S.rating) }}</text>
                  <text class="tiny">{{ S.commentCount }} 条评价</text>
                </view>
              </view>
              <view class="chip heart-btn" :class="{ 'is-on': fav }" style="flex: none" @click="toggleFav">
                <AppIcon name="heart" :size="15" :color="fav ? '#FFFFFF' : '#3D4F4D'" />
                <text>{{ fav ? '已收藏' : '收藏' }}</text>
              </view>
            </view>
            <view class="row mt12" style="gap: 6px; flex-wrap: wrap">
              <text class="tag" :class="(S.pay || '').indexOf('免费') > -1 ? 'tag--success' : 'tag--gold'">{{ S.pay }}</text>
              <text v-for="f in S.fish" :key="f" class="tag tag--primary">{{ f }}</text>
            </view>
            <view class="hr"></view>
            <view class="grid3">
              <view class="metric">
                <view class="metric__k">
                  <AppIcon name="ruler" :size="12" color="#6E807E" />
                  <text>水深</text>
                </view>
                <text class="metric__v metric__v--sm">{{ waterDepth }}</text>
              </view>
              <view class="metric">
                <view class="metric__k">
                  <AppIcon name="waves" :size="12" color="#6E807E" />
                  <text>水底</text>
                </view>
                <text class="metric__v metric__v--sm">{{ S.bottom }}</text>
              </view>
              <view class="metric">
                <view class="metric__k">
                  <AppIcon name="users" :size="12" color="#6E807E" />
                  <text>人流</text>
                </view>
                <text class="metric__v metric__v--sm">{{ S.crowd }}</text>
              </view>
            </view>
          </view>

          <!-- 区块：钓况反馈 / 是否可正常作钓，同一用户可改选；5 人反馈无法作钓后该钓点不再展示 -->
          <view class="card card--pad reveal mt12">
            <view class="card__title">
              <AppIcon name="users" :size="16" color="#12211F" />
              <text>这里还能正常作钓吗</text>
            </view>
            <view class="row mt12" style="gap: 8px">
              <view
                class="chip vote-btn"
                :class="{ 'is-on': fishability.myVote === 'yes' }"
                @click="voteFishable('yes')"
              >
                <AppIcon name="circle-check" :size="14" :color="fishability.myVote === 'yes' ? '#FFFFFF' : '#0A6A6C'" />
                <text>可以作钓</text>
                <text class="vote-btn__n">{{ fishability.yes }}</text>
              </view>
              <view
                class="chip vote-btn vote-btn--no"
                :class="{ 'is-on': fishability.myVote === 'no' }"
                @click="voteFishable('no')"
              >
                <AppIcon name="x" :size="14" :color="fishability.myVote === 'no' ? '#FFFFFF' : '#B4453A'" />
                <text>无法作钓</text>
                <text class="vote-btn__n">{{ fishability.no }}</text>
              </view>
            </view>
            <text class="tiny mt8" style="display: block">{{ fishabilityHint }}</text>
          </view>

          <!-- 区块：位置与导航 / 地址与坐标文本 + 复制、导航两个等宽按钮 / 坐标与地址拼接后写入剪贴板 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>位置与导航</text></view>
              <text class="tiny">可复制到地图 App 导航</text>
            </view>
            <view class="copy-loc copy-loc-col">
              <view class="row" style="gap: 8px; align-items: flex-start">
                <AppIcon name="map-pin" :size="18" color="#0A6A6C" />
                <view class="grow">
                  <text style="font-weight: 600; line-height: 1.5; display: block">{{ S.address }}</text>
                  <text v-if="S.coord" class="tiny num mt4" style="display: block">坐标 {{ S.coord }}</text>
                </view>
              </view>
              <view class="row" style="gap: 8px">
                <view class="btn btn--line btn--sm grow" @click="copyLoc">
                  <AppIcon name="copy" :size="15" color="#3D4F4D" />
                  <text>复制位置</text>
                </view>
                <view class="btn btn--primary btn--sm grow" @click="doNav">
                  <AppIcon name="navigation" :size="15" color="#FFFFFF" />
                  <text>立即导航</text>
                </view>
              </view>
            </view>
            <!-- 纠错 / 举报入口：位置、禁钓、干涸、收费等异常信息 -->
            <view class="report-link" @click="openReport">
              <AppIcon name="alert-triangle" :size="13" color="#8E6210" />
              <text class="grow">信息有误？纠错 / 举报</text>
              <AppIcon name="chevron-right" :size="12" color="#8E6210" />
            </view>
          </view>

          <!-- 区块：注意事项 / 单卡片文本块 / 后端 note 为空时整块不渲染 -->
          <view v-if="S.note" class="card card--pad reveal mt12">
            <view class="card__title">
              <AppIcon name="alert-triangle" :size="16" color="#12211F" />
              <text>注意事项</text>
            </view>
            <text class="muted mt8" style="line-height: 1.7; display: block">{{ S.note }}</text>
          </view>

          <!-- 区块：今日鱼情入口 / 天气摘要卡 + 解锁按钮 / 非会员点击先走会员校验 -->
          <view class="section">
            <view class="card card--pad reveal">
              <view class="row" style="gap: 12px">
                <view class="cell__icon" style="width: 44px; height: 44px; border-radius: 14px">
                  <AppIcon name="cloud" :size="22" color="#0A6A6C" />
                </view>
                <view class="grow">
                  <text class="item__title" style="display: block">今日该塘鱼情</text>
                  <text class="muted mt4" style="display: block">气压 1018hPa · 东北风 2 级 · AI 研判全天时段口型</text>
                </view>
                <AppIcon name="chevron-right" :size="18" color="#9AA9A7" />
              </view>
              <view class="btn btn--accent btn--block mt12" @click="unlockWeather">
                <AppIcon :name="weatherLocked ? 'lock' : 'sparkles'" :size="16" color="#FFFFFF" />
                <text>查看今日鱼情预报</text>
              </view>
            </view>
          </view>

          <!-- 区块：相似钓点推荐 / 横向 scroll-view 卡片流 / 无相似数据时整块隐藏 -->
          <view v-if="similar.length" class="section">
            <view class="section__head">
              <view class="section__title"><text>相似钓点推荐</text></view>
              <view class="section__more" @click="go('/pages/spots/spots')">
                <text>更多钓点</text>
                <AppIcon name="chevron-right" :size="13" color="#6E807E" />
              </view>
            </view>
            <scroll-view scroll-x class="hscroll" :show-scrollbar="false">
              <view class="hscroll__row">
                <view
                  v-for="s in similar"
                  :key="s.id"
                  class="card sim-card"
                  @click="openSpot(s.id)"
                >
                  <image v-if="s.cover" class="sim-card__img" :src="imgUrl(s.cover)" mode="aspectFill" />
                  <view v-else class="sim-card__ph"><AppIcon name="image" :size="22" color="#FFFFFF" /></view>
                  <view style="padding: 9px 10px 11px">
                    <text class="ellipsis" style="font-weight: 600; font-size: 13px; display: block">{{ s.name }}</text>
                    <view class="row mt4" style="gap: 6px">
                      <Rating :value="s.rating" :size="11" />
                    </view>
                    <text class="tiny mt4 ellipsis" style="display: block">{{ s.fish.join(' · ') }}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- 区块：钓友评价 / 评分汇总 + 发布入口 + 评论列表（含实景图与点赞） / 无评论时展示空态 -->
          <view class="section">
            <view class="section__head">
              <view class="section__title"><text>钓友评价</text></view>
              <text class="tiny">共 {{ commentsTotal }} 条</text>
            </view>
            <view class="card card--pad">
              <view class="row row--between">
                <view class="row" style="gap: 10px">
                  <text class="rating-big">{{ ratingText(S.rating) }}</text>
                  <view>
                    <Rating :value="S.rating" :size="13" />
                    <text class="tiny" style="display: block">综合评分</text>
                  </view>
                </view>
                <view class="tiny" style="text-align: right; line-height: 1.7">
                  <text style="display: block">实景图 {{ imgCount }} 张</text>
                  <text style="display: block">点击图片看大图</text>
                </view>
              </view>
              <view class="publish-bar mt12" @click="publishOpen = true">
                <AppIcon name="camera" :size="16" color="#9AA9A7" />
                <text class="grow">分享你的鱼情与实景，帮钓友避坑…</text>
                <AppIcon name="chevron-right" :size="16" color="#9AA9A7" />
              </view>
              <view class="mt8">
                <view v-if="!commentsLoading && !S.comments.length" class="empty" style="padding: 26px 10px">
                  <view class="empty__ic"><AppIcon name="message-circle" :size="24" color="#9AA9A7" /></view>
                  <text style="font-size: 13px; color: var(--c-ink-3)">还没有评价，来发第一条</text>
                </view>
                <view v-for="c in S.comments" :key="c.id" class="comment">
                  <view class="avatar"><text class="avatar__t2">{{ c.avatar }}</text></view>
                  <view class="comment__body">
                    <view class="comment__name">
                      <text>{{ c.user }}</text>
                      <Rating :value="c.rating" :size="11" />
                    </view>
                    <text class="comment__text">{{ c.text }}</text>
                    <view v-if="c.images && c.images.length" class="comment__imgs">
                      <image
                        v-for="(im, ii) in c.images"
                        :key="ii"
                        class="ci"
                        :src="imgUrl(im)"
                        mode="aspectFill"
                        @click="previewComment(c.images, ii)"
                      />
                    </view>
                    <view class="comment__ft">
                      <text>{{ c.date }}</text>
                      <view class="like-btn" :class="{ 'is-on': !!liked[c.id] }" @click="toggleLike(c.id)">
                        <AppIcon name="heart" :size="13" :color="liked[c.id] ? '#E8662B' : '#9AA9A7'" />
                        <text>{{ likes[c.id] || 0 }}</text>
                      </view>
                    </view>
                  </view>
                </view>

                <!-- 评论分页：还有更多时展示加载按钮；全部加载完提示到底 -->
                <view v-if="commentsHasMore || commentsLoading" class="load-more mt12" @click="loadMoreComments">
                  <text>{{ commentsLoading ? '加载中…' : '加载更多评论' }}</text>
                </view>
                <text v-else-if="S.comments.length" class="tiny mt12" style="display: block; text-align: center">已经到底啦</text>
              </view>
            </view>
          </view>

          <!-- 区块：页脚说明 / 居中免责声明 / 预留底部安全间距，避免被标签栏遮挡 -->
          <view class="mt24" style="text-align: center; padding-bottom: 8px">
            <text class="tiny" style="display: block">渔获 AI · 钓点信息由钓友共建，仅供出钓参考</text>
            <text class="tiny mt4" style="color: var(--c-ink-4); display: block">原型演示 · 不产生真实交易</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 区块：发表评价弹层 / 遮罩 + 底部抽屉 / 关闭仅重置显隐，表单值在提交成功后清空 -->
    <template v-if="publishOpen">
      <view class="mask" @click="publishOpen = false"></view>
      <view class="sheet">
        <view class="row row--between" style="margin-bottom: 10px">
          <text class="sheet__title" style="margin: 0">发表评价</text>
          <view class="appbar__btn" @click="publishOpen = false">
            <AppIcon name="x" :size="16" color="#12211F" />
          </view>
        </view>
        <text class="tiny">给这个塘打个分</text>
        <view class="row" style="gap: 6px; margin-top: 6px">
          <view v-for="n in 5" :key="n" class="star-btn" :class="{ 'is-on': n <= rating }" @click="rating = n">
            <AppIcon name="star" :size="26" :color="n <= rating ? '#D9971A' : '#E3EAE8'" />
          </view>
        </view>
        <textarea
          v-model="text"
          class="textarea compose-text mt12"
          maxlength="300"
          placeholder="说说鱼情、鱼种、停车、钓位与避坑经验…"
          placeholder-class="ph"
        />
        <view class="row row--between mt12">
          <text class="tiny">添加实景图片（最多 3 张）</text>
          <text class="tiny">{{ picks.length }} / 3</text>
        </view>
        <view class="uploader mt8">
          <view v-for="(p, i) in picks" :key="i" class="uploader__wrap">
            <image class="uploader__item" :src="p" mode="aspectFill" />
            <view class="uploader__rm" @click="removePick(i)">
              <AppIcon name="x" :size="12" color="#FFFFFF" />
            </view>
          </view>
          <view v-if="picks.length < 3" class="uploader__add" @click="addPick">
            <AppIcon name="plus" :size="18" color="#9AA9A7" />
            <text>添加图片</text>
          </view>
        </view>
        <text v-if="uploadTip" class="tiny mt8" style="display: block">{{ uploadTip }}</text>
        <view class="notice notice--info mt12">
          <AppIcon name="info" :size="15" color="#0A6A6C" />
          <text class="grow">带实景图的评价会被优先展示，也可能成为该钓点的封面图。</text>
        </view>
        <view class="btn btn--accent btn--block btn--lg mt12" :class="{ 'is-loading': submitting }" @click="submit">
          <text>发布评价</text>
        </view>
      </view>
    </template>

    <!-- 区块：纠错 / 举报弹层 / 选择问题类型，位置不对时可填新坐标 -->
    <template v-if="reportOpen">
      <view class="mask" @click="reportOpen = false"></view>
      <view class="sheet">
        <view class="row row--between" style="margin-bottom: 10px">
          <text class="sheet__title" style="margin: 0">纠错 / 举报</text>
          <view class="appbar__btn" @click="reportOpen = false">
            <AppIcon name="x" :size="16" color="#12211F" />
          </view>
        </view>
        <text class="tiny">选择问题类型</text>
        <view class="chips mt8">
          <view
            v-for="t in reportTypes"
            :key="t.key"
            class="chip"
            :class="{ 'is-on': reportType === t.key }"
            @click="reportType = t.key"
          >
            <text>{{ t.label }}</text>
          </view>
        </view>

        <text v-if="reportType === 'wrong_location'" class="form-label mt16">新位置坐标（lng,lat）</text>
        <view v-if="reportType === 'wrong_location'" class="row" style="gap: 8px">
          <input v-model="reportCoord" class="input grow" placeholder="如 117.227200,31.820600" placeholder-class="ph" />
          <view class="btn btn--line btn--sm" @click="pickReportCoord">选点</view>
        </view>

        <text class="form-label mt16">补充说明（选填）</text>
        <textarea
          v-model="reportNote"
          class="textarea"
          maxlength="500"
          placeholder="描述发现的问题，便于管理员核实"
          placeholder-class="ph"
        />

        <view class="notice notice--warn mt12">
          <AppIcon name="shield-check" :size="15" color="#8E6210" />
          <text class="grow">提交后会进入人工核实，恶意举报可能影响账号信用。</text>
        </view>
        <view class="btn btn--accent btn--block btn--lg mt12" :class="{ 'is-loading': reportSubmitting }" @click="submitReport">
          <text>提交</text>
        </view>
      </view>
    </template>

    <!-- 全局：底部标签栏 + 全局浮层（登录/解锁/弹窗），固定在页面根节点末尾 -->
    <AppTabBar page="spot-detail" />
    <AppOverlays />
  </view>
</template>

<script>
/* 钓点详情页
 * 路由参数：id —— 钓点 ID（缺省 's1'）
 * 数据接口：Api.fetchSpot(id) 详情、Api.fetchSpots({}) 相似钓点、Api.toggleFavorite 收藏、Api.postComment 发表评价
 * 关键交互：图集切换/大图预览、收藏、复制位置、会员解锁天气、发表带图评价、评论点赞
 * 业务限制：评价正文必填且 ≤300 字、实景图 ≤3 张；该塘无实景图时，后端以首条评论图作为封面
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppTabBar from '../../components/AppTabBar.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Rating from '../../components/Rating.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'
import { mediaUrl } from '../../common/request.js'
import { ratingText } from '../../common/utils.js'

export default {
  components: { AppBar, AppIcon, AppTabBar, AppOverlays, Rating },
  data() {
    return {
      loading: true, // 首屏骨架开关：请求返回后关闭
      spotId: 's1', // 钓点 ID，来自路由参数 ?id=，缺省 s1（演示数据）
      S: { comments: [], fish: [], gallery: [] }, // 钓点详情：名称/评分/评论/鱼种/图集/坐标/注意事项等
      similar: [], // 相似钓点：排除自身后取前 3 条
      gi: 0, // 当前图集索引，0 表示首图
      likes: {}, // 评论点赞数缓存 { 评论id: 数量 }
      liked: {}, // 当前用户点赞态缓存 { 评论id: boolean }
      publishOpen: false, // 发表评价弹层显隐
      rating: 5, // 打星评分，取值 1~5
      text: '', // 评价正文，最长 300 字
      picks: [], // 待上传实景图临时路径，最多 3 张
      submitting: false, // 发布请求中，防止重复提交
      uploadTip: '', // 评论图片上传进度文案
      // 评论分页：首次 page=1，触底 / 按钮继续加载
      commentsPage: 1,
      commentsTotal: 0,
      commentsHasMore: false,
      commentsLoading: false,
      // 纠错 / 举报弹层
      reportOpen: false,
      reportType: '',
      reportNote: '',
      reportCoord: '',
      reportSubmitting: false,
      // 钓况反馈：yes/no 人数、当前用户投票（同一用户可改选）
      fishability: { yes: 0, no: 0, myVote: null, limit: 5 },
      voting: false,
      reportTypes: [
        { key: 'wrong_location', label: '位置不对' },
        { key: 'prohibited', label: '已禁钓' },
        { key: 'dry', label: '已干涸' },
        { key: 'fee_changed', label: '收费变化' },
        { key: 'duplicate', label: '重复' },
        { key: 'other', label: '其他' }
      ]
    }
  },
  computed: {
    /** 图集数据源：优先 gallery，缺省用 cover 兜底，都无则为空数组
     * @returns {string[]} 可预览的图片地址列表
     */
    gallery() {
      const S = this.S
      if (S.gallery && S.gallery.length) return S.gallery
      return S.cover ? [S.cover] : []
    },
    /** 当前大图地址（相对路径补全），索引越界时返回空串（模板走占位块）
     * @returns {string}
     */
    heroImg() { return this.imgUrl(this.gallery[this.gi] || '') },
    /** 封面来源：'comment' 评论实景 / 'none' 无图 / '' 官方实景
     * @returns {string}
     */
    coverFrom() {
      if (this.S.coverFrom) return this.S.coverFrom
      return this.S.cover ? '' : 'none'
    },
    /** 顶部封面提示文案：评论实景时带出 @用户，无图时引导上传，官方实景返回空串不展示
     * @returns {string}
     */
    coverNotice() {
      const cf = this.coverFrom
      if (cf === 'comment') {
        let who = ''
        const list = this.S.comments || []
        for (let i = 0; i < list.length; i++) {
          if (list[i].images && list[i].images.indexOf(this.S.cover) > -1) { who = list[i].user; break }
        }
        if (!who && list[0]) who = list[0].user
        return '该钓点暂无实景图，封面取自钓友评论实景（@' + (who || '钓友') + '）'
      }
      if (cf === 'none') return '暂无实景图，欢迎上传第一张实景'
      return ''
    },
    /** 提示图标：无图用相机，其余用图片图标
     * @returns {string} AppIcon 名称
     */
    coverNoticeIcon() { return this.coverFrom === 'none' ? 'camera' : 'image' },
    /** 水深文本：去掉后端返回的「水深」前缀，只留数值部分
     * @returns {string}
     */
    waterDepth() { return String(this.S.water || '').replace(/^水深\s*/, '') },
    /** 收藏状态，来自本地 Store（登录后与后端同步）
     * @returns {boolean}
     */
    fav() { return Store.isFavorite(this.S.id) },
    /** 天气功能是否锁定（非会员即锁定）
     * @returns {boolean}
     */
    weatherLocked() { return !Store.isUnlocked('weather') },
    /** 所有评论所带实景图的总数，用于「实景图 N 张」展示
     * @returns {number}
     */
    imgCount() {
      let n = 0
      ;(this.S.comments || []).forEach(c => { if (c.images) n += c.images.length })
      return n
    },
    /** 钓况反馈提示文案：展示当前「无法作钓」人数与触发隐藏的剩余人数 */
    fishabilityHint() {
      const f = this.fishability || {}
      if (!f.no) return '还没有钓友反馈，欢迎投票帮助其他钓友判断'
      const left = Math.max(0, (f.limit || 5) - f.no)
      if (!left) return '已有 ' + f.no + ' 位钓友反馈无法作钓，该钓点将不再展示'
      return '已有 ' + f.no + ' 位钓友反馈无法作钓，再有 ' + left + ' 人反馈将不再展示'
    }
  },
  /**
   * 读取路由参数并拉取详情
   * @param {Object} options 页面参数，options.id 为钓点 ID
   */
  onLoad(options) {
    this.spotId = (options && options.id) || 's1'
    this.load()
  },
  /** 触底自动加载下一页评论 */
  onReachBottom() {
    this.loadMoreComments()
  },
  methods: {
    // 模板中使用的 utils 函数必须挂到 methods：小程序端非内联渲染无法直接访问模块内导入
    ratingText,
    /**
     * 通用页面跳转
     * @param {string} url 目标页面路径（可带查询串）
     */
    go(url) { nav(url) },
    /**
     * 打开指定钓点详情
     * @param {string} id 钓点 ID
     */
    openSpot(id) { nav('/pages/spot-detail/spot-detail?id=' + encodeURIComponent(id)) },
    /**
     * 并行加载钓点详情与钓点列表，用列表推导相似钓点
     * 详情失败：结束骨架并提示；列表失败：仅缺少相似推荐，不影响主内容
     */
    load() {
      this.loading = true
      Promise.all([
        Api.fetchSpot(this.spotId),
        Api.fetchSpots({}),
        Api.fetchSpotComments(this.spotId, 1, 20)
      ]).then(res => {
        if (res[0].code !== 0 || !res[0].data) { this.loading = false; ui.toast(res[0].msg || '钓点加载失败', 'alert-triangle'); return }
        this.S = res[0].data
        // 钓况反馈统计（yes/no 人数 + 当前用户投票）
        this.fishability = res[0].data.fishability || { yes: 0, no: 0, myVote: null, limit: 5 }
        // 详情接口已带评论，先以它为兜底；评论分页接口成功后覆盖第一页
        this.applyComments(res[2], 1)
        // 同步收藏状态到本地，保证收藏按钮与后端一致
        if (this.S.favorited != null) Store.setFavorite(this.S.id, !!this.S.favorited)
        // 相似钓点：排除当前钓点后取前 3 条（不再按距离排序）
        const list = (res[1].data || []).filter(x => x.id !== this.S.id)
        this.similar = list.slice(0, 3)
        this.loading = false
      })
    },
    /** 图片地址补全（本地 /static/uploads 相对路径 -> 服务端绝对地址） */
    imgUrl(u) { return mediaUrl(u) },
    /**
     * 应用评论接口结果（兼容旧数组契约）
     * @param {{code:number,data:*}} res 评论接口返回
     * @param {number} page 请求页码
     */
    applyComments(res, page) {
      const fallback = (this.S && this.S.comments) || []
      if (res.code !== 0 || !res.data) {
        if (page === 1) {
          this.S.comments = fallback
          this.commentsTotal = fallback.length
          this.commentsHasMore = false
        }
        return
      }
      if (Array.isArray(res.data)) {
        this.S.comments = res.data.slice()
        this.commentsPage = 1
        this.commentsTotal = res.data.length
        this.commentsHasMore = false
        return
      }
      const list = res.data.list || []
      if (page === 1) {
        this.S.comments = list.slice()
      } else {
        // 追加时按 id 去重：期间新发评论会让后端偏移量后移，避免出现重复项
        const cur = this.S.comments || []
        const seen = {}
        cur.forEach(c => { seen[c.id] = 1 })
        this.S.comments = cur.concat(list.filter(c => !seen[c.id]))
      }
      this.commentsPage = res.data.page || page
      this.commentsTotal = res.data.total != null ? res.data.total : this.S.comments.length
      this.commentsHasMore = this.S.comments.length < this.commentsTotal
    },
    /** 加载更多评论（底部按钮 / 触底） */
    async loadMoreComments() {
      if (this.commentsLoading || !this.commentsHasMore) return
      this.commentsLoading = true
      const res = await Api.fetchSpotComments(this.spotId, this.commentsPage + 1, 20)
      this.commentsLoading = false
      if (res.code !== 0) { ui.toast(res.msg || '评论加载失败', 'alert-triangle'); return }
      this.applyComments(res, this.commentsPage + 1)
    },
    /**
     * 预览图集大图
     * @param {number} i 起始图片索引
     */
    previewImage(i) {
      if (!this.gallery.length) return
      const urls = this.gallery.map(mediaUrl)
      uni.previewImage({ urls, current: urls[i] })
    },
    /**
     * 预览单条评论的实景图
     * @param {string[]} images 该评论图片列表
     * @param {number} i 起始索引
     */
    previewComment(images, i) {
      const urls = (images || []).map(mediaUrl)
      uni.previewImage({ urls, current: urls[i] })
    },
    /** 切换收藏状态，成功按结果提示并同步本地 Store */
    toggleFav() {
      Api.toggleFavorite(this.S.id).then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '操作失败，请重试', 'alert-triangle'); return }
        const on = !!res.data.favorited
        Store.setFavorite(this.S.id, on)
        this.S.favorited = on
        ui.toast(on ? '已收藏该钓点' : '已取消收藏', 'heart')
      })
    },
    /** 复制「地址 + 坐标」，便于粘贴到第三方地图搜索 */
    copyLoc() {
      ui.copy(this.S.address + ' ' + this.S.coord, '已复制，可粘贴到高德 / 百度 / 腾讯地图导航')
    },
    /** 解析 "lng,lat" 坐标串 */
    parseCoord(coord) {
      const parts = String(coord || '').split(',')
      if (parts.length !== 2) return null
      const lng = Number(parts[0])
      const lat = Number(parts[1])
      if (!isFinite(lng) || !isFinite(lat)) return null
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
      return { lng, lat }
    },
    /** 唤起系统地图导航 */
    doNav() {
      const p = this.parseCoord(this.S.coord)
      if (!p) { ui.toast('该钓点暂无有效坐标，无法导航', 'alert-triangle'); return }
      uni.openLocation({
        latitude: p.lat,
        longitude: p.lng,
        name: this.S.name || '钓点',
        address: this.S.address || '',
        scale: 16,
        fail: () => ui.toast('打开导航失败，请检查定位权限或地图应用', 'alert-triangle')
      })
    },
    /**
     * 评论点赞 / 取消点赞
     * @param {string} id 评论 ID
     */
    toggleLike(id) {
      if (this.liked[id]) {
        this.liked[id] = false
        this.likes[id] = Math.max(0, (this.likes[id] || 0) - 1)
      } else {
        this.liked[id] = true
        this.likes[id] = (this.likes[id] || 0) + 1
      }
      // likes/liked 为对象字面量，需触发响应式
      this.likes = Object.assign({}, this.likes)
      this.liked = Object.assign({}, this.liked)
    },
    /** 会员解锁校验：通过后跳转天气页，取消则停留原页 */
    async unlockWeather() {
      const ok = await ui.requireUnlock({
        feature: 'weather',
        title: '开通会员查看钓鱼天气',
        sub: '开通会员即可无限次查看钓鱼天气与鱼情研判，全程无广告',
        featureLabel: '钓鱼天气查询'
      })
      if (ok) nav('/pages/weather/weather')
    },
    /**
     * 反馈是否可正常作钓（同一用户可改选）
     * 达到阈值后后端会返回 hidden=true，提示该钓点将不再展示
     * @param {'yes'|'no'} verdict yes=可以作钓 / no=无法作钓
     */
    async voteFishable(verdict) {
      if (this.voting) return
      if (!Store.isLoggedIn) { ui.toast('登录后才能反馈钓况', 'alert-triangle'); ui.toLogin(); return }
      if (this.fishability.myVote === verdict) return
      this.voting = true
      const res = await Api.reportFishability(this.S.id, verdict)
      this.voting = false
      if (res.code !== 0 || !res.data) { ui.toast(res.msg || '反馈失败，请重试', 'alert-triangle'); return }
      this.fishability = {
        yes: res.data.yes || 0,
        no: res.data.no || 0,
        myVote: res.data.myVote || verdict,
        limit: res.data.limit || 5
      }
      if (res.data.hidden) ui.toast('已有 5 位钓友反馈无法作钓，该钓点将不再展示', 'alert-triangle')
      else ui.toast(verdict === 'no' ? '已反馈无法作钓' : '已反馈可以作钓', 'circle-check')
    },
    /** 打开纠错 / 举报弹层（默认不选类型，需用户主动选择） */
    openReport() {
      this.reportType = ''
      this.reportNote = ''
      this.reportCoord = ''
      this.reportOpen = true
    },
    /** 位置纠错时用地图选点回填新坐标 */
    pickReportCoord() {
      if (typeof uni.chooseLocation !== 'function') {
        ui.toast('当前环境不支持地图选点，请手动填写坐标', 'alert-triangle')
        return
      }
      uni.chooseLocation({
        success: res => {
          const lng = Number(res.longitude)
          const lat = Number(res.latitude)
          if (!isFinite(lng) || !isFinite(lat)) { ui.toast('选点坐标无效，请重试', 'alert-triangle'); return }
          this.reportCoord = lng.toFixed(6) + ',' + lat.toFixed(6)
        },
        fail: () => ui.toast('地图选点未完成，可手动填写坐标', 'alert-triangle')
      })
    },
    /** 提交纠错 / 举报 */
    async submitReport() {
      if (this.reportSubmitting) return
      if (!this.reportType) { ui.toast('请选择问题类型', 'alert-triangle'); return }
      const coord = String(this.reportCoord || '').replace(/，/g, ',').trim()
      if (this.reportType === 'wrong_location') {
        if (!this.parseCoord(coord)) { ui.toast('请填写有效的新坐标（lng,lat）', 'alert-triangle'); return }
      }
      this.reportSubmitting = true
      const payload = {
        spot_id: this.S.id,
        report_type: this.reportType,
        photos: [],
        note: String(this.reportNote || '').trim()
      }
      if (this.reportType === 'wrong_location' && coord) payload.proposed_coord = coord
      const res = await Api.reportSpot(payload)
      this.reportSubmitting = false
      if (res.code !== 0) { ui.toast(res.msg || '提交失败，请重试', 'alert-triangle'); return }
      this.reportOpen = false
      this.reportType = ''
      this.reportNote = ''
      this.reportCoord = ''
      ui.toast('已提交，感谢你的反馈', 'circle-check')
    },
    /**
     * 选择实景图，按剩余名额（3 - 已选）限制单次可选数量
     * 用户拒绝相册/相机授权时给出提示
     */
    addPick() {
      const remain = 3 - this.picks.length
      if (remain <= 0) return
      uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: res => {
          const paths = res.tempFilePaths || []
          paths.forEach(p => { if (this.picks.length < 3) this.picks.push(p) })
        },
        fail: () => ui.toast('请授权相册后再上传图片', 'alert-triangle')
      })
    },
    /**
     * 移除指定位置的待上传图片
     * @param {number} i 图片索引
     */
    removePick(i) {
      this.picks.splice(i, 1)
    },
    /**
     * 发布评价：校验正文非空且未在提交中 → 提交 → 本地插入评论并同步计数
     * 该塘原本无实景图时，首图会回填为封面（与后端规则保持一致）
     */
    async submit() {
      const text = String(this.text || '').trim()
      if (!text) { ui.toast('请先填写评价内容', 'alert-triangle'); return }
      if (this.submitting) return
      this.submitting = true
      // 先逐张上传本地图片，拿到 /static 地址后再发布评论
      const images = []
      for (let i = 0; i < this.picks.length; i++) {
        this.uploadTip = '图片上传中 ' + (i + 1) + '/' + this.picks.length
        const up = await Api.uploadSpotImage(this.picks[i], percent => {
          this.uploadTip = '图片上传中 ' + (i + 1) + '/' + this.picks.length + ' · ' + percent + '%'
        })
        if (up.code !== 0 || !up.data || !up.data.url) {
          this.submitting = false
          this.uploadTip = ''
          ui.toast(up.msg || '图片上传失败，请重试', 'alert-triangle')
          return
        }
        images.push(up.data.url)
      }
      this.uploadTip = ''
      const res = await Api.postComment(this.S.id, { text, images, rating: this.rating })
      this.submitting = false
      if (res.code !== 0 || !res.data) { ui.toast(res.msg || '评论发布失败，请重试', 'alert-triangle'); return }
      const c = res.data
      if (!Array.isArray(this.S.comments)) this.S.comments = []
      this.S.comments.unshift(c)
      this.S.commentCount = (this.S.commentCount || 0) + 1
      this.commentsTotal = (this.commentsTotal || 0) + 1
      this.likes[c.id] = 0
      // 该塘原本没有实景图时，这条评论的图会成为封面（与后端 post_comment 的规则一致）
      if ((!this.S.cover || this.S.coverFrom === 'none') && c.images && c.images.length) {
        this.S.cover = c.images[0]
        this.S.coverFrom = 'comment'
        this.S.gallery = [c.images[0]]
      }
      this.publishOpen = false
      this.text = ''
      this.picks = []
      this.rating = 5
      ui.toast('评论发布成功', 'circle-check')
    }
  }
}
</script>

<style>
.metric__v--sm { font-size: 14px; }
.rating-big { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1; }
.avatar__t2 { color: #fff; font-weight: 700; font-size: 14px; }
/* 横滑相似钓点卡片：固定宽度且不参与 flex 收缩，保证卡片等宽排列 */
.sim-card { width: 152px; flex: none; }
.sim-card__img { width: 100%; height: 92px; }
.sim-card__ph { width: 100%; height: 92px; background: var(--grad-water); display: flex; align-items: center; justify-content: center; }
/* 弹层内文本域：改用二级背景，与抽屉底色区分 */
.sheet .textarea { background: var(--c-surface-2); }
/* 纠错入口：暖色提示条，弱化但可发现 */
.report-link {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; padding: 8px 10px;
  border-radius: var(--r-sm);
  background: #FCF3E0; color: #8E6210;
  font-size: 12px;
}
/* 评论加载更多 */
.load-more {
  display: flex; align-items: center; justify-content: center;
  height: 40px; border-radius: var(--r-pill);
  background: var(--c-primary-l); color: var(--c-primary-d);
  font-size: 13px; font-weight: 600;
}
/* 钓况反馈：两个结论按钮用不同主色，选中后整块反白 */
.vote-btn { gap: 5px; }
.vote-btn__n { font-weight: 700; opacity: .78; }
.chip.vote-btn--no.is-on { background: #B4453A; border-color: #B4453A; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.form-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--c-ink-2); }
.ph { color: var(--c-ink-4); }
</style>
