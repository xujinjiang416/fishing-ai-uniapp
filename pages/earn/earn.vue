<template>
  <view class="app">
    <view class="app-main">
      <AppBar title="看广告赚积分" back />

      <view class="page" style="padding-top: 4px">
        <!-- 区块：今日统计 / 水纹卡片展示已看条数、单条奖励与观看入口
             广告展示次数与时长由微信流量主组件控制，本页不做自定义限制 -->
        <view class="card card--water card--pad">
          <view class="row row--between" style="align-items: flex-start">
            <view>
              <text class="tiny white82" style="display: block">今日已看广告</text>
              <text class="big-num">{{ watched }}<text class="big-unit"> 条</text></text>
            </view>
            <view style="text-align: right">
              <text class="tiny white82" style="display: block">每条奖励</text>
              <text class="big-num">+{{ perAd }}<text class="big-unit"> 积分</text></text>
            </view>
          </view>

          <view class="row row--between mt12">
            <text class="tiny white82">今日已得 +{{ earnedToday }} 积分</text>
            <text class="tiny white82">积分永久有效</text>
          </view>

          <view class="btn btn--block btn--lg mt16 btn--white" @click="watch">
            <AppIcon name="play-circle" :size="18" color="#0A6A6C" />
            <text>立即观看（+{{ perAd }} 积分）</text>
          </view>
        </view>

        <!-- 区块：升级会员 / 仅非会员展示，套餐标题、价格、标签均来自后台配置
             注意事项：点击跳转会员页，不在此处直接下单 -->
        <view v-if="!isMember" class="card card--gold card--pad mt12">
          <view class="row row--between" style="align-items: flex-start">
            <view class="grow">
              <view class="row" style="gap: 6px">
                <text style="font-weight: 700; font-size: 15px; color: #fff">{{ memberTitle }}</text>
                <text v-if="memberPlan && memberPlan.tag" class="tag tag--glass">{{ memberPlan.tag }}</text>
              </view>
              <text class="tiny mt4 up-hint">{{ upHint }}</text>
            </view>
            <view class="btn btn--sm btn--white" @click="go('/pages/membership/membership')">
              <text>立即开通</text>
            </view>
          </view>
        </view>

        <!-- 区块：积分说明 / 列表展示积分用途与额度规则，底部展示当前积分与商城入口 -->
        <view class="card card--pad mt12">
          <view class="card__title" style="margin-bottom: 8px">
            <AppIcon name="coins" :size="16" color="#0A6A6C" />
            <text>积分怎么用</text>
          </view>
          <view v-for="g in guides" :key="g.t" class="row" style="gap: 10px; padding: 6px 0">
            <view class="cell__icon" :class="g.gold ? 'cell__icon--gold' : ''" style="width: 30px; height: 30px; border-radius: 9px">
              <AppIcon :name="g.ic" :size="16" :color="g.gold ? '#C08A2E' : '#0A6A6C'" />
            </view>
            <view class="grow">
              <text class="cell__t">{{ g.t }}</text>
              <text class="cell__d">{{ g.d }}</text>
            </view>
          </view>
          <view class="row row--between mt12">
            <view>
              <text class="tiny" style="display: block">当前积分</text>
              <view class="row" style="gap: 6px; align-items: baseline">
                <text class="blance-num">{{ points }}</text>
                <text class="tiny">可抵 ¥{{ money(usableYuan) }}</text>
              </view>
            </view>
            <view class="btn btn--line btn--sm" @click="go('/pages/shop/shop')">
              <AppIcon name="shopping-bag" :size="16" color="#3D4F4D" />
              <text>去商城</text>
            </view>
          </view>
        </view>

      </view>
    </view>

    <AppOverlays />
  </view>
</template>

<script>
/* 看广告赚积分页
 * 职责：通过观看激励视频获取积分，展示今日观看统计、可抵扣金额，并引导非会员开通会员。
 * 路由参数：无
 * 数据接口：
 *   Api.ensureConfig()  同步广告积分、积分汇率等后台配置
 *   Api.rewardAd()      观看完成后上报并发放积分
 * 关键交互：
 *   watch() 先播放广告（ui.singleAd），播放完成后调用领奖接口
 * 业务规则：
 *   - 广告展示次数与时长完全遵循微信流量主官方规范，系统不额外限制
 *   - 单条奖励取 Store.adPoints，禁止前端硬编码；积分永久有效
 *   - 积分抵扣：pointsPerYuan 积分 = 1 元，单笔最多抵 maxYuan，可足额抵至 0 元
 */
import AppBar from '../../components/AppBar.vue'
import AppIcon from '../../components/AppIcon.vue'
import AppOverlays from '../../components/AppOverlays.vue'
import Api from '../../common/api.js'
import Store from '../../common/state.js'
import { money } from '../../common/utils.js'
import * as ui from '../../common/ui.js'
import { nav } from '../../common/nav.js'

export default {
  components: { AppBar, AppIcon, AppOverlays },
  // 页面状态全部派生自全局 Store，无额外本地数据
  data() {
    return {}
  },
  computed: {
    // 当前积分余额
    points() { return Store.points },
    // 是否会员：决定会员升级卡片显隐
    isMember() { return Store.isMember },
    // 单次广告积分来自后台配置（禁止硬编码）
    perAd() { return Store.adPoints },
    // 今日已看条数（仅统计）
    watched() { return Store.adsWatchedToday },
    // 今日已获得积分 = 已看条数 × 单条积分
    earnedToday() { return this.watched * this.perAd },
    // 积分汇率：多少积分等于 1 元
    pointsPerYuan() { return Store.config.pointsPerYuan },
    /** 单笔全局抵扣上限（元），来自后台配置 */
    maxYuan() {
      const cap = (Store.config.pointsRules && Store.config.pointsRules.globalCap) || 1500
      return +(cap / this.pointsPerYuan).toFixed(2)
    },
    // 可抵扣金额（元）：按积分汇率换算，且不超过全局上限
    usableYuan() { return Math.min(this.maxYuan, this.points / this.pointsPerYuan) },
    // 展示用套餐（取后台配置的第一个套餐）
    memberPlan() { return (Store.plans && Store.plans[0]) || null },
    // 会员卡片标题：套餐信息取自后台配置
    memberTitle() {
      const p = this.memberPlan
      if (!p) return '开通会员'
      return '开通会员 · ¥' + money(p.price) + ' / ' + (p.durationLabel || '')
    },
    // 积分用途说明：汇率取后台配置，积分永久有效
    guides() {
      return [
        { ic: 'percent', gold: true, t: '商城积分抵扣', d: this.pointsPerYuan + ' 积分 = 1 元，单笔最多抵 ' + this.maxYuan + ' 元，积分充足可 0 元购' },
        { ic: 'play-circle', t: '广告与有效期', d: '完整观看广告即可获得积分；积分永久有效' }
      ]
    },
    // 升级引导文案：只宣传会员内容权益，不描述广告条数或时长
    upHint() { return '开通会员可无限次查天气与钓点，并享受全程无广告' }
  },
  onLoad() {
    // 同步后台广告积分配置（缓存过期会自动重新拉取）
    Api.ensureConfig()
  },
  methods: {
    // 暴露金额格式化工具给模板使用
    money,
    /**
     * 页面内跳转
     * @param {string} url 目标页面路径
     * @returns {void}
     */
    go(url) { nav(url) },
    /**
     * 观看广告并领取积分
     * @returns {Promise<void>}
     * 步骤：1) 播放微信流量主广告，用户中途关闭则不发奖
     *       2) 播放完成后调用领奖接口，成功则累加积分并 toast
     */
    async watch() {
      const ok = await ui.singleAd()
      if (!ok) return
      /* rewardAd 内部已调用 Store.addAdWatch()，此处不再重复计数 */
      Api.rewardAd().then(res => {
        if (res.code !== 0) { ui.toast(res.msg || '领取失败，请重试', 'alert-triangle'); return }
        const d = res.data || {}
        if (!d.points) return
        Store.addPoints(d.points)
        Api.track('ad_watch', { points: d.points, todayCount: d.todayCount }, 'earn')
        ui.toast('获得 ' + d.points + ' 积分', 'circle-check')
      })
    }
  }
}
</script>

<style>
.white82 { color: rgba(255, 255, 255, .82); }
.big-num { font-family: var(--font-display); font-size: 34px; font-weight: 700; line-height: 1.15; color: #fff; }
.big-unit { font-size: 15px; font-family: var(--font-body); font-weight: 500; }
.tag--glass { background: rgba(255, 255, 255, .22); color: #fff; }
.btn--white { background: #fff; color: #0A6A6C; box-shadow: none; }
.btn--white text { color: #0A6A6C; }
.up-hint { display: block; opacity: .92; color: #fff; }
.blance-num { font-family: var(--font-display); font-size: 21px; font-weight: 700; }
</style>
