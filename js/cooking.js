'use strict';
/* 料理與烹飪小遊戲 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 料理：廚房灶台（家裡擺了才能用） ---------- */
const DISHC = { rcake: '#f3d79a', stew: '#e8a05a', pie: '#f0a64a', grilled: '#c98f62', soup: '#e8c97a', escargot: '#b98a62' };
function drawDish(x, y, k) {   // 盤子上的料理（像素）；直接畫在目前的畫布上
  ob('#fffaf0', '#c9b79a', x + 2, y + 9, 12, 5);
  ob(DISHC[k] || '#f3c77a', 'rgba(90,60,40,.5)', x + 3, y + 5, 10, 6);
  r('rgba(255,255,255,.55)', x + 5, y + 6, 2, 1); r('#8fe09a', x + 9, y + 4, 2, 2);
}
function dishIcon(c2d, k) {
  g = c2d; g.clearRect(0, 0, 16, 16);
  drawDish(0, 0, k);
  g = ctx;
}
const BUFF_N = { swift: '走路變快', fish: '釣魚運氣變好', bug: '捕蟲網變大' };
const BUFF_I = { swift: '👟', fish: '🎣', bug: '🦋' };   // 圖示
const BUFF_D = { swift: '移動速度變快（約 +25%）', fish: '釣魚時運氣更好', bug: '捕蟲網的範圍變大' };   // 點開後的說明
const BUFF_MAX = 60 * 60000;   // 單一效果最多累積 60 分鐘，圓環以此為滿
const ckEl = $('ckm'), ckCard = $('ckcard');
let ckBusy = false;
function openKitchen() { if (ckOpen) return; ckOpen = true; pressed.length = 0; renderKitchen(); ckEl.hidden = false; ckCard.focus(); }
function closeKitchen() { cgStop(); ckOpen = false; ckEl.hidden = true; }
function maxCook(rc) { let m = 99; for (const k in rc.ing) m = Math.min(m, Math.floor(have(k) / rc.ing[k])); return m; }
/* ---- 烹飪技能：等級與經驗以伺服器為準（level_get 的 cook／xp_cook），跟其他技能一樣；上限＝玩家等級＋2 ---- */
const ckCap = () => (lv && +lv.cap) ? Math.min(12, +lv.cap) : 12;
const ckXpNow = () => (lv && +lv.xp_cook) || 0;
function ckLv() { return lv && +lv.cook ? Math.min(12, +lv.cook) : 1; }
/* 料理難度（1～5 星）：照售價由低到高分組，星數 = 需要的烹飪等級 */
function ckTier(rc) {
  if (/^hw_/.test(rc.key)) return HW_TIER[rc.key] || 2;   // 萬聖節料理（魔女鍋）：難度固定，不參與一般料理的排名
  const s = recipes.filter(x => !/^hw_/.test(x.key)).sort((a, b) => (a.price - b.price) || (a.key < b.key ? -1 : 1));
  const i = Math.max(0, s.findIndex(x => x.key === rc.key));
  return Math.min(5, 1 + Math.floor(i * 5 / Math.max(1, s.length)));
}
function ckSkillHtml() {
  const L = ckLv(), cap = ckCap(), mx = L >= 12, atCap = L >= cap && !mx;
  const sub = mx ? '已滿級' : atCap ? '需要玩家 Lv.' + (lv ? lv.pl + 1 : '?') + ' 才能繼續成長' : '經驗 ' + ckXpNow() + ' / ' + skillNeed(L + 1);
  return '<div class="row"><span style="font-size:24px;line-height:1">🍳</span><div class="meta"><b>烹飪 Lv.' + L + ' / 上限 ' + cap + '</b><small>' + sub + '</small>' + lvBar(skillNeed(L), skillNeed(L + 1), ckXpNow(), '') + '</div></div>';
}
function renderKitchen() {
  const dis = ckBusy ? ' disabled' : '';
  const act_ = Object.keys(buffs).filter(buffOn).map(k => (BUFF_N[k] || k) + '（剩 ' + Math.ceil((buffs[k] - srvNow()) / 60000) + ' 分鐘）');
  const L = ckLv();
  const rows = recipes.filter(rc => !/^hw_/.test(rc.key)).map(rc => {
    const mx = maxCook(rc), dn = have('dish:' + rc.key), T = ckTier(rc), lock = L < T;
    const ing = Object.keys(rc.ing).map(k => esc(itemName(k)) + ' ' + have(k) + '/' + rc.ing[k]).join('、');
    return '<div class="row" style="flex-wrap:wrap;gap:6px"><i class="dot" style="--c:' + (DISHC[rc.key] || '#f3c77a') + '"></i><div class="meta" style="min-width:150px"><b>' + esc(rc.name) + (dn ? '　持有 ' + dn : '') + '</b> <span class="cg-star">' + '★'.repeat(T) + '</span><small>' + ing + '</small><small>' +
      esc(rc.descr) + '　賣 ' + rc.price + ' G</small></div><div style="display:flex;gap:6px;flex-wrap:wrap">' +
      (lock ? '<button type="button" class="btn small" disabled>烹飪 Lv.' + T + ' 解鎖</button>' :
        '<button type="button" class="btn small" data-a="cook" data-c="' + esc(rc.key) + '"' + (ckBusy || mx < 1 ? ' disabled' : '') + '>開始烹飪</button>') +
      (dn && rc.buff ? '<button type="button" class="btn small" data-a="eat" data-c="' + esc(rc.key) + '"' + dis + '>吃一份</button>' : '') +
      '</div></div>';
  }).join('');
  ckCard.innerHTML = '<div class="shop-h"><h2>廚房</h2><span class="chip gold">' + (me ? me.coins : 0) + ' G</span></div>' + ckSkillHtml() +
    (visiting ? '<p class="empty">你在 ' + esc(visiting.name) + ' 的廚房：用的是你自己的材料，做好的料理和烹飪經驗都是你的。</p>' : '') + '<p class="empty">選一道料理開始烹飪：會回到灶台前，鍋子上方有火候條。按住動作鍵加熱，指針進到綠區就放開定火，一共三段；太生、太大或燒焦都算失誤。失誤太多會失敗（失敗或中途走開都不會浪費材料）。做出來的料理可以賣錢、交委託，有些吃下去還有 buff（最多累積 60 分鐘）。' + (act_.length ? '<br>目前效果：' + esc(act_.join('、')) : '') + '</p>' +
    (rows || '<p class="empty">還沒有食譜。</p>') + '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
}
/* ---- 烹飪小遊戲（火候條）：站在灶台前，鍋子上方有火候條；按住動作鍵加熱，指針停在綠區就放開定火，一共三段 ---- */
let cooking = null, cookSeq = 0, ckAnchor = null;
/* 把烹飪進度傳給同一間屋子的人：只在換階段時傳一次，各人在自己的畫面推算動畫 */
function ckSend(st, c) {
  if (!c || !net || !net.ch || scene !== 'house') return;
  try { net.ch.send({ type: 'broadcast', event: 'cook', payload: { i: myUid, id: c.itId, st, n: c.i, rk: c.rc.key, m: c.miss, mm: c.maxMiss } }); } catch (e) { /* 略過 */ }
}
function cgStop() { if (cooking) ckSend('stop', cooking); cooking = null; }
function ckPlan(rc) {
  const T = ckTier(rc), L = ckLv(), n = 3;
  const w = clamp(0.31 - 0.03 * T + 0.005 * (L - 1), 0.14, 0.32), v = 0.40 + 0.04 * T;   // 綠區寬度（等級越高越寬）、加熱速度（料理越難越快）
  const plan = [];
  for (let i = 0; i < n; i++) { const a = 0.30 + Math.random() * (0.85 - w - 0.30); plan.push({ a, b: a + w, v }); }
  return { T, plan, maxMiss: T <= 2 ? 2 : 1 };
}
function ckStart(key) {
  const rc = recipes.find(x => x.key === key); if (!rc || ckBusy || cooking) return;
  const T = ckTier(rc);
  if (ckLv() < T) { toast('烹飪 Lv.' + T + ' 才能做這道'); return; }
  if (maxCook(rc) < 1) { toast('材料不夠'); return; }
  if (!ckAnchor || scene !== 'house') { toast('要站在廚房灶台前面'); return; }
  closeKitchen();
  const p = ckPlan(rc), now = Date.now();
  cooking = { id: ++cookSeq, rc, T: p.T, plan: p.plan, maxMiss: p.maxMiss, miss: 0, done: 0, i: 0, hit: 0, itId: ckAnchor.id, host: ckAnchor.at || null, fx: ckAnchor.fx, fy: ckAnchor.fy, scene, phase: 'wait', t0: now, at: now + 900, ok: true, heat: 0, lt: now, msg: '', needRel: false };
  ckSend('start', cooking);
}
function cookCancel() { if (!cooking) return; ckSend('stop', cooking); cooking = null; toast('不煮了（材料沒有消耗）', 1600); }
function cookMiss(c, msg, now) {
  c.miss++; c.ok = false; c.phase = 'pause'; c.at = now + 650; c.msg = msg;
  ckSend('bad', c);
  pop(c.fx, c.fy, msg, '#ff9a9a');
  if (navigator.vibrate) try { navigator.vibrate(60); } catch (_) {}
}
function cookNext(c, now) {
  c.i++;
  if (c.i >= c.plan.length || c.miss > c.maxMiss) { cookFinish(c.miss <= c.maxMiss); return; }
  c.phase = 'wait'; c.heat = 0; c.t0 = now; c.at = now + 450;
}
function cookAct() { /* 火候條靠「按住」判斷（actHeld），按一下不算 */ }
function cookJudge(c, now) {
  const rd = c.plan[c.i], h = c.heat;
  if (h >= rd.a && h <= rd.b) { c.done++; c.ok = true; c.phase = 'pause'; c.at = now + 600; c.msg = '剛剛好！'; ckSend('ok', c); sparkle(c.fx, c.fy, '#ffd34d'); if (navigator.vibrate) try { navigator.vibrate(20); } catch (_) {} }
  else cookMiss(c, h >= 1 ? '燒焦了！' : h < rd.a ? '太生了…' : '火太大了…', now);
}
function cookTick() {
  const c = cooking; if (!c || c.phase === 'serve') return;
  const it = c.hw ? (scene === 'plaza' && hwOn() ? true : null) : scene === 'house' && house ? house.items.find(x => x.id === c.itId) : null;
  if (c.scene !== scene || !it || paused() || pressed.length) { cookCancel(); return; }
  const now = Date.now(), rd = c.plan[c.i], dt = Math.min(100, now - (c.lt || now)); c.lt = now;
  if (c.phase === 'wait') { if (now >= c.at) { c.phase = 'idle'; c.heat = 0; c.needRel = actHeld; } }
  else if (c.phase === 'idle') { if (c.needRel) { if (!actHeld) c.needRel = false; } else if (actHeld) { c.phase = 'heat'; c.t0 = now; ckSend('heat', c); } }
  else if (c.phase === 'heat') {
    if (actHeld) { c.heat = Math.min(1, c.heat + rd.v * dt / 1000); if (c.heat >= 1) cookJudge(c, now); }
    else cookJudge(c, now);
  } else if (c.phase === 'pause' && now >= c.at) cookNext(c, now);
}
const cookTip = () => {
  const c = cooking;
  return c.phase === 'heat' ? '火在變大…進到綠區就放開！' : c.phase === 'serve' ? '盛盤中…' :
    '按住動作鍵加熱，指針進到綠區就放開定火（共三段）。走開就取消，材料不會消耗。';
};
async function cookFinish(ok) {
  const c = cooking; if (!c) return;
  const rc = c.rc, perfect = c.miss === 0;
  let made = false, errMsg = '', srvXp = 0;
  if (ok) {
    c.phase = 'serve'; ckBusy = true;
    try { const r = await enqueue(() => c.hw ? rpc('hw_cook', { p_key: rc.key, p_qty: 1 }) : rpc('cook', c.host ? { p_key: rc.key, p_qty: 1, p_perfect: perfect, p_at: c.host } : { p_key: rc.key, p_qty: 1, p_perfect: perfect })); if (r.inv) Object.assign(inv, r.inv); srvXp = +r.xp || 0; made = true; }
    catch (err) { errMsg = errText(err); await resync(); }
    ckBusy = false; refreshHud();
  }
  if (cooking === c) cooking = null;
  ckSend(made ? 'done' : 'fail', c);
  if (made && !c.hw) loadLevel();   // 伺服器已加經驗，重新抓等級（升級彈窗也在裡面）
  const xp = srvXp ? ' · 烹飪經驗 +' + srvXp : '';
  dishIcon(catchCv.getContext('2d'), rc.key);
  catchT.textContent = made ? rc.name + (perfect ? '　完美！' : '') : !ok ? '糊掉了…' : '做不出來';
  catchS.textContent = (made ? '已放進背包，現在持有 ' + have('dish:' + rc.key) + ' 份' + (perfect ? '（零失誤，經驗加成）' : '') : errMsg ? errMsg : '失誤太多了，材料沒有消耗，再試一次吧') + xp;
  catchEl.style.setProperty('--rc', DISHC[rc.key] || '#f3c77a');
  $('catch-show').hidden = true;
  catchShown = true; catchEl.hidden = false; clearTimeout(catchTimer); catchTimer = setTimeout(hideCatch, 4500);
  if (made) { sparkle(c.fx, c.fy, '#ffd34d'); }
}
function heartPx(x, y, col) { r(col, x, y, 2, 1); r(col, x + 3, y, 2, 1); r(col, x, y + 1, 5, 1); r(col, x + 1, y + 2, 3, 1); r(col, x + 2, y + 3, 1, 1); }
function stoveFlames(px0, top, now, big) {   // 爐火；加熱時火變大
  const fl = Math.floor(now / 120) % 3;
  r('#ff8a3c', px0 + 6, top + 4 - (fl === 0 ? 1 : 0), 2, 2); r('#ffd34d', px0 + 9, top + 4 - (fl === 1 ? 1 : 0), 2, 2);
  if (big) { r('#ff8a3c', px0 + 5, top + 2, 2, 3); r('#ffd34d', px0 + 9, top + 2, 2, 3); r('#ff8a3c', px0 + 12, top + 3, 2, 2); }
}
const CK_FONT = '800 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
function ckText(txt, x, y, col) {   // 帶白邊的小字，疊在牆上也看得清楚
  ctx.font = CK_FONT; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 2; ctx.strokeStyle = '#fffaf0'; ctx.strokeText(txt, x, y);
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
}
/* 自己煮菜時的火候錶：浮在自己頭頂的小圓錶（名牌上方），不會擋到人物；頭頂放不下就改放腳下 */
function drawCooking(now) {
  const c = cooking;
  if (!c || c.scene !== scene) return;
  const it = house ? house.items.find(x => x.id === c.itId) : null, rt = c.hw ? true : it && itemRect(it);
  if (!rt) return;
  const rd = c.plan[Math.min(c.i, c.plan.length - 1)];
  if (!c.hw) { const px0 = (RX + rt.x) * T, top = (RY + rt.y) * T; stoveFlames(px0, top, now, c.phase === 'heat'); }   // 魔女鍋的泡泡由 halloween.js 畫
  const R = 10, lw = 3.5, ppx = Math.round(pl.x * T), ppy = Math.round(pl.y * T);
  let rx = clamp(ppx + 8, R + 3, ctx.canvas.width - R - 3), ry = ppy - 11 - R - 3, below = false;   // 頭頂：名牌（約 ppy-11）之上
  if (ry - R - 9 < 1) { ry = ppy + 17 + R + 3; below = true; }                                       // 上面沒空間 → 放腳下
  const A0 = Math.PI * 0.75, SW = Math.PI * 1.5;          // 從左下開始順時針轉 270 度
  let edge = '#c9a05a', label;
  if (c.phase === 'wait') label = (c.i + 1) + '/' + c.plan.length;
  else if (c.phase === 'idle') label = '按住';
  else if (c.phase === 'heat') { label = '放開'; edge = Math.floor(now / 110) % 2 ? '#ff9a4a' : '#c9742a'; }
  else if (c.phase === 'pause') { label = c.ok ? '好' : '失誤'; edge = c.ok ? '#6fcf7f' : '#ef6a5a'; }
  else label = '盛盤';
  ctx.save();
  ctx.beginPath(); ctx.arc(rx, ry, R + 1.5, 0, Math.PI * 2); ctx.fillStyle = edge; ctx.fill();
  ctx.beginPath(); ctx.arc(rx, ry, R, 0, Math.PI * 2); ctx.fillStyle = '#fffaf0'; ctx.fill();
  const arc = (a, b, col) => { ctx.beginPath(); ctx.arc(rx, ry, R - 2, A0 + SW * a, A0 + SW * b); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.stroke(); };
  arc(0, rd.a, '#f6d9c8'); arc(rd.a, rd.b, '#6fcf7f'); arc(rd.b, 1, '#f1b3a8');   // 太生／綠區／太大
  ctx.beginPath(); ctx.arc(rx, ry, R - lw - 0.5, 0, Math.PI * 2); ctx.fillStyle = '#fffaf0'; ctx.fill();
  const an = A0 + SW * clamp(c.heat || 0, 0, 1);
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(an) * (R - 1), ry + Math.sin(an) * (R - 1));
  ctx.strokeStyle = '#5a4034'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(rx, ry, 1.6, 0, Math.PI * 2); ctx.fillStyle = '#5a4034'; ctx.fill();
  ctx.restore();
  ctx.font = CK_FONT; ctx.textAlign = 'center'; ctx.fillStyle = INK;
  ctx.fillText(label, rx, ry + 6);                                                       // 字放在圓心下半，不被指針蓋住
  if (c.phase === 'pause' && c.msg) ckText(c.msg, rx, ry - R - 4, c.ok ? '#2e9b4c' : '#e0503f');
  const lives = c.maxMiss + 1, x0 = Math.round(rx - (lives * 6 - 1) / 2), hy = below ? ry + R + 3 : ppy + 17;   // 生命（愛心）：頭頂模式放腳下
  for (let k = 0; k < lives; k++) heartPx(x0 + k * 6, hy, k < lives - c.miss ? '#ef6a7a' : '#cdbfb4');
}
/* ---------- 別人煮菜時，同一間屋子的人看到的畫面：爐火氣氛＋頭上名牌＋喝采 ---------- */
const COOK_ST = ['start', 'heat', 'ok', 'bad', 'done', 'fail', 'stop'], COOK_SHOW = 5000;
function onCook(p) {
  if (!p || typeof p !== 'object' || p.i === myUid || scene !== 'house' || !house) return;
  const rp = typeof p.i === 'string' ? remotes.get(p.i) : null;
  if (!rp || !hereRp(rp) || !COOK_ST.includes(p.st)) return;
  if (p.st === 'stop') { rp.cook = null; return; }
  const id = +p.id, rc = recipes.find(x => x.key === p.rk);
  if (!isFinite(id) || !rc || !house.items.some(x => x.id === id && x.k === 'kitchen')) return;   // 只認得這間屋子的灶台和認得的料理
  const now = Date.now();
  let c = rp.cook;
  if (p.st === 'start' || !c || c.id !== id) c = rp.cook = { id, rk: rc.key, name: String(rc.name || '').slice(0, 6), res: [], i: 0, miss: 0, mm: 1, ph: 'wait', t0: now, last: now };
  c.i = clamp(p.n | 0, 0, 3); c.miss = clamp(p.m | 0, 0, 4); c.mm = clamp(p.mm | 0, 0, 3); c.last = now;
  if (p.st === 'heat') { c.ph = 'heat'; c.t0 = now; }
  else if (p.st === 'ok' || p.st === 'bad') { c.res[c.i] = p.st; c.ph = p.st; c.t0 = now; }
  else if (p.st === 'done' || p.st === 'fail') { c.ph = p.st; c.t0 = now; }
}
function drawCookWatch(now) {
  if (scene !== 'house' || !house) return;
  const t = Date.now();
  remotes.forEach(rp => {
    const c = rp.cook; if (!c || !hereRp(rp)) return;
    const ended = c.ph === 'done' || c.ph === 'fail', age = t - c.t0;
    if (ended && age > COOK_SHOW) return;
    const it = house.items.find(x => x.id === c.id), rt = it && itemRect(it); if (!rt) return;
    const px0 = (RX + rt.x) * T, top = (RY + rt.y) * T, cx = px0 + Math.round(rt.w * T / 2), heat = c.ph === 'heat';
    stoveFlames(px0, top, now, heat);
    ctx.save();
    if (heat) for (let k = 0; k < 3; k++) {                       // 加熱：鍋子冒白煙
      const ph = ((now / 55) + k * 7) % 20;
      ctx.globalAlpha = 0.8 * (1 - ph / 20);
      r('#ffffff', Math.round(cx - 5 + k * 5 + Math.sin(now / 200 + k)), Math.round(top - 1 - ph), 2, 2);
    }
    if (c.ph === 'ok' && age < 900) {                              // 成功：叮！＋星星
      for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + age / 200, rr = 4 + age / 70; ctx.globalAlpha = 1 - age / 900; r(k % 2 ? '#ffffff' : '#ffd34d', Math.round(cx + Math.cos(an) * rr), Math.round(top - 4 + Math.sin(an) * rr), 1, 1); }
      ctx.globalAlpha = 1 - age / 900; ckText('叮！', cx, top - 9 - age / 90, '#2e9b4c');
    }
    if ((c.ph === 'bad' || (c.ph === 'fail')) && age < 1000) {     // 失敗：冒灰煙
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = (1 - age / 1000) * 0.8; const sz = 3 + k; r('#8a8a8a', Math.round(cx - 5 + k * 4 + Math.sin(age / 150 + k)), Math.round(top - 2 - age / 60 - k * 3), sz, sz); }
    }
    if (c.ph === 'done' && age < 2600) {                            // 完成：鍋上浮出料理
      ctx.globalAlpha = age > 2000 ? (2600 - age) / 600 : 1;
      const y = top - 18 - Math.min(8, age / 50);
      drawDish(cx - 8, Math.round(y), c.rk);
      if (age < 1200) for (let k = 0; k < 3; k++) r('#ffd34d', Math.round(cx - 9 + k * 9), Math.round(y + 2 + Math.sin(now / 90 + k) * 2), 1, 1);
    }
    ctx.restore();
    // 頭上名牌：料理名稱、三段燈號、剩餘愛心
    const w = 64, h = 18, x = Math.round(cx - w / 2), y = Math.max(1, top - h - 4);
    ob('#fffaf0', c.ph === 'done' ? '#6fcf7f' : c.ph === 'fail' ? '#ef6a5a' : '#c9a05a', x, y, w, h);
    ctx.font = CK_FONT; ctx.textAlign = 'center';
    ctx.fillStyle = c.ph === 'done' ? '#2e9b4c' : c.ph === 'fail' ? '#e0503f' : INK;
    ctx.fillText(c.ph === 'done' ? '完成！' : c.ph === 'fail' ? '糊掉了…' : c.name, cx, y + 7);
    for (let k = 0; k < 3; k++) {
      const res = c.res[k], col = res === 'ok' ? '#6fcf7f' : res === 'bad' ? '#ef6a5a' : (k === c.i && heat && Math.floor(now / 150) % 2) ? '#ffd34d' : '#e5d7c8';
      r(col, x + 6 + k * 7, y + 11, 4, 4); r(col, x + 7 + k * 7, y + 10, 2, 6); r(col, x + 5 + k * 7, y + 12, 6, 2);
    }
    const lives = c.mm + 1;
    for (let k = 0; k < lives; k++) heartPx(x + w - 4 - (lives - k) * 6, y + 11, k < lives - c.miss ? '#ef6a7a' : '#cdbfb4');
  });
}
/* 有人在煮菜時，顯示「喝采」按鈕；同時清掉過期的烹飪狀態 */
function updateCheer() {
  const el = $('cheer'); if (!el) return;
  const t = Date.now(); let on = false;
  remotes.forEach(rp => {
    const c = rp.cook; if (!c) return;
    if (t - c.last > 90000 || ((c.ph === 'done' || c.ph === 'fail') && t - c.t0 > COOK_SHOW)) { rp.cook = null; return; }
    if (hereRp(rp)) on = true;
  });
  el.hidden = !(on && scene === 'house' && !cooking);
}
$('cheer').addEventListener('click', () => doEmote('e', 'clap'));
/* 吃一份料理（廚房和背包共用）：成功回傳伺服器結果（含 buff），失敗回傳 null */
let eating = false;
async function eatDish(k) {
  if (eating) return null;
  eating = true;
  try {
    const r = await enqueue(() => rpc('eat', { p_key: k }));
    if (r.inv) Object.assign(inv, r.inv);
    if (r.buff) { buffs[r.buff] = +r.until; toast('吃下去了：' + (BUFF_N[r.buff] || r.buff)); updateBuffChip(); }
    return r;
  } catch (err) { toast(errText(err)); await resync(); return null; }
  finally { eating = false; }
}
ckCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, k = b.dataset.c;
  if (a === 'close') { closeKitchen(); return; }
  if (a === 'cook') { ckStart(k); return; }
  if (a === 'cookback') { cgStop(); renderKitchen(); return; }
  ckBusy = true; renderKitchen();
  const r = await eatDish(k);
  ckBusy = false;
  refreshHud();
  if (r && r.buff) { closeKitchen(); playEat(k, r.buff); return; }   // 關掉廚房視窗才看得到角色吃東西
  if (ckOpen && !cg) renderKitchen();
});
ckEl.addEventListener('click', e => { if (e.target === ckEl && !cg) closeKitchen(); });
let lastBuffSig = '', buffOpen = false, lastBuffKeys = [];
function updateBuffChip() {
  const el = $('buff'); if (!el) return;
  const ks = Object.keys(BUFF_N).filter(buffOn);
  const left = k => buffs[k] - srvNow(), mins = k => Math.ceil(left(k) / 60000);
  const sig = ks.map(k => k + mins(k)).join('|') + (buffOpen ? '|o' : '');
  if (sig === lastBuffSig) return;
  lastBuffSig = sig;
  el.hidden = !ks.length;
  if (!ks.length) { buffOpen = false; lastBuffKeys = []; el.innerHTML = ''; return; }
  const fresh = ks.filter(k => !lastBuffKeys.includes(k)); lastBuffKeys = ks;
  const ring = ks.map(k => {
    const p = Math.max(2, Math.min(100, Math.round(left(k) / BUFF_MAX * 100)));
    return '<button type="button" class="bring' + (mins(k) <= 1 ? ' low' : '') + (fresh.includes(k) ? ' new' : '') + '" style="--p:' + p + '" data-b="1" aria-label="' + esc(BUFF_N[k]) + '，剩 ' + mins(k) + ' 分鐘"><span>' + BUFF_I[k] + '</span></button>';
  }).join('');
  const pop = buffOpen ? '<div class="bpop"><h3>料理效果</h3>' + ks.map(k =>
    '<div class="bli"><i>' + BUFF_I[k] + '</i><div><b>' + esc(BUFF_N[k]) + '</b><span>' + esc(BUFF_D[k]) + '</span></div><em>' + mins(k) + '分</em></div>').join('') +
    '<p>再吃同一種會續時間，最多 60 分鐘。</p></div>' : '';
  el.innerHTML = '<div class="brow">' + ring + '</div>' + pop;
}
$('buff').addEventListener('click', e => {
  if (!e.target.closest('[data-b]')) return;
  e.stopPropagation(); buffOpen = !buffOpen; lastBuffSig = ''; updateBuffChip();
});
document.addEventListener('click', e => {
  if (buffOpen && !e.target.closest('#buff')) { buffOpen = false; lastBuffSig = ''; updateBuffChip(); }
});
