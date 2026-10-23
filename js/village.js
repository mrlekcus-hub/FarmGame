'use strict';
/* 廣場：即時走動與聊天 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 廣場：即時走動與聊天（Supabase Realtime） ---------- */
/* 位置與聊天都是玩家自己送出的，收到的一律當作不可信資料：先檢查型別與範圍，再顯示。 */
const FACEIDX = { down: 0, right: 1, up: 2, left: 3 };
const remotes = new Map();
let net = null, roomInfo = null, myUid = '', pingTimer = 0, myBubble = null, myShow = null;
let lastPosKey = '', posAcc = 0, lastMoveAt = 0, lastChat = 0, lastTrackAt = 0, lastSendAt = 0;
const vPanel = $('village'), vList = $('v-list'), vLog = $('v-log');

function nameTag(txt, cx, cy, col) {
  ctx.font = '800 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(122,74,74,.9)';
  ctx.strokeText(txt, cx, cy);
  ctx.fillStyle = col; ctx.fillText(txt, cx, cy);
}
function bubble(b, cx, cy, now) {
  const age = now - b.at;
  if (age > 6000) return;
  ctx.font = '700 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  const t = b.txt.length > 14 ? b.txt.slice(0, 13) + '…' : b.txt;
  const w = Math.ceil(ctx.measureText(t).width) + 8, h = 10;
  const x = Math.round(cx - w / 2), y = cy - h;
  ctx.globalAlpha = clamp((6000 - age) / 700, 0, 1);
  ob('#ffffff', '#e0b896', x, y, w, h);
  r('#e0b896', cx - 1, y + h, 3, 1); r('#ffffff', cx, y + h - 1, 1, 1);
  ctx.fillStyle = INK; ctx.fillText(t, cx, y + 7);
  ctx.globalAlpha = 1;
}
/* 同步的「世界」：p 廣場、t 塔羅屋、h 屋子（拜訪朋友或自己的家，各屋子有自己的頻道）。
   廣場和塔羅屋共用同一條村頻道，靠位置訊息裡的 w 分開；只有和自己同一個世界的人才會畫出來。 */
const worldKey = () => scene === 'tarot' ? 't' : scene === 'house' ? 'h' : 'p';
const syncScene = () => scene === 'plaza' || scene === 'tarot' || (scene === 'house' && !!net);
const hereRp = rp => (rp.w || 'p') === worldKey();
const worldOf = w => w === 't' ? 't' : w === 'h' ? 'h' : 'p';
const worldW = w => w === 't' ? RMW : BW;
const worldH = w => w === 't' ? RMH : BH;
const WORLD_IN = { p: '來到廣場', t: '進了塔羅屋', h: '來到屋子裡' };
const remoteAt = (x, y) => {
  let hit = null;
  remotes.forEach(rp => { if (rp.tx === x && rp.ty === y && hereRp(rp)) hit = rp; });
  return hit;
};
const intIn = (v, a, b, d) => (typeof v === 'number' && isFinite(v)) ? clamp(Math.round(v), a, b) : d;

function addLog(name, text, mine, sys) {
  const line = document.createElement('div');
  line.className = 'vline' + (mine ? ' me' : '') + (sys ? ' sys' : '');
  if (sys) line.textContent = text;
  else {
    const b = document.createElement('b'), sp = document.createElement('span');
    b.textContent = name; sp.textContent = ' ' + text;
    line.appendChild(b); line.appendChild(sp);
  }
  vLog.appendChild(line);
  if (!sys) { try { feedPush(name, text, mine); } catch (e) { /* 略過 */ } }
  while (vLog.children.length > 60) vLog.removeChild(vLog.firstChild);
  vLog.scrollTop = vLog.scrollHeight;
}
const addSys = text => addLog('', text, false, true);

function renderVillage() {
  const inHouse = scene === 'house' && !!net;          // 在屋子裡：同一個聊天欄，標題改成屋子，沒有邀請碼，也沒有「離開廣場」
  if (!roomInfo && !inHouse) return;
  const n = remotes.size + 1;
  $('v-input').placeholder = inHouse ? '對屋子裡的朋友說點什麼' : '對廣場上的朋友說點什麼';
  $('v-leave').hidden = inHouse;
  if (inHouse) {
    $('v-title').textContent = visiting ? visiting.name + ' 的家' : '我的家';
    $('v-count').textContent = n + ' 人';
    $('v-copy').hidden = true;
  } else {
    $('v-title').textContent = roomInfo.kind === 'public' ? '公開廣場 ' + roomInfo.room.replace('pub-', '#') : '私人村 ' + roomInfo.code;
    $('v-count').textContent = n + '/' + (roomInfo.cap || 8) + ' 人';
    $('v-copy').hidden = roomInfo.kind !== 'private';
  }
  const names = [esc(me.name) + '（你）'];
  remotes.forEach(rp => names.push(esc(rp.name)));
  vList.innerHTML = names.map(x => '<span class="pchip">' + x + '</span>').join('');
}
const sitCode = () => pose ? (pose.ground ? 2 : pose.bench ? 1 : pose.id != null ? (pose.type === 'lie' ? 4 : 3) : 0) : 0;   // 0 站著、1 坐長椅、2 坐在地上、3 坐家具（椅子／沙發）、4 躺床
/* Supabase Realtime 限制：每個用戶端 30 秒內最多 5 次 presence 呼叫（track／untrack），超過整條頻道會被伺服器關掉
   （就是「連線中斷，重新連線中…」）。不確定這個額度是每條頻道還是整條連線共用，所以廣場和好友在線兩條頻道的 track
   一律經過這裡，全部合起來兩次之間至少隔 7.5 秒（30 秒內最多 4 次）；太密的呼叫合併成一次稍後補送，
   補送時才讀當下的位置／場景，不會送到舊資料。位置本身另外靠 pos 廣播即時更新，不受影響。 */
const TRACK_GAP = 7500;
let trackLastAt = 0;
const trackPending = {};
function trackLimited(key, fn) {
  const wait = trackLastAt + TRACK_GAP - performance.now();
  if (wait <= 0) { trackLastAt = performance.now(); fn(); return; }
  if (trackPending[key]) return;
  trackPending[key] = setTimeout(() => { trackPending[key] = null; trackLimited(key, fn); }, wait);
}
function trackSelf() {
  if (!net || !net.ok) return;
  trackLimited('self', () => {
    if (!net || !net.ok) return;
    try { net.ch.track({ n: me.name, c: me.look, w: worldKey(), x: pl.x, y: pl.y, f: FACEIDX[pl.face], s: sitCode() }); } catch (e) { /* 略過 */ }
  });
}
function onSync(ch) {
  if (!net || net.ch !== ch) return;
  const state = ch.presenceState() || {};
  const seen = new Set();
  Object.keys(state).forEach(id => {
    if (id === myUid) return;
    const m = (state[id] && state[id][0]) || {};
    const name = clean(m.n, 8) || '旅人';
    const wk = worldOf(m.w);
    const x = intIn(m.x, 0, worldW(wk) - 1, 10), y = intIn(m.y, 0, worldH(wk) - 1, 11), f = intIn(m.f, 0, 3, 0);
    seen.add(id);
    let rp = remotes.get(id);
    if (!rp) {
      rp = { id, name, w: wk, char: toChar(name, m.c), x, y, tx: x, ty: y, f, bubble: null, sit: wk === 'p' && m.s === 1 && pkind[y][x] === BN, gsit: m.s === 2, fs: wk === 'h' && (m.s === 3 || m.s === 4) ? m.s : 0, heard: performance.now() };
      remotes.set(id, rp);
      if (net.synced) addSys(name + ' ' + WORLD_IN[wk]);
    } else {
      rp.heard = performance.now();
      rp.name = name; rp.char = toChar(name, m.c);
      if (performance.now() - (rp.posAt || 0) > 12000) {   // presence 現在更新較慢，位置可能是舊的：只要最近收過他的 pos 廣播就以廣播為準，12 秒都沒收到才改用 presence 的位置

        if (rp.w !== wk) { rp.w = wk; rp.x = x; rp.y = y; }       // 換了世界（進出塔羅屋）：直接放到新位置，不要從舊位置滑過去
        rp.tx = x; rp.ty = y; rp.f = f; rp.sit = wk === 'p' && m.s === 1 && pkind[y][x] === BN; rp.gsit = m.s === 2; rp.fs = wk === 'h' && (m.s === 3 || m.s === 4) ? m.s : 0;
      }   // 剛收到更新的走動訊息就不要被舊位置蓋回去
    }
  });
  /* 這次 presence 沒看到的人，不要馬上刪：網路抖一下、Realtime 丟包時 presence 常常漏掉人。
     只要最近還有收到他的位置廣播（站著不動也每 3 秒一次）就繼續顯示，真的消失由 sweepRemotes 在幾秒後清掉 */
  remotes.forEach((rp, id) => { if (!seen.has(id) && performance.now() - (rp.heard || 0) > 8000) dropRemote(id); });
  net.synced = true;
  renderVillage();
}
function dropRemote(id) { const rp = remotes.get(id); if (!rp) return; remotes.delete(id); addSys(rp.name + ' 離開了'); renderVillage(); }
const UID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function onPos(p) {
  if (!p || typeof p !== 'object' || typeof p.i !== 'string' || p.i === myUid) return;
  let rp = remotes.get(p.i);
  const wk = worldOf(p.w);
  const nx = intIn(p.x, 0, worldW(wk) - 1, rp ? rp.tx : 10), ny = intIn(p.y, 0, worldH(wk) - 1, rp ? rp.ty : 11);
  if (!rp) {
    /* presence 漏掉的人：靠位置廣播（心跳裡帶名字和造型）補回來 */
    if (!UID_RE.test(p.i) || remotes.size >= 16) return;
    const name = clean(p.n, 8) || '旅人';
    rp = { id: p.i, name, w: wk, char: toChar(name, p.c), x: nx, y: ny, tx: nx, ty: ny, f: intIn(p.f, 0, 3, 0), bubble: null, sit: false, fs: 0, heard: performance.now() };
    remotes.set(p.i, rp);
    if (net && net.synced) addSys(name + ' ' + WORLD_IN[wk]);
    renderVillage();
  } else if (typeof p.n === 'string') { rp.name = clean(p.n, 8) || rp.name; rp.char = toChar(rp.name, p.c); }
  rp.heard = performance.now();
  if (nx !== rp.tx || ny !== rp.ty) rp.fish = null;
  if (rp.w !== wk) { rp.w = wk; rp.x = nx; rp.y = ny; rp.fish = null; rp.bubble = null; }   // 換了世界：直接放到新位置
  rp.tx = nx; rp.ty = ny; rp.f = intIn(p.f, 0, 3, rp.f); rp.posAt = performance.now();
  rp.sit = wk === 'p' && p.s === 1 && pkind[ny][nx] === BN; rp.gsit = p.s === 2; rp.fs = wk === 'h' && (p.s === 3 || p.s === 4) ? p.s : 0;                  // 只有真的在長椅那一格才當作坐著
}
function onBye(p) { if (p && typeof p.i === 'string') dropRemote(p.i); }
/* 清道夫：很久沒收到位置廣播、presence 也沒有他的人才移除 */
setInterval(() => {
  if (!syncScene() || !net || !net.ok) return;
  const now = performance.now(), st = (net.ch.presenceState && net.ch.presenceState()) || {};
  remotes.forEach((rp, id) => {
    if (now - (rp.heard || 0) < 12000) return;
    if (st[id]) { rp.heard = now; return; }
    dropRemote(id);
  });
}, 2000);
/* 別人釣魚：只畫釣竿和浮標（收到的資料一律檢查：座標要在範圍內、而且要是池塘的水面） */
function onFish(p) {
  if (!p || typeof p !== 'object') return;
  const rp = typeof p.i === 'string' ? remotes.get(p.i) : null;
  if (!rp) return;
  if (p.a !== 1) { rp.fish = null; return; }
  const x = intIn(p.x, 0, BW - 1, -1), y = intIn(p.y, 0, BH - 1, -1);
  if (x < 0 || y < 0 || pkind[y][x] !== WA) { rp.fish = null; return; }
  const bite = p.b === 1;
  if (rp.fish && rp.fish.x === x && rp.fish.y === y) rp.fish.phase = bite ? 'bite' : rp.fish.phase;
  else rp.fish = { x, y, phase: bite ? 'bite' : 'cast', t0: Date.now() };
  if (rp.fish.phase === 'cast') setTimeout(() => { if (rp.fish && rp.fish.phase === 'cast') rp.fish.phase = 'wait'; }, 400);
}
/* 別人展示魚或蟲蝶：只認得自己清單裡的種類，名字和稀有度用本機的資料，不用對方送來的文字 */
function onShow(p) {
  if (!p || typeof p !== 'object') return;
  const rp = typeof p.i === 'string' ? remotes.get(p.i) : null;
  const kd = p.t === 'bug' ? 'bug' : 'fish';
  const f = typeof p.k === 'string' ? (kd === 'bug' ? bugCat : fishCat).find(x => x.key === p.k) : null;
  if (!rp || !f) return;
  const rc = RARITY[f.rarity] || ['', '#e0b896'];
  rp.show = { kind: kd, k: f.key, name: f.name, col: rc[1], at: performance.now() };
  addLog(rp.name, '展示了「' + f.name + '」（' + rc[0] + '）', false);
}
function onChat(p) {
  if (!p || typeof p !== 'object') return;
  const rp = typeof p.i === 'string' ? remotes.get(p.i) : null;
  const text = clean(p.t, 40).trim();
  if (!rp || !text) return;
  rp.bubble = { txt: text, at: performance.now() };
  addLog(rp.name, text, false);
}
/* 同一個主題的頻道在 supabase-js 裡會被重用：舊的還沒離開乾淨就用同名開新的，會拿到壞掉的舊頻道。
   所以每次換頻道都要等舊的完全移除後才建立新的。 */
let netGate = Promise.resolve(), netTok = 0;
const dropChannel = ch => { try { return Promise.resolve(sb.removeChannel(ch)).catch(() => {}); } catch (e) { return Promise.resolve(); } };
function stopNet() {
  netTok++;
  if (!net) return;
  const n = net; net = null;
  netGate = netGate.then(() => dropChannel(n.ch));
}
function startNet(rm, priv) {
  stopNet();
  const tok = netTok;
  netGate.then(() => {
    if (tok !== netTok) return;                // 等待期間已經離開或換房了
    const ch = sb.channel('village:' + rm, { config: { private: priv, presence: { key: myUid }, broadcast: { self: false, ack: false } } });
    net = { ch, room: rm, priv, ok: false, wasOk: false, bad: 0, synced: false };
    ch.on('presence', { event: 'sync' }, () => onSync(ch))
      .on('broadcast', { event: 'pos' }, m => onPos(m && m.payload))
      .on('broadcast', { event: 'bye' }, m => onBye(m && m.payload))
      .on('broadcast', { event: 'chat' }, m => onChat(m && m.payload))
      .on('broadcast', { event: 'fish' }, m => onFish(m && m.payload))
      .on('broadcast', { event: 'show' }, m => onShow(m && m.payload))
      .on('broadcast', { event: 'emo' }, m => onEmo(m && m.payload))
      .on('broadcast', { event: 'pact' }, m => onPact(m && m.payload))
      .on('broadcast', { event: 'kick' }, m => onKick(m && m.payload))
      .on('broadcast', { event: 'ate' }, m => onAte(m && m.payload))
      .on('broadcast', { event: 'tv' }, m => onTv(m && m.payload))
      .on('broadcast', { event: 'pno' }, m => onPno(m && m.payload))
      .subscribe(status => {
        if (!net || net.ch !== ch) return;
        if (status === 'SUBSCRIBED') { net.ok = true; net.wasOk = true; net.bad = 0; lastSendAt = 0; trackSelf(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (net.ok || net.wasOk) { net.ok = false; return; }   // 連上後才斷線：supabase-js 會自動重連，netWatch 看門狗負責兜底
          if (status === 'CLOSED') return;
          if (priv) startNet(rm, false);          // 備援：改用公開頻道
          else { addSys('連不上即時連線，暫時只能看到自己。'); if (rm.indexOf('house-') !== 0) toast('廣場的即時連線失敗，請重新整理再試'); }
        }
      });
  });
}
function enterPlaza(info) {
  roomInfo = info; scene = 'plaza'; K = pkind; pose = null;
  remotes.clear(); vLog.innerHTML = ''; myBubble = null; myShow = null; lastPosKey = ''; posAcc = 0;
  pl.x = pl.sx = 10; pl.y = pl.sy = 11; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  vPanel.hidden = false; renderVillage();
  addSys(info.kind === 'public' ? '歡迎來到公開廣場，和路過的朋友打個招呼吧。' : '私人村的邀請碼是 ' + info.code + '，把它傳給朋友就能進來。');
  startNet(info.room, true);
  clearInterval(pingTimer);
  pingTimer = setInterval(async () => {
    try {
      const alive = await rpc('village_ping');
      if (!alive && roomInfo && scene === 'plaza') {                 // 太久沒心跳被移出了，重新登記
        const again = await rpc('village_join', roomInfo.kind === 'private' ? { p_mode: 'private_join', p_code: roomInfo.code } : { p_mode: 'public', p_code: null });
        if (again.room !== roomInfo.room) enterPlaza(again);
      }
    } catch (e) { /* 下次再試 */ }
  }, 20000);
}
function sayBye() { try { if (net && net.ok) net.ch.send({ type: 'broadcast', event: 'bye', payload: { i: myUid } }); } catch (e) { /* 略過 */ } }
window.addEventListener('pagehide', sayBye);
function leaveVillage(silent) {
  leaveLekcus(true);
  pAct = null; pIn = null; hidePactBox(); sayBye(); stopNet(); clearInterval(pingTimer); if (pose && (pose.bench || pose.ground)) pose = null;
  const was = scene === 'plaza';
  scene = 'farm'; K = kind; roomInfo = null; remotes.clear(); myBubble = null; myShow = null;
  vPanel.hidden = true;
  if (sb && ready) rpc('village_leave').catch(() => {});
  if (was) {
    pl.x = pl.sx = 18; pl.y = pl.sy = 5; pl.prog = 1; pl.face = 'left'; pressed.length = 0;
    if (!silent) toast('回到農場了');
  }
}
async function joinVillage(mode, code, k) {
  try {
    const info = mode === 'room' ? await rpc('village_join_pub', { p_k: k }) : await rpc('village_join', { p_mode: mode, p_code: code || null });
    closeVMenu(); enterPlaza(info);
  } catch (e) { toast(errText(e)); renderVMenu(); loadVRooms(); }
}
function sendPos(dt) {
  posAcc += dt;
  const now = performance.now();
  const key = worldKey() + ',' + pl.x + ',' + pl.y + ',' + pl.face + ',' + (sitCode());
  /* 節流（為了不超過 Supabase 免費版 Realtime 每秒 100 則的上限）：
     有別人在房間：走動最多每 200ms 一則（最後停下的那格一定會補送）、心跳維持每 3 秒（對方 8 秒沒聽到才會移除，要留掉一則包的餘裕）；
     房間裡只有自己：沒人在聽，走動不廣播、心跳拉長到 10 秒（新來的人會從 presence 拿到你的位置）。 */
  const others = remotes.size > 0;
  const moved = key !== lastPosKey && posAcc >= (others ? 200 : 2000);
  const beat = !!(net && net.ok) && now - lastSendAt > (others ? 3000 : 10000);   // 心跳：站著不動也定期補一次位置，弄丟的訊息會自己補回來
  if ((moved || beat) && net && net.ok) {
    posAcc = 0; lastPosKey = key; lastSendAt = now;
    if (moved) lastMoveAt = now;
    try { net.ch.send({ type: 'broadcast', event: 'pos', payload: beat ? { i: myUid, w: worldKey(), x: pl.x, y: pl.y, f: FACEIDX[pl.face], s: sitCode(), n: me.name, c: me.look } : { i: myUid, w: worldKey(), x: pl.x, y: pl.y, f: FACEIDX[pl.face], s: sitCode() } }); } catch (e) { /* 略過 */ }
    if (moved && now - lastTrackAt > 4000) { lastTrackAt = now; trackSelf(); }   // presence 只當備援，降低頻率以免超過 Realtime 的訊息上限
  }
  if (lastMoveAt && now - lastMoveAt > 500) { lastMoveAt = 0; trackSelf(); }
}
/* 看門狗：頻道連上後如果掉線又沒自己恢復，就整條重建；回到前景、網路恢復時也會檢查 */
function netWatch(force) {
  if (!ready || !sb) return;
  if (net && (scene === 'plaza' || scene === 'tarot' || scene === 'house')) {
    const st = net.ch.state;
    if (st === 'joined') { net.bad = 0; if (!net.ok) { net.ok = true; trackSelf(); } }
    else if (net.wasOk && (force || ++net.bad >= 2)) { addSys('連線中斷，重新連線中…'); startNet(net.room, net.priv); return; }
  }
  if (pres) {
    if (pres.ch.state === 'joined') { pres.bad = 0; if (!pres.ok) { pres.ok = true; trackWhere(true); } }
    else if (pres.ok && (force || (pres.bad = (pres.bad || 0) + 1) >= 2)) startPresence();
  }
}
setInterval(netWatch, 4000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !ready) return;
  netWatch(false);
  setTimeout(() => { if (net && net.ok) { lastSendAt = 0; trackSelf(); } if (pres && pres.ok) trackWhere(true); }, 600);   // 回到前景：重新宣告自己的位置與狀態
});
window.addEventListener('online', () => setTimeout(() => netWatch(true), 3000));
function netFish(p) {
  if (scene !== 'plaza' || !net || !net.ok) return;
  try { net.ch.send({ type: 'broadcast', event: 'fish', payload: { i: myUid, ...p } }); } catch (e) { /* 略過 */ }
}
let lastShow = 0;
const canShowHere = () => true;
/* 展示魚或蟲蝶：在廣場會廣播給大家；在家裡只有自己看得到，卡片會停留較久 */
function showItem(kind, key) {
  kind = kind === 'bug' ? 'bug' : 'fish';
  const f = (kind === 'bug' ? bugCat : fishCat).find(x => x.key === key);
  if (!f || !((kind === 'bug' ? bugLog : fishLog)[key] > 0)) return;
  const now = performance.now();
  if (now - lastShow < 1500) { toast('慢一點，別洗頻喔', 1200); return; }
  lastShow = now;
  const rc = RARITY[f.rarity] || ['', '#e0b896'];
  if (syncScene() && net && net.ok) {
    try { net.ch.send({ type: 'broadcast', event: 'show', payload: { i: myUid, k: key, t: kind } }); } catch (e) { return; }
    addLog(me.name, '展示了「' + f.name + '」（' + rc[0] + '）', true);
  } else toast('展示中：' + f.name + '（' + rc[0] + '）' + (scene === 'plaza' ? '（尚未連上廣場，只有你看得到）' : ''), 1800);
  myShow = { kind, k: key, name: f.name, col: rc[1], at: now, dur: syncScene() && net && net.ok ? 7000 : 20000 };
}
const showFish = key => showItem('fish', key);
function sendChat(text) {
  text = clean(text, 40).trim();
  if (!text || !net || !net.ok) return;
  const now = performance.now();
  if (now - lastChat < 900) { toast('慢一點，別洗頻喔', 1200); return; }
  lastChat = now;
  try { net.ch.send({ type: 'broadcast', event: 'chat', payload: { i: myUid, t: text } }); } catch (e) { return; }
  myBubble = { txt: text, at: now };
  addLog(me.name, text, true);
}
$('v-form').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('v-input'), v = inp.value;
  inp.value = '';
  sendChat(v);
});
['你好！', '一起來玩', '好可愛', '哈哈', '謝謝', '再見'].forEach(t => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'qbtn'; b.textContent = t;
  b.addEventListener('click', () => sendChat(t));
  $('v-quick').appendChild(b);
});
