<template>
  <view class="app-root"></view>
</template>

<script>
export default {
  onLaunch() {
    // 应用启动：数据层（Store/mock/api）在 common 模块首次引入时完成初始化
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
/* ==========================================================================
   渔获 AI · 钓鱼助手 —— 设计系统 / Design System（全局，唯一真源）
   风格：清晨野钓 · 静谧湖面（户外杂志感）
   说明：设计 token 挂在 .app 根容器上（跨端：微信小程序 / App / H5 均可继承）。
   所有页面必须复用本文件中的 token 与组件类，禁止自创色值 / 字号 / 圆角。
   ========================================================================== */

/* ---------- 1. Tokens（挂在根容器 .app 上，向后代继承） ---------- */
.app {
  --c-primary: #0F8B8D;
  --c-primary-d: #0A6A6C;
  --c-primary-l: #E5F4F4;
  --c-accent: #FF7A3D;
  --c-accent-d: #E8662B;
  --c-accent-l: #FFEFE6;
  --c-gold: #C08A2E;
  --c-gold-l: #FBF3E2;
  --c-ink: #12211F;
  --c-ink-2: #3D4F4D;
  --c-ink-3: #6E807E;
  --c-ink-4: #9AA9A7;
  --c-bg: #F4F7F6;
  --c-surface: #FFFFFF;
  --c-surface-2: #F8FAFA;
  --c-line: #E3EAE8;
  --c-line-soft: #EFF3F2;
  --c-success: #2E9E6B;
  --c-warn: #D9971A;
  --c-danger: #E5484D;

  --grad-water: linear-gradient(160deg, #128E90 0%, #0B5F72 100%);
  --grad-dawn: linear-gradient(135deg, #FFB06B 0%, #FF7A3D 100%);
  --grad-gold: linear-gradient(135deg, #E3B25E 0%, #C08A2E 100%);
  --grad-fade: linear-gradient(180deg, rgba(18,33,31,0) 0%, rgba(9,32,36,.82) 100%);

  --font-display: "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
  --font-body: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, -apple-system, sans-serif;
  --font-mono: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;

  --r-xs: 8px; --r-sm: 12px; --r-md: 16px; --r-lg: 22px; --r-xl: 28px; --r-pill: 999px;
  --sh-sm: 0 1px 2px rgba(18,33,31,.05), 0 1px 3px rgba(18,33,31,.04);
  --sh-md: 0 6px 20px rgba(11,95,114,.08);
  --sh-lg: 0 16px 40px rgba(11,95,114,.16);

  --tabbar-h: 64px;
  --app-w: 430px;

  position: relative;
  max-width: var(--app-w);
  margin: 0 auto;
  min-height: 100vh;
  background-color: var(--c-bg);
  background-image:
    radial-gradient(900px 600px at 12% -10%, #E8F3F1 0%, rgba(232,243,241,0) 60%),
    radial-gradient(800px 520px at 96% 4%, #FBEDE4 0%, rgba(251,237,228,0) 58%);
  font-family: var(--font-body);
  color: var(--c-ink);
  font-size: 14px;
  line-height: 1.55;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
page { background-color: #E9EEED; }

/* ---------- 2. Reset ---------- */
view, text, image, scroll-view, input, textarea, button, navigator { box-sizing: border-box; }
image { display: block; }
input, textarea, button { font-family: inherit; }
.ic { display: inline-block; vertical-align: middle; flex: none; }

/* ---------- 3. App Shell ---------- */
.app-main {
  min-height: 100vh;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 14px);
}

/* ---------- 4. 页面标题栏（属于页面内容，非 shell） ---------- */
.appbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 10px;
  height: 52px; padding: 0 14px;
  background: rgba(244,247,246,.9);
}
.appbar--solid { background: var(--c-surface); border-bottom: 1px solid var(--c-line); }
.appbar--transparent { background: transparent; }
.appbar__btn {
  width: 34px; height: 34px; flex: none;
  display: flex; align-items: center; justify-content: center;
  border: 0; background: rgba(255,255,255,.82); color: var(--c-ink);
  border-radius: var(--r-pill); box-shadow: var(--sh-sm);
}
.appbar__btn--hollow { background: rgba(9,32,36,.34); color: #fff; box-shadow: none; }
.appbar__title { font-size: 16px; font-weight: 600; letter-spacing: .3px; }
.appbar__spacer { flex: 1; }
.appbar__right { font-size: 13px; color: var(--c-primary); font-weight: 500; }

/* ---------- 5. 版式工具 ---------- */
.page { padding: 0 16px; }
.page--flush { padding: 0; }
.section { margin-top: 18px; }
.section__head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 2px 10px; }
.section__title { font-size: 16px; font-weight: 700; letter-spacing: .2px; }
.section__title em { font-style: normal; font-family: var(--font-display); }
.section__more { font-size: 12px; color: var(--c-ink-3); display: flex; align-items: center; gap: 2px; }
.h1 { font-family: var(--font-display); font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: .5px; }
.h2 { font-family: var(--font-display); font-size: 20px; font-weight: 700; }
.h3 { font-size: 15px; font-weight: 600; }
.muted { color: var(--c-ink-3); font-size: 12.5px; }
.tiny { font-size: 11px; color: var(--c-ink-4); }
.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.row { display: flex; align-items: center; gap: 8px; }
.row--between { justify-content: space-between; }
.col { display: flex; flex-direction: column; }
.grow { flex: 1; min-width: 0; }
.mt4 { margin-top: 4px; } .mt8 { margin-top: 8px; } .mt12 { margin-top: 12px; }
.mt16 { margin-top: 16px; } .mt24 { margin-top: 24px; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ---------- 6. 载入动效 ---------- */
@keyframes revealUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes sheetUp { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes glowSweep { 0% { transform: translateX(-120%) rotate(8deg); } 100% { transform: translateX(220%) rotate(8deg); } }
@keyframes pulseRing { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
@keyframes spin { to { transform: rotate(360deg); } }
.reveal { animation: revealUp .52s cubic-bezier(.2,.8,.3,1) both; animation-delay: calc(var(--d, 0) * 55ms); }

/* ---------- 7. 按钮 ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 42px; padding: 0 18px; border: 1px solid transparent;
  border-radius: var(--r-pill); font-size: 14px; font-weight: 600;
  background: var(--c-surface); color: var(--c-ink);
  transition: transform .14s ease, box-shadow .18s ease, background .18s ease, opacity .18s ease;
  box-shadow: var(--sh-sm);
}
.btn::after { border: 0; }
.btn:active { transform: scale(.97); }
.btn--primary { background: var(--grad-water); color: #fff; box-shadow: 0 8px 18px rgba(15,139,141,.28); }
.btn--accent { background: var(--grad-dawn); color: #fff; box-shadow: 0 8px 18px rgba(255,122,61,.3); }
.btn--gold { background: var(--grad-gold); color: #fff; box-shadow: 0 8px 18px rgba(192,138,46,.28); }
.btn--ghost { background: var(--c-primary-l); color: var(--c-primary-d); box-shadow: none; }
.btn--line { background: transparent; border-color: var(--c-line); color: var(--c-ink-2); box-shadow: none; }
.btn--danger { background: var(--c-danger); color: #fff; box-shadow: none; }
.btn--white { background: #fff; color: var(--c-primary-d); box-shadow: none; }
.btn--sm { height: 32px; padding: 0 12px; font-size: 12.5px; }
.btn--lg { height: 50px; font-size: 15.5px; }
.btn--block { display: flex; width: 100%; }
.btn[disabled], .btn.is-disabled { opacity: .45; pointer-events: none; }
.btn.is-loading { pointer-events: none; color: transparent; position: relative; }
.btn.is-loading::after {
  content: ''; position: absolute; left: 50%; top: 50%; margin: -8px 0 0 -8px;
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; animation: spin .7s linear infinite;
}

/* ---------- 8. 胶囊 / 标签 ---------- */
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  height: 28px; padding: 0 12px; border-radius: var(--r-pill);
  background: var(--c-surface); border: 1px solid var(--c-line);
  font-size: 12.5px; color: var(--c-ink-2);
  transition: all .16s ease; white-space: nowrap;
}
.chip:active { transform: scale(.96); }
.chip.is-on, .chip.is-active { background: var(--c-primary); border-color: var(--c-primary); color: #fff; font-weight: 600; }
.tag {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; line-height: 1.7;
}
.tag--primary { background: var(--c-primary-l); color: var(--c-primary-d); }
.tag--accent { background: var(--c-accent-l); color: var(--c-accent-d); }
.tag--gold { background: var(--c-gold-l); color: var(--c-gold); }
.tag--success { background: #E6F5EE; color: #1D7A50; }
.tag--warn { background: #FCF3E0; color: #A97410; }
.tag--mute { background: var(--c-line-soft); color: var(--c-ink-3); }
.tag--danger { background: #FDECEC; color: #C33236; }

/* ---------- 9. 卡片 ---------- */
.card {
  background: var(--c-surface);
  border: 1px solid var(--c-line);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-sm);
  overflow: hidden;
}
.card--pad { padding: 16px; }
.card--flat { box-shadow: none; }
.card--water { background: var(--grad-water); border-color: transparent; color: #fff; box-shadow: var(--sh-lg); }
.card--gold { background: var(--grad-gold); border-color: transparent; color: #fff; box-shadow: 0 12px 28px rgba(192,138,46,.26); }
.card__hd { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 0; }
.card__title { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.card__bd { padding: 12px 16px 16px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.hr { height: 1px; background: var(--c-line-soft); margin: 12px 0; }
.dashed { border-top: 1px dashed var(--c-line); }

/* ---------- 10. 首页 Hero ---------- */
.hero {
  position: relative; margin: 0; height: 232px; overflow: hidden;
  border-bottom-left-radius: var(--r-xl); border-bottom-right-radius: var(--r-xl);
}
.hero__img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.hero__mask { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(9,32,36,.34) 0%, rgba(9,32,36,.05) 42%, rgba(9,32,36,.78) 100%); }
.hero__top { position: absolute; top: 0; left: 0; right: 0; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
.hero__body { position: absolute; left: 16px; right: 16px; bottom: 16px; color: #fff; }
.hero__eyebrow { font-size: 11.5px; letter-spacing: 2px; text-transform: uppercase; opacity: .82; }
.hero__title { font-family: var(--font-display); font-size: 27px; font-weight: 700; line-height: 1.2; margin-top: 2px; text-shadow: 0 2px 14px rgba(0,0,0,.3); color: #fff; }
.hero__sub { font-size: 12.5px; opacity: .9; margin-top: 4px; color: #fff; }
.loc-pill {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px; border-radius: var(--r-pill);
  background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.36);
  color: #fff; font-size: 13px;
}
.avatar {
  border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: #fff; background: var(--grad-water);
  width: 36px; height: 36px; font-size: 14px;
}
.avatar--sm { width: 28px; height: 28px; font-size: 12px; }
.avatar--lg { width: 56px; height: 56px; font-size: 22px; font-family: var(--font-display); }

/* ---------- 11. 统计格 / 指标 ---------- */
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--c-line-soft); border-radius: var(--r-md); overflow: hidden; }
.stat { background: var(--c-surface); padding: 12px 6px; text-align: center; }
.stat__label { font-size: 11px; color: var(--c-ink-3); display: flex; align-items: center; justify-content: center; gap: 3px; }
.stat__val { font-family: var(--font-display); font-size: 21px; font-weight: 700; line-height: 1.3; margin-top: 2px; }
.stat__val small { font-size: 11px; font-family: var(--font-body); font-weight: 500; color: var(--c-ink-3); margin-left: 2px; }
.stat__hint { font-size: 10.5px; color: var(--c-ink-4); }
.metric {
  display: flex; flex-direction: column; gap: 2px;
  padding: 11px 12px; border-radius: var(--r-sm);
  background: var(--c-surface-2); border: 1px solid var(--c-line-soft);
}
.metric__k { font-size: 11px; color: var(--c-ink-3); display: flex; align-items: center; gap: 4px; }
.metric__v { font-size: 17px; font-weight: 700; font-family: var(--font-display); }
.metric__v small { font-size: 11px; font-weight: 500; color: var(--c-ink-3); font-family: var(--font-body); }
.bar { height: 6px; border-radius: var(--r-pill); background: var(--c-line-soft); overflow: hidden; }
.bar__fill { height: 100%; border-radius: var(--r-pill); background: var(--grad-water); transition: width .5s cubic-bezier(.2,.8,.3,1); }
.bar__fill--accent { background: var(--grad-dawn); }
.bar__fill--gold { background: var(--grad-gold); }

/* ---------- 12. 列表项 ---------- */
.item {
  display: flex; gap: 12px; padding: 12px;
  background: var(--c-surface); border: 1px solid var(--c-line);
  border-radius: var(--r-md); box-shadow: var(--sh-sm);
  transition: transform .16s ease, box-shadow .18s ease;
}
.item:active { transform: scale(.985); box-shadow: var(--sh-md); }
.item__thumb { width: 74px; height: 74px; border-radius: var(--r-sm); flex: none; background: var(--c-line-soft); }
.item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.item__title { font-size: 14.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.item__meta { font-size: 12px; color: var(--c-ink-3); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.item__meta span { display: inline-flex; align-items: center; gap: 3px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.cell {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: var(--c-surface);
}
.cell + .cell { border-top: 1px solid var(--c-line-soft); }
.cell__icon { width: 34px; height: 34px; border-radius: 10px; background: var(--c-primary-l); color: var(--c-primary-d); display: flex; align-items: center; justify-content: center; flex: none; }
.cell__icon--accent { background: var(--c-accent-l); color: var(--c-accent-d); }
.cell__icon--gold { background: var(--c-gold-l); color: var(--c-gold); }
.cell__t { font-size: 14px; font-weight: 500; }
.cell__d { font-size: 11.5px; color: var(--c-ink-4); }
.cell__arrow { color: var(--c-ink-4); }

/* ---------- 13. 分段控件 ---------- */
.segmented {
  display: flex; gap: 4px; padding: 4px; border-radius: var(--r-pill);
  background: var(--c-line-soft); position: relative;
}
.segmented__btn {
  flex: 1; height: 32px; border: 0; background: transparent; border-radius: var(--r-pill);
  font-size: 13px; color: var(--c-ink-3); transition: all .2s ease; white-space: nowrap;
  display: flex; align-items: center; justify-content: center;
}
.segmented__btn.is-on, .segmented__btn.is-active { background: var(--c-surface); color: var(--c-primary-d); font-weight: 600; box-shadow: var(--sh-sm); }
/* 横向滚动容器统一用 <scroll-view scroll-x>，内层 row 承担排布 */
.hscroll { width: 100%; white-space: nowrap; }
.hscroll__row { display: flex; gap: 8px; padding: 2px 0 4px; }
.hscroll__row .chip { flex: none; }

/* ---------- 14. 底部弹层 / 模态 ---------- */
.mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 90;
  background: rgba(9,32,36,.46);
  animation: fadeIn .2s ease both;
}
.sheet {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; z-index: 91;
  width: 100%; max-width: var(--app-w);
  background: var(--c-surface); border-radius: var(--r-xl) var(--r-xl) 0 0;
  padding: 8px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  animation: sheetUp .3s cubic-bezier(.2,.9,.3,1) both;
  max-height: 86vh; overflow-y: auto;
}
.sheet__grip { width: 40px; height: 4px; border-radius: 2px; background: var(--c-line); margin: 4px auto 12px; }
.sheet__title { font-size: 17px; font-weight: 700; margin-bottom: 12px; }
.modal-wrap {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 92;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  pointer-events: none;
}
.modal {
  pointer-events: auto; width: 100%; max-width: 340px;
  background: var(--c-surface); border-radius: var(--r-xl);
  box-shadow: var(--sh-lg); overflow: hidden;
  animation: popIn .28s cubic-bezier(.2,.9,.3,1) both;
}
.modal--wide { max-width: 360px; }
.modal__hd { padding: 20px 20px 0; text-align: center; }
.modal__title { font-family: var(--font-display); font-size: 19px; font-weight: 700; }
.modal__sub { font-size: 12.5px; color: var(--c-ink-3); margin-top: 6px; }
.modal__bd { padding: 16px 18px; }
.modal__text { display: block; font-size: 13.5px; color: var(--c-ink-2); line-height: 1.7; }
.modal__rows { display: flex; flex-direction: column; gap: 9px; }
.modal__row { font-size: 13px; }
.modal__row .k { color: var(--c-ink-3); }
.modal__row .v { font-weight: 600; }
.modal__ft { padding: 0 18px 18px; display: flex; flex-direction: column; gap: 9px; }
.modal__ft--top { padding-top: 16px; }

/* ---------- 15. 解锁弹窗（付费墙） ---------- */
.paywall__hero {
  background: var(--grad-water); color: #fff; padding: 22px 20px 18px; text-align: center; position: relative; overflow: hidden;
}
.paywall__hero::after {
  content: ''; position: absolute; top: -40%; left: -30%; width: 60%; height: 200%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.22), rgba(255,255,255,0));
  animation: glowSweep 3.4s ease-in-out infinite;
}
.paywall__icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
.paywall__title { font-family: var(--font-display); font-size: 19px; font-weight: 700; }
.paywall__sub { font-size: 12.5px; opacity: .88; margin-top: 4px; }
.icon-badge { display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.opt {
  position: relative; display: flex; align-items: center; gap: 12px;
  padding: 13px 14px; border: 1.5px solid var(--c-line); border-radius: var(--r-md);
  transition: all .18s ease; background: var(--c-surface);
}
.opt:active { transform: scale(.985); }
.opt.is-reco { border-color: var(--c-gold); background: linear-gradient(180deg, #FFFCF5, #FFF8EC); }
.opt__ic { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex: none; }
.opt__ic--ad { background: var(--c-primary-l); color: var(--c-primary-d); }
.opt__ic--pay { background: var(--c-accent-l); color: var(--c-accent-d); }
.opt__ic--member { background: var(--grad-gold); color: #fff; }
.opt__t { font-size: 14.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.opt__d { font-size: 11.5px; color: var(--c-ink-3); margin-top: 2px; }
.opt__price { font-family: var(--font-display); font-size: 17px; font-weight: 700; }
.reco-flag {
  position: absolute; top: -9px; right: 12px;
  background: var(--grad-dawn); color: #fff; font-size: 10.5px; font-weight: 700;
  padding: 2px 8px; border-radius: var(--r-pill); box-shadow: 0 3px 8px rgba(255,122,61,.4);
}

/* ---------- 16. 广告播放器 ---------- */
.ad-stage {
  border-radius: var(--r-lg); overflow: hidden; position: relative;
  background: #0E2830;
  color: #fff; padding: 20px; text-align: center;
}
.ad-stage__badge {
  position: absolute; top: 10px; left: 10px; font-size: 10px; letter-spacing: 1px;
  border: 1px solid rgba(255,255,255,.4); border-radius: 4px; padding: 1px 6px; opacity: .8;
}
.ad-stage__close { position: absolute; top: 8px; right: 10px; }
.ad-stage__body { padding: 6px 0 2px; }
.ad-stage__brand { font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: .5px; color: #fff; }
.ad-stage__slogan { font-size: 12.5px; opacity: .8; margin-top: 6px; color: #fff; }
.ad-ring { position: relative; width: 84px; height: 84px; margin: 14px auto 4px; border-radius: 50%; }
.ad-ring__hole {
  position: absolute; left: 5px; top: 5px; right: 5px; bottom: 5px;
  border-radius: 50%; background: #0E2830; display: flex; align-items: center; justify-content: center;
}
.ad-ring__num { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: #fff; }
.ad-dots { display: flex; gap: 5px; justify-content: center; margin-top: 12px; }
.ad-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.28); }
.ad-dot.is-done { background: #7FE3D2; }
.ad-dot.is-now { background: #fff; animation: pulseRing 1s ease-in-out infinite; }

/* ---------- 17. 渔获海报 ---------- */
.catch-poster {
  position: relative; border-radius: var(--r-xl); overflow: hidden;
  min-height: 400px; color: #fff; box-shadow: var(--sh-lg);
  animation: popIn .6s cubic-bezier(.2,.9,.3,1) both;
}
.catch-poster__bg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.catch-poster__mask { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(4,26,30,.34) 0%, rgba(4,26,30,.62) 52%, rgba(3,20,24,.94) 100%); }
.catch-poster__in { position: relative; padding: 20px 20px 22px; display: flex; flex-direction: column; min-height: 400px; }
.catch-poster__brand { font-size: 11px; letter-spacing: 2.5px; opacity: .78; text-transform: uppercase; color: #fff; }
.catch-poster__date { font-size: 12px; opacity: .8; margin-top: 2px; color: #fff; }
.catch-poster__level { font-family: var(--font-display); font-size: 62px; font-weight: 700; letter-spacing: 6px; line-height: 1.05; margin: 14px 0 0; text-shadow: 0 6px 26px rgba(0,0,0,.4); }
.catch-poster__level.is-explode { color: #FFB06B; }
.catch-poster__level.is-hot { color: #4FD9A4; }
.catch-poster__level.is-slow { color: #C3D2D1; }
.catch-poster__score { display: flex; align-items: baseline; gap: 4px; margin-top: 8px; }
.catch-poster__score b { font-family: var(--font-display); font-size: 30px; }
.catch-poster__score span { font-size: 12px; opacity: .78; }
.catch-poster__why { margin-top: 12px; font-size: 12.5px; line-height: 1.7; opacity: .92; }
.catch-poster__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.catch-poster__chips .pc {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.2);
}
.catch-poster__ft { margin-top: auto; padding-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.catch-poster__meter { height: 6px; border-radius: 3px; background: rgba(255,255,255,.2); overflow: hidden; flex: 1; }
.catch-poster__meter i { display: block; height: 100%; background: linear-gradient(90deg,#FFD98A,#FF7A3D); border-radius: 3px; transition: width .8s cubic-bezier(.2,.8,.3,1); }
.catch-poster__score-num { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: #fff; }
.catch-poster__score-lbl { font-size: 12px; opacity: .78; color: #fff; }
.catch-poster__meter-in { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg,#FFD98A,#FF7A3D); transition: width .8s cubic-bezier(.2,.8,.3,1); }
.catch-poster__updated { font-size: 11px; color: rgba(255,255,255,.7); }
.catch-poster__chips .pc { display: inline-block; }
.poster-actions { display: flex; gap: 10px; margin-top: 12px; }

/* ---------- 18. 时段轴 ---------- */
.slot-axis { width: 100%; white-space: nowrap; }
.slot-axis__row { display: flex; gap: 8px; padding: 4px 0 8px; }
.slot {
  flex: none; width: 82px; border-radius: var(--r-md); padding: 10px 9px;
  background: var(--c-surface); border: 1px solid var(--c-line); box-shadow: var(--sh-sm);
  display: flex; flex-direction: column; gap: 6px;
}
.slot.is-now { border-color: var(--c-primary); box-shadow: 0 0 0 2px var(--c-primary-l), var(--sh-sm); }
.slot__time { font-size: 11px; color: var(--c-ink-3); font-family: var(--font-mono); }
.slot__lvl { font-size: 13.5px; font-weight: 700; }
.slot__bar { height: 5px; border-radius: 3px; background: var(--c-line-soft); overflow: hidden; }
.slot__bar i { display: block; height: 100%; border-radius: 3px; }
.slot__p { font-size: 10.5px; color: var(--c-ink-4); }
.lvl-explode { color: #E8662B; } .lvl-hot { color: #1D9E6E; }
.lvl-fair { color: #A97410; } .lvl-slow { color: #6E807E; } .lvl-stop { color: #97A6B4; }
.bg-explode { background: var(--grad-dawn); } .bg-hot { background: linear-gradient(90deg,#7BE0B4,#25C08A); }
.bg-fair { background: linear-gradient(90deg,#F6D48A,#D9971A); } .bg-slow { background: #A9BBB9; } .bg-stop { background: #D3DEDC; }

/* ---------- 19. 签到 ---------- */
.checkin-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.day {
  border-radius: var(--r-md); padding: 10px 6px; text-align: center;
  background: var(--c-surface-2); border: 1px solid var(--c-line-soft);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.day.is-done { background: var(--c-primary-l); border-color: #BFE3E2; }
.day.is-today { background: var(--c-accent-l); border-color: #FFCFB4; box-shadow: 0 0 0 2px rgba(255,122,61,.16); }
.day__n { font-size: 10.5px; color: var(--c-ink-3); }
.day__ic { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--c-line-soft); color: var(--c-ink-4); }
.day.is-done .day__ic { background: var(--c-primary); color: #fff; }
.day.is-today .day__ic { background: var(--grad-dawn); color: #fff; }
.day__p { font-size: 11px; font-weight: 600; color: var(--c-ink-2); }
.day.is-bonus { background: var(--c-gold-l); border-color: #EBD6A8; }
.streak-strip { display: flex; gap: 6px; }
.streak-strip__cell { flex: 1; height: 6px; border-radius: 3px; background: var(--c-line-soft); }
.streak-strip__cell.is-on { background: var(--grad-dawn); }

/* ---------- 20. 会员权益表 ---------- */
.plan-cmp { border-radius: var(--r-md); overflow: hidden; border: 1px solid var(--c-line); }
.plan-cmp__row { display: grid; grid-template-columns: 1.15fr 1fr 1fr; align-items: center; }
.plan-cmp__row + .plan-cmp__row { border-top: 1px solid var(--c-line-soft); }
.plan-cmp__cell { padding: 12px 8px; font-size: 12.5px; text-align: center; }
.plan-cmp__cell:first-child { text-align: left; padding-left: 14px; color: var(--c-ink-2); }
.plan-cmp__hd .plan-cmp__cell { background: var(--c-surface-2); font-weight: 600; font-size: 12px; color: var(--c-ink-3); }
.plan-cmp__hd .plan-cmp__cell.is-member { background: var(--grad-gold); color: #fff; }
.price-card {
  border-radius: var(--r-lg); padding: 16px; position: relative; overflow: hidden;
  background: var(--c-surface); border: 1.5px solid var(--c-line); transition: all .18s ease;
}
.price-card.is-on { border-color: var(--c-gold); background: linear-gradient(180deg,#FFFCF5,#FFF7EA); box-shadow: 0 8px 22px rgba(192,138,46,.16); }
.price-card__price { font-family: var(--font-display); font-size: 30px; font-weight: 700; }
.benefit { display: flex; align-items: flex-start; gap: 10px; }
.benefit__ic { width: 30px; height: 30px; border-radius: 9px; background: var(--c-gold-l); color: var(--c-gold); display: flex; align-items: center; justify-content: center; flex: none; }

/* ---------- 21. 商城 ---------- */
.goods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.goods {
  background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--r-md);
  overflow: hidden; box-shadow: var(--sh-sm); transition: transform .16s ease;
}
.goods:active { transform: scale(.98); }
.goods__img { width: 100%; height: 176px; background: var(--c-surface-2); }
.goods__bd { padding: 9px 10px 11px; }
.goods__t { font-size: 13px; font-weight: 600; line-height: 1.4; }
.goods__tags { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.goods__price { display: flex; align-items: baseline; gap: 5px; margin-top: 7px; }
.goods__price b { color: var(--c-accent-d); font-size: 17px; font-family: var(--font-display); font-weight: 700; }
.goods__price b i { font-size: 11px; font-style: normal; }
.goods__price s { font-size: 11px; color: var(--c-ink-4); }
.goods__pts { font-size: 10.5px; color: var(--c-gold); margin-top: 3px; display: flex; align-items: center; gap: 3px; }
.gallery-hero { position: relative; height: 260px; }
.gallery-hero img { width: 100%; height: 100%; }
.gallery-hero__mask { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(9,32,36,.36), rgba(9,32,36,0) 40%); }
.gallery-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; white-space: nowrap; }
.gallery-strip::-webkit-scrollbar { display: none; }
.gallery-strip .gs-item { width: 84px; height: 64px; border-radius: var(--r-xs); flex: none; border: 2px solid transparent; }
.gallery-strip .gs-item.is-on { border-color: var(--c-primary); }

/* ---------- 22. 积分抵扣 ---------- */
.points-box {
  border-radius: var(--r-md); padding: 14px; background: var(--c-gold-l); border: 1px solid #EEDCB4;
}
.slider { width: 100%; }
.stepper { display: flex; align-items: center; gap: 10px; }
.stepper .stepper__btn {
  width: 30px; height: 30px; border-radius: 9px; border: 1px solid var(--c-line);
  background: var(--c-surface); display: flex; align-items: center; justify-content: center;
}
.stepper .stepper__btn.is-disabled { opacity: .4; }
.checkout-bar {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; z-index: 55;
  width: 100%; max-width: var(--app-w);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(255,255,255,.96);
  border-top: 1px solid var(--c-line); display: flex; align-items: center; gap: 12px;
}

/* ---------- 22.5 表单控件 ---------- */
.input, .textarea {
  width: 100%; border: 1px solid var(--c-line); border-radius: var(--r-sm);
  background: var(--c-surface-2); color: var(--c-ink); font-size: 14px;
  padding: 11px 13px;
}
.input--flush { height: 100%; flex: 1; min-width: 0; padding: 0 14px 0 0; border: 0; border-radius: 0; background: transparent; }
.input--lg { height: 50px; padding: 0 14px; }
.search-box {
  display: flex; align-items: center; gap: 8px; height: 44px; padding-left: 14px;
  border: 1px solid var(--c-line); border-radius: var(--r-pill); background: var(--c-surface); box-shadow: var(--sh-sm);
}
.search-box .ic { flex: none; }
.switch {
  width: 44px; height: 26px; border-radius: var(--r-pill); background: var(--c-line);
  display: inline-flex; align-items: center; padding: 3px; box-sizing: border-box;
  transition: background .18s;
}
.switch__dot { width: 20px; height: 20px; border-radius: 50%; background: var(--c-surface); box-shadow: var(--sh-sm); transition: transform .18s; }
.switch.is-on { background: var(--c-primary); }
.switch.is-on .switch__dot { transform: translateX(18px); }

/* ---------- 23. 评论 ---------- */
.comment { display: flex; gap: 10px; padding: 14px 0; }
.comment + .comment { border-top: 1px solid var(--c-line-soft); }
.comment__body { flex: 1; min-width: 0; }
.comment__name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.comment__text { font-size: 13.5px; color: var(--c-ink-2); margin-top: 5px; line-height: 1.6; }
.comment__imgs { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.comment__imgs .ci { width: 74px; height: 74px; border-radius: var(--r-xs); }
.comment__ft { display: flex; align-items: center; gap: 14px; margin-top: 8px; font-size: 11.5px; color: var(--c-ink-4); }
.publish-bar {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border: 1px solid var(--c-line); border-radius: var(--r-pill); background: var(--c-surface-2);
  color: var(--c-ink-4); font-size: 13px;
}
.uploader { display: flex; gap: 8px; flex-wrap: wrap; }
.uploader__item { width: 72px; height: 72px; border-radius: var(--r-xs); }
.uploader__wrap { position: relative; display: inline-block; }
.uploader__rm {
  position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%;
  background: rgba(18,33,31,.72); color: #fff; display: flex; align-items: center; justify-content: center;
}
.uploader__add {
  width: 72px; height: 72px; border-radius: var(--r-xs); border: 1px dashed var(--c-line);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  color: var(--c-ink-4); font-size: 10.5px; background: var(--c-surface-2);
}
.star-btn { padding: 2px; }
.rate { position: relative; display: inline-flex; align-items: center; }
.rate__layer { display: flex; flex: none; }
.rate__fg { position: absolute; left: 0; top: 0; overflow: hidden; }
.rate__v { font-size: 12px; color: var(--c-ink-2); margin-left: 4px; font-weight: 600; }

/* ---------- 23.5 底部导航 TabBar（自定义，跨端一致） ---------- */
.tabbar {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; z-index: 60;
  width: 100%; max-width: var(--app-w);
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  display: flex; align-items: flex-start;
  background: rgba(255,255,255,.94);
  border-top: 1px solid var(--c-line);
}
.tabbar__item {
  position: relative; flex: 1; height: var(--tabbar-h);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  color: var(--c-ink-4); transition: color .18s ease;
}
.tabbar__item.is-active { color: var(--c-primary-d); }
.tabbar__label { font-size: 11px; line-height: 1.2; }
.tabbar__item.is-active .tabbar__label { font-weight: 600; }
.tabbar__item.is-active::before {
  content: ''; position: absolute; top: 0; left: 50%; margin-left: -11px;
  width: 22px; height: 3px; border-radius: 0 0 3px 3px; background: var(--c-primary);
}

/* ---------- 24. Toast / 空状态 / 骨架 ---------- */
.toast {
  position: fixed; left: 50%; bottom: calc(var(--tabbar-h) + 44px);
  transform: translateX(-50%); z-index: 99; max-width: 300px;
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: var(--r-pill);
  background: rgba(18,33,31,.9); color: #fff; font-size: 13px; line-height: 1.4;
  box-shadow: var(--sh-lg); animation: fadeIn .18s ease both;
}
.toast text { color: #fff; }
.empty { text-align: center; padding: 44px 20px; color: var(--c-ink-4); }
.empty__ic { width: 60px; height: 60px; border-radius: 50%; background: var(--c-line-soft); color: var(--c-ink-4); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
.skel {
  background: linear-gradient(90deg, #EEF2F1 25%, #F7FAF9 37%, #EEF2F1 63%);
  background-size: 400% 100%; animation: shimmer 1.3s ease infinite; border-radius: var(--r-sm);
}
.spinner { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--c-line); border-top-color: var(--c-primary); animation: spin .8s linear infinite; }

/* ---------- 25. 其它 ---------- */
.notice {
  display: flex; align-items: flex-start; gap: 8px; padding: 11px 12px;
  border-radius: var(--r-sm); font-size: 12px; line-height: 1.6;
}
.notice--info { background: var(--c-primary-l); color: var(--c-primary-d); }
.notice--warn { background: #FCF3E0; color: #8E6210; }
.notice--gold { background: var(--c-gold-l); color: #8C6420; }
.copy-loc {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-radius: var(--r-sm); background: var(--c-surface-2); border: 1px dashed var(--c-line);
  font-size: 12.5px; color: var(--c-ink-2);
}
.member-ribbon {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #2A2A28, #4A4335); color: #F0D9A6;
  font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: var(--r-pill);
}
.lock-blur { filter: blur(6px); opacity: .55; pointer-events: none; }

/* ---------- 26. 最近 6 小时气压柱状图 ---------- */
.pbars { display: flex; align-items: flex-end; gap: 6px; height: 66px; margin-top: 12px; }
.pbars__i { flex: 1; border-radius: 5px 5px 2px 2px; background: var(--c-primary); }
.pbars__i.is-last { background: var(--c-accent); }

/* ---------- 27. 文本块级化（小程序 <text> 默认 inline，置于非 flex 容器时需显式块级） ---------- */
.h1, .h2, .h3,
.hero__eyebrow, .hero__title, .hero__sub,
.modal__title, .modal__sub, .modal__text,
.paywall__title, .paywall__sub,
.opt__t, .opt__d, .benefit__t, .benefit__d,
.sheet__title, .goods__t, .comment__text,
.ad-stage__brand, .ad-stage__slogan, .ad-tip, .ad-progress,
.metric__v, .stat__val, .empty__t { display: block; }

/* ---------- 28. 浮层补充 ---------- */
.tone-primary { background: var(--c-primary-l); }
.tone-gold { background: var(--c-gold-l); }
.tone-accent { background: var(--c-accent-l); }
.tone-success { background: #E6F5EE; }
.modal__icon { width: 52px; height: 52px; margin: 0 auto 10px; }
.pw-list { display: flex; flex-direction: column; gap: 10px; }
.modal__bd .notice { margin-top: 12px; }
.modal__bd .benefit { margin-top: 10px; }
.modal__bd .modal__rows { margin-top: 12px; }
.ad-tip { font-size: 11px; color: rgba(255,255,255,.72); }
.ad-progress { font-size: 11px; color: rgba(255,255,255,.65); margin-top: 8px; }
.loc-label { display: block; margin: 14px 2px 6px; }

/* ---------- 29. 图集 / 评论点赞 / 发布 ---------- */
.gallery-hero__img { width: 100%; height: 100%; }
.gallery-hero__ph { width: 100%; height: 100%; background: var(--grad-water); display: flex; align-items: center; justify-content: center; }
.gallery-strip { width: 100%; white-space: nowrap; }
.gallery-strip__row { display: flex; gap: 8px; padding-bottom: 4px; }
.gallery-strip .gs-item { display: block; flex: none; }
.hero-wrap { position: relative; }
.hero-strip-wrap { position: absolute; left: 0; right: 0; bottom: 10px; padding: 0 16px; z-index: 4; }
.hero-appbar { position: absolute; top: 0; left: 0; right: 0; z-index: 6; }
.like-btn { display: inline-flex; align-items: center; gap: 4px; color: var(--c-ink-4); font-size: 11.5px; }
.like-btn.is-on { color: var(--c-accent-d); }
.compose-text { min-height: 96px; width: 100%; }
.comment__imgs .ci { display: block; }
.copy-loc-col { flex-direction: column; align-items: stretch; gap: 10px; }
.heart-btn { gap: 4px; }


</style>
