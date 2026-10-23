'use strict';
/* 輸入 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 輸入 ---------- */
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
const press = d => { const i = pressed.indexOf(d); if (i >= 0) pressed.splice(i, 1); pressed.push(d); };
const release = d => { const i = pressed.indexOf(d); if (i >= 0) pressed.splice(i, 1); };
window.addEventListener('keydown', e => {
  const tg = e.target && e.target.tagName;
  if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
  if (e.key === 'Escape' && lkOpen) { closeLekcus(); return; }
  if (e.key === 'Escape' && bdOpen) { closeBoard(); return; }
  if (e.key === 'Escape' && ckOpen) { closeKitchen(); return; }
  if (e.key === 'Escape' && dgOpen) { closeDlg(); return; }
  if (e.key === 'Escape' && rcOpen) { closeRanch(); return; }
  if (e.key === 'Escape' && mcOpen) { closeMerchant(); return; }
  if (e.key === 'Escape' && lvOpen) { closeLevels(); return; }
  if (e.key === 'Escape' && cdOpen) { closeCard(); return; }
  if (e.key === 'Escape' && qOpen) { closeQuests(); return; }
  if ((e.key === 'q' || e.key === 'Q') && qOpen) { closeQuests(); return; }
  if ((e.key === 'q' || e.key === 'Q') && !paused() && ready && me) { openQuests(); return; }
  if (e.key === 'Escape' && dexOpen) { closeDex(); return; }
  if ((e.key === 'g' || e.key === 'G') && dexOpen) { closeDex(); return; }
  if ((e.key === 'g' || e.key === 'G') && !paused()) { openDex(); return; }
  if (e.key === 'Escape' && bagOpen) { closeBag(); return; }
  if ((e.key === 'b' || e.key === 'B') && !paused()) { openBag(); return; }
  if ((e.key === 'b' || e.key === 'B') && bagOpen) { closeBag(); return; }
  if (e.key === 'Escape' && mlOpen) { closeMail(); return; }
  if (e.key === 'Escape' && frOpen) { closeFriends(); return; }
  if ((e.key === 'f' || e.key === 'F') && !paused() && ready && me) { openFriends(); return; }
  if ((e.key === 'm' || e.key === 'M') && !paused() && ready && me) { openMail(); return; }
  if (e.key === 'Escape' && shopOpen) { closeShop(); return; }
  if (e.key === 'Escape' && vmOpen) { closeVMenu(); return; }
  if (e.key === 'Escape' && gmOpen) { closeGM(); return; }
  if (e.key === 'Escape' && syOpen) { closeSty(); return; }
  if (e.key === 'Escape' && fOpen) { closeFShop(); return; }
  if (e.key === 'Escape' && trOpen) { closeTarot(); return; }
  if (e.key === 'Escape' && stOpen) { closeSettings(); return; }
  if (e.key === 'Escape' && dsOpen) { closeDisplay(); return; }
  if (e.key === 'Escape' && emOpen) { closeEmote(); return; }
  if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '')) {
    if (emOpen) closeEmote(); else if (!paused() && me) openEmote();
    return;
  }
  if (e.key === 'Escape' && makerOpen && !firstTime) { closeMaker(); return; }
  if (paused()) return;
  const d = KEYMAP[e.key];
  if (d) { e.preventDefault(); press(d); return; }
  if (e.key === 'Enter' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && chatOn()) { e.preventDefault(); openChat(true); return; }
  if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
    e.preventDefault();
    if (!e.repeat) actQueued = true;
    actHeld = true;
    return;
  }
  if (e.key === 'Tab' && ready && me && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (!e.repeat) setHotPage(hotPage + (e.shiftKey ? -1 : 1)); return; }
  if (e.key >= '1' && e.key <= '6') selectTool(+e.key - 1);
});
window.addEventListener('keyup', e => { const d = KEYMAP[e.key]; if (d) release(d); if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter') actHeld = false; });
window.addEventListener('blur', () => { pressed.length = 0; actHeld = false; });
/* 類比搖桿：圓鈕跟著手指（限制在底盤內），方向取主軸（帶遲滯避免斜推時抖動），
   推得越遠走得越快（格子制移動，所以「類比」體現在速度上）。多指可同時按動作鈕。 */
const dpadEl = document.querySelector('.dpad'), knobEl = $('knob'), DIRS4 = ['up', 'down', 'left', 'right'];
let dpId = null, stickMag = 0, stickDir = null;
function dpSet(d) {
  DIRS4.forEach(x => { if (x !== d) release(x); });
  if (d && !paused() && pressed[pressed.length - 1] !== d) press(d);
  dpadEl.classList.toggle('on', !!d);
  if (!d) stickDir = null;
  if (dpId === null) { knobEl.style.transform = ''; stickMag = 0; }
}
function dpDir(e) {
  const rc = dpadEl.getBoundingClientRect(), R = rc.width / 2;
  const dx = e.clientX - (rc.left + R), dy = e.clientY - (rc.top + R);
  const len = Math.hypot(dx, dy), travel = R * 0.5;
  const k = len > travel ? travel / len : 1;
  knobEl.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px)';
  if (len < R * 0.28) { stickMag = 0; stickDir = null; return null; }          // 死區（調大一點，手指輕輕放著不會亂動）
  stickMag = clamp((len - R * 0.28) / (R * 0.55), 0, 1);
  const ax = Math.abs(dx), ay = Math.abs(dy);
  const horiz = stickDir === 'left' || stickDir === 'right' ? ax * 1.3 >= ay
              : stickDir ? ax > ay * 1.3 : ax >= ay;
  stickDir = horiz ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  return stickDir;
}
const stepMs = () => ((dpId !== null && stickMag > 0) ? 290 - 140 * stickMag : STEP_MS) * (buffOn('swift') ? 0.8 : 1);   // 搖桿：輕推約 290ms 一步，推到底約 150ms 一步（鍵盤維持 120ms）
dpadEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (dpId !== null) return;
  dpId = e.pointerId;
  try { dpadEl.setPointerCapture(e.pointerId); } catch (_) {}
  dpSet(dpDir(e));
});
dpadEl.addEventListener('pointermove', e => { if (e.pointerId === dpId) dpSet(dpDir(e)); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => dpadEl.addEventListener(t, e => {
  if (e.pointerId !== dpId) return;
  dpId = null; dpSet(null);
}));
['blur', 'orientationchange', 'resize'].forEach(t => window.addEventListener(t, () => { dpId = null; dpSet(null); }));
document.addEventListener('visibilitychange', () => { if (document.hidden) { dpId = null; dpSet(null); } });
['pad', 'game'].forEach(id => $(id).addEventListener('contextmenu', e => e.preventDefault()));
/* iOS Safari 防縮放：它無視 user-scalable=no，所以要自己擋雙指縮放、雙擊放大 */
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault()));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now(), t = e.target, tg = t && t.tagName;
  const free = tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || (t.closest && t.closest('button,a,label'));
  if (now - lastTouchEnd < 350 && !free) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
/* 按下去才開出來的視窗（例如動作鈕）：手指放開時的 click 會落在剛長出來的視窗上，可能直接點到「先告辭」之類的按鈕而被關掉。
   只要這個視窗在「按下」那一刻還不存在，這一下 click 就吃掉；之後再點才算數。鍵盤觸發的 click 不受影響。 */
const OVERLAY_SEL = '.maker:not([hidden]), .stm:not([hidden])';
let downOverlays = null;
document.addEventListener('pointerdown', () => { downOverlays = new Set(document.querySelectorAll(OVERLAY_SEL)); }, true);
document.addEventListener('click', e => {
  if (!(e.pointerType || e.detail) || !downOverlays || !e.target.closest) return;   // 鍵盤觸發的 click 沒有 pointerType 也沒有 detail
  const m = e.target.closest('.maker, .stm');
  if (m && !downOverlays.has(m)) { e.stopPropagation(); e.preventDefault(); }
}, true);
['pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, e => { if (e.pointerId === actPtr) { actHeld = false; actPtr = -1; } }));
$('actbtn').addEventListener('pointerdown', e => { e.preventDefault(); actQueued = true; actHeld = true; actPtr = e.pointerId; if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {} });

/* 橫屏選單抽屜 + 全螢幕 */
const sideEl = $('side'), menuBtn = $('menubtn');
function setSide(on) { if (on) hbEl.classList.remove('open'); sideEl.classList.toggle('open', on); sheetOpen = on; document.body.classList.toggle('sheet', on && imm); menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) pressed.length = 0; }
menuBtn.addEventListener('click', () => setSide(!sideEl.classList.contains('open')));
$('sideclose').addEventListener('click', () => setSide(false));
$('game').addEventListener('pointerdown', () => { if (sideEl.classList.contains('open')) setSide(false); });
const fsBtn = $('fs'), docEl = document.documentElement;
if (docEl.requestFullscreen && document.fullscreenEnabled) {
  fsBtn.hidden = false;
  fsBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await docEl.requestFullscreen();
      if (orientPref !== 'auto') applyOrient(false);
    } catch (_) {}
  });
  document.addEventListener('fullscreenchange', () => { fsBtn.textContent = document.fullscreenElement ? '離開全螢幕' : '全螢幕'; });
}
