'use strict';
/* 拜訪、表情、友情互動、坐椅子與躺床 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 拜訪好友的家（唯讀：看得到擺設與展示品，不能動） ---------- */
/* ---------- 表情與動作：在廣場會同步給其他玩家，其他地方只有自己看得到 ---------- */
const EMOTES = [
  { id: 'heart', ic: '❤️', n: '愛心' }, { id: 'happy', ic: '😄', n: '開心' }, { id: 'laugh', ic: '😂', n: '大笑' }, { id: 'wow', ic: '😮', n: '驚訝' },
  { id: 'angry', ic: '💢', n: '生氣' }, { id: 'sad', ic: '😢', n: '難過' }, { id: 'sleepy', ic: '💤', n: '想睡' }, { id: 'music', ic: '🎵', n: '哼歌' },
  { id: 'what', ic: '❓', n: '疑問' }, { id: 'idea', ic: '💡', n: '靈感' }, { id: 'star', ic: '✨', n: '閃亮' }, { id: 'like', ic: '👍', n: '讚' },
  { id: 'clap', ic: '👏', n: '喝采', hide: true }   // 有人煮菜時的「喝采」按鈕用，不放進表情選單
];
const ANIMS = {
  wave: { ic: '👋', n: '揮手', dur: 1800 }, jump: { ic: '🦘', n: '跳躍', dur: 1000 }, dance: { ic: '💃', n: '跳舞', dur: 3000 },
  spin: { ic: '🌀', n: '轉圈', dur: 1200 }, bow: { ic: '🙇', n: '鞠躬', dur: 1300 },
  p_clap: { ic: '🙌', n: '擊掌', dur: 1500, pair: true }, p_dance: { ic: '💃', n: '一起跳舞', dur: 4000, pair: true },
  p_hug: { ic: '🤗', n: '擁抱', dur: 2400, pair: true }, p_photo: { ic: '📸', n: '合照', dur: 2200, pair: true },
  eat: { ic: '🍙', n: '吃東西', dur: 2800, hide: true }   // 吃料理時自動播放，不放進表情選單
};
let myEmo = null, anim = null, lastEmo = 0;
/* 動作在這一刻的樣子：位移、朝向、壓扁（鞠躬）、舉手（揮手） */
function animFx(a, now) {
  if (!a) return null;
  const A = ANIMS[a.id], t = now - a.t0;
  if (!A || t < 0 || t > A.dur) return null;
  const fx = { dx: 0, dy: 0, face: null, sy: 1, hand: 0, mv: false, ph: null };
  if (a.id === 'jump') fx.dy = -Math.abs(Math.sin(t / A.dur * Math.PI * 2)) * 6;
  else if (a.id === 'dance' || a.id === 'p_dance') {
    fx.dx = Math.round(Math.sin(t / 160) * 2); fx.dy = -Math.abs(Math.sin(t / 160)) * 2;
    fx.mv = true; fx.ph = Math.floor(t / 160) % 2; fx.face = ['down', 'right', 'down', 'left'][Math.floor(t / 320) % 4];
  } else if (a.id === 'spin') fx.face = ['down', 'right', 'up', 'left'][Math.floor(t / 100) % 4];
  else if (a.id === 'bow') fx.sy = 1 - Math.sin(t / A.dur * Math.PI) * 0.22;
  else if (a.id === 'wave') fx.hand = 1 + (Math.floor(t / 180) % 2);
  else if (a.id === 'p_clap' || a.id === 'p_hug') {   // 面向對方、往對方靠一點
    const k = Math.sin(t / A.dur * Math.PI), lunge = a.id === 'p_hug' ? 4 : 2;
    fx.face = a.face; fx.dx = Math.round((a.sx || 0) * lunge * k); fx.dy = Math.round((a.sy || 0) * lunge * k);
    if (a.id === 'p_clap') fx.hand = 1 + (Math.floor(t / 150) % 2); else fx.sy = 1 - k * 0.06;
  } else if (a.id === 'p_photo') { fx.face = 'down'; fx.hand = 1 + (Math.floor(t / 280) % 2); }
  else if (a.id === 'eat') {   // 舉起食物咬三口，接著擴散效果光環、buff 圖示飄起來
    fx.face = 'down'; fx.hand = (t > 150 && t < 1350) ? 1 : 0;
    const bt = (t - 350) / 400, bites = bt < 0 ? 0 : Math.min(3, Math.floor(bt) + 1);
    if (bt >= 0 && bt < 3 && (bt % 1) < 0.3) fx.dy = -1;   // 每咬一口點一下頭
    fx.eat = { t, rem: (3 - bites) / 3, bt, col: DISHC[a.d] || '#f3c77a', b: a.b };
  }
  return fx;
}
function drawPlayerFx(px, py, face, moving, phase, ch, fx) {
  if (!fx) { drawPlayer(px, py, face, moving, phase, ch); return; }
  g.save();
  if (fx.sy !== 1) { g.translate(0, py + 14); g.scale(1, fx.sy); g.translate(0, -(py + 14)); }
  drawPlayer(px + fx.dx, py + Math.round(fx.dy), fx.face || face, fx.mv || moving, fx.ph != null ? fx.ph : phase, ch);
  g.restore();
  if (fx.hand) {
    const skin = SKINS[(ch || DEF_CHAR).skin] || SKINS[0], hx = px + fx.dx + 13 + (fx.hand === 2 ? 1 : 0);
    r(shade(skin, 0.82), hx, py + 1, 3, 7); r(skin, hx + 1, py + 2, 1, 5);
  }
  if (fx.eat) drawEatFx(px + fx.dx, py + Math.round(fx.dy), fx.eat);
}
const EAT_AURA = { swift: '#5fb8e6', fish: '#4fd0d8', bug: '#7fd08a' };   // 光環顏色跟 buff 走
function drawEatFx(px, py, e) {
  const t = e.t;
  g.save();
  if (t < 1700 && e.rem > 0) {   // 手上的食物：從手邊舉到嘴邊，一口比一口小
    const k = clamp(t / 350, 0, 1), w = Math.max(2, Math.round(7 * e.rem)), h = Math.max(2, Math.round(5 * e.rem));
    const x = Math.round(px + 14 - 4 * k), y = Math.round(py + 9 - 4 * k);
    r(e.col, x, y, w, h); r(shade(e.col, 0.78), x, y + h - 1, w, 1);
  }
  if (e.bt >= 0 && e.bt < 3.6) {   // 咬下去掉碎屑
    const ph = e.bt % 1;
    if (ph < 0.5 && e.bt < 3) { const f = Math.round(ph * 10); r(e.col, px + 9, py + 8 + f, 1, 1); r(e.col, px + 12, py + 9 + f, 1, 1); }
  }
  if (t >= 1500 && t < 2500 && EAT_AURA[e.b]) {   // 效果光環
    const p = (t - 1500) / 1000;
    [0, 0.22].forEach((j, n) => {
      const pj = p - j; if (pj <= 0 || pj >= 1) return;
      g.globalAlpha = 1 - pj; g.strokeStyle = n ? '#ffffff' : EAT_AURA[e.b]; g.lineWidth = 2;
      g.beginPath(); g.arc(px + 8, py + 10, 4 + pj * 14, 0, Math.PI * 2); g.stroke();
    });
    g.globalAlpha = 1 - p;
    for (let i = 0; i < 4; i++) { const an = p * 3 + i * Math.PI / 2; r('#ffffff', Math.round(px + 8 + Math.cos(an) * (6 + p * 10)), Math.round(py + 10 + Math.sin(an) * (6 + p * 10)), 1, 1); }
  }
  if (t >= 1500 && BUFF_I[e.b]) {   // buff 圖示往上飄、最後淡出
    const q = (t - 1500) / 1300;
    g.globalAlpha = q > 0.7 ? clamp((1 - q) / 0.3, 0, 1) : 1;
    g.font = '10px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
    g.fillText(BUFF_I[e.b], px + 8, py - 3 - q * 14);
  }
  g.restore();
}
/* 頭旁邊的表情泡泡（cx, cy = 泡泡左下角） */
function emoteBubble(e, cx, cy, now) {
  const age = now - e.at, em = EMOTES.find(x => x.id === e.id);
  if (!em || age < 0 || age > 3200) return;
  const w = 14, h = 14, bob = Math.round(Math.sin(now / 220)), y = cy - h + bob - (age < 160 ? Math.round((1 - age / 160) * 4) : 0);
  ctx.globalAlpha = clamp((3200 - age) / 500, 0, 1);
  ob('#ffffff', '#e0b896', cx, y, w, h);
  r('#e0b896', cx + 1, y + h, 2, 1); r('#ffffff', cx + 2, y + h - 1, 1, 1);
  ctx.font = '9px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
  ctx.fillText(em.ic, cx + w / 2, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}
function doEmote(kind, id) {
  if (!ready || !me) return;
  const now = performance.now();
  if (now - lastEmo < 700) return;
  if (kind === 'a') {
    if (!ANIMS[id] || ANIMS[id].pair) return;
    if (pose) { toast('起身後才能做動作', 1500); return; }
    if (fishing || cooking) { toast((cooking ? '烹飪' : '釣魚') + '的時候不能做動作', 1500); return; }
    anim = { id, t0: now };
  } else if (EMOTES.some(x => x.id === id)) myEmo = { id, at: now };
  else return;
  lastEmo = now;
  if (syncScene() && net && net.ok) {
    try { net.ch.send({ type: 'broadcast', event: 'emo', payload: { i: myUid, k: kind === 'a' ? 'a' : 'e', e: id } }); } catch (e) { /* 略過 */ }
  }
}
/* 吃料理的動作：d = 料理 key、b = buff 種類（只用來決定顏色和圖示） */
function playEat(d, b) {
  if (!ready || !me || pose || fishing || cooking) return;
  const now = performance.now();
  anim = { id: 'eat', t0: now, d, b };
  lastEmo = now;
  if (syncScene() && net && net.ok) {
    try { net.ch.send({ type: 'broadcast', event: 'emo', payload: { i: myUid, k: 'a', e: 'eat', d, b } }); } catch (e) { /* 略過 */ }
  }
}
/* 別人的表情與動作：只認得清單裡的 id，其他一律丟掉 */
function onEmo(p) {
  if (!p || typeof p !== 'object') return;
  const rp = typeof p.i === 'string' ? remotes.get(p.i) : null;
  if (!rp || typeof p.e !== 'string') return;
  const now = performance.now();
  if (p.k === 'a' && p.e === 'eat') {   // 吃東西：料理和 buff 都要是認得的才播
    const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
    if (own(DISHC, p.d) && own(BUFF_I, p.b) && !rp.sit && !rp.gsit && !rp.fs) rp.anim = { id: 'eat', t0: now, d: p.d, b: p.b };
    return;
  }
  if (p.k === 'a' && ANIMS[p.e] && !ANIMS[p.e].pair && !rp.sit && !rp.gsit && !rp.fs) rp.anim = { id: p.e, t0: now };
  else if (p.k === 'e' && EMOTES.some(x => x.id === p.e)) rp.emo = { id: p.e, at: now };
}
const emEl = $('emm'), emCard = $('emcard');
function openEmote() {
  if (!ready || !me || authOpen || paused()) return;
  if (cOpen) closeChat();
  const btn = (k, id, ic, n) => '<button type="button" data-k="' + k + '" data-e="' + id + '" title="' + n + '" aria-label="' + n + '">' + ic + '</button>';
  emCard.innerHTML = '<div class="eg">' + EMOTES.filter(e => !e.hide).map(e => btn('e', e.id, e.ic, e.n)).join('') + '</div>' +
    '<div class="eg">' + Object.keys(ANIMS).filter(id => !ANIMS[id].pair && !ANIMS[id].hide).map(id => btn('a', id, ANIMS[id].ic, ANIMS[id].n)).join('') + '</div>' +
    (chatOn() ? '<div class="eg qq">' + QUICK_CHAT.map(t => btn('q', t, t, t)).join('') + btn('t', '', '✏️ 自己輸入', '自己輸入') + '</div>' : '');
  emOpen = true; emEl.hidden = false; cFab.classList.add('on');
}
function closeEmote() { emOpen = false; emEl.hidden = true; if (!cOpen) cFab.classList.remove('on'); }
emCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-k]');
  if (!b) return;
  if (b.dataset.k === 'q') { closeEmote(); sendChat(b.dataset.e); return; }
  if (b.dataset.k === 't') { closeEmote(); openChat(true); return; }
  closeEmote(); doEmote(b.dataset.k, b.dataset.e);
});
document.addEventListener('pointerdown', e => { if (emOpen && !emEl.contains(e.target) && !cFab.contains(e.target)) closeEmote(); });

/* ---------- 友情互動：雙人動作（要對方按同意；伺服器每對好友每天只算第一次，見 friendship.sql） ---------- */
const PACTS = {
  clap:  { ic: '🙌', n: '擊掌',     need: 1, anim: 'p_clap' },
  dance: { ic: '💃', n: '一起跳舞', need: 2, anim: 'p_dance' },
  sit:   { ic: '🧘', n: '坐在地上', need: 3 },
  hug:   { ic: '🤗', n: '擁抱',     need: 4, anim: 'p_hug' },
  photo: { ic: '📸', n: '合照',     need: 5, anim: 'p_photo' }
};
let pAct = null, pIn = null, pTimer = 0;      // pAct：我發出的邀請；pIn：收到的邀請
const pbox = document.createElement('div'); pbox.id = 'pactbox'; pbox.hidden = true; document.body.appendChild(pbox);
function sendPact(to, t, a, s) {
  if (!net || !net.ok) return;
  try { net.ch.send({ type: 'broadcast', event: 'pact', payload: { i: myUid, to, t, a, s: s ? 1 : 0 } }); } catch (e) { /* 略過 */ }
}
const dirTo = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
const nearRemote = rp => !!rp && hereRp(rp) && Math.abs(rp.tx - pl.x) + Math.abs(rp.ty - pl.y) === 1;   // 上下左右相鄰一格
async function pactInvite(uid, act) {
  const P = PACTS[act], rp = remotes.get(uid);
  if (!P || !ready || !me) return;
  if (!syncScene() || !net || !net.ok) { toast('要連上即時連線才能做雙人動作（廣場、塔羅屋、屋子裡都可以）', 2600); return; }
  if (!rp || !nearRemote(rp)) { toast('距離不夠：走到對方的上、下、左或右一格，面對面才能邀請', 3200); return; }
  if (fishing || cooking) { toast((cooking ? '烹飪' : '釣魚') + '的時候不能互動', 1800); return; }
  if (pose) { toast('起身後才能邀請', 1800); return; }
  const b = bondOf(uid);
  if (b.lv < P.need) { toast('友情等級還不夠：' + P.n + ' 要 Lv.' + P.need, 2400); return; }
  if (pAct && performance.now() - pAct.at < 15000) { toast('邀請還在等對方回覆', 1800); return; }
  let done = b.day === todayStr() && act !== 'photo';        // 今天已經算過：只播動畫，不用打伺服器
  if (!done) {
    try { const r = await rpc('friend_act_request', { p_uid: uid, p_act: act }); done = !!(r && r.today); }
    catch (e) { toast(errText(e)); return; }
  }
  const tok = pAct = { to: uid, act, at: performance.now(), done };
  sendPact(uid, 'req', act, done);
  toast('已邀請 ' + rp.name + '，等對方按同意…', 2400);
  setTimeout(() => { if (pAct === tok) { pAct = null; toast(rp.name + ' 沒有回應', 2000); } }, 15000);
}
function onPact(p) {
  if (!p || typeof p !== 'object' || typeof p.i !== 'string' || typeof p.a !== 'string') return;
  const rp = remotes.get(p.i);
  if (!rp || !PACTS[p.a]) return;
  if (p.t === 'up') { if (pose && pose.pair === p.i) standUp(); return; }      // 坐在地上：對方起身，我也跟著起身
  if (p.to !== myUid) {                        // 不是對我說的：旁觀。雙方一同意（ok），旁邊的人也播兩人的動畫
    if (p.t === 'ok' && p.i !== myUid && typeof p.to === 'string') watchPact(p.a, rp, remotes.get(p.to));
    return;
  }
  if (p.t === 'req') {
    const P = PACTS[p.a];
    if (!isFriend(p.i) || bondOf(p.i).lv < P.need || fishing || pose || !syncScene() || !nearRemote(rp) || pIn) { sendPact(p.i, 'no', p.a); return; }
    pIn = { from: p.i, act: p.a, s: p.s === 1, at: performance.now() };
    showPactBox(rp.name, P); chime([81, 88], 0.1); if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (_) {}
    clearTimeout(pTimer); pTimer = setTimeout(() => { if (pIn && pIn.from === p.i) { pIn = null; hidePactBox(); } }, 15000);
  } else if (p.t === 'ok') {
    if (!pAct || pAct.to !== p.i || pAct.act !== p.a || pose || fishing) return;
    const q = pAct; pAct = null;
    startPact(p.a, rp);
    if (!q.done || q.act === 'photo') afterPact(p.i);
  } else if (p.t === 'no') {
    if (pAct && pAct.to === p.i) { pAct = null; toast(rp.name + ' 這次不方便', 2000); }
  }
}
async function afterPact(uid) {                // 發起方：同意後重抓友情資料，看有沒有升級、拿到合照獎勵
  const was = bondOf(uid).lv, hadPhoto = bondPhoto;
  await loadBonds();
  if (bondOf(uid).lv > was) bondToast(uid, bondOf(uid).lv);
  if (!hadPhoto && bondPhoto) photoReward();
}
function photoReward() { toast('📸 獲得稱號「命運之交」和專屬明信片卡片「合照紀念」！', 5000); chime([76, 81, 88, 93], 0.12); mailLoad(true); }
function showPactBox(name, P) {
  pbox.innerHTML = '<span>' + P.ic + ' <b>' + esc(name) + '</b> 想和你一起「' + P.n + '」</span><button type="button" class="btn small" data-a="yes">接受</button><button type="button" class="btn small ghost" data-a="no">不要</button>';
  pbox.hidden = false;
}
function hidePactBox() { pbox.hidden = true; }
pbox.addEventListener('pointerdown', e => e.stopPropagation());
pbox.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; if (b.dataset.a === 'yes') pactAccept(); else pactDecline(); });
function pactDecline() { const q = pIn; pIn = null; hidePactBox(); if (q) sendPact(q.from, 'no', q.act); }
async function pactAccept() {
  const q = pIn; if (!q) return;
  pIn = null; hidePactBox();
  const rp = remotes.get(q.from), P = PACTS[q.act];
  if (!rp || !P) return;
  if (!nearRemote(rp) || fishing || pose || !syncScene()) { toast('位置不對，沒辦法開始', 2000); sendPact(q.from, 'no', q.act); return; }
  const b = bondOf(q.from);
  let r = null;
  if (!(q.act !== 'photo' && (b.day === todayStr() || q.s))) {   // 今天已經算過就不用打伺服器
    try { r = await rpc('friend_act_accept', { p_uid: q.from }); }
    catch (e) { if (!/no_pending/.test(String((e && e.message) || e))) { toast(errText(e)); sendPact(q.from, 'no', q.act); return; } }
  }
  sendPact(q.from, 'ok', q.act);
  startPact(q.act, rp);
  if (r) {
    bonds.set(q.from, { cnt: r.cnt | 0, lv: intIn(r.lv, 1, 5, b.lv), day: todayStr() });
    if (r.up) bondToast(q.from, intIn(r.lv, 1, 5, b.lv));
    if (r.first_photo) { bondPhoto = true; photoReward(); }
    if (frOpen) renderFriends();
  }
}
/* 旁觀別人的雙人動作：a 是按同意的人、b 是邀請的人，兩個都在這間房才播（坐在地上本來就靠位置同步，不用特別處理） */
function watchPact(act, a, b) {
  const P = PACTS[act], now = performance.now();
  if (!P || !P.anim || !a || !b || !hereRp(a) || !hereRp(b)) return;
  const dx = b.tx - a.tx, dy = b.ty - a.ty;
  if (Math.abs(dx) + Math.abs(dy) > 2) return;   // 兩個人離太遠就不是在互動
  const sx = Math.sign(dx), sy = Math.sign(dy), mx = (a.tx + b.tx) / 2, my = (a.ty + b.ty) / 2 - 0.6;
  a.anim = { id: P.anim, t0: now, face: dirTo(dx, dy), sx, sy };
  b.anim = { id: P.anim, t0: now, face: dirTo(-dx, -dy), sx: -sx, sy: -sy };
  if (act === 'clap') pop(mx, my, '✋', '#ffffff');
  else if (act === 'dance') { pop(mx, my, '♪', '#ffd34d'); setTimeout(() => pop(mx, my, '♫', '#ff8fa8'), 1400); }
  else if (act === 'hug') { pop(mx, my, '❤️', '#ff8fa8'); setTimeout(() => pop(mx, my, '❤️', '#ff8fa8'), 900); }
  else if (act === 'photo') setTimeout(() => pop(mx, my, '📸', '#ffffff'), 1000);
}
/* 兩邊同時開始動作：各自在自己的畫面上播自己和對方的動畫 */
function startPact(act, rp) {
  const P = PACTS[act], now = performance.now();
  if (!P || !rp) return;
  const dx = rp.tx - pl.x, dy = rp.ty - pl.y, sx = Math.sign(dx), sy = Math.sign(dy);
  const mx = (pl.x + rp.tx) / 2, my = (pl.y + rp.ty) / 2 - 0.6;
  pressed.length = 0; pl.sx = pl.x; pl.sy = pl.y; pl.prog = 1;
  if (act === 'sit') {                         // 坐在地上：就地坐下（不需要長椅），任一方起身就一起起身
    pose = { type: 'sit', ground: true, pair: rp.id, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, t: 0 };
    pl.face = 'down'; lastPosKey = ''; posAcc = 999; trackSelf();
    pop(mx, my, '🧘', '#ffffff'); return;
  }
  pl.face = dirTo(dx, dy);
  anim = { id: P.anim, t0: now, face: dirTo(dx, dy), sx, sy };
  rp.anim = { id: P.anim, t0: now, face: dirTo(-dx, -dy), sx: -sx, sy: -sy };
  if (act === 'clap') pop(mx, my, '✋', '#ffffff');
  else if (act === 'dance') { pop(mx, my, '♪', '#ffd34d'); setTimeout(() => pop(mx, my, '♫', '#ff8fa8'), 1400); }
  else if (act === 'hug') { pop(mx, my, '❤️', '#ff8fa8'); setTimeout(() => pop(mx, my, '❤️', '#ff8fa8'), 900); }
  else if (act === 'photo') setTimeout(() => { pop(mx, my, '📸', '#ffffff'); chime([88], 0.1); }, 1000);
}


/* ---------- 面對朋友按動作鍵：浮窗互動選單（不蓋住畫面、不用進整頁好友名單；要看名單按「更多」） ---------- */
let fpId = '', fpTimer = 0;
const fpop = document.createElement('div'); fpop.id = 'frpop'; fpop.hidden = true; fpop.setAttribute('role', 'dialog'); fpop.setAttribute('aria-label', '和朋友互動'); document.body.appendChild(fpop);
const fpOpen = () => !fpop.hidden;
function renderFriendPop() {
  const rp = remotes.get(fpId);
  if (!rp) { closeFriendPop(); return; }
  const u = esc(rp.id), near = nearRemote(rp);
  let h = '<div class="fp-h"><b>' + esc(rp.name) + '</b>';
  if (isFriend(rp.id)) {
    const b = bondOf(rp.id);
    h += ' <span class="bondtag">❤️Lv.' + b.lv + '</span></div><div class="fp-g">';
    Object.keys(PACTS).forEach(k => {
      const P = PACTS[k], lock = b.lv < P.need;
      h += '<button type="button" class="btn small' + (lock ? ' ghost' : '') + '" data-a="pact" data-p="' + k + '" data-u="' + u + '">' + P.ic + ' ' + P.n + (lock ? ' 🔒' + P.need : '') + '</button>';
    });
    h += '<button type="button" class="btn small ghost" data-a="card" data-u="' + u + '">名片</button></div>';
    h += near ? '<p class="fp-hint">' + bondLine(b) + '</p>' : '<p class="fp-hint warn">走到對方旁邊一格、面對面才能邀請。</p>';
    h += '<div class="fp-r"><button type="button" class="btn small" data-a="visit" data-u="' + u + '">拜訪</button><button type="button" class="btn small ghost" data-a="more" data-u="' + u + '">更多…</button></div>';
  } else {
    h += '</div>';
    if (fr.incoming.some(f => f.uid === rp.id)) h += '<p class="fp-hint">對方想加你為好友。</p><div class="fp-r"><button type="button" class="btn small" data-a="accept" data-u="' + u + '">接受</button><button type="button" class="btn small ghost" data-a="more" data-u="' + u + '">更多…</button></div>';
    else if (fr.outgoing.some(f => f.uid === rp.id)) h += '<p class="fp-hint">已送出申請，等對方同意。</p><div class="fp-r"><button type="button" class="btn small ghost" data-a="more" data-u="' + u + '">更多…</button></div>';
    else h += '<p class="fp-hint">成為好友後可以擊掌、跳舞、擁抱和合照。</p><div class="fp-r"><button type="button" class="btn small" data-a="reqid" data-u="' + u + '">加好友</button><button type="button" class="btn small ghost" data-a="more" data-u="' + u + '">更多…</button></div>';
  }
  fpop.innerHTML = h;
}
function openFriendPop(rp) {
  if (!rp || !ready || !me || frOpen || shopOpen || makerOpen || bagOpen) return;
  fpId = rp.id; pressed.length = 0; renderFriendPop(); fpop.hidden = false;
  clearInterval(fpTimer);
  fpTimer = setInterval(() => {                 // 走遠、換場景或對方離開就自動收起來
    const r = remotes.get(fpId);
    if (!r || !hereRp(r) || Math.abs(r.tx - pl.x) + Math.abs(r.ty - pl.y) > 2 || frOpen) closeFriendPop();
    else if (fpOpen()) renderFriendPop();
  }, 400);
}
function closeFriendPop() { fpop.hidden = true; fpId = ''; clearInterval(fpTimer); }
fpop.addEventListener('pointerdown', e => e.stopPropagation());
fpop.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b) return;
  const a = b.dataset.a, u = b.dataset.u, rp = remotes.get(u);
  if (a === 'pact') { closeFriendPop(); pactInvite(u, b.dataset.p); return; }
  if (a === 'card') { closeFriendPop(); openCard(u); return; }
  if (a === 'visit') { closeFriendPop(); visitHouse(u, rp && rp.name); return; }
  if (a === 'more') { closeFriendPop(); openFriends(rp || { id: u, name: '旅人' }); return; }
  if (frBusy) return;
  frBusy = true;
  try {
    const before = fr.friends.length;
    applyFriends(await rpc(a === 'accept' ? 'friend_accept' : 'friend_request_uid', { p_uid: u }));
    notifyFriend(u);
    toast(fr.friends.length > before ? '你們成為好友了！' : '已送出好友申請', 2500);
  } catch (er) { toast(errText(er)); }
  frBusy = false;
  if (fpOpen()) renderFriendPop();
});
document.addEventListener('pointerdown', e => { if (fpOpen() && !fpop.contains(e.target) && !(e.target.closest && e.target.closest('#actbtn'))) closeFriendPop(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && fpOpen()) closeFriendPop(); });

/* ---------- 坐椅子、躺床（在自己家或朋友家都可以） ---------- */
let pose = null;                                // { type: 'sit' | 'lie', id, ix, iy, ox, oy, face0, tile, sort, t }
function takeSeat(it, x, y) {
  const d = dimsOf(it.k, it.r | 0); if (!d || pose) return;
  if ((it.r | 0) !== 0 && SEAT[it.k] !== 'lie') { toast('轉過方向的椅子／沙發不能坐，轉回原位就可以了', 2200); return; }   // 床轉過方向也能躺
  let slot = 0;
  if (SEAT[it.k] === 'lie') {
    const sp = BEDS[it.k] || BEDS.bed, taken = bedTaken(it);
    if (sp.n === 1) { if (taken[0]) { toast(BEDS[it.k] ? '床上已經有人了' : '這裡已經有人了', 1400); return; } }
    else {   // 雙人床：點哪一邊就躺哪一邊；那邊有人就換另一邊；兩邊都有人才不能躺
      const [lx, ly] = bedLocal(it, x, y);
      slot = lx >= 2 ? 1 : 0;
      if (taken[slot]) slot = 1 - slot;
      if (taken[slot]) { toast('床上已經有人了', 1400); return; }
      [x, y] = bedWorld(it, slot ? 2 : 0, ly);   // 躺下時站到那一邊的格子，別人才看得出你躺在哪個位子
    }
  } else if (it.k !== 'sofa' && seatTaken(it)) { toast('這個位子已經有人坐了', 1400); return; }   // 沙發可以兩個人並排坐，其他家具一次一人
  pose = { type: SEAT[it.k], id: it.id, ix: it.x, iy: it.y, ox: pl.x, oy: pl.y, face0: pl.face, tile: x - (RX + it.x), slot, sort: RY + it.y + d.h - 1 + 0.02, t: 0 };
  pl.x = pl.sx = x; pl.y = pl.sy = y; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  if (pose.type === 'lie') pop(x, y - 0.6, 'Zzz', '#cfe8f7');
  lastPosKey = ''; posAcc = 999; trackSelf();   // 讓同一間屋子裡的人看到我坐著／躺著
}
/* 某個家具上現在有沒有別人（坐或躺）；seatItemAt 依座標找出對方坐的是哪件家具 */
function seatItemAt(x, y, code) {
  if (!house || scene !== 'house') return null;
  const lx = x - RX, ly = y - RY, want = code === 4 ? 'lie' : 'sit';
  return house.items.find(it => {
    if (SEAT[it.k] !== want || ((it.r | 0) !== 0 && want !== 'lie')) return false;
    const g_ = itemRect(it);
    return g_ && lx >= g_.x && lx < g_.x + g_.w && ly >= g_.y && ly < g_.y + g_.h;
  }) || null;
}
/* 床的每個位子現在有沒有別人躺著（陣列，依位子編號） */
function bedTaken(it) {
  const out = [false, false];
  remotes.forEach(rp => {
    if (rp.fs === 4 && hereRp(rp)) { const f = seatItemAt(rp.tx, rp.ty, rp.fs); if (f && f.id === it.id) out[bedSlotAt(it, rp.tx, rp.ty)] = true; }
  });
  return out;
}
function seatTaken(it) {
  let hit = false;
  remotes.forEach(rp => {
    if (!hit && rp.fs && hereRp(rp)) { const f = seatItemAt(rp.tx, rp.ty, rp.fs); if (f && f.id === it.id) hit = true; }
  });
  return hit;
}
/* 廣場的長椅：位置與「坐著」的狀態會同步給其他玩家 */
function takeBench(x, y) {
  if (pose || fishing) return;
  if (remoteAt(x, y)) { toast('這個位子已經有人坐了', 1400); return; }
  pose = { type: 'sit', bench: true, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, t: 0 };
  pl.x = pl.sx = x; pl.y = pl.sy = y; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  lastPosKey = ''; posAcc = 999; trackSelf();
}
function drawBenchSeated(px, py, ch) {
  g.save(); g.beginPath(); g.rect(px - 4, py - 14, 24, 24); g.clip();
  drawPlayer(px, py - 2, 'down', false, 0, ch);
  g.restore();
  ob('#d9a066', '#9b6a44', px + 1, py + 10, 14, 3);
  r('#9b6a44', px + 2, py + 13, 2, 2); r('#9b6a44', px + 12, py + 13, 2, 2);
}
function drawGroundSeated(px, py, ch) { drawPlayerFx(px, py, 'down', false, 0, ch, { dx: 0, dy: 2, face: 'down', sy: 0.8, hand: 0, mv: false, ph: null }); }
function standUp() {
  if (!pose) return;
  const wasBench = !!(pose.bench || pose.ground), pairUid = pose.pair;
  if (pairUid) sendPact(pairUid, 'up', 'sit');
  pl.x = pl.sx = pose.ox; pl.y = pl.sy = pose.oy; pl.prog = 1; pl.face = pose.face0; pose = null;
  lastPosKey = ''; posAcc = 999; trackSelf();
}
/* 坐著：只畫上半身（腿被椅面擋住），再把椅面前緣蓋回去 */
function drawSeated(px, py, it, ch, tile) {
  g.save(); g.beginPath(); g.rect(px - 4, py - 14, 24, 24); g.clip();
  drawPlayer(px, py - 2, 'down', false, 0, ch);
  g.restore();
  if (it.k === 'sofa') {
    const t = tile != null ? tile : pose ? pose.tile : 0, xs = t === 0 ? px + 5 : px, xw = t === 0 ? 11 : 10;
    r('#ffb3c6', xs, py + 10, xw, 3); r('#d4688a', xs, py + 13, xw, 1);
  } else {
    r('#ffb3c6', px + 3, py + 10, 10, 2); r('#9b6a44', px + 3, py + 12, 10, 1);
    r('#9b6a44', px + 4, py + 12, 2, 3); r('#9b6a44', px + 10, py + 12, 2, 3);
  }
}
/* 躺著：頭枕在枕頭上，身體蓋在被子下 */
/* 床上的某一點（以未轉向的床為準）轉成畫面座標，名牌要跟著頭的位置 */
function bedPt(it, lx, ly) {
  const d = defOf(it.k), rt = (it.r | 0) & 3, bx = (RX + it.x) * T, by = (RY + it.y) * T;
  if (!rt || !d) return [bx + lx, by + ly];
  const rw = rt & 1 ? d.h : d.w, rh = rt & 1 ? d.w : d.h, a = rt * Math.PI / 2, co = Math.round(Math.cos(a)), si = Math.round(Math.sin(a));
  const dx = lx - d.w * T / 2, dy = ly - d.h * T / 2;
  return [bx + rw * T / 2 + dx * co - dy * si, by + rh * T / 2 + dx * si + dy * co];
}
function drawLying(it, ch, slot) {
  const d0 = defOf(it.k), rt = (it.r | 0) & 3, turned = !!(rt && d0), sp = BEDS[it.k] || BEDS.bed;
  slot = Math.min(slot | 0, sp.n - 1);
  let bx = (RX + it.x) * T, by = (RY + it.y) * T;
  if (turned) {   // 和 drawFurn 一樣：以轉過之後的佔格中心為軸旋轉，人和床一起轉
    const rw = rt & 1 ? d0.h : d0.w, rh = rt & 1 ? d0.w : d0.h;
    g.save(); g.translate(bx + rw * T / 2, by + rh * T / 2); g.rotate(rt * Math.PI / 2); g.translate(-d0.w * T / 2, -d0.h * T / 2);
    bx = 0; by = 0;
  }
  const hx = bx + sp.hx[slot];   // 枕頭在每個位子的正中間，翻轉也一樣
  const skin = SKINS[ch.skin] || SKINS[0], hair = HAIRS[ch.hair] || HAIRS[0];
  ob(skin, shade(skin, 0.82), hx + 1, by + 4, 8, 7);
  r(hair, hx + 1, by + 4, 8, 3); r(hair, hx + 1, by + 5, 1, 3); r(hair, hx + 8, by + 5, 1, 3);
  r('#4a2c2c', hx + 3, by + 8, 2, 1); r('#4a2c2c', hx + 6, by + 8, 2, 1);
  r('#ffa0b0', hx + 2, by + 9, 1, 1); r('#ffa0b0', hx + 8, by + 9, 1, 1);
  /* 把這個位子的被子蓋回去：只重畫床下半部（頭以下），身體就被蓋住了；另一個位子不受影響 */
  const f = FURN[it.k], cl = sp.clip[slot];
  if (f) { g.save(); g.beginPath(); g.rect(bx + cl[0], by + 12, cl[1] - cl[0], 20); g.clip(); f(bx, by, 0); g.restore(); }
  if (turned) g.restore();
}
let visiting = null, ownHouse = null;
async function visitHouse(uid, name) {
  if (!ready || !me || enterBusy || dsOpen) return;
  enterBusy = true;
  try {
    const d = await withTimeout(rpc('house_visit', { p_uid: uid }).then(x => houseDoorOf(x, uid)), 12000);
    /* 從任何場景拜訪都要先回到農場：小村、森林、山洞、穀倉、造型屋的地圖大小各不相同，不先離開的話，離開朋友家後地圖尺寸會停在錯的值，農場畫面就壞掉 */
    if (scene === 'plaza' || scene === 'tarot') leaveVillage(true);
    if (scene === 'house') leaveHouse(true);
    if (scene === 'stylist') leaveStylist(true);
    if (scene === 'cave') leaveCave(true);
    if (scene === 'forest') leaveForest(true);
    if (scene === 'town') leaveTown(true);
    if (scene === 'barn') leaveBarn(true);
    if (scene !== 'farm') { toast('現在不能拜訪'); enterBusy = false; return; }
    closeFriends();
    pose = null; ownHouse = house; applyHouse(d);
    visiting = { uid, name: clean(d.owner && d.owner.name, 8) || name || '朋友' };
    scene = 'house'; K = hkind; W = houseMapW(); H = houseMapH();
    pl.x = pl.sx = RX + DX + 1; pl.y = pl.sy = RY + RH - 1; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
    edit.on = false; edit.door = false; edit.hold = null; edit.sel = null; myShow = null;
    $('hpanel').hidden = false; $('game').classList.remove('editing');
    view.snap = true; fitView();
    renderHousePanel();
    joinHouseRoom(uid);          // 連上這間屋子的頻道：屋主和其他訪客會即時看到彼此
    ringBell(uid);
    toast('來到 ' + visiting.name + ' 的家了', 2200);
    visitLog('enter');
  } catch (e) { toast(errText(e)); }
  enterBusy = false;
}
function visitShowList(it) {
  const dd = DISP[it.k], arr = dispOf(it), cat = dd.kind === 'fish' ? fishCat : bugCat;
  const names = [];
  for (let s = 0; s < dd.n; s++) if (arr[s]) { const f = cat.find(x => x.key === arr[s].k); if (f) names.push(f.name); }
  toast((defOf(it.k) || {}).name + '：' + (names.length ? names.join('、') : '還沒有展示品'), 3500);
}
/* 每間屋子一條頻道（house-屋主uid）；屋主在家、訪客拜訪時都連進來。用公開頻道（只傳位置和表情，不含任何資料） */
function joinHouseRoom(ownerUid) {
  if (!ownerUid || !sb) return;
  remotes.clear(); myBubble = null; lastPosKey = ''; posAcc = 999;
  vLog.innerHTML = ''; vPanel.hidden = false;
  startNet('house-' + ownerUid, false);
  renderVillage();
  addSys(ownerUid === myUid ? '你的家連上了，朋友來拜訪時可以在這裡聊天。' : '來到朋友的家了，可以和屋子裡的人聊天。');
}
function leaveHouse(silent) {
  if (scene !== 'house') return;
  pose = null;
  sayBye(); stopNet(); remotes.clear(); myBubble = null; vPanel.hidden = true;
  scene = 'farm'; K = kind; W = BW; H = BH;
  if (visiting) { visitLog('leave'); house = ownHouse; ownHouse = null; visiting = null; syncHouseSize(); } edit.on = false; edit.door = false; edit.hold = null; edit.sel = null; myShow = null;
  $('hpanel').hidden = true; $('game').classList.remove('editing');
  pl.x = pl.sx = 4; pl.y = pl.sy = 4; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  view.snap = true; fitView();
  if (!silent) toast('回到農場了');
}
$('h-leave').addEventListener('click', () => leaveHouse());
$('h-look').addEventListener('click', () => { if (ready && !authOpen) openMaker(false); });
