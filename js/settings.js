'use strict';
/* 設定與拜訪設定 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 設定：畫面方向、音樂與音量、全螢幕、登出 ---------- */
const stEl = $('stm'), stCard = $('stcard');
const orientOK = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
let orientPref = 'auto';
try { const v = localStorage.getItem('dw_orient'); if (v === 'portrait' || v === 'landscape') orientPref = v; } catch (e) { /* 略過 */ }
function syncOrientUI() { document.querySelectorAll('#st-orient button').forEach(b => b.classList.toggle('on', b.dataset.o === orientPref)); }
async function applyOrient(interactive) {
  const so = screen.orientation;
  if (orientPref === 'auto') { try { so && so.unlock && so.unlock(); } catch (e) { /* 略過 */ } return; }
  if (!so || !so.lock) { if (interactive) toast('iPhone 不支援網頁鎖定方向：把手機橫放，並關閉控制中心的「直向鎖定」，遊戲就會跟著轉', 5200); return; }
  const mode = orientPref;
  try { await so.lock(mode); return; } catch (e) { /* 多數手機要先進入全螢幕才能鎖定 */ }
  if (docEl.requestFullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
    try { await docEl.requestFullscreen(); await so.lock(mode); return; } catch (e) { /* 略過 */ }
  }
  if (interactive) toast('無法鎖定方向，請改用手機的「自動旋轉」開關', 3200);
}
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement && orientPref !== 'auto') applyOrient(false); });
/* 瀏覽器不會記得方向鎖定：每次開遊戲、回到前景都要重新鎖一次。
   已安裝的 App（standalone）通常可以直接鎖；一般網頁要先進全螢幕，需要使用者點一下，所以第一次點畫面時再補鎖一次。 */
/* iPhone（沒有鎖定方向的功能）：方向和設定不一樣時，開遊戲、回到前景都提醒一次怎麼轉 */
const orientCanLock = () => !!(screen.orientation && screen.orientation.lock);
function orientHint() {
  if (!orientOK || orientPref === 'auto' || orientCanLock()) return;
  const portrait = window.innerHeight >= window.innerWidth;
  if ((orientPref === 'landscape') !== portrait) return;     // 已經是想要的方向
  toast(orientPref === 'landscape' ? '要橫向玩：請把手機橫放，並關閉控制中心的「直向鎖定」' : '要直向玩：請把手機直放，並關閉控制中心的「直向鎖定」', 6000);
}
if (orientOK && orientPref !== 'auto' && !orientCanLock()) {
  setTimeout(orientHint, 3500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(orientHint, 1200); });
}
if (orientOK) {    // 一律先掛上，方向偏好在遊戲中途改也會生效（每個處理函式裡面都會檢查是不是 auto）
  /* 切到別的 App 再回來，系統會放掉方向鎖定（影片裡的狀況）：回到前景、視窗大小變了、取得焦點時都重鎖，
     剛回來的瞬間可能鎖不上，所以間隔幾百毫秒多試幾次；方向已經對了就不用動 */
  const wantPortrait = () => orientPref === 'portrait';
  const orientOff = () => (window.innerHeight >= window.innerWidth) !== wantPortrait();
  let relockT = [];
  const relock = () => {
    relockT.forEach(clearTimeout); relockT = [];
    [0, 350, 1000, 2200].forEach(ms => relockT.push(setTimeout(() => { if (orientPref !== 'auto' && !document.hidden && orientOff()) applyOrient(false); }, ms)));
  };
  if (orientPref !== 'auto') applyOrient(false);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && orientPref !== 'auto') { applyOrient(false); relock(); } });
  window.addEventListener('pageshow', () => { if (orientPref !== 'auto') relock(); });
  window.addEventListener('focus', () => { if (orientPref !== 'auto') relock(); });
  window.addEventListener('resize', () => { if (orientPref !== 'auto' && orientOff()) relock(); });
  const lockOnTap = () => { if (orientPref !== 'auto' && orientOff()) applyOrient(false); };
  window.addEventListener('pointerdown', lockOnTap, true);   // 一般網頁要先進全螢幕才鎖得住，需要使用者點一下；方向不對時每次點畫面都補一次
}
function openSettings() {
  syncAppRow();
  if (!ready || !me || authOpen || paused() || stOpen) return;
  stOpen = true; pressed.length = 0; $('st-orient-row').hidden = !orientOK; syncOrientUI(); syncCtlUI(); syncVisitUI(); loadVisitCfg(); stEl.hidden = false; stCard.focus();
}
function closeSettings() { stOpen = false; stEl.hidden = true; }
$('st-close').addEventListener('click', closeSettings);
stEl.addEventListener('pointerdown', e => { if (e.target === stEl) closeSettings(); });
$('st-orient').addEventListener('click', e => {
  const b = e.target.closest('button[data-o]');
  if (!b) return;
  orientPref = b.dataset.o; syncOrientUI();
  try { localStorage.setItem('dw_orient', orientPref); } catch (err) { /* 略過 */ }
  applyOrient(true);
});
function syncCtlUI() {
  [['st-tap', tapOn]].forEach(([id, on]) => { const b = $(id); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '開' : '關'; });
}
function setCtl(key, on) { try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* 略過 */ } }
$('st-tap').addEventListener('click', () => { tapOn = !tapOn; setCtl('dw_tap', tapOn); if (!tapOn) autoPath = null; syncCtlUI(); });
$('logout').addEventListener('click', closeSettings);


/* ---------- 拜訪設定：門鈴、謝絕訪客、禁止拜訪名單 ---------- */
let bellOn = true, visitClosed = false, visitBlocks = [], dtId = null;
function isBlocked(uid) { return visitBlocks.some(b => b.uid === uid); }
try { bellOn = localStorage.getItem('dw_bell') !== '0'; } catch (e) { /* 略過 */ }
const lastBell = new Map();
function syncVisitUI() {
  $('st-bell').textContent = bellOn ? '開' : '關'; $('st-bell').setAttribute('aria-pressed', String(bellOn));
  $('st-closed').textContent = visitClosed ? '開' : '關'; $('st-closed').setAttribute('aria-pressed', String(visitClosed));
  $('st-blk').innerHTML = visitBlocks.length ? visitBlocks.map(b => '<div class="strow"><span>' + esc(b.name) + '</span><button type="button" class="btn ghost small" data-u="' + esc(b.uid) + '">解除</button></div>').join('') : '<small class="empty">名單是空的。到「好友」列表按某位好友的「禁止拜訪」就會加入。</small>';
}
async function loadVisitCfg() { try { const d = await rpc('visit_get'); visitClosed = !!d.closed; visitBlocks = d.blocks || []; syncVisitUI(); } catch (e) { /* 伺服器還沒裝就略過 */ } }
$('st-bell').addEventListener('click', () => { bellOn = !bellOn; try { localStorage.setItem('dw_bell', bellOn ? '1' : '0'); } catch (e) { /* 略過 */ } syncVisitUI(); if (bellOn) chime([79, 72], 0.14); });
$('st-closed').addEventListener('click', async () => { try { const d = await rpc('visit_closed_set', { p_on: !visitClosed }); visitClosed = !!d.closed; } catch (e) { toast(errText(e)); } syncVisitUI(); });
$('st-blk-btn').addEventListener('click', () => { const el = $('st-blk'); el.hidden = !el.hidden; });
$('st-blk').addEventListener('click', async e => {
  const b = e.target.closest('button[data-u]'); if (!b) return;
  try { const d = await rpc('visit_block', { p_uid: b.dataset.u, p_on: false }); visitBlocks = d.blocks || []; } catch (er) { toast(errText(er)); }
  syncVisitUI();
});
function ringBell(uid) { if (pres && pres.ok) try { pres.ch.send({ type: 'broadcast', event: 'bell', payload: { to: uid, from: myUid, n: me.name } }); } catch (e) { /* 略過 */ } }
function onBell(p) {   // 同一個人 30 秒內只響一次；對方要是好友、而且不在黑名單
  if (!bellOn || !p || p.to !== myUid || !isFriend(p.from) || visitBlocks.some(b => b.uid === p.from)) return;
  const now = Date.now(); if (now - (lastBell.get(p.from) || 0) < 30000) return; lastBell.set(p.from, now);
  chime([79, 72], 0.14);
  if (!fishing && !cooking) toast('🔔 ' + clean(p.n, 8) + ' 來拜訪你的家了', 3000);
}
function kickGuest(uid) { if (scene === 'house' && !visiting && net && net.ch) try { net.ch.send({ type: 'broadcast', event: 'kick', payload: { i: myUid, to: uid } }); } catch (e) { /* 略過 */ } }
function onKick(p) { if (p && visiting && p.i === visiting.uid && p.to === myUid && scene === 'house') { leaveHouse(true); toast('現在不方便拜訪'); } }
function onAte(p) { if (p && p.i !== myUid) addSys(clean(p.n, 8) + ' 吃了一份' + clean(p.d, 12)); }
