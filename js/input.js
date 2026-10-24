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
let dpId = null, stickMag = 0, stickDir = null, fOrg = null;
/* 操作方式設定：浮動搖桿（手按哪裡搖桿就出現在哪裡）、點地面走過去。手機預設開，電腦預設關，設定裡可以改 */
const coarseMain = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
const loadFlag = (key, def) => { try { const v = localStorage.getItem(key); if (v === '1') return true; if (v === '0') return false; } catch (e) { /* 略過 */ } return def; };
let floatOn = loadFlag('dw_float', coarseMain), tapOn = loadFlag('dw_tap', coarseMain);
function applyCtl() { document.body.classList.toggle('fl', floatOn); }
applyCtl();
/* 浮動搖桿的外觀：只有按下去才出現，位置就是手指按下的地方 */
const FS_R = 64;
const fltEl = document.createElement('div');
fltEl.id = 'fstick'; fltEl.hidden = true; fltEl.innerHTML = '<div class="stick-base"></div><i class="stick-knob"></i>';
document.body.appendChild(fltEl);
const fltKnob = fltEl.querySelector('.stick-knob');
function dpSet(d) {
  DIRS4.forEach(x => { if (x !== d) release(x); });
  if (d && !paused() && pressed[pressed.length - 1] !== d) press(d);
  dpadEl.classList.toggle('on', !!d); fltEl.classList.toggle('on', !!d);
  if (!d) stickDir = null;
  if (dpId === null) { knobEl.style.transform = ''; fltKnob.style.transform = ''; stickMag = 0; fOrg = null; fltEl.hidden = true; }
}
function dpDir(e) {
  let R, dx, dy, kel;
  if (fOrg) { R = FS_R; dx = e.clientX - fOrg.x; dy = e.clientY - fOrg.y; kel = fltKnob; }
  else { const rc = dpadEl.getBoundingClientRect(); R = rc.width / 2; dx = e.clientX - (rc.left + R); dy = e.clientY - (rc.top + R); kel = knobEl; }
  const len = Math.hypot(dx, dy), travel = R * 0.5;
  const k = len > travel ? travel / len : 1;
  kel.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px)';
  if (len < R * 0.28) { stickMag = 0; stickDir = null; return null; }          // 死區（調大一點，手指輕輕放著不會亂動）
  stickMag = clamp((len - R * 0.28) / (R * 0.55), 0, 1);
  const ax = Math.abs(dx), ay = Math.abs(dy);
  const horiz = stickDir === 'left' || stickDir === 'right' ? ax * 1.3 >= ay
              : stickDir ? ax > ay * 1.3 : ax >= ay;
  stickDir = horiz ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  return stickDir;
}
const stepMs = () => ((dpId !== null && stickMag > 0) ? 240 - 100 * stickMag : STEP_MS) * (buffOn('swift') ? 0.8 : 1);   // 搖桿：輕推約 240ms 一步，推到底約 140ms 一步（鍵盤維持 120ms）
function fsStart(e, x, y) {
  if (dpId !== null) return;
  dpId = e.pointerId; fOrg = { x, y };
  fltEl.style.left = x + 'px'; fltEl.style.top = y + 'px'; fltEl.hidden = false;
  dpSet(dpDir(e));
}
dpadEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (dpId !== null) return;
  try { dpadEl.setPointerCapture(e.pointerId); } catch (_) {}
  if (floatOn && e.pointerType !== 'mouse') { fsStart(e, e.clientX, e.clientY); return; }   // 浮動模式：從按下的地方當中心，不用瞄準底盤
  dpId = e.pointerId;
  dpSet(dpDir(e));
});
/* 搖桿底下的空白處（動作鈕以外的左側）也能直接按 */
$('pad').addEventListener('pointerdown', e => {
  if (!floatOn || e.pointerType === 'mouse' || dpId !== null || (e.target.closest && e.target.closest('#actbtn,.dpad'))) return;
  const rc = $('pad').getBoundingClientRect();
  if (e.clientX > rc.left + rc.width * 0.6) return;
  e.preventDefault();
  try { $('pad').setPointerCapture(e.pointerId); } catch (_) {}
  fsStart(e, e.clientX, e.clientY);
});
/* 畫面手勢：左半邊按住（或拖一下）＝浮動搖桿；快速點一下＝走到那一格 */
let gest = null, gestTimer = 0;
const gestOK = () => ready && !!me && !paused() && !(scene === 'house' && edit.on);
cv.addEventListener('pointerdown', e => {
  if (gest || dpId !== null || e.isPrimary === false || !gestOK()) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const rc = cv.getBoundingClientRect();
  const fl = floatOn && e.pointerType !== 'mouse' && (e.clientX - rc.left) < rc.width * 0.55;
  if (!fl && !tapOn) return;
  gest = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), fl, stick: false, moved: false };
  if (!fl) return;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const go = () => { if (gest && !gest.stick && !gest.moved) { gest.stick = true; fsStart({ pointerId: gest.id, clientX: gest.x, clientY: gest.y }, gest.x, gest.y); } };
  if (tapOn) gestTimer = setTimeout(go, 200); else go();   // 有開點地面：超過 0.2 秒才算按住，之前放開就是「點一下」
});
function gestMove(e) {
  if (!gest || e.pointerId !== gest.id || gest.stick) return;
  if (Math.hypot(e.clientX - gest.x, e.clientY - gest.y) < 10) return;
  clearTimeout(gestTimer);
  if (gest.fl) { gest.stick = true; fsStart(e, gest.x, gest.y); } else gest.moved = true;
}
function gestEnd(e, type) {
  if (!gest || e.pointerId !== gest.id) return;
  clearTimeout(gestTimer);
  const g0 = gest; gest = null;
  if (type === 'pointerup' && !g0.stick && !g0.moved && tapOn && performance.now() - g0.t < (g0.fl ? 200 : 450) && gestOK()) tapMove(e);
}
window.addEventListener('pointermove', e => { gestMove(e); if (e.pointerId === dpId) dpSet(dpDir(e)); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => window.addEventListener(t, e => {
  if (t !== 'lostpointercapture') gestEnd(e, t);
  if (e.pointerId !== dpId) return;
  dpId = null; dpSet(null);
}));
['blur', 'orientationchange'].forEach(t => window.addEventListener(t, () => { dpId = null; gest = null; dpSet(null); }));   // 不再聽 resize：手機網址列收起來也會觸發 resize，會讓手指還按著、搖桿卻被放開
document.addEventListener('visibilitychange', () => { if (document.hidden) { dpId = null; gest = null; dpSet(null); } });
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
