'use strict';
/* 浮動聊天 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 浮動聊天（手機與電腦共用）：最近訊息浮在畫面上；💬 或 / 開輸入列，快捷語一點就送；輸入框才會叫出鍵盤 ---------- */
const QUICK_CHAT = ['你好！', '一起來玩', '好可愛', '哈哈', '謝謝', '再見'];
const cFeed = $('cfeed'), cBar = $('cbar'), cFab = $('cfab'), cIn = $('cinput'), cForm = $('cform'), cQ = $('cq'), stageEl = document.querySelector('.stage');
const coarseNow = () => !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
let cOpen = false, cWas = false;
const chatOn = () => !vPanel.hidden && ready && !!me && !vfOn;
function feedPush(name, text, mine) {
  const d = document.createElement('div'), b = document.createElement('b'), sp = document.createElement('span');
  d.className = 'cfl' + (mine ? ' me' : ''); d.dataset.t = String(performance.now());
  b.textContent = name; sp.textContent = ' ' + text;
  d.appendChild(b); d.appendChild(sp); cFeed.appendChild(d);
  while (cFeed.children.length > 3) cFeed.removeChild(cFeed.firstChild);
  setTimeout(() => d.classList.add('old'), 8000);
  setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 9000);
}
function openChat(focus) {
  if (!chatOn() || paused()) return;
  if (emOpen) closeEmote();
  cOpen = true; cBar.hidden = false; cFab.classList.add('on'); stageEl.classList.add('cbo');
  stageEl.style.setProperty('--cbh', cBar.offsetHeight + 'px');
  pressed.length = 0;
  if (focus) { try { cIn.focus({ preventScroll: true }); } catch (e) { cIn.focus(); } }
}
function closeChat() {
  if (!cOpen) return;
  cOpen = false; cBar.hidden = true; if (!emOpen) cFab.classList.remove('on'); stageEl.classList.remove('cbo');
  document.body.classList.remove('cht');
  if (document.activeElement === cIn) cIn.blur();
}
function chatTick() {
  const on = chatOn();
  if (cFeed.children.length) {
    const t = performance.now();
    Array.from(cFeed.children).forEach(d => { const age = t - (+d.dataset.t || t); if (age > 9000) d.remove(); else if (age > 8000) d.classList.add('old'); });
  }
  if (on !== cWas) {
    cWas = on; cFeed.hidden = !on;
    if (!on) { closeChat(); cFeed.innerHTML = ''; }
  }
  const fabOn = !!(ready && me);   // 💬 在沒有聊天的場景（農場等）也顯示：只開表情與動作
  if (cFab.hidden === fabOn) { cFab.hidden = !fabOn; if (!fabOn) closeEmote(); }
  if (cOpen && paused()) closeChat();
}
QUICK_CHAT.forEach(t => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'qbtn'; b.textContent = t;
  b.addEventListener('click', () => { sendChat(t); closeChat(); });
  cQ.appendChild(b);
});
cBar.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });   // 點按鈕時不要讓輸入框失焦，鍵盤才不會先縮回去
const syncCbh = () => requestAnimationFrame(() => { if (cOpen) stageEl.style.setProperty('--cbh', cBar.offsetHeight + 'px'); });
cIn.addEventListener('focus', () => { pressed.length = 0; document.body.classList.add('cht'); syncCbh(); });
cIn.addEventListener('blur', () => { document.body.classList.remove('cht'); syncCbh(); });
/* 送出：觸控裝置上，鍵盤的藍色「傳送」鍵在注音／拼音還沒確認時，第一下只會確認文字（鍵盤也可能收起來，輸入列跳到右下的小窗），要再按一次才送。
   這裡改成：確認完文字就直接送出，一下搞定；電腦的輸入法維持原本的行為（Enter 先確認選字）。 */
let enterPending = false, lastCompEnd = 0;
cIn.addEventListener('compositionend', () => {
  lastCompEnd = performance.now();
  if (enterPending) { enterPending = false; setTimeout(submitChat, 0); }
});
cIn.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeChat(); return; }
  if (e.key !== 'Enter' || e.shiftKey || !coarseNow()) return;
  if (e.isComposing || (e.keyCode === 229 && performance.now() - lastCompEnd > 150)) {
    enterPending = true; setTimeout(() => { enterPending = false; }, 800);   // 等 compositionend 再送
  } else if (e.keyCode === 229) {   // Safari：compositionend 先到、keydown 後到，文字已確認，直接送
    e.preventDefault(); setTimeout(submitChat, 0);
  }
});
function submitChat() {
  const v = cIn.value;
  if (!v.trim()) { closeChat(); return; }
  cIn.value = '';
  sendChat(v); closeChat();
}
cForm.addEventListener('submit', e => { e.preventDefault(); submitChat(); });
/* 觸控時「送出」鈕一按下去就送：以前要等手指放開（click），這中間鍵盤若收起來、輸入列跳到小窗，手指底下的按鈕就不見了，要再按一次 */
let tapSendAt = 0;
const sendBtn = cForm.querySelector('button[type="submit"]');
if (sendBtn) {
  sendBtn.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault(); tapSendAt = performance.now(); submitChat();
  });
  sendBtn.addEventListener('click', e => { if (performance.now() - tapSendAt < 800) { e.preventDefault(); e.stopPropagation(); } });
}
cFab.addEventListener('click', () => { if (cOpen) closeChat(); else if (emOpen) closeEmote(); else openEmote(); });   // 💬 統一入口：表情、動作、快捷語；要打字從面板裡的「自己輸入」或按 /
cFab.addEventListener('pointerdown', e => e.stopPropagation());
document.addEventListener('pointerdown', e => { if (cOpen && !cBar.contains(e.target) && !cFab.contains(e.target)) closeChat(); });
window.addEventListener('keydown', e => {
  const tg = e.target && e.target.tagName;
  if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
  if (e.key === 'Escape' && cOpen) { closeChat(); return; }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && chatOn() && !paused()) { e.preventDefault(); openChat(true); }
});
/* 手機鍵盤：讓輸入列貼著鍵盤上緣 */
if (window.visualViewport) {
  const vv = window.visualViewport;
  const updKb = () => document.documentElement.style.setProperty('--kb', Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) + 'px');
  vv.addEventListener('resize', updKb); vv.addEventListener('scroll', updKb); updKb();
}
$('v-leave').addEventListener('click', () => leaveVillage());
function copyText(t) {
  const done = () => toast('已複製：' + t, 2200);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => toast('請手動複製：' + t, 6000));
    else toast('請手動複製：' + t, 6000);
  } catch (e) { toast('請手動複製：' + t, 6000); }
}
$('v-copy').addEventListener('click', () => { if (roomInfo && roomInfo.code) copyText(roomInfo.code); });
