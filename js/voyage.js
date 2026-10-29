'use strict';
/* 出海團 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   全服 voyage:lobby 連線與通知卡、柴犬船長開團面板、船上集合面板與航程倒數、拋竿與回報、結算畫面。
   所有狀態都由伺服器（voyage.sql）決定，這裡只負責顯示；伺服器時間用 srvNow()（和 applyState 的 offset 同一套）。 */
const VY_COOLDOWN_MS = 12000;                       // 只用來顯示冷卻倒數；真正的冷卻由伺服器（voyage_cfg.cast_cooldown_ms）判定
const VOY_TIER = { 1: '小航海', 2: '遠洋', 3: '大航海' };
const voy = { cur: null, back: null, ch: null, topic: '', ok: false, tok: 0, bad: 0, notes: new Map(), busy: false, fogT0: 0, lastReelAt: 0, pollAt: 0, endChecked: 0, finishing: false, leaveAsk: 0, listAt: 0, mode: 'captain', info: null, sum: null };
let voyNotifyOn = true, voyToggleReel = false;
try { voyNotifyOn = localStorage.getItem('dw_voynote') !== '0'; voyToggleReel = localStorage.getItem('dw_voytog') === '1'; } catch (e) { /* 略過 */ }
const voyMk = (tag, id, cls) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; return e; };
const voyFmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const voySleep = ms => new Promise(res => setTimeout(res, ms));
const voyUuid = s => typeof s === 'string' && UID_RE.test(s);
const voyAboard = () => !!voy.cur && scene === 'boat';
const voyMe = () => (voy.cur && voy.cur.members || []).find(m => m.uid === myUid) || null;
const voyIsHost = () => !!voy.cur && voy.cur.host === myUid;
const voyBackNow = () => ({ scene, x: pl.x, y: pl.y, room: roomInfo ? roomInfo.room : null });

/* ---------- 畫面元件：通知卡、航程倒數、集合面板、開團／結算視窗 ---------- */
const voyStage = document.querySelector('.stage');
const voyNoteEl = voyMk('div', 'voynote'); voyNoteEl.setAttribute('aria-live', 'polite'); voyStage.appendChild(voyNoteEl);
const voyHud = voyMk('div', 'voyhud'); voyHud.hidden = true; voyStage.appendChild(voyHud);
const voyPanel = voyMk('section', 'voypanel', 'village'); voyPanel.hidden = true;
vPanel.parentNode.insertBefore(voyPanel, vPanel);
const voyM = voyMk('div', 'voym', 'maker'); voyM.hidden = true;
const voyCard = voyMk('div', 'voycard', 'card maker-card'); voyCard.tabIndex = -1; voyM.appendChild(voyCard);
document.body.appendChild(voyM);

/* ---------- 全服連線：集合中是 voyage:lobby，上船後換成 voyage:<id>（玩家同時最多三條頻道）---------- */
function voyOpenChannel(topic) {
  if (!sb || !myUid) return;
  if (voy.ch && voy.topic === topic) return;
  voyCloseChannel();
  const tok = ++voy.tok;
  voy.topic = topic;
  netGate.then(() => {                               // 等舊頻道完全移除再建立（同 startNet 的作法）
    if (tok !== voy.tok) return;
    const ch = sb.channel(topic, { config: { private: true, broadcast: { self: false, ack: false } } });
    voy.ch = ch; voy.ok = false;
    ch.on('broadcast', { event: 'open' }, m => voyOnOpen(m && m.payload))
      .on('broadcast', { event: 'count' }, m => voyOnCount(m && m.payload))
      .on('broadcast', { event: 'closed' }, m => voyOnClosed(m && m.payload))
      .on('broadcast', { event: 'legend' }, m => voyOnLegend(m && m.payload))
      .on('broadcast', { event: 'sail' }, m => voyOnShip('sail', m && m.payload))
      .on('broadcast', { event: 'mystery' }, m => voyOnShip('mystery', m && m.payload))
      .on('broadcast', { event: 'roster' }, m => voyOnShip('roster', m && m.payload))
      .on('broadcast', { event: 'kicked' }, m => voyOnShip('kicked', m && m.payload))
      .subscribe(st => {
        if (voy.ch !== ch) return;
        if (st === 'SUBSCRIBED') { voy.ok = true; voy.bad = 0; if (!voy.cur) voyListOpen(); else voySync(); }
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') voy.ok = false;
      });
  });
}
function voyCloseChannel() {
  voy.tok++;
  if (!voy.ch) { voy.topic = ''; return; }
  const c = voy.ch; voy.ch = null; voy.ok = false; voy.topic = '';
  netGate = netGate.then(() => dropChannel(c));
}
setInterval(() => {                                   // 看門狗：連上後掉線又沒自己恢復，就整條重建
  if (!ready || !voy.ch) return;
  if (voy.ch.state === 'joined') { voy.bad = 0; voy.ok = true; return; }
  if (++voy.bad >= 3) { const t = voy.topic; voyCloseChannel(); voyOpenChannel(t); }
}, 5000);

/* 收到的資料一律當作不可信：先檢查型別與範圍 */
const voyNote = p => {
  if (!p || typeof p !== 'object' || !voyUuid(p.id)) return null;
  return { id: p.id, host: clean(p.host, 8) || '旅人', hostUid: voyUuid(p.host_uid) ? p.host_uid : '', tier: intIn(p.tier, 1, 3, 1), price: intIn(p.price, 0, 100000, 0),
    n: intIn(p.n, 0, 8, 1), cap: intIn(p.cap, 1, 8, 8), deadline: +p.deadline_ms > 0 ? +p.deadline_ms : 0 };
};
function voyOnOpen(p) {
  const n = voyNote(p);
  if (!n || n.hostUid === myUid) return;
  const old = voy.notes.get(n.id);
  voy.notes.set(n.id, { ...n, hidden: old ? old.hidden : false, closed: false });
  voyRenderNotes();
  if (voyNotifyOn && !voy.cur && !old) chime([79, 84], 0.1);
}
function voyOnCount(p) {
  if (!p || !voyUuid(p.id)) return;
  const n = voy.notes.get(p.id);
  if (!n) return;
  n.n = intIn(p.n, 0, 8, n.n);
  if (n.n >= n.cap) voyCloseNote(n.id);
  voyRenderNotes();
}
function voyCloseNote(id) {
  const n = voy.notes.get(id);
  if (!n || n.closed) return;
  n.closed = true;
  setTimeout(() => { voy.notes.delete(id); voyRenderNotes(); }, 3000);     // 「加入」變灰，3 秒後收起
}
function voyOnClosed(p) {
  if (!p || !voyUuid(p.id)) return;
  if (voy.cur && voy.cur.id === p.id && scene === 'boat') {                  // 船上：自己這趟的結局
    if (p.reason === 'cancel' || p.reason === 'timeout') voySync();
    else if (p.reason === 'done') voySync();
    return;
  }
  voyCloseNote(p.id); voyRenderNotes();
}
function voyOnLegend(p) {
  if (!p || typeof p !== 'object') return;
  const f = typeof p.key === 'string' ? fishCat.find(x => x.key === p.key) : null;
  if (!f) return;
  const txt = '🐋 ' + (clean(p.name, 8) || '旅人') + ' 在出海團釣到' + f.name + '！';
  toast(txt, 4800); addSys(txt); chime([84, 88, 91], 0.12);              // 傳說魚公告不受「出海團通知」開關影響
}
function voyOnShip(ev, p) {
  if (!p || typeof p !== 'object' || !voy.cur || p.id !== voy.cur.id) return;
  if (ev === 'kicked') {
    if (p.uid === myUid) { toast('船長請你下船了', 3200); voyEnded(); }
    else voySync();
    return;
  }
  voySync();                                                                  // sail / mystery / roster：向伺服器取最新狀態
}
async function voyListOpen() {
  if (!sb || !myUid || voy.cur) return;
  voy.listAt = Date.now();
  try {
    const list = await rpc('voyage_list_open');
    const next = new Map();
    (Array.isArray(list) ? list : []).forEach(p => { const n = voyNote(p); if (n && n.hostUid !== myUid) { const o = voy.notes.get(n.id); next.set(n.id, { ...n, hidden: o ? o.hidden : false, closed: false }); } });
    voy.notes = next; voyRenderNotes();
  } catch (e) { /* 伺服器還沒裝出海團就略過 */ }
}

/* ---------- 右側通知卡（最多同時 3 張，其他排隊；「略過」只在本機隱藏）---------- */
const voyBoatCv = voyMk('canvas'); voyBoatCv.width = 128; voyBoatCv.height = 80;
let voyBoatImg = '';
function voyBoatUrl() { if (!voyBoatImg) { boatSide(voyBoatCv.getContext('2d'), 0, { still: true }); voyBoatImg = voyBoatCv.toDataURL(); g = ctx; } return voyBoatImg; }
function voyRenderNotes() {
  const show = !voy.cur && voyNotifyOn && ready && !authOpen
    ? [...voy.notes.values()].filter(n => !n.hidden && (n.closed || srvNow() < n.deadline + 1500)).slice(0, 3) : [];
  voyNoteEl.hidden = !show.length;
  voyNoteEl.innerHTML = show.map(n => {
    const dots = Array.from({ length: n.cap }, (_, i) => '<i class="' + (i < n.n ? 'on' : '') + '"></i>').join('');
    const full = n.n >= n.cap;
    return '<div class="voyc' + (n.closed ? ' off' : '') + '" data-id="' + esc(n.id) + '"><img alt="" src="' + voyBoatUrl() + '"><div class="voyc-b"><b>出海團招募中</b>' +
      '<small>' + esc(n.host) + ' · ' + VOY_TIER[n.tier] + '</small><div class="voyc-dots" aria-label="' + n.n + '/' + n.cap + ' 人">' + dots + '</div>' +
      '<small class="voyc-t" data-t="' + n.deadline + '">' + voyFmt(n.deadline - srvNow()) + '</small>' +
      '<div class="voyc-btns"><button type="button" class="btn small" data-a="join"' + (n.closed || full ? ' disabled' : '') + '>加入</button>' +
      '<button type="button" class="btn small ghost" data-a="skip">略過</button></div></div></div>';
  }).join('');
}
voyNoteEl.addEventListener('pointerdown', e => e.stopPropagation());
voyNoteEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'), c = e.target.closest('.voyc');
  if (!b || !c) return;
  const id = c.dataset.id;
  if (b.dataset.a === 'skip') { const n = voy.notes.get(id); if (n) n.hidden = true; voyRenderNotes(); }
  else voyJoin(id);
});

/* ---------- 加入、開團、進出船 ---------- */
async function voyJoin(id) {
  if (!ready || !me || voy.busy || !voyUuid(id)) return;
  if (voy.cur) { toast('你已經在一趟出海團裡了'); return; }
  if (paused() && !vyOpen) { toast('先關閉目前的視窗，再加入出海團', 2200); return; }
  voy.busy = true;
  const back = voyBackNow();
  try {
    const v = await rpc('voyage_join', { p_id: id, p_back: back });
    if (vyOpen) closeVoyModal();
    enterBoat(v, back);
  } catch (e) {
    toast(errText(e));
    if (/voyage_full|voyage_closed|kicked/.test(String((e && e.message) || e))) voyCloseNote(id);
    voyRenderNotes();
  }
  voy.busy = false;
}
async function voyOpenVoyage(tier) {
  if (!ready || !me || voy.busy) return;
  voy.busy = true; renderVoyModal();
  const back = voyBackNow();
  try {
    const v = await rpc('voyage_open', tier ? { p_tier: tier } : {});
    closeVoyModal();
    if (typeof v.price === 'number' && v.price > 0) { me.coins = Math.max(0, me.coins - v.price); refreshHud(); }
    enterBoat(v, back);
    resync();
  } catch (e) { toast(errText(e)); loadVoyInfo(); }
  voy.busy = false; if (vyOpen) renderVoyModal();
}
/* 進船：由 scenes.js 的 enterBoat 呼叫 */
function voyEntered(v, back) {
  voy.cur = v; voy.back = back || { scene: 'farm' }; voy.finishing = false; voy.leaveAsk = 0; voy.lastReelAt = 0; voy.pollAt = Date.now(); voy.endChecked = 0;
  voy.fogT0 = v.mystery ? -1e9 : 0;                                  // 進來時就已經是神秘路線（重新整理回到船上、3 階團）：不用淡入
  voyOpenChannel('voyage:' + v.id);
  voyRender(); voyRenderNotes();
  if (v.status === 'sailing') toast(v.mystery ? '回到船上了（神秘路線）' : '回到船上了', 2200);
  else toast(voyIsHost() ? '登船了！等朋友加入，準備好就出發' : '登船了！按「準備」讓船長知道', 3200);
}
/* 離開船：由 scenes.js 的 leaveBoat 呼叫 */
function voyLeft() {
  voy.cur = null; voy.finishing = false; voy.leaveAsk = 0; voy.fogT0 = 0;
  vfAbort(); fishing = null;
  voyHud.hidden = true; voyPanel.hidden = true; voyPanel.innerHTML = '';
  voyOpenChannel('voyage:lobby');
  voyListOpen(); voyRenderNotes(); syncBgm();
}
function voyEnded(msg) {            // 被踢、解散、已經不在船上：回到原位
  if (msg) toast(msg, 3200);
  if (vyOpen) closeVoyModal();
  if (scene === 'boat') leaveBoat();
  else voyLeft();
}
async function voySync() {
  const v0 = voy.cur;
  if (!v0 || voy.finishing && v0.status === 'done') return;
  voy.pollAt = Date.now();
  try {
    const v = await rpc('voyage_state', { p_id: v0.id });
    if (!voy.cur || voy.cur.id !== v0.id) return;
    voyApply(v);
  } catch (e) {
    const m = String((e && e.message) || e);
    if (/not_member/.test(m)) voyEnded('你已經不在這趟出海團了');
  }
}
function voyApply(v) {
  if (!v || !voy.cur) return;
  const prev = voy.cur;
  voy.cur = v;
  if (v.mystery && !prev.mystery) {
    voy.fogT0 = prev.status === 'lobby' ? -1e9 : performance.now();            // 抽中的神秘路線：霧和極光 3 秒內淡入
    if (prev.status === 'sailing') { toast('海面起霧了…神秘路線開啟！', 4800); chime([72, 76, 83], 0.12); }
  }
  if (prev.status === 'lobby' && v.status === 'sailing') toast(v.mystery ? '出發！這是一趟神秘路線…' : '出發！把魚竿放下去吧', 2800);
  if (v.status === 'cancelled') { voyEnded(prev.host === myUid ? '出海團已解散，船票已退還' : '船長解散了這趟出海團'); return; }
  if (v.status === 'done') { voyFinish(); return; }
  if (v.me && v.me.active === false) { voyEnded('你已經不在這趟出海團了'); return; }
  voyRender();
}
async function voyFinish() {
  if (voy.finishing || !voy.cur) return;
  voy.finishing = true; vfAbort(); fishing = null; netFish({ a: 0 });
  const id = voy.cur.id;
  voyHud.textContent = '⛵ 回港中…'; voyRender();
  await voySleep(2300);                                          // 航程結束後 2 秒內伺服器還接受最後一次拉竿回報
  try { voy.sum = await rpc('voyage_summary', { p_id: id }); }
  catch (e) { voy.sum = null; }
  if (scene !== 'boat') return;
  if (!voy.sum) { toast('出海結束了'); leaveBoat(); return; }
  voy.mode = 'summary'; openVoyModal();
  resync();
}

/* ---------- 船上面板：集合、準備、踢人、出發、解散、離開 ---------- */
function voyRender() {
  const v = voy.cur;
  if (!v || scene !== 'boat') { voyPanel.hidden = true; voyHud.hidden = true; return; }
  const host = v.host === myUid, mem = v.members || [], lobby = v.status === 'lobby', sailing = v.status === 'sailing';
  const me_ = mem.find(m => m.uid === myUid), wait = mem.filter(m => !m.host && !m.ready).length;
  let h = '<div class="v-head"><b>出海團</b><span class="v-last">' + esc(v.host_name) + ' 的團 · ' + VOY_TIER[v.tier] + (v.mystery ? ' · 神秘路線' : '') + '</span></div>';
  h += '<div class="v-list">' + mem.map(m => '<span class="pchip' + (m.host ? ' host' : '') + '">' + (m.host ? '👑 ' : '') + esc(m.name) + (m.uid === myUid ? '（你）' : '') +
    (lobby && !m.host ? (m.ready ? ' <span class="rdy on">✓</span>' : ' <span class="rdy">…</span>') : '') +
    (sailing ? ' <small>🎣' + (m.catches | 0) + '</small>' : '') +
    (lobby && host && !m.host ? '<button type="button" class="pkick" data-a="kick" data-u="' + esc(m.uid) + '" aria-label="踢掉 ' + esc(m.name) + '">✕</button>' : '') + '</span>').join('') + '</div>';
  if (lobby) {
    h += '<p class="voy-note">' + (host ? (wait ? '還有 ' + wait + ' 人沒準備。' : mem.length > 1 ? '大家都準備好了！' : '只有你一個人也可以直接出發。') : '準備好之後，等船長出發。') + '</p><div class="v-quick">';
    if (host) {
      h += '<button type="button" class="btn small" data-a="start"' + (wait ? ' disabled' : '') + '>出發</button>';
      if (wait) h += '<button type="button" class="btn small ghost" data-a="kickall">踢掉未準備的人（' + wait + '）</button>';
      h += '<button type="button" class="btn small ghost" data-a="cancel">解散並退款</button>';
    } else {
      h += '<button type="button" class="btn small" data-a="ready" aria-pressed="' + (me_ && me_.ready ? 'true' : 'false') + '">' + (me_ && me_.ready ? '取消準備' : '準備') + '</button>' +
        '<button type="button" class="btn small ghost" data-a="leave">離開</button>';
    }
    h += '</div>';
  } else if (sailing) {
    h += '<p class="voy-note">站在欄杆邊，面向海面按動作鍵拋竿。每人獨立拿魚，不用搶。</p><div class="v-quick"><button type="button" class="btn small ghost" data-a="leave">' +
      (voy.leaveAsk > Date.now() ? '再按一次確定離開' : '離開這趟（不退款）') + '</button></div>';
  }
  voyPanel.innerHTML = h; voyPanel.hidden = false;
  voyHudUpdate();
}
voyPanel.addEventListener('pointerdown', e => e.stopPropagation());
voyPanel.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || !voy.cur || voy.busy) return;
  const v = voy.cur, a = b.dataset.a;
  voy.busy = true;
  try {
    if (a === 'ready') { const m = voyMe(); voyApply(await rpc('voyage_ready', { p_id: v.id, p_ready: !(m && m.ready) })); }
    else if (a === 'start') voyApply(await rpc('voyage_start', { p_id: v.id }));
    else if (a === 'kick') voyApply(await rpc('voyage_kick', { p_id: v.id, p_uid: b.dataset.u }));
    else if (a === 'kickall') {
      for (const m of (v.members || []).filter(m => !m.host && !m.ready)) voyApply(await rpc('voyage_kick', { p_id: v.id, p_uid: m.uid }));
    } else if (a === 'cancel') { await rpc('voyage_cancel', { p_id: v.id }); resync(); voyEnded('出海團已解散，船票已退還'); }
    else if (a === 'leave') {
      if (v.status === 'sailing' && voy.leaveAsk < Date.now()) { voy.leaveAsk = Date.now() + 3500; voyRender(); setTimeout(() => { if (voy.cur) voyRender(); }, 3600); }
      else { await rpc('voyage_leave', { p_id: v.id }); voyEnded(); }
    }
  } catch (err) {
    toast(errText(err));
    if (/voyage_closed|not_member|not_sailing/.test(String((err && err.message) || err))) voySync();
  }
  voy.busy = false;
});

/* 航程倒數 HUD（畫面上方中間）：集合倒數、航行倒數、釣到幾條、拋竿冷卻 */
function voyHudUpdate() {
  const v = voy.cur;
  if (!v || scene !== 'boat') { voyHud.hidden = true; return; }
  const now = srvNow(), me_ = v.me || {}, cap = v.cap_catch || 10;
  let t;
  if (v.status === 'lobby') t = '⛵ 集合中 ' + voyFmt(v.lobby_ms - now) + ' · ' + (v.members || []).length + '/' + (v.cap || 8) + ' 人';
  else if (v.status === 'sailing') {
    const cd = voy.lastReelAt + VY_COOLDOWN_MS - Date.now();
    t = (v.mystery ? '🌫 神秘路線 ' : '⛵ 航行中 ') + voyFmt(v.ends_ms - now) + ' · 🎣 ' + (me_.catches | 0) + '/' + cap + (cd > 0 ? ' · 冷卻 ' + Math.ceil(cd / 1000) + 's' : '');
  } else t = '⛵ 回港中…';
  if (voyHud.textContent !== t) voyHud.textContent = t;
  voyHud.hidden = false;
}
function voyTick() {
  if (!ready) return;
  voyNoteEl.querySelectorAll('.voyc-t').forEach(el => { el.textContent = voyFmt(+el.dataset.t - srvNow()); });
  let changed = false;
  voy.notes.forEach((n, id) => { if (!n.closed && n.deadline && srvNow() > n.deadline + 1500) { voy.notes.delete(id); changed = true; } });
  if (changed) voyRenderNotes();
  const v = voy.cur;
  if (!v) { if (voy.ok && !document.hidden && Date.now() - voy.listAt > 60000) voyListOpen(); return; }
  const now = srvNow(), t = Date.now();
  if (v.status === 'lobby' && now >= v.lobby_ms + 200 && t - voy.endChecked > 2500) { voy.endChecked = t; voySync(); }
  else if (v.status === 'sailing' && now >= v.ends_ms + 200 && t - voy.endChecked > 2500) { voy.endChecked = t; voySync(); }
  else if (t - voy.pollAt > 7000) voySync();
  voyHudUpdate();
}
setInterval(voyTick, 500);
document.addEventListener('visibilitychange', () => { if (!document.hidden && voy.cur) voySync(); });

/* 神秘路線的霧與極光：0~1，3 秒內淡入 */
function voyFogLevel(now) {
  const v = voy.cur;
  if (!v || !v.mystery || v.status === 'lobby' || scene !== 'boat') return 0;
  return clamp((now - voy.fogT0) / 3000, 0, 1);
}
/* 甲板上的「已準備」氣泡（集合中才有）：舉辦者不用準備，不畫 */
function readyBubble(cx, cy) {
  ob('#ffffff', '#7fd08a', cx, cy, 10, 9);
  r('#7fd08a', cx + 3, cy + 9, 2, 1); r('#ffffff', cx + 3, cy + 8, 2, 1);
  r('#3fa05a', cx + 2, cy + 4, 1, 1); r('#3fa05a', cx + 3, cy + 5, 1, 1); r('#3fa05a', cx + 4, cy + 4, 1, 1); r('#3fa05a', cx + 5, cy + 3, 1, 1); r('#3fa05a', cx + 6, cy + 2, 1, 1);
}
function voyDrawReady(now, rx, ry) {
  const v = voy.cur;
  if (!v || v.status !== 'lobby' || scene !== 'boat') return;
  const mem = v.members || [];
  const mine = mem.find(m => m.uid === myUid);
  if (mine && !mine.host && mine.ready) readyBubble(Math.round(rx * T) - 8, Math.round(ry * T) - 12 + Math.round(Math.sin(now / 300)));
  remotes.forEach(rp => {
    if (!hereRp(rp)) return;
    const m = mem.find(q => q.uid === rp.id);
    if (m && !m.host && m.ready) readyBubble(Math.round(rp.x * T) - 8, Math.round(rp.y * T) - 12 + Math.round(Math.sin(now / 300 + 1)));
  });
}

/* ---------- 船上拋竿：伺服器決定魚種、咬鉤時間、難度；客戶端只負責顯示和拉扯小遊戲 ---------- */
function boatAct(x, y) {
  if (catchShown) { hideCatch(); return; }
  if (fishing) { fishAct(); return; }
  const rp = remoteAt(x, y);
  if (rp) { openFriendPop(rp); return; }
  const k = K[y][x], v = voy.cur;
  if (k === WA || k === BRL) {
    if (!v) return;
    if (v.status !== 'sailing') { toast(v.status === 'lobby' ? '船還沒出發，等開船再釣魚' : '航程已經結束了', 1800); return; }
    let tx = x, ty = y;
    if (k === BRL) {                                   // 面向欄杆：魚線落在欄杆外的水面
      const d = DIRS[pl.face]; tx = x + d[0]; ty = y + d[1];
      if (tx < 0 || ty < 0 || tx >= W || ty >= H || K[ty][tx] !== WA) { pop(x, y, '這邊是船頭，換個位置釣', '#ffb3a8'); return; }
    }
    boatCast(tx, ty);
    return;
  }
  if (k === BCB) pop(x, y, x >= 14 ? '船頭' : '船艙', '#ffffff');
}
async function boatCast(tx, ty) {
  const v = voy.cur;
  if (!v || fishing) return;
  const left = voy.lastReelAt + VY_COOLDOWN_MS - Date.now();
  if (left > 0) { pop(pl.x, pl.y - 0.8, '再等 ' + Math.ceil(left / 1000) + ' 秒', '#fff3b0'); return; }
  if (Date.now() < fishCool) return;
  const id = ++fishSeq;
  fishing = { id, x: tx, y: ty, scene, phase: 'cast', t0: Date.now(), bite: 0, win: 1600, boat: true };
  try {
    const r_ = await rpc('voyage_cast', { p_id: v.id });
    if (!fishing || fishing.id !== id) return;
    fishing.phase = 'wait'; fishing.bite = +r_.now_ms + +r_.bite_ms; fishing.win = +r_.window_ms || 1600;
    fishing.diff = intIn(+r_.diff, 1, 4, 1); fishing.seed = (+r_.seed | 0) || 1;
    netFish({ a: 1, x: tx, y: ty });
  } catch (e) {
    if (fishing && fishing.id === id) fishing = null;
    const m = String((e && e.message) || e);
    if (/cooldown/.test(m)) voy.lastReelAt = Date.now() - (VY_COOLDOWN_MS - 3000);
    toast(errText(e));
    if (/not_sailing|not_member/.test(m)) voySync();
  }
}
/* 按動作鍵：等待中 = 太早；咬鉤中 = 開始張力拉扯 */
function boatHook(f) {
  if (f.phase === 'cast' || f.phase === 'fight' || f.phase === 'reel') return;
  if (f.phase === 'wait') { toast('太早拉竿了，魚被嚇跑了', 1800); fishCancel(); return; }
  const hook = Math.max(0, Math.round(srvNow() - f.bite));
  f.phase = 'fight';
  netFish({ a: 2, x: f.x, y: f.y });
  vfStart(f.diff || 1, f.seed || 1, hook);
}
/* 小遊戲結束：回報給伺服器（只信任時間，不信任結果） */
async function boatReel(f, res) {
  vfClose();
  const v = voy.cur;
  if (!v) { fishing = null; return; }
  f.phase = 'reel';
  try {
    const r_ = await rpc('voyage_reel', { p_id: v.id, p_res: res });
    if (!fishing || fishing.id !== f.id) return;
    fishing = null; fishCool = Date.now() + 700; voy.lastReelAt = Date.now(); netFish({ a: 0 });
    if (r_.result === 'caught') {
      const fi = r_.fish || {};
      if (r_.inv) Object.assign(inv, r_.inv);
      fishLog[fi.key] = +r_.n || 1;
      splash(f.x, f.y); sparkle(f.x, f.y, (RARITY[fi.rarity] || [0, '#8fd3ff'])[1]);
      showCatch(fi, !!r_.first); qAdd('fish'); refreshHud(); loadLevelSoon();
      if (r_.size_cm != null) {
        const prevBest = (fishRec[fi.key] || {}).best | 0, sz = +r_.size_cm;
        fishRec[fi.key] = { best: Math.max(prevBest, sz), last: sz };
        toast(fi.name + ' 體長 ' + sz + ' cm' + (sz > prevBest ? (prevBest ? '（個人新紀錄！）' : '（第一次記錄）') : '（最大 ' + prevBest + ' cm）'));
        if (dexOpen) renderDex();
      }
      if (voy.cur && voy.cur.me) voy.cur.me.catches = (voy.cur.me.catches | 0) + 1;
      if (fi.rarity === 'rare' || fi.rarity === 'legend') setTimeout(() => showItem('fish', fi.key), 700);   // 稀有以上：全船看到閃光與名字
      voyHudUpdate();
    } else toast(res.ok ? '魚跑掉了…' : (f.why === 'snapped' ? '線斷了，魚跑掉了！' : '魚跑掉了…'), 2200);
  } catch (e) {
    if (fishing && fishing.id === f.id) { fishing = null; fishCool = Date.now() + 700; netFish({ a: 0 }); }
    const m = String((e && e.message) || e);
    if (/reel_early|catch_cap|no_cast/.test(m)) voy.lastReelAt = Date.now();
    toast(errText(e));
    if (/not_sailing|not_member/.test(m)) voySync();
  }
}

/* ---------- 出海碼頭建造（全服捐木頭、石頭、銅礦）：廣場岸邊的告示牌與柴犬船長都會開這個面板 ---------- */
const BLD_ITEMS = [['wood', 'm:wood', '木頭'], ['stone', 'm:stone', '石頭'], ['copper', 'm:copper', '銅礦']];
async function loadBuild() {
  bldAt = Date.now();
  try { const r = await rpc('voyage_build_info'); if (r && typeof r === 'object' && r.stage) bld = r; } catch (e) { /* 伺服器還沒升級：維持原樣（當作已完工） */ }
  if (vyOpen && voy.mode === 'build') renderBuild();
}
function openBuild(line) {
  if (!ready || !me || authOpen || paused() || vyOpen) return;
  voy.mode = 'build'; voy.bLine = line || ''; voy.bBusy = false;
  openVoyModal(); loadBuild();
}
async function buildGive(item, n) {
  if (voy.bBusy || !bld || bld.done) return;
  const key = item, have = (bld.inv && bld.inv[key]) | 0, k = BLD_ITEMS.find(x => x[1] === key);
  if (!k) return;
  const need = bld.need ? bld.need[k[0]] : 0, left = need - ((bld.have && bld.have[k[0]]) | 0);
  const qty = n === 'all' ? Math.min(have, left) : Math.min(+n || 1, have, left);
  if (qty < 1) return;
  voy.bBusy = true; renderBuild();
  try {
    const r = await enqueue(() => rpc('voyage_build_give', { p_item: key, p_qty: qty }));
    bld = r; bldAt = Date.now(); inv[key] = r.left | 0;
    toast('捐了 ' + k[2] + ' ×' + r.gave + (r.done ? '，碼頭完工啦！全服都收到信了' : r.advanced ? '，這個階段完成！' : ''));
    refreshHud();
  } catch (e) { toast(errText(e)); loadBuild(); }
  voy.bBusy = false; if (vyOpen && voy.mode === 'build') renderBuild();
}
async function buildClose(on) {
  if (voy.bBusy) return; voy.bBusy = true; if (voy.mode === 'build') renderBuild();
  try { bld = await rpc('voyage_set_closed', { p_closed: on }); bldAt = Date.now(); toast(on ? 'GM：碼頭已暫時關閉' : 'GM：碼頭重新開放'); }
  catch (e) { toast(errText(e)); }
  voy.bBusy = false; if (vyOpen) { if (voy.mode === 'build') renderBuild(); else if (voy.mode === 'captain') renderVoyModal(); }
}
async function buildGm(cmd) {
  if (voy.bBusy) return; voy.bBusy = true; renderBuild();
  try { bld = await rpc('voyage_build_gm', { p_cmd: cmd }); bldAt = Date.now(); toast('GM：' + ({ next: '完成目前階段', complete: '直接完工', reset: '全部重來' }[cmd] || cmd)); }
  catch (e) { toast(errText(e)); }
  voy.bBusy = false; if (vyOpen && voy.mode === 'build') renderBuild();
}
function renderBuild() {
  const b = bld;
  let h = '<div class="shop-h"><h2>出海碼頭</h2><span class="chip">' + (!b ? '讀取中' : b.done ? '✅ 已完工' : '🔨 第 ' + b.stage + ' / 4 階段') + '</span></div>' +
    '<div class="voyport"><canvas id="voy-port" width="128" height="80"></canvas><p class="lkline">' + esc(voy.bLine || (b && b.done ? '船造好了！謝謝大家～' : '全服一起捐材料，把碼頭和船蓋起來！')) + '</p></div>';
  if (!b) { h += '<p class="empty">讀取中…</p>'; }
  else {
    if (b.closed) h += '<p class="bldclosed">🚧 碼頭暫時關閉中：現在不能開團、加入或捐材料（進行中的航程照常）。</p>';
    const names = (b.stages || []).map(s => s.name);
    h += '<div class="bldsteps">' + names.map((nm, i) => '<span class="' + (b.done || i + 1 < b.stage ? 'ok' : i + 1 === b.stage ? 'on' : '') + '"><i>' + (b.done || i + 1 < b.stage ? '✓' : i + 1) + '</i>' + esc(nm) + '</span>').join('<u></u>') + '</div>';
    if (!b.done && b.need) {
      h += BLD_ITEMS.filter(k => b.need[k[0]] > 0).map(([col, key, nm]) => {
        const need = b.need[col], have = Math.min(need, b.have[col] | 0), mine = (b.inv && b.inv[key]) | 0, left = need - have, full = left <= 0;
        const dis = voy.bBusy || b.closed || full || mine < 1 ? ' disabled' : '';
        return '<div class="bldrow"><canvas width="16" height="16" data-bi="' + key + '"></canvas><div class="bldmid"><div class="bldnm"><b>' + nm + '</b><span>' + have + ' / ' + need + (full ? ' ✓' : '') + '</span></div>' +
          '<div class="voybar"><i style="width:' + Math.round(have / need * 100) + '%;background:' + (full ? '#6fcf7a' : '#ffb347') + '"></i></div><small>你有 ' + mine + '</small></div>' +
          '<div class="bldbtn"><button type="button" class="btn small" data-a="give" data-i="' + key + '" data-n="1"' + dis + '>+1</button><button type="button" class="btn small" data-a="give" data-i="' + key + '" data-n="10"' + dis + '>+10</button><button type="button" class="btn small" data-a="give" data-i="' + key + '" data-n="all"' + dis + '>全捐</button></div></div>';
      }).join('');
      h += '<p class="empty">木頭到西邊森林砍樹（斧頭）、石頭和銅礦到山洞挖礦（鎬子）；樹和礦石每天 0 點刷新。</p>';
    } else if (b.done) h += '<p class="empty">碼頭已經完工，全服玩家都收到信箱通知了。到柴犬船長那裡就能開團出海！</p>';
    const top = b.top || [];
    if (top.length) {
      h += '<p class="empty" style="margin:8px 0 2px"><b>貢獻榜</b>（共 ' + (b.donors | 0) + ' 位）</p>' + top.map((t, i) => '<div class="voyrank' + (t.uid === myUid ? ' me' : '') + '"><b class="voyrk' + (i < 3 ? ' top' : '') + '">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</b><div class="voyrb"><div class="voyrn">' + esc(clean(t.name, 8)) + (t.uid === myUid ? '（你）' : '') + '</div>' +
        '<small>木頭 ' + t.wood + ' · 石頭 ' + t.stone + ' · 銅礦 ' + t.copper + '</small></div></div>').join('');
    } else h += '<p class="empty">還沒有人捐獻，來當第一個吧！</p>';
    if (b.gm) h += '<div class="v-quick" style="margin-top:8px"><button type="button" class="btn small ghost" data-a="bgm" data-c="next">GM：完成這階段</button><button type="button" class="btn small ghost" data-a="bgm" data-c="complete">GM：直接完工</button><button type="button" class="btn small ghost" data-a="bgm" data-c="reset">GM：全部重來</button><button type="button" class="btn small ghost" data-a="bclose" data-c="' + (b.closed ? '0' : '1') + '">' + (b.closed ? 'GM：重新開放碼頭' : 'GM：暫時關閉碼頭') + '</button>' + (b.done ? '' : '<button type="button" class="btn small ghost" data-a="gmcap">GM：開團面板</button>') + '</div>';
  }
  h += '<button type="button" class="btn ghost wide" data-a="close" style="margin-top:8px">關閉</button>';
  voyCard.innerHTML = h;
  const pc = $('voy-port'); if (pc) { boatSide(pc.getContext('2d'), performance.now(), { still: true }); g = ctx; }
  voyCard.querySelectorAll('canvas[data-bi]').forEach(c => { miscIcon(c.getContext('2d'), c.dataset.bi); });
}
/* 建造進度即時推送：伺服器有人捐獻／GM 操作就廣播 pier:build，收到後隔一小段隨機時間重新讀取（避免大家同時打伺服器）。
   連線正常時 3 分鐘才補讀一次；連不上就維持每 45 秒輪詢。 */
let bldCh = null, bldOk = false, bldTimer = 0;
function bldOpenChannel() {
  if (!sb || !myUid || bldCh) return;
  netGate.then(() => {
    if (bldCh || !sb) return;
    const ch = sb.channel('pier:build', { config: { broadcast: { self: false, ack: false } } });
    bldCh = ch; bldOk = false;
    ch.on('broadcast', { event: 'progress' }, () => { clearTimeout(bldTimer); bldTimer = setTimeout(loadBuild, 200 + Math.random() * 800); })
      .subscribe(st => {
        if (bldCh !== ch) return;
        if (st === 'SUBSCRIBED') { bldOk = true; loadBuild(); }
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') bldOk = false;
      });
  });
}
function bldCloseChannel() {
  clearTimeout(bldTimer); bldOk = false;
  if (!bldCh) return;
  const c = bldCh; bldCh = null; netGate = netGate.then(() => dropChannel(c));
}
setInterval(() => { if (scene === 'plaza' && !document.hidden && Date.now() - bldAt > (bldOk ? 180000 : 45000)) loadBuild(); }, 5000);

/* ---------- 柴犬船長面板（廣場）與結算畫面 ---------- */
const CPT_LINES = ['出海嗎？船票不貴，魚可是很大一條！', '海上的風很舒服，來一趟吧！', '人多熱鬧，客人免費上船喔～', '今天的海，感覺會有大魚。', '汪！準備好就出發！'];
async function loadVoyInfo() {
  try { voy.info = await rpc('voyage_info'); } catch (e) { voy.info = null; voy.infoErr = errText(e); }
  if (vyOpen && voy.mode === 'captain') renderVoyModal();
}
function openCaptain() {
  if (!ready || !me || authOpen || paused() || vyOpen) return;
  if (bld && bld.closed && !bld.gm) { openBuild('碼頭暫時關閉中，請晚一點再來～'); return; }   // GM 暫時關閉碼頭玩法
  if (bld && !bld.done && !voy.gmPass) { openBuild('船還沒造好呢！需要大家一起捐材料，汪！'); return; }   // 碼頭沒蓋好：船長請大家幫忙
  voy.mode = 'captain'; voy.info = null; voy.infoErr = ''; voy.capLine = CPT_LINES[Math.floor(Math.random() * CPT_LINES.length)];
  openVoyModal(); loadVoyInfo(); loadVoyHints();
}
function loadVoyHints() { voyListOpen(); }
function openVoyModal() { vyOpen = true; pressed.length = 0; renderVoyModal(); voyM.hidden = false; voyCard.focus(); }
function closeVoyModal() { vyOpen = false; voyM.hidden = true; }
function voyFishIcons() { voyCard.querySelectorAll('canvas[data-fish]').forEach(c => drawFish(c.getContext('2d'), c.dataset.fish, false)); }
function renderVoyModal() {
  if (voy.mode === 'summary') { renderVoySummary(); return; }
  if (voy.mode === 'build') { renderBuild(); return; }
  const i = voy.info;
  let h = '<div class="shop-h"><h2>柴犬船長</h2><span class="chip">出海團</span></div>' +
    '<div class="voyport"><canvas id="voy-port" width="128" height="80"></canvas><p class="lkline">' + esc(voy.capLine || '') + '</p></div>';
  if (!i) h += '<p class="empty">' + esc(voy.infoErr || '讀取中…') + '</p>';
  else {
    const left = Math.max(0, i.max - i.opens), price = i.next_price, tier = Math.min(3, i.opens + 1);
    const aboard = !!i.mine || !!voy.cur;
    h += '<p class="empty">今天已開 ' + i.opens + '/' + i.max + ' 次 · 你有 ' + i.coins + ' G<br>船票：第 1 次 ' + i.prices[0] + ' G · 第 2 次 ' + i.prices[1] + ' G · 第 3 次 ' + i.prices[2] + ' G（客人免費加入）</p>';
    if (i.gm) h += '<div class="v-quick">' + [1, 2, 3].map(t => '<button type="button" class="btn small ghost" data-a="gmopen" data-t="' + t + '">GM 開 ' + VOY_TIER[t] + '</button>').join('') + '<button type="button" class="btn small ghost" data-a="bclose" data-c="' + (bld && bld.closed ? '0' : '1') + '">' + (bld && bld.closed ? 'GM：重新開放碼頭' : 'GM：暫時關閉碼頭') + '</button></div>';
    if (aboard) h += '<button type="button" class="btn wide" disabled>你已經在一趟出海團裡了</button>';
    else if (left <= 0 && !i.gm) h += '<button type="button" class="btn wide" disabled>今天的船票用完了</button>';
    else if (!i.gm && i.coins < price) h += '<button type="button" class="btn wide" disabled>金幣不夠（' + price + ' G）</button>';
    else h += '<button type="button" class="btn wide" data-a="open"' + (voy.busy ? ' disabled' : '') + '>開團（' + VOY_TIER[tier] + ' · ' + (i.gm ? 0 : price) + ' G）</button>' +
      '<p class="empty" style="margin-top:4px">' + '航程 5 分鐘，第 4 分鐘有 ' + (tier === 3 ? '30' : '10') + '% 機率遇到神秘路線（再 +5 分鐘）。' + '</p>';
    const open = [...voy.notes.values()].filter(n => !n.closed && srvNow() < n.deadline + 1500);
    if (open.length && !aboard) h += '<p class="empty" style="margin:8px 0 2px"><b>正在招募</b></p>' + open.map(n => '<div class="giftrow"><span>' + esc(n.host) + ' · ' + VOY_TIER[n.tier] + ' · ' + n.n + '/' + n.cap + ' 人</span><button type="button" class="btn small" data-a="join" data-id="' + esc(n.id) + '"' + (n.n >= n.cap ? ' disabled' : '') + '>加入</button></div>').join('');
  }
  h += '<button type="button" class="btn ghost wide" data-a="close">先不出海</button>';
  voyCard.innerHTML = h;
  const pc = $('voy-port'); if (pc) { boatSide(pc.getContext('2d'), performance.now(), { still: true }); g = ctx; }
}
function renderVoySummary() {
  const s = voy.sum || { members: [] };
  const price = k => { const f = fishCat.find(x => x.key === k); return f ? f.price : 0; };
  const fname = k => { const f = fishCat.find(x => x.key === k); return f ? f.name : k; };
  const mem = (s.members || []).map(m => ({ ...m, count: m.count | 0, value: m.value | 0, items: Array.isArray(m.items) ? m.items : [] }))
    .sort((a, b) => b.value - a.value || b.count - a.count);
  const mx = Math.max(1, mem.length ? mem[0].value : 1), medal = ['🥇', '🥈', '🥉'];
  const tot = mem.reduce((t, m) => t + m.value, 0), cnt = mem.reduce((t, m) => t + m.count, 0), leg = s.legend | 0;
  const withBest = mem.filter(m => m.best && m.best.key && +m.best.cm > 0);
  const big = withBest.slice().sort((a, b) => +b.best.cm - +a.best.cm)[0];
  const most = mem.length && mem[0].value > 0 ? mem.slice().sort((a, b) => b.count - a.count)[0] : null;
  const tag = t => '<span class="voytag">' + t + '</span>';
  const st = (t, v) => '<div><small>' + t + '</small><b>' + v + '</b></div>';
  let h = '<div class="shop-h"><h2>出海排行榜</h2><span class="chip">' + (s.mystery ? '🌫 神秘路線' : '⛵ ' + (VOY_TIER[s.tier] || '出海')) + '</span></div>';
  if (!cnt) h += '<p class="empty">這趟沒有人釣到魚。</p>';
  else h += '<div class="voysumbar">' + st('全船合計', '<span style="color:var(--pink-deep)">' + tot + ' G</span>') + st('魚獲', cnt + ' 條') + st('傳說魚', '🐋 ×' + leg) +
    st('最大魚', big ? esc(fname(big.best.key)) + ' ' + (+big.best.cm) + 'cm' : '—') + '</div>';
  h += mem.map((m, i) => {
    const top = m.items.slice().sort((a, b) => price(b.key) - price(a.key)).slice(0, 3);
    const nm = (m.host ? '👑 ' : '') + esc(clean(m.name, 8)) + (m.uid === myUid ? '（你）' : '') + (i === 0 && m.value > 0 ? tag('MVP') : '') + (most === m && m.count > 0 ? tag('最多條') : '') + (big === m ? tag('最大魚') : '');
    return '<div class="voyrank' + (m.uid === myUid ? ' me' : '') + '"><b class="voyrk' + (i < 3 ? ' top' : '') + '">' + (i < 3 ? medal[i] : i + 1) + '</b><div class="voyrb"><div class="voyrn">' + nm + '</div>' +
      '<div class="voybar"><i style="width:' + Math.round(m.value / mx * 100) + '%;background:' + (i === 0 ? '#ffb347' : '#8fd3ff') + '"></i><span>' + m.count + ' 條 · ' + m.value + ' G</span></div></div>' +
      '<div class="voyfx">' + top.map(it => '<canvas width="16" height="16" data-fish="' + esc(it.key) + '"></canvas>').join('') + '</div></div>';
  }).join('');
  h += '<button type="button" class="btn wide" data-a="home" style="margin-top:8px">下船</button>';
  voyCard.innerHTML = h; voyFishIcons();
}
voyCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]');
  if (!b) return;
  const a = b.dataset.a;
  if (a === 'close') closeVoyModal();
  else if (a === 'open') voyOpenVoyage(0);
  else if (a === 'gmopen') voyOpenVoyage(+b.dataset.t);
  else if (a === 'join') voyJoin(b.dataset.id);
  else if (a === 'home') { closeVoyModal(); leaveBoat(); }
  else if (a === 'give') buildGive(b.dataset.i, b.dataset.n);
  else if (a === 'bgm') buildGm(b.dataset.c);
  else if (a === 'bclose') buildClose(b.dataset.c === '1');
  else if (a === 'gmcap') { voy.gmPass = true; closeVoyModal(); openCaptain(); voy.gmPass = false; }
});
voyM.addEventListener('pointerdown', e => { if (e.target === voyM && voy.mode !== 'summary') closeVoyModal(); });
setInterval(() => { if (vyOpen && voy.mode === 'captain') renderVoyModal(); }, 1000);   // 招募中的團倒數、人數

/* ---------- 設定頁：出海團通知、點一下切換收線 ---------- */
function voySyncUI() {
  [['st-voy', voyNotifyOn], ['st-vtog', voyToggleReel]].forEach(([id, on]) => { const b = $(id); if (!b) return; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '開' : '關'; });
}
if ($('st-voy')) $('st-voy').addEventListener('click', () => { voyNotifyOn = !voyNotifyOn; try { localStorage.setItem('dw_voynote', voyNotifyOn ? '1' : '0'); } catch (e) { /* 略過 */ } voySyncUI(); voyRenderNotes(); });
if ($('st-vtog')) $('st-vtog').addEventListener('click', () => { voyToggleReel = !voyToggleReel; try { localStorage.setItem('dw_voytog', voyToggleReel ? '1' : '0'); } catch (e) { /* 略過 */ } voySyncUI(); });
voySyncUI();

/* ---------- 啟動與登出 ---------- */
function voyageInit() {
  if (!sb || !myUid) return;
  loadBuild(); bldOpenChannel();
  voy.notes.clear(); voyRenderNotes();
  rpc('voyage_mine').then(v => {
    if (v && v.id && scene !== 'boat') enterBoat(v, v.me && v.me.back ? v.me.back : { scene: 'farm' });   // 重新整理、斷線後回到船上
    else voyOpenChannel('voyage:lobby');
  }).catch(() => voyOpenChannel('voyage:lobby'));
}
function voyageStop() {
  if (scene === 'boat') leaveBoat(true, true);
  voyCloseChannel(); bldCloseChannel(); voy.cur = null; voy.notes.clear(); voyRenderNotes();
  voyHud.hidden = true; voyPanel.hidden = true; if (vyOpen) closeVoyModal();
}

/* ---------- 出海成就（自己的名片）：次數來自 voyage_stat_get，海釣圖鑑從本機圖鑑算 ---------- */
let voyStat = null, voyStatAt = 0;
function voyAchSelf() {
  if (!voyStat || Date.now() - voyStatAt > 60000) {
    voyStatAt = Date.now();
    rpc('voyage_stat_get').then(s => { const first = !voyStat; voyStat = s || {}; if (first && cdOpen) renderCard(); }).catch(() => { voyStat = voyStat || {}; });
  }
  const out = [], n = voyStat ? (voyStat.hosted | 0) + (voyStat.joined | 0) : 0;
  if (n >= 1) out.push('voy1'); if (n >= 10) out.push('voy10'); if (n >= 50) out.push('voy50');
  if (bld && bld.mine && ((bld.mine.wood | 0) + (bld.mine.stone | 0) + (bld.mine.copper | 0)) > 0) out.push('pier');   // 捐過碼頭材料 = 碼頭建設者
  const sea = fishCat.filter(f => habitatOf(f) !== 'fresh');
  if (sea.length && sea.every(f => (fishLog[f.key] | 0) > 0)) out.push('sea_all');
  return out;
}
