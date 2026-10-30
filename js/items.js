'use strict';
/* 庭院裝飾、雜項物品、建物地標、採集、挖礦 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 庭院裝飾（擺在農場空草地上） ---------- */
const yardBlocks = (x, y) => { const k = yardMap.get(pk(x, y)); if (!k) return false; const c = ycat.find(q => q.key === k); return !(c && c.walk); };
function yardArt(px, py, key, now, night) {
  const o = 'rgba(90,60,40,.55)';
  switch (key) {
    case 'stones': r('#c9c3b8', px + 2, py + 5, 5, 4); r('#c9c3b8', px + 9, py + 8, 5, 4); r('#e6e1d6', px + 3, py + 5, 2, 1); r('#e6e1d6', px + 10, py + 8, 2, 1); break;
    case 'fence': r('rgba(90,60,40,.16)', px + 1, py + 14, 14, 1); r('#b88458', px + 1, py + 7, 14, 2); r('#b88458', px + 1, py + 11, 14, 2);
      [2, 7, 12].forEach(x0 => { ob('#e8b27a', '#9b6a44', px + x0, py + 3, 3, 11); }); break;
    case 'flowers': ob('#9b6a44', '#6e4a2e', px + 1, py + 9, 14, 6); r('#6b4a2e', px + 2, py + 10, 12, 4);
      [[3, 6, '#ff8fa8'], [7, 4, '#ffd34d'], [11, 6, '#b79cff'], [5, 8, '#ffffff'], [9, 8, '#ff8fa8']].forEach(([a, b, c]) => { r('#5fbf6a', px + a, py + b + 2, 1, 3); rr(c, px + a - 1, py + b, 3, 3); }); break;
    case 'lamp': r('rgba(90,60,40,.18)', px + 4, py + 14, 8, 1); r('#5b5b68', px + 7, py + 5, 2, 10); r('#5b5b68', px + 5, py + 13, 6, 2);
      ob(night ? '#ffe9a0' : '#fff6d6', '#8f8f9a', px + 5, py + 1, 6, 5);
      if (night) { g.globalAlpha = 0.22; rr('#ffe58a', px - 6, py - 7, 28, 26); g.globalAlpha = 0.18; rr('#ffe58a', px - 2, py - 3, 20, 18); g.globalAlpha = 1; } break;
    case 'bench': r('rgba(90,60,40,.18)', px + 1, py + 14, 14, 1); ob('#e8b27a', '#9b6a44', px + 1, py + 4, 14, 4); ob('#d9a066', '#9b6a44', px + 1, py + 9, 14, 3); r('#9b6a44', px + 2, py + 12, 2, 3); r('#9b6a44', px + 12, py + 12, 2, 3); break;
    case 'sapling': r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 1); r('#8c5b3c', px + 7, py + 8, 2, 7); rr('#7fd08a', px + 3, py + 1, 10, 9); rr('#a8ecaa', px + 5, py + 2, 4, 3); r('#ff8fa8', px + 5, py + 6, 1, 1); r('#ff8fa8', px + 10, py + 4, 1, 1); break;
    case 'statue': r('rgba(90,60,40,.18)', px + 2, py + 14, 12, 1); ob('#c9c3b8', '#8d877c', px + 3, py + 11, 10, 4); ob('#e6e1d6', '#8d877c', px + 5, py + 3, 6, 9); ob('#e6e1d6', '#8d877c', px + 6, py + 1, 4, 4); r('#8d877c', px + 7, py + 2, 1, 1); r('#8d877c', px + 9, py + 2, 1, 1); break;
    default: ob('#cccccc', o, px + 4, py + 4, 8, 8);
  }
}
function yardIcon(c2d, key) { g = c2d; g.clearRect(0, 0, 16, 16); yardArt(0, 0, key, 0, false); g = ctx; }
/* 面向的格子能不能擺庭院裝飾（要和 SQL _yard_ok 一致；客戶端更嚴：只能是空草地） */
const yardOkLocal = (x, y) => grassTile(x, y) && !farmable(x, y) && !plots.has(pk(x, y)) && !yardMap.has(pk(x, y)) && x <= 18;
function yardAct(x, y) {
  if (featLocked('yard', x, y)) return;
  const here = yardMap.get(pk(x, y));
  if (here) {
    yardMap.delete(pk(x, y)); inv['y:' + here] = have('y:' + here) + 1;
    pop(x, y, '收回' + itemName('y:' + here), '#fff3b0'); dust(x, y);
    act2('yard_pick', { p_x: x, p_y: y }); refreshHud(); renderYardBar(); return;
  }
  const mine = Object.keys(inv).filter(k => /^y:/.test(k) && inv[k] > 0);
  let key = yardSel && have('y:' + yardSel) > 0 ? yardSel : (mine[0] || '').slice(2);
  if (!key) { pop(x, y, '沒有庭院裝飾，去村長家的園藝工坊買', '#ffb3a8'); return; }
  if (!yardOkLocal(x, y)) { pop(x, y, '這裡不能擺（要空草地，不含田地區）', '#ffb3a8'); return; }
  yardMap.set(pk(x, y), key); inv['y:' + key] = have('y:' + key) - 1;
  pop(x, y, '擺上' + itemName('y:' + key), '#c9f0a8'); dust(x, y);
  act2('yard_place', { p_key: key, p_x: x, p_y: y }, null, e => { yardMap.delete(pk(x, y)); return false; });
  refreshHud(); renderYardBar();
}

/* ---------- 庭院佈置模式：右側功能列的「🏡 庭院」。開著時，動作鍵（面向的格子）＝擺放選中的裝飾／收回已擺的 ---------- */
function setYard(on) {
  if (on && (scene !== 'farm' || visiting || !ready || !me)) { if (scene !== 'farm') toast('庭院佈置要在自己的農場上進行'); return; }
  if (on && featLocked('yard')) return;
  yardMode = !!on;
  const b = $('dockyard'); if (b) { b.classList.toggle('on', yardMode); b.setAttribute('aria-pressed', yardMode ? 'true' : 'false'); }
  renderYardBar();
}
const toggleYard = () => setYard(!yardMode);
function renderYardBar() {
  const el = $('yardbar'); if (!el) return;
  if (!yardMode) { el.hidden = true; el.innerHTML = ''; return; }
  const mine = Object.keys(inv).filter(k => /^y:/.test(k) && inv[k] > 0).sort();
  if (mine.length && !mine.includes('y:' + yardSel)) yardSel = mine[0].slice(2);
  el.innerHTML = '<div class="yb-h"><b>🏡 庭院佈置模式</b><span>點空草地擺放 · 點已擺的裝飾收回（也可面向格子按動作鍵）</span><button type="button" class="btn small" data-y="end">結束</button></div>' +
    (mine.length ? '<div class="yb-g">' + mine.map(k => '<button type="button" class="yb-i' + (k.slice(2) === yardSel ? ' on' : '') + '" data-y="sel" data-k="' + esc(k.slice(2)) + '"><canvas width="16" height="16" data-y-ic="' + esc(k.slice(2)) + '"></canvas><small>' + esc(itemName(k)) + '</small><i>×' + inv[k] + '</i></button>').join('') + '</div>'
      : '<p class="yb-e">還沒有庭院裝飾，到小村村長家的園藝工坊買。</p>');
  el.querySelectorAll('canvas[data-y-ic]').forEach(c => yardIcon(c.getContext('2d'), c.dataset.yIc));
  el.hidden = false;
}
$('yardbar').addEventListener('pointerdown', e => e.stopPropagation());
$('yardbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-y]'); if (!b) return;
  if (b.dataset.y === 'end') setYard(false);
  else if (b.dataset.y === 'sel') { yardSel = b.dataset.k; renderYardBar(); }
});
setInterval(() => { if (yardMode && (scene !== 'farm' || visiting || !ready || authOpen)) setYard(false); }, 400);   // 離開農場、被叫去別處就自動結束

/* ---------- 雜項物品（畜產、採集物、礦物、肥料）的像素圖與價錢 ---------- */
function miscArt(px, py, key) {
  const m = itemMeta[key] || { shape: 'round', color: '#cccccc' }, c = m.color, o = 'rgba(90,60,40,.55)';
  r('rgba(90,60,40,.16)', px + 4, py + 13, 8, 2);
  switch (m.shape) {
    case 'bottle': ob('#fffaf0', o, px + 5, py + 6, 6, 8); r('#d8ecf8', px + 6, py + 8, 4, 5); r(o, px + 6, py + 3, 4, 3); break;
    case 'cloud': rr(c, px + 2, py + 6, 6, 6); rr(c, px + 7, py + 5, 7, 7); rr('#ffffff', px + 4, py + 7, 3, 2); r(o, px + 4, py + 12, 8, 1); break;
    case 'sack': ob(c, o, px + 3, py + 5, 10, 9); r(o, px + 6, py + 3, 4, 2); r('rgba(255,255,255,.35)', px + 5, py + 7, 2, 4); break;
    case 'leaf': r('#5fbf6a', px + 7, py + 7, 2, 7); rr(c, px + 4, py + 2, 8, 6); r('#fff8c0', px + 7, py + 4, 2, 2); break;
    case 'flower': r('#5fbf6a', px + 7, py + 8, 2, 6); rr(c, px + 4, py + 3, 3, 3); rr(c, px + 9, py + 3, 3, 3); rr(c, px + 6, py + 1, 4, 3); rr(c, px + 6, py + 5, 4, 3); r('#ff9b3a', px + 7, py + 4, 2, 2); break;
    case 'berry': ob(c, o, px + 3, py + 7, 5, 5); ob(c, o, px + 8, py + 6, 5, 5); r('#5fbf6a', px + 7, py + 3, 3, 3); r('rgba(255,255,255,.55)', px + 4, py + 8, 1, 1); break;
    case 'cap': ob(c, o, px + 2, py + 3, 12, 6); r('#fff3d6', px + 4, py + 5, 2, 2); r('#fff3d6', px + 9, py + 4, 2, 2); ob('#fff3d6', o, px + 6, py + 9, 4, 5); break;
    case 'gem': ob(c, '#4a7fa8', px + 3, py + 4, 10, 8); r('#ffffff', px + 5, py + 5, 2, 2); r('#4a7fa8', px + 7, py + 7, 1, 4); r(c, px + 5, py + 12, 6, 2); break;
    case 'log': ob('#c99a6a', '#7a5532', px + 2, py + 5, 12, 5); ob('#b98a62', '#7a5532', px + 3, py + 9, 11, 5); r('#e8c9a0', px + 3, py + 6, 2, 3); r('#e8c9a0', px + 4, py + 10, 2, 3); r('#8a5a34', px + 4, py + 7, 1, 1); break;
    case 'rock': ob(c, o, px + 2, py + 6, 12, 8); r('rgba(255,255,255,.4)', px + 4, py + 7, 3, 1); break;
    case 'ore': ob('#a8a8b0', o, px + 2, py + 6, 12, 8); r(c, px + 4, py + 8, 3, 2); r(c, px + 9, py + 10, 3, 2); r(c, px + 8, py + 7, 2, 2); break;
    default: ob(c, o, px + 4, py + 5, 8, 8); r('rgba(255,255,255,.6)', px + 5, py + 6, 2, 2);
  }
}
function miscIcon(c2d, key) { g = c2d; g.clearRect(0, 0, 16, 16); miscArt(0, 0, key); g = ctx; }
function qcropIcon(c2d, key) {
  const q = key.slice(0, 2), k = key.slice(3);
  cropIcon(c2d, k); g = c2d;
  const sc = q === 'q2' ? '#ffd23a' : '#d8e6f2';
  r('#7a5a1a', 10, 0, 6, 6); r(sc, 11, 1, 4, 4); r('#ffffff', 12, 2, 1, 1);
  g = ctx;
}
function miscPrice(key) {
  if (/^q[12]:/.test(key)) { const k = key.slice(3); return Math.floor((cropPrice(k) * (key[1] === '2' ? 150 : 125) + 50) / 100); }
  return (itemMeta[key] || {}).price | 0;
}

/* ---------- 建物與地標：穀倉、礦石、旅行商人的攤位 ---------- */
function drawBarn(now) {   // 穀倉＋筒倉（4×2 格，在 (12,1)）：左邊三格是穀倉，右邊一格是筒倉
  const ox = 12 * T, oy = 1 * T;
  r('rgba(107,72,72,.16)', ox + 2, oy + 30, 60, 2);
  ob('#e0786a', '#9b3f3a', ox + 1, oy + 8, 46, 23);
  r('#f4a090', ox + 3, oy + 10, 42, 2);
  ob('#9b6a44', '#6e4a2e', ox, oy + 1, 48, 9); r('#b88458', ox + 3, oy + 3, 42, 2);
  ob('#fff0d4', '#9b6a44', ox + 17, oy + 16, 14, 15);
  r('#9b6a44', ox + 23, oy + 17, 2, 14); r('#9b6a44', ox + 18, oy + 22, 12, 2);
  ob('#ffe9a8', '#9b6a44', ox + 21, oy + 4, 6, 4);
  ob('#e8c070', '#b8923e', ox + 34, oy + 25, 6, 6); ob('#f5e6c8', '#b8923e', ox + 40, oy + 26, 5, 5);
  ob('#c9c3b8', '#8d877c', ox + 49, oy + 8, 14, 23);
  rr('#8d877c', ox + 48, oy + 3, 16, 7); r('#a8a39a', ox + 51, oy + 4, 4, 1);
  r('#8d877c', ox + 49, oy + 15, 14, 1); r('#8d877c', ox + 49, oy + 22, 14, 1);
  r('#7a8590', ox + 53, oy + 25, 6, 6);
  const bob = Math.floor(now / 400) % 2;
  r('#ffffff', ox + 3, oy + 26 - bob, 3, 3); r('#ffd34d', ox + 6, oy + 28, 1, 1);
}
function drawRock(px, py, idx) {
  const ready = !(rocksAt[idx] > srvNow());
  r('rgba(90,60,40,.18)', px + 1, py + 13, 14, 2);
  ob(ready ? '#b4b8c4' : '#8d909b', ready ? '#6f7384' : '#5e616e', px + 1, py + 4, 14, 10);
  if (ready) {
    r('#dfe3ec', px + 3, py + 5, 4, 1); r('#8e93a6', px + 9, py + 9, 4, 3);
    r('#8fd3ff', px + 5, py + 8, 2, 2); r('#d98a52', px + 10, py + 6, 2, 2);
  } else r('#6f7384', px + 5, py + 7, 5, 1);
}
function drawStall(px, py, now) {
  r('rgba(90,60,40,.18)', px + 1, py + 14, 14, 2);
  r('#9b6a44', px + 2, py + 6, 2, 9); r('#9b6a44', px + 12, py + 6, 2, 9);
  for (let i = 0; i < 4; i++) rr(i % 2 ? '#ffffff' : '#7a7ee8', px + 1 + i * 4, py, 4, 6);
  ob('#e8b27a', '#9b6a44', px + 2, py + 10, 12, 4);
  r('#ffd34d', px + 4, py + 8, 2, 2); r('#ff8fa8', px + 7, py + 8, 2, 2); r('#8fd3ff', px + 10, py + 8, 2, 2);
  if (Math.floor(now / 500) % 2) r('#fff6a8', px + 14, py + 1, 1, 3);
}

/* ---------- 採集：農場草地每 30 分鐘長出 3 樣當季野外採集物（和 SQL _slot_forage 一致） ---------- */
const FSLOT_MS = 1800000;
function forageSlot(sl) {
  const sea = seasonAt(sl * FSLOT_MS), pool = forPool.filter(q => q.season === sea).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const tot = pool.reduce((t, q) => t + q.weight, 0), out = [];
  if (!tot) return out;
  for (let i = 0; i < 3; i++) {
    const rr_ = hash(sl, i, 61) * tot; let cs = 0, key = pool[pool.length - 1].key;
    for (const q of pool) { cs += q.weight; if (cs >= rr_) { key = q.key; break; } }
    let x = 1 + Math.floor(hash(sl, i, 63) * (W - 2)), y = 1 + Math.floor(hash(sl, i, 64) * (H - 2));
    for (let n = 0; n < W * H && !(grassTile(x, y) && !farmable(x, y)); n++) { x++; if (x >= W - 1) { x = 1; y = y >= H - 2 ? 1 : y + 1; } }
    out.push({ slot: sl, i, key, x, y });
  }
  return out;
}
function updateForage() {
  const sl = Math.floor(srvNow() / FSLOT_MS);
  if (sl !== fgSlot && forPool.length) { fgSlot = sl; fgList = forageSlot(sl - 1).concat(forageSlot(sl)); }
}
function takeForage(f) {
  if (featLocked('forage', f.x, f.y)) return;
  const id = f.slot + ':' + f.i;
  forTaken.add(id);
  sparkle(f.x, f.y, '#fff6a8');
  enqueue(() => rpc('forage_take', { p_slot: f.slot, p_i: f.i })).then(r => {
    if (r.inv) Object.assign(inv, r.inv);
    if (r.item) { pop(f.x, f.y, '+1 ' + itemName(r.item), '#fff3b0'); loadLevelSoon(); } else toast('這個已經被採走了');
    refreshHud();
  }).catch(e => { toast(errText(e)); });
}

/* ---------- 挖礦、施肥 ---------- */
function mineRock(x, y) {
  const idx = ROCKS.findIndex(q => q[0] === x && q[1] === y), t = curTool();
  if (idx < 0) return;
  if (featLocked('mine', x, y)) return;
  if (t.id !== 'pick') { pop(x, y, '換成鎬子才敲得動', '#ffffff'); return; }
  if (rocksAt[idx] > srvNow()) { pop(x, y, '還在恢復中', '#ffffff'); return; }
  rocksAt[idx] = nextDay0();
  burst(x, y, 8, ['#dfe3ec', '#b4b8c4'], -1.2, 8);
  enqueue(() => rpc('mine', { p_rock: idx })).then(r => {
    if (r.inv) Object.assign(inv, r.inv);
    rocksAt[idx] = +r.ready;
    const got = r.got || {};
    pop(x, y, Object.keys(got).map(k => itemName(k) + '×' + got[k]).join(' '), '#fff3b0');
    if (got['m:gem']) toast('挖到水晶了！');
    refreshHud();
  }).catch(e => { rocksAt[idx] = srvNow() + 3000; toast(errText(e)); loadRocks(); resync(); });   // 同上：先鎖 3 秒，再向伺服器同步真實冷卻
}
/* ---------- 砍樹：西邊森林的 17 棵樹，每人各自 隔天 0 點長回來 ---------- */
function drawChopTree(px, py, tx, ty, idx) {
  if (treesAt[idx] > srvNow()) {   // 還在長：只剩樹墩
    drawGrass(px, py, tx, ty);
    r('rgba(107,72,72,.16)', px + 2, py + 12, 12, 3);
    ob('#b98a62', '#7a5532', px + 4, py + 8, 8, 6); r('#e8c9a0', px + 5, py + 9, 6, 2); r('#9a6a4a', px + 7, py + 9, 2, 1);
    return;
  }
  drawTree(px, py, tx, ty);
  r('#8a5a34', px + 5, py + 10, 6, 6); r('#5a3a1c', px + 5, py + 10, 1, 6);   // 比裝飾樹粗的樹幹
  const tw = Math.floor(srvNow() / 500 + idx) % 2;   // 金色星點閃爍：看得出是可以砍的
  r('#ffd34d', px + 1, py + 1, 2, 2); r('#ffd34d', px + 13, py + 3, 2, 2); if (tw) { r('#ffffff', px + 2, py + 2, 1, 1); r('#ffffff', px + 13, py + 3, 1, 1); }
}
const CHOP_HITS = 1;
function chopTree(x, y) {
  const idx = CHOPS.findIndex(q => q[0] === x && q[1] === y), t = curTool();
  if (idx < 0) return;
  if (t.id !== 'axe') { pop(x, y, '換成斧頭才砍得動', '#ffffff'); return; }
  const left = (treesAt[idx] | 0) - srvNow();
  if (left > 0) { pop(x, y, '還沒生長，每天 0 點長回來（約 ' + fmtDur(Math.ceil(left / 1000)) + ' 後）', '#ffffff'); return; }
  const n = (chopHits[idx] | 0) + 1;
  burst(x, y, 5, ['#8fcf7a', '#b98a62'], -1.2, 6);
  if (n < CHOP_HITS) { chopHits[idx] = n; pop(x, y, '砍！' + n + '/' + CHOP_HITS, '#fff3b0'); return; }
  delete chopHits[idx];
  treesAt[idx] = nextDay0();
  burst(x, y, 10, ['#8fcf7a', '#b98a62', '#e8c9a0'], -1.4, 8);
  enqueue(() => rpc('chop_tree', { p_tree: idx })).then(r => {
    if (r.inv) Object.assign(inv, r.inv);
    treesAt[idx] = +r.ready;
    const got = r.got || {};
    pop(x, y, Object.keys(got).map(k => itemName(k) + '×' + got[k]).join(' '), '#fff3b0');
    refreshHud();
  }).catch(e => { treesAt[idx] = srvNow() + 3000; toast(errText(e)); loadTrees(); resync(); });   // 失敗先鎖 3 秒（連點不會狂送請求），loadTrees 回來會用伺服器的真實時間覆蓋
}
function fertAct(x, y, p) {
  if (!p || !p.crop) { pop(x, y, '先種下作物再施肥', '#ffffff'); return; }
  if (p.fert) { pop(x, y, '已經施過肥了', '#ffffff'); return; }
  const kd = have('x:fert') > 0 ? 1 : have('x:fert2') > 0 ? 2 : 0;
  if (!kd) { pop(x, y, '沒有肥料，找旅行商人買', '#ffb3a8'); return; }
  const ik = kd === 2 ? 'x:fert2' : 'x:fert';
  inv[ik] = have(ik) - 1; p.fert = kd;
  sparkle(x, y, '#c9a15a'); pop(x, y, '施肥！', '#c9f0a8');
  act2('fertilize', { p_x: x, p_y: y, p_kind: kd });
  refreshHud();
}
