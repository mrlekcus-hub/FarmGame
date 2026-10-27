'use strict';
/* 手機沉浸模式 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 手機沉浸模式：畫面鋪滿、鏡頭跟隨、介面閒置時淡出、選單上拉 ---------- */
const view = { s: S, x: 0, y: 0, snap: true, scene: '' };
const coarseMQ = window.matchMedia ? matchMedia('(pointer:coarse)') : null;
const wantImm = () => !!(coarseMQ && coarseMQ.matches && Math.min(window.innerWidth, window.innerHeight) < 700);
function fitView() {
  const want = wantImm();
  document.body.classList.toggle('imm', want);
  if (want !== imm) { imm = want; view.snap = true; if (!imm) setSide(false); }
  if (imm) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), rc = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(rc.width * dpr)), h = Math.max(1, Math.round(rc.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    view.s = Math.max(2, Math.round(Math.min(rc.width, rc.height) / 8 * dpr / T), Math.ceil(h / (H * T)), Math.ceil(w / (W * T)));
  } else {
    syncCanvasRows();
    view.s = S;
  }
}
window.addEventListener('resize', fitView);
window.addEventListener('orientationchange', () => setTimeout(fitView, 120));
if (coarseMQ && coarseMQ.addEventListener) coarseMQ.addEventListener('change', fitView);
/* 畫布的實際大小變了（登入畫面收起來、換角色、網址列縮放…）也重算一次縮放；用 rAF 合併，避免反覆觸發 */
if (window.ResizeObserver) { let fvRaf = 0; new ResizeObserver(() => { if (fvRaf) return; fvRaf = requestAnimationFrame(() => { fvRaf = 0; fitView(); }); }).observe(cv); }
let lastInputAt = performance.now();
const wakeUI = () => { lastInputAt = performance.now(); };
['pointerdown', 'pointermove', 'keydown', 'touchstart'].forEach(t => document.addEventListener(t, wakeUI, { passive: true }));
function idleTick(now) {
  chatTick();
  /* 商店、背包、圖鑑這些全頁視窗打開時，把搖桿、動作鈕、工具列、選單把手都藏起來，才不會蓋住視窗底下的按鈕 */
  const modal = imm && (lkOpen || bdOpen || ckOpen || rcOpen || mcOpen || mnOpen || dgOpen || lvOpen || cdOpen || dexOpen || qOpen || dsOpen || pnOpen || stOpen || trOpen || frOpen || mlOpen || snOpen || hwUi || bagOpen || shopOpen || makerOpen || authOpen || vmOpen || gmOpen || fOpen || syOpen);
  if (modal !== document.body.classList.contains('modal')) document.body.classList.toggle('modal', modal);
  const idle = imm && !sheetOpen && !pressed.length && now - lastInputAt > 3000;
  if (idle !== document.body.classList.contains('idle')) document.body.classList.toggle('idle', idle);
}
/* 把手：點一下開關；往上（直向）或往左（橫向）滑開；面板頂端的把手往下／往右滑關閉 */
function swipeOf(el, onSwipe) {
  let x0 = 0, y0 = 0, id = null;
  el.addEventListener('pointerdown', e => { id = e.pointerId; x0 = e.clientX; y0 = e.clientY; });
  el.addEventListener('pointerup', e => {
    if (e.pointerId !== id) return; id = null;
    const dx = e.clientX - x0, dy = e.clientY - y0, land = window.innerWidth > window.innerHeight;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    onSwipe(land ? dx : dy, land);
  });
}
swipeOf($('menubtn'), (d) => { if (d < -20) setSide(true); });
swipeOf($('grab'), (d) => { if (d > 24) setSide(false); });
swipeOf($('side'), (d, land) => { if (land && d > 40) setSide(false); });
$('immgrid').addEventListener('click', e => {
  const b = e.target.closest('button[data-k]');
  if (!b) return;
  setSide(false); dockAct(b.dataset.k);
});

/* 直向沉浸模式：工具列平常只留目前的工具，點一下展開六格，選好再收起來 */
const hbEl = $('hotbar'), portraitNow = () => window.innerHeight >= window.innerWidth;
function setHot(on) { hbEl.classList.toggle('open', !!on); }
hbEl.addEventListener('click', e => {
  if (!imm || !portraitNow()) return;
  if (e.target.closest && e.target.closest('.hbpage')) return;
  if (!hbEl.classList.contains('open')) { e.stopPropagation(); e.preventDefault(); setHot(true); }
  else setHot(false);
}, true);
document.addEventListener('pointerdown', e => { if (hbEl.classList.contains('open') && !hbEl.contains(e.target)) setHot(false); }, true);
fitView();

let last = performance.now();
function frame(now) {
  idleTick(now);
  const dt = Math.min(60, now - last);
  last = now;
  update(dt);
  draw(now);
  houseBarSync();
  requestAnimationFrame(frame);
}
