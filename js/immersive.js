'use strict';
/* 手機沉浸模式與新手教學視覺指引 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
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
/* ---------- 新手教學的視覺指引：A 工具格子閃爍、B 目標位置跳動箭頭 ---------- */
const TUT_NEED = { till: ['hoe', '鋤頭'], plant: ['seed', '種子'], water: ['can', '水壺'], fish: ['rod', '釣竿'] };
let tutTgt = null;
const tutToolOk = (t, id) => !!t && t.id === id && (id !== 'seed' || have('s:' + t.crop) > 0);
function tutMark(el, tip) {   // 只在狀態改變時動 DOM，閃爍動畫才不會被重置
  const on = !!tip;
  if (el.classList.contains('tuthint') !== on) el.classList.toggle('tuthint', on);
  if (on) { if (el.getAttribute('data-tip') !== tip) el.setAttribute('data-tip', tip); }
  else if (el.hasAttribute('data-tip')) el.removeAttribute('data-tip');
}
function tutValid(ev, x, y) {
  const p = plots.get(pk(x, y));
  if (ev === 'till') return !p && farmable(x, y) && K[y][x] === G && !yardMap.has(pk(x, y)) && plots.size < plotCap();
  if (ev === 'plant') return !!p && !p.crop;
  if (ev === 'water') return !!p && !!p.crop && (world().wet || !isWet(p));
  if (ev === 'fish') return K[y][x] === WA;
  return false;
}
function tutPickTarget(ev) {
  if (scene !== 'farm') return null;
  if (ev === 'shop') return { k: 'shop', ev, x: 9 * T, y: 3 * T, w: 2 * T, h: 2 * T };
  if (ev === 'house') return { k: 'door', ev, x: 4 * T, y: 3 * T, w: T, h: T };
  if (!TUT_NEED[ev]) return null;
  if (tutTgt && tutTgt.ev === ev) {   // 目標還有效就不換，箭頭才不會跟著玩家亂跳
    const [kx, ky] = tutTgt.k.split(',').map(Number);
    if (tutValid(ev, kx, ky)) return tutTgt;
  }
  let best = null, bd = 1e9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!tutValid(ev, x, y)) continue;
    const d = Math.abs(x - pl.x) + Math.abs(y - pl.y);
    if (d < bd) { bd = d; best = { k: x + ',' + y, ev, x: x * T, y: y * T, w: T, h: T }; }
  }
  return best;
}
function tutSyncHint() {
  const ev = tutI >= 0 && tutI < TUT.length ? TUT[tutI].ev : null;
  const live = !!ev && ready && !paused();
  const need = live ? TUT_NEED[ev] : null;
  let slotAt = -1, slotTip = '', pageTip = '', hbTip = '';
  if (need && !tutToolOk(curTool(), need[0])) {
    const collapsed = imm && portraitNow() && !hbEl.classList.contains('open');
    slotAt = hot.findIndex(i => tutToolOk(TOOLS[i], need[0]));
    if (collapsed) hbTip = '點開選' + need[1];
    else if (slotAt >= 0) slotTip = '選' + need[1];
    else if (hotSets.some(set => set !== hot && set.some(i => tutToolOk(TOOLS[i], need[0])))) pageTip = '換組找' + need[1];
  }
  slots.forEach((s, i) => tutMark(s.el, i === slotAt ? slotTip : ''));
  tutMark(pgBtn, pageTip);
  tutMark(hbEl, hbTip);
  tutTgt = live ? tutPickTarget(ev) : null;
}
setInterval(tutSyncHint, 250);
/* 像素箭頭（預設朝下，9×8），其他方向用翻轉／轉置產生 */
const TUT_ARW = [[3, 0, 3, 3], [0, 3, 9, 1], [1, 4, 7, 1], [2, 5, 5, 1], [3, 6, 3, 1], [4, 7, 1, 1]];
function tutArrow(x, y, dir, col, line) {
  const paint = (ox, oy, c) => TUT_ARW.forEach(([a, b, w, h]) => {
    let X = a, Y = b, WW = w, HH = h;
    if (dir === 'up') Y = 8 - b - h;
    else if (dir === 'right') { X = b; Y = a; WW = h; HH = w; }
    else if (dir === 'left') { X = 8 - b - h; Y = a; WW = h; HH = w; }
    r(c, x + X + ox, y + Y + oy, WW, HH);
  });
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ox, oy]) => paint(ox, oy, line));
  paint(0, 0, col);
}
function tutDrawHint(now) {
  const t = tutTgt;
  if (!t || tutI < 0 || scene !== 'farm') return;
  const sc = imm ? view.s : S, vw = cv.width / sc, vh = cv.height / sc;
  const a = (0.55 + 0.4 * (0.5 + 0.5 * Math.sin(now / 260))).toFixed(2);
  const line = 'rgba(255,243,176,' + a + ')', edge = 'rgba(122,74,74,' + (a * 0.8).toFixed(2) + ')';
  r(edge, t.x - 1, t.y - 1, t.w + 2, 1); r(edge, t.x - 1, t.y + t.h, t.w + 2, 1);
  r(edge, t.x - 1, t.y, 1, t.h); r(edge, t.x + t.w, t.y, 1, t.h);
  r(line, t.x, t.y, t.w, 1); r(line, t.x, t.y + t.h - 1, t.w, 1);
  r(line, t.x, t.y + 1, 1, t.h - 2); r(line, t.x + t.w - 1, t.y + 1, 1, t.h - 2);
  const tcx = t.x + t.w / 2, tcy = t.y + t.h / 2, bob = Math.round(Math.abs(Math.sin(now / 280)) * 3);
  const outside = t.x + t.w < view.x || t.x > view.x + vw || t.y + t.h < view.y || t.y > view.y + vh;
  let ax, ay, dir;
  if (outside) {   // 目標在畫面外：在畫面邊緣放箭頭指方向
    const mx0 = view.x + 10, mx1 = view.x + vw - 24, my0 = view.y + 10, my1 = view.y + vh - 22;
    const dx = tcx - (view.x + vw / 2), dy = tcy - (view.y + vh / 2);
    if (Math.abs(dx) * vh > Math.abs(dy) * vw) {
      dir = dx > 0 ? 'right' : 'left'; ay = clamp(tcy - 4, my0, my1); ax = dir === 'right' ? mx1 + bob : mx0 - bob;
    } else {
      dir = dy > 0 ? 'down' : 'up'; ax = clamp(tcx - 4, mx0, mx1); ay = dir === 'down' ? my1 + bob : my0 - bob;
    }
  } else if (t.y - 12 < view.y + 4) { dir = 'up'; ax = tcx - 4; ay = t.y + t.h + 4 - bob; }
  else { dir = 'down'; ax = tcx - 4; ay = t.y - 12 + bob; }
  tutArrow(Math.round(ax), Math.round(ay), dir, '#ffe066', INK);
}
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
