'use strict';
/* 快捷列 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 快捷列：背包、好友、圖鑑隨時一鍵打開 ---------- */
function dockAct(k) {
  if (!ready || !me || authOpen) return;
  if (k === 'emo') openEmote();
  else if (k === 'bag') openBag();
  else if (k === 'fr') openFriends();
  else if (k === 'mail') openMail();
  else if (k === 'dex') openDex();
  else if (k === 'quest') openQuests();
  else if (k === 'lv') openLevels();
  else if (k === 'card') openCard(null);
  else if (k === 'set') openSettings();
  else if (k === 'tut') { if (tutI >= 0) { tutDone(true); } else tutStart(0); }
}
$('dock').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) dockAct(b.dataset.k); });
$('dock').addEventListener('pointerdown', e => e.stopPropagation());
/* 電腦版：快捷列可以收起來，只剩一顆小鈕，狀態會記住 */
/* 快捷列收起（電腦）或選單關著（手機）時，把好友／信箱／任務的通知數字加總，顯示在收起鈕上 */
function updateFoldBadge() {
  let n = 0;
  ['dockbadge', 'mailbadge', 'questbadge'].forEach(id => { const b = $(id); if (b && !b.hidden) n += parseInt(b.textContent, 10) || 0; });
  const txt = n > 99 ? '99+' : String(n), d = $('dock'), f = $('foldbadge'), m = $('menubadge');
  const folded = !!d && d.classList.contains('folded');
  if (f) { f.hidden = !(folded && n); f.textContent = txt; }
  if (m) { m.hidden = !n; m.textContent = txt; }
  const fb = $('dockfold'); if (fb) fb.classList.toggle('hasnew', folded && n > 0);
}
function setDockFold(on, save) {
  const d = $('dock'), b = $('dockfold');
  d.classList.toggle('folded', on);
  b.setAttribute('aria-expanded', on ? 'false' : 'true'); b.setAttribute('aria-label', on ? '展開快捷列' : '收起快捷列');
  b.querySelector('.di').textContent = on ? '◂' : '▸'; b.querySelector('small').textContent = on ? '展開' : '收起';
  updateFoldBadge();
  if (save) { try { localStorage.setItem('dw_dockfold', on ? '1' : '0'); } catch (e) { /* 略過 */ } }
}
$('dockfold').addEventListener('click', () => setDockFold(!$('dock').classList.contains('folded'), true));
try { if (localStorage.getItem('dw_dockfold') === '1') setDockFold(true, false); } catch (e) { /* 略過 */ }
