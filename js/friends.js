'use strict';
/* 好友與友情等級 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 好友 ---------- */
const frEl = $('frmenu'), frCard = $('frcard');
let fr = { friends: [], incoming: [], outgoing: [], max: 50 }, frTarget = null, frConfirm = '', frMsg = '';
let seenMap = {}, onlineMap = new Map(), pres = null, lastWhere = '', whereTimer = 0, frBusy = false;
const WHERE = { farm: '在農場', plaza: '在廣場', house: '在屋子裡' };
const isFriend = uid => fr.friends.some(f => f.uid === uid);
/* ---------- 友情等級：只靠雙人互動動作升級，每對好友每天只算第一次（伺服器 friend_act_*） ---------- */
const BOND_NEED = [0, 0, 3, 10, 25, 50];
const todayStr = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);   // 和伺服器一樣以 UTC+8 換日
let bonds = new Map(), bondPhoto = false;
const bondOf = uid => bonds.get(uid) || { cnt: 0, lv: 1, day: '' };
function applyBonds(d) {
  const m = new Map();
  (d && Array.isArray(d.bonds) ? d.bonds : []).slice(0, 300).forEach(b => {
    if (b && typeof b.uid === 'string') m.set(b.uid, { cnt: intIn(b.cnt, 0, 100000, 0), lv: intIn(b.lv, 1, 5, 1), day: typeof b.day === 'string' ? b.day.slice(0, 10) : '' });
  });
  bonds = m; bondPhoto = !!(d && d.photo);
  if (frOpen) renderFriends();
}
async function loadBonds() { try { applyBonds(await rpc('bond_get')); } catch (e) { /* 伺服器還沒裝友情功能就略過 */ } }
function bondLine(b) {
  const nx = b.lv < 5 ? BOND_NEED[b.lv + 1] - b.cnt : 0;
  return '互動 ' + b.cnt + ' 次' + (nx > 0 ? '（再 ' + nx + ' 次升級）' : '（已滿級）') + (b.day === todayStr() ? ' · 今天 ✓' : '');
}
function bondToast(uid, lv) {
  const f = fr.friends.find(x => x.uid === uid), un = Object.keys(PACTS).filter(k => PACTS[k].need === lv).map(k => PACTS[k].n)[0];
  toast('❤️ 你和 ' + (f ? f.name : '好友') + ' 的友情升到 Lv.' + lv + '！' + (un ? '解鎖「' + un + '」' : ''), 4200); chime([76, 81, 88], 0.12);
}
function pactPanel(uid) {
  const b = bondOf(uid);
  let h = '<h3>一起玩　<span class="bondtag">❤️Lv.' + b.lv + '</span></h3><p class="empty">' + bondLine(b) + '。要雙方都同意才算，每天第一次互動才算次數。</p><div class="pgrid">';
  Object.keys(PACTS).forEach(k => {
    const P = PACTS[k], lock = b.lv < P.need;
    h += '<button type="button" class="btn small' + (lock ? ' ghost' : '') + '" data-a="pact" data-p="' + k + '" data-u="' + esc(uid) + '"' + (lock ? ' disabled' : '') + '>' + P.ic + ' ' + P.n + (lock ? ' 🔒Lv.' + P.need : '') + '</button>';
  });
  return h + '</div>';
}
function applyFriends(d) {
  const arr = v => Array.isArray(v) ? v.slice(0, 200) : [];
  const row = o => ({ uid: typeof o.uid === 'string' ? o.uid.slice(0, 40) : '', username: clean(o.username, 16), name: clean(o.name, 8) || '旅人' });
  const before = fr.incoming.length;
  fr = { friends: arr(d && d.friends).map(row), incoming: arr(d && d.incoming).map(row), outgoing: arr(d && d.outgoing).map(row), max: intIn(d && d.max, 1, 500, 50) };
  const bd = $('dockbadge'); bd.hidden = !fr.incoming.length; bd.textContent = fr.incoming.length;
  const bd2 = $('immfb'); if (bd2) { bd2.hidden = !fr.incoming.length; bd2.textContent = fr.incoming.length; }
  updateFoldBadge();
  if (fr.incoming.length > before) toast('收到新的好友申請！按 F 或點右上角的好友圖示查看', 4000);
  if (frOpen) renderFriends();
}
async function loadFriends() {
  try { applyFriends(await rpc('friend_list')); } catch (e) { /* 下次再試 */ }
  try { const m = await rpc('friend_seen'); seenMap = m && typeof m === 'object' ? m : {}; if (frOpen) renderFriends(); } catch (e) { /* 伺服器還沒裝最後上線功能就略過 */ }
}
function touchSeen() { rpc('touch_seen').catch(() => {}); }          // 告訴伺服器「我現在在線」
function agoText(ms) {
  if (!ms) return '離線';
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (m < 1) return '離線 · 剛剛上線';
  if (m < 60) return '離線 · ' + m + ' 分鐘前上線';
  const h = Math.floor(m / 60);
  if (h < 24) return '離線 · ' + h + ' 小時前上線';
  const d = Math.floor(h / 24);
  return '離線 · ' + (d > 30 ? '30 天以上' : d + ' 天前') + '上線';
}
function trackWhere(force) {
  if (!pres || !pres.ok) return;
  if (!force && scene === lastWhere) return;
  lastWhere = scene;
  trackLimited('where', () => {
    if (!pres || !pres.ok) return;
    try { pres.ch.track({ w: scene }); } catch (e) { /* 略過 */ }
  });
}
function stopPresence() {
  clearInterval(whereTimer);
  if (!pres) return;
  const p = pres; pres = null; onlineMap = new Map(); presTok++;
  netGate = netGate.then(() => dropChannel(p.ch));
}
let presTok = 0;
function startPresence() {
  stopPresence();
  if (!myUid) return;
  const tok = presTok;
  netGate.then(() => { if (tok === presTok && !pres) openPresence(); });
}
function openPresence() {
  const ch = sb.channel('friends:online', { config: { presence: { key: myUid }, broadcast: { self: false, ack: false } } });
  pres = { ch, ok: false }; lastWhere = '';
  ch.on('presence', { event: 'sync' }, () => {
    if (!pres || pres.ch !== ch) return;
    const st = ch.presenceState() || {}, m2 = new Map();
    Object.keys(st).forEach(id => { const m = (st[id] && st[id][0]) || {}; m2.set(id, WHERE[m.w] ? m.w : 'farm'); });
    onlineMap = m2;
    if (frOpen) renderFriends();
  }).on('broadcast', { event: 'fr' }, m => {
    const p = m && m.payload;
    if (p && p.to === myUid) loadFriends();
  }).on('broadcast', { event: 'bell' }, m => onBell(m && m.payload)).subscribe(st => {
    if (!pres || pres.ch !== ch) return;
    if (st === 'SUBSCRIBED') { pres.ok = true; trackWhere(true); }
  });
  whereTimer = setInterval(() => trackWhere(false), 1000);
}
async function loadGifts() {
  try {
    const r = await rpc('gift_inbox');
    if (r && r.inv) Object.assign(inv, r.inv);
    const gs = (r && r.gifts) || [];
    if (gs.length) { toast('🎁 收到 ' + gs.map(x => clean(x.from, 8) + ' 送的' + itemName(String(x.item))).slice(0, 3).join('、') + (gs.length > 3 ? ' 等 ' + gs.length + ' 份禮物' : '')); chime([76, 81], 0.12); refreshHud(); }
  } catch (e) { /* 伺服器還沒裝送禮功能就略過 */ }
}
function afterReady() { loadVisitCfg(); touchSeen(); loadFriends(); loadBonds(); mailLoad(true); startPresence(); loadQuests(); loadLevel(); rpc('story_get').then(d => { stData = d; }).catch(() => {}); }
function notifyFriend(uid) {
  if (!pres || !pres.ok || !uid) return;
  try { pres.ch.send({ type: 'broadcast', event: 'fr', payload: { to: uid } }); } catch (e) { /* 略過 */ }
}
function renderFriends() {
  let h = '<div class="shop-h"><h2>好友 ' + fr.friends.length + '/' + fr.max + '</h2></div>';
  if (frMsg) h += '<p class="mk-msg">' + esc(frMsg) + '</p>';
  if (frTarget) {
    const t = frTarget;
    let act;
    if (isFriend(t.id)) act = pactPanel(t.id) + '<p class="empty">你們已經是好友了。</p><button type="button" class="btn wide ghost" data-a="card" data-u="' + esc(t.id) + '">看 ' + esc(t.name) + ' 的名片</button><button type="button" class="btn wide" data-a="visit" data-u="' + esc(t.id) + '">拜訪 ' + esc(t.name) + ' 的家</button><button type="button" class="btn wide ghost" data-a="block" data-u="' + esc(t.id) + '">禁止 ' + esc(t.name) + ' 拜訪</button>';
    else if (fr.incoming.some(f => f.uid === t.id)) act = '<button type="button" class="btn wide" data-a="accept" data-u="' + esc(t.id) + '">接受 ' + esc(t.name) + ' 的好友申請</button>';
    else if (fr.outgoing.some(f => f.uid === t.id)) act = '<p class="empty">已送出申請，等對方同意。</p>';
    else act = '<button type="button" class="btn wide" data-a="reqid" data-u="' + esc(t.id) + '">加 ' + esc(t.name) + ' 為好友</button>';
    h += '<div class="offer"><p><b>' + esc(t.name) + '</b></p></div>' + act;
  }
  if (fr.incoming.length) {
    h += '<h3>收到的申請</h3>' + fr.incoming.map(f => '<div class="frow"><div class="meta"><b>' + esc(f.name) + '</b><small>@' + esc(f.username) + '</small></div><div class="acts">' +
      '<button type="button" class="btn small" data-a="accept" data-u="' + esc(f.uid) + '">接受</button>' +
      '<button type="button" class="btn small ghost" data-a="clear" data-u="' + esc(f.uid) + '">拒絕</button></div></div>').join('');
  }
  h += '<h3>我的好友</h3>';
  if (!fr.friends.length) h += '<p class="empty">還沒有好友。在廣場面向其他玩家按動作鍵，或在下面輸入帳號。</p>';
  else {
    const list = fr.friends.slice().sort((a, b) => (onlineMap.has(b.uid) ? 1 : 0) - (onlineMap.has(a.uid) ? 1 : 0));
    h += list.map(f => {
      const w = onlineMap.get(f.uid);
      return '<div class="frow"><div class="meta"><b><span class="fdot' + (w ? ' on' : '') + '"></span>' + esc(f.name) + ' <span class="bondtag" title="友情等級">❤️Lv.' + bondOf(f.uid).lv + '</span></b><small>@' + esc(f.username) + ' · ' + (w ? WHERE[w] : agoText(+seenMap[f.uid] || 0)) + '<br>' + bondLine(bondOf(f.uid)) + '</small></div><div class="acts">' +
        '<button type="button" class="btn small ghost" data-a="card" data-u="' + esc(f.uid) + '">名片</button>' +
        '<button type="button" class="btn small ghost" data-a="mail" data-u="' + esc(f.uid) + '">寄信</button>' +
        '<button type="button" class="btn small" data-a="visit" data-u="' + esc(f.uid) + '">拜訪</button>' +
        (frConfirm === f.uid ? '<button type="button" class="btn small" data-a="remove" data-u="' + esc(f.uid) + '">確定刪除</button>'
                             : '<button type="button" class="btn small ghost" data-a="rmask" data-u="' + esc(f.uid) + '">刪除</button>') + '</div></div>';
    }).join('');
  }
  if (fr.outgoing.length) {
    h += '<h3>等待對方回覆</h3>' + fr.outgoing.map(f => '<div class="frow"><div class="meta"><b>' + esc(f.name) + '</b><small>@' + esc(f.username) + '</small></div><div class="acts">' +
      '<button type="button" class="btn small ghost" data-a="clear" data-u="' + esc(f.uid) + '">取消</button></div></div>').join('');
  }
  h += '<h3>用帳號加好友</h3><div class="gmrow"><input class="nameinput" id="fr-user" type="text" maxlength="16" autocapitalize="none" autocomplete="off" placeholder="對方的帳號"><button type="button" class="btn small" data-a="requser">送出申請</button></div>' +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  const keep = $('fr-user') ? $('fr-user').value : '';
  frCard.innerHTML = h;
  if (keep) $('fr-user').value = keep;
}
function openFriends(target) {
  if (!ready || !me || frOpen || shopOpen || makerOpen || bagOpen) return;
  frOpen = true; pressed.length = 0; frTarget = target || null; frConfirm = ''; frMsg = '';
  renderFriends(); frEl.hidden = false; frCard.focus(); loadFriends();
}
function closeFriends() { frOpen = false; frEl.hidden = true; frTarget = null; }
