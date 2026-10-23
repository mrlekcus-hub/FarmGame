'use strict';
/* 料理與烹飪小遊戲 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 料理：廚房灶台（家裡擺了才能用） ---------- */
const DISHC = { rcake: '#f3d79a', stew: '#e8a05a', pie: '#f0a64a', grilled: '#c98f62', soup: '#e8c97a', escargot: '#b98a62' };
function dishIcon(c2d, k) {
  g = c2d; g.clearRect(0, 0, 16, 16);
  ob('#fffaf0', '#c9b79a', 2, 9, 12, 5);
  ob(DISHC[k] || '#f3c77a', 'rgba(90,60,40,.5)', 3, 5, 10, 6);
  r('rgba(255,255,255,.55)', 5, 6, 2, 1); r('#8fe09a', 9, 4, 2, 2);
  g = ctx;
}
const BUFF_N = { swift: '走路變快', fish: '釣魚運氣變好', bug: '捕蟲網變大' };
const ckEl = $('ckm'), ckCard = $('ckcard');
let ckBusy = false;
function openKitchen() { if (ckOpen) return; ckOpen = true; pressed.length = 0; renderKitchen(); ckEl.hidden = false; ckCard.focus(); }
function closeKitchen() { cgStop(); ckOpen = false; ckEl.hidden = true; }
function maxCook(rc) { let m = 99; for (const k in rc.ing) m = Math.min(m, Math.floor(have(k) / rc.ing[k])); return m; }
/* ---- 烹飪技能：經驗存在這台裝置上；等級上限跟其他技能一樣（玩家等級＋2） ---- */
let ckXp = 0, ckXpUser = null;
const ckKey = () => 'dewfarm_cook_' + authUser;
function ckLoadXp() { if (ckXpUser === authUser) return; ckXpUser = authUser; ckXp = 0; try { ckXp = Math.max(0, parseInt(localStorage.getItem(ckKey()), 10) || 0); } catch (e) { /* 略過 */ } }
const ckCap = () => (lv && +lv.cap) ? Math.min(12, +lv.cap) : 12;
function ckLv() { ckLoadXp(); let L = 1; while (L < 12 && ckXp >= skillNeed(L + 1)) L++; return Math.min(L, ckCap()); }
/* 料理難度（1～5 星）：照售價由低到高分組，星數 = 需要的烹飪等級 */
function ckTier(rc) {
  const s = recipes.slice().sort((a, b) => (a.price - b.price) || (a.key < b.key ? -1 : 1));
  const i = Math.max(0, s.findIndex(x => x.key === rc.key));
  return Math.min(5, 1 + Math.floor(i * 5 / Math.max(1, s.length)));
}
function ckAddXp(n) {
  const before = ckLv(), cap = ckCap();
  if (before >= 12 || before >= cap) return 0;
  if (cap < 12) n = Math.min(n, skillNeed(cap + 1) - 1 - ckXp);
  if (n <= 0) return 0;
  ckXp += n;
  try { localStorage.setItem(ckKey(), String(ckXp)); } catch (e) { /* 略過 */ }
  const after = ckLv();
  if (after > before) {
    const names = recipes.filter(rc => ckTier(rc) === after).map(rc => rc.name);
    levelUp('烹飪等級 Lv.' + after, [names.length ? '解鎖：' + names.join('、') : '熟練度又提升了', '火候的綠區變寬了，更好停']);
  }
  if (lvOpen) renderLevels();
  return n;
}
function ckSkillHtml() {
  const L = ckLv(), cap = ckCap(), mx = L >= 12, atCap = L >= cap && !mx;
  const sub = mx ? '已滿級' : atCap ? '需要玩家 Lv.' + (lv ? lv.pl + 1 : '?') + ' 才能繼續成長' : '經驗 ' + ckXp + ' / ' + skillNeed(L + 1);
  return '<div class="row"><span style="font-size:24px;line-height:1">🍳</span><div class="meta"><b>烹飪 Lv.' + L + ' / 上限 ' + cap + '</b><small>' + sub + '</small>' + lvBar(skillNeed(L), skillNeed(L + 1), ckXp, '') + '</div></div>';
}
function renderKitchen() {
  const dis = ckBusy ? ' disabled' : '';
  const act_ = Object.keys(buffs).filter(buffOn).map(k => (BUFF_N[k] || k) + '（剩 ' + Math.ceil((buffs[k] - srvNow()) / 60000) + ' 分鐘）');
  const L = ckLv();
  const rows = recipes.map(rc => {
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
function cgStop() { cooking = null; }
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
}
function cookCancel() { if (!cooking) return; cooking = null; toast('不煮了（材料沒有消耗）', 1600); }
function cookMiss(c, msg, now) {
  c.miss++; c.ok = false; c.phase = 'pause'; c.at = now + 650; c.msg = msg;
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
  if (h >= rd.a && h <= rd.b) { c.done++; c.ok = true; c.phase = 'pause'; c.at = now + 600; c.msg = '剛剛好！'; sparkle(c.fx, c.fy, '#ffd34d'); if (navigator.vibrate) try { navigator.vibrate(20); } catch (_) {} }
  else cookMiss(c, h >= 1 ? '燒焦了！' : h < rd.a ? '太生了…' : '火太大了…', now);
}
function cookTick() {
  const c = cooking; if (!c || c.phase === 'serve') return;
  const it = scene === 'house' && house ? house.items.find(x => x.id === c.itId) : null;
  if (c.scene !== scene || !it || paused() || pressed.length) { cookCancel(); return; }
  const now = Date.now(), rd = c.plan[c.i], dt = Math.min(100, now - (c.lt || now)); c.lt = now;
  if (c.phase === 'wait') { if (now >= c.at) { c.phase = 'idle'; c.heat = 0; c.needRel = actHeld; } }
  else if (c.phase === 'idle') { if (c.needRel) { if (!actHeld) c.needRel = false; } else if (actHeld) { c.phase = 'heat'; c.t0 = now; } }
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
  let made = false, errMsg = '';
  if (ok) {
    c.phase = 'serve'; ckBusy = true;
    try { const r = await enqueue(() => rpc('cook', c.host ? { p_key: rc.key, p_qty: 1, p_at: c.host } : { p_key: rc.key, p_qty: 1 })); if (r.inv) Object.assign(inv, r.inv); made = true; }
    catch (err) { errMsg = errText(err); await resync(); }
    ckBusy = false; refreshHud();
  }
  if (cooking === c) cooking = null;
  const gain = made ? Math.round((6 + 4 * c.T) * (perfect ? 1.5 : 1)) : ok ? 0 : 2;
  const got = gain ? ckAddXp(gain) : 0;
  const xp = got ? ' · 烹飪經驗 +' + got : '';
  dishIcon(catchCv.getContext('2d'), rc.key);
  catchT.textContent = made ? rc.name + (perfect ? '　完美！' : '') : !ok ? '糊掉了…' : '做不出來';
  catchS.textContent = (made ? '已放進背包，現在持有 ' + have('dish:' + rc.key) + ' 份' + (perfect ? '（零失誤，經驗加成）' : '') : errMsg ? errMsg : '失誤太多了，材料沒有消耗，再試一次吧') + xp;
  catchEl.style.setProperty('--rc', DISHC[rc.key] || '#f3c77a');
  $('catch-show').hidden = true;
  catchShown = true; catchEl.hidden = false; clearTimeout(catchTimer); catchTimer = setTimeout(hideCatch, 4500);
  if (made) { sparkle(c.fx, c.fy, '#ffd34d'); }
}
function heartPx(x, y, col) { r(col, x, y, 2, 1); r(col, x + 3, y, 2, 1); r(col, x, y + 1, 5, 1); r(col, x + 1, y + 2, 3, 1); r(col, x + 2, y + 3, 1, 1); }
function drawCooking(now) {
  const c = cooking;
  if (!c || c.scene !== scene) return;
  const it = house ? house.items.find(x => x.id === c.itId) : null, rt = it && itemRect(it);
  if (!rt) return;
  const px0 = (RX + rt.x) * T, top = (RY + rt.y) * T, cx = px0 + Math.round(rt.w * T / 2), t = Date.now(), rd = c.plan[Math.min(c.i, c.plan.length - 1)];
  const fl = Math.floor(now / 120) % 3;                       // 爐火
  r('#ff8a3c', px0 + 6, top + 4 - (fl === 0 ? 1 : 0), 2, 2); r('#ffd34d', px0 + 9, top + 4 - (fl === 1 ? 1 : 0), 2, 2);
  let label, edge = '#c9a05a';
  if (c.phase === 'wait') label = '火候 ' + (c.i + 1) + '/' + c.plan.length;
  else if (c.phase === 'idle') label = '按住加熱';
  else if (c.phase === 'heat') { label = '放開定火！'; edge = Math.floor(now / 110) % 2 ? '#ff9a4a' : '#c9742a'; }
  else if (c.phase === 'pause') { label = c.msg || (c.ok ? '剛剛好！' : '糟了…'); edge = c.ok ? '#6fcf7f' : '#ef6a5a'; }
  else label = '盛盤中…';
  ctx.font = '800 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
  const bw = 56, w = bw + 10, h = 24, x = Math.round(cx - w / 2), y = top - h - 8;
  ob('#fffaf0', edge, x, y, w, h);
  ctx.textAlign = 'center'; ctx.fillStyle = INK;
  ctx.fillText(label, cx, y + 9);
  const bx = x + 5, by = y + 13, bh = 6, za = Math.round(bw * rd.a), zb = Math.round(bw * rd.b);
  r('#f6d9c8', bx, by, za, bh); r('#6fcf7f', bx + za, by, zb - za, bh); r('#f1b3a8', bx + zb, by, bw - zb, bh);
  const mx = bx + Math.min(bw - 1, Math.round(bw * clamp(c.heat, 0, 1)));
  r('#5a4034', mx - 1, by - 2, 2, bh + 4);
  if (c.phase === 'heat') { r('#ff8a3c', px0 + 5, top + 2, 2, 3); r('#ffd34d', px0 + 9, top + 2, 2, 3); r('#ff8a3c', px0 + 12, top + 3, 2, 2); }   // 加熱時火變大
  const lives = c.maxMiss + 1;                                // 生命（愛心）
  for (let k = 0; k < lives; k++) heartPx(x + w + 3 + k * 6, y + 2, k < lives - c.miss ? '#ef6a7a' : '#cdbfb4');
}
ckCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, k = b.dataset.c;
  if (a === 'close') { closeKitchen(); return; }
  if (a === 'cook') { ckStart(k); return; }
  if (a === 'cookback') { cgStop(); renderKitchen(); return; }
  ckBusy = true; renderKitchen();
  try {
    const r = await enqueue(() => rpc('eat', { p_key: k }));
    if (r.inv) Object.assign(inv, r.inv);
    if (r.buff) { buffs[r.buff] = +r.until; toast('吃下去了：' + (BUFF_N[r.buff] || r.buff)); updateBuffChip(); }
  } catch (err) { toast(errText(err)); await resync(); }
  ckBusy = false;
  if (ckOpen && !cg) renderKitchen();
  refreshHud();
});
ckEl.addEventListener('click', e => { if (e.target === ckEl && !cg) closeKitchen(); });
let lastBuffSig = '';
function updateBuffChip() {
  const el = $('buff'); if (!el) return;
  const ks = Object.keys(BUFF_N).filter(buffOn);
  const sig = ks.map(k => k + Math.ceil((buffs[k] - srvNow()) / 60000)).join('|');
  if (sig === lastBuffSig) return;
  lastBuffSig = sig;
  el.style.display = ks.length ? '' : 'none';
  el.textContent = '🍲 ' + ks.map(k => BUFF_N[k] + ' ' + Math.ceil((buffs[k] - srvNow()) / 60000) + '分').join('、');
}
