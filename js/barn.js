'use strict';
/* 穀倉內部 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 穀倉內部：走進去看得到養的動物 ---------- */
const BAW = 14, BAH = 10, BWL = 19, TRG = 20, BSK = 21, SGN = 22, BX = 23;   // 牆／飼料槽／收成籃／告示牌／門
const bkind = Array.from({ length: BAH }, () => Array(BAW).fill(G));
for (let y = 0; y < BAH; y++) for (let x = 0; x < BAW; x++) if (y < 2 || y === BAH - 1 || x === 0 || x === BAW - 1) bkind[y][x] = BWL;
bkind[BAH - 1][6] = BX; bkind[BAH - 1][7] = BX;
bkind[2][2] = SGN; bkind[2][6] = TRG; bkind[2][7] = TRG; bkind[2][11] = BSK;
[[1, 7], [1, 8], [12, 7], [12, 8], [12, 6]].forEach(([x, y]) => { bkind[y][x] = BWL; });   // 乾草堆
let barnAn = [];
function barnSync() {
  const list = rcData && rcData.animals ? rcData.animals : [];
  barnAn = list.map((a, i) => {
    const o = barnAn[i];
    const n = o || { x: 0, y: 0, tx: 0, ty: 0, wait: 0, dir: 1, ph: i * 1.7 };
    if (!o) { const t = barnPick(); n.x = n.tx = t[0]; n.y = n.ty = t[1]; n.wait = 500 + Math.random() * 2500; }
    n.sp = a.species; n.ready = a.ready;
    return n;
  });
}
function barnPick() {
  for (let n = 0; n < 40; n++) {
    const x = 1 + Math.floor(Math.random() * (BAW - 2)), y = 3 + Math.floor(Math.random() * (BAH - 4));
    if (bkind[y][x] === G) return [x, y];
  }
  return [6, 5];
}
function barnTick(dt) {
  const sec = dt / 1000;
  barnAn.forEach(a => {
    if (a.wait > 0) { a.wait -= dt; return; }
    const v = (a.sp === 'chicken' ? 1.3 : a.sp === 'cow' ? 0.55 : 0.8) * sec, dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d <= v) { a.x = a.tx; a.y = a.ty; a.wait = 800 + Math.random() * 3500; const t = barnPick(); a.tx = t[0]; a.ty = t[1]; return; }
    a.x += dx / d * v; a.y += dy / d * v; if (Math.abs(dx) > 0.05) a.dir = dx > 0 ? 1 : -1;
  });
}
async function enterBarn() {
  if (scene !== 'farm' || enterBusy) return;
  if (!ready || !me || authOpen || paused()) return;
  if (featLocked('ranch')) return;
  enterBusy = true;
  try { rcData = await rpc('ranch_get'); } catch (e) { enterBusy = false; toast(errText(e)); return; }
  enterBusy = false;
  if (scene !== 'farm') return;
  barnSync();
  pose = null; scene = 'barn'; K = bkind; W = BAW; H = BAH;
  critters.length = 0; critSlot = -1;
  pl.x = pl.sx = 6; pl.y = pl.sy = BAH - 2; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  view.snap = true; fitView();
}
function leaveBarn(silent) {
  if (scene !== 'barn') return;
  scene = 'farm'; K = kind; W = BW; H = BH;
  pl.x = pl.sx = 16; pl.y = pl.sy = 3; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  view.snap = true; fitView();
  if (!silent) toast('回到農場了');
}
const ANI_N = { chicken: '母雞', cow: '乳牛', sheep: '綿羊' };
function barnStatus(a) {
  const now = srvNow(), sp = ((rcData.species || []).find(q => q.key === a.sp) || {});
  return !a.ready ? ANI_N[a.sp] + '：肚子餓了，去飼料槽餵乾草' : a.ready <= now ? ANI_N[a.sp] + '：可以收' + itemName(sp.product) + '了' : ANI_N[a.sp] + '：還要 ' + fmtLeft(a.ready - now);
}
async function barnDo(kd) {
  if (rcBusy || !rcData) return;
  const hungry = rcData.animals.filter(a => !a.ready).length, done = rcData.animals.filter(a => a.ready && a.ready <= srvNow()).length;
  if (kd === 'feed') {
    if (!rcData.animals.length) { toast('還沒有動物，去村裡的牧場小屋買'); return; }
    if (!hungry) { toast('大家都吃飽了'); return; }
    if (have('a:hay') < 1) { toast('沒有乾草，去村裡的牧場小屋買'); return; }
  } else if (!done) { toast(rcData.animals.length ? '還沒有東西可以收' : '還沒有動物，去村裡的牧場小屋買'); return; }
  rcBusy = true;
  try {
    const r = await enqueue(() => kd === 'feed' ? rpc('ranch_feed') : rpc('ranch_collect'));
    if (r.inv) Object.assign(inv, r.inv);
    rcData = r; barnSync();
    if (kd === 'feed') toast('餵了 ' + r.fed + ' 隻');
    else toast('收成：' + Object.keys(r.got).map(k => itemName(k) + ' ×' + r.got[k]).join('、'));
    loadLevelSoon();
  } catch (err) { toast(errText(err)); try { rcData = await rpc('ranch_get'); barnSync(); } catch (_) {} }
  rcBusy = false; refreshHud();
}
function barnAct(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H || catchShown) { if (catchShown) hideCatch(); return; }
  const an = barnAn.find(a => Math.abs(a.x - x) < 0.8 && Math.abs(a.y - y) < 0.8), k = K[y][x];
  if (an && rcData) { pop(x, y, barnStatus(an), '#fff3b0'); return; }
  if (k === BX) { leaveBarn(); return; }
  if (k === TRG) { barnDo('feed'); return; }
  if (k === BSK) { barnDo('collect'); return; }
  if (k === SGN) { pop(x, y, '買雞、牛和乾草，請到小村的牧場小屋找小茉', '#fff3b0'); return; }
}
function drawAnimal(sp, px, py, dir, fr) {
  const X = (x, w) => px + (dir > 0 ? x : 16 - x - w), R = (c, x, y, w, h) => r(c, X(x, w), py + y, w, h);
  r('rgba(90,60,40,.2)', px + 3, py + 13, 10, 2);
  if (sp === 'chicken') {
    R('#ffffff', 4, 6, 8, 6); R('#e6e2dc', 4, 10, 8, 2); R('#ffffff', 10, 3, 4, 5); R('#e0483c', 11, 2, 2, 2); R('#ffb02e', 14, 5, 2, 2);
    R('#2b2b2b', 12, 4, 1, 1); R('#f0f0f0', 3, 7, 2, 3); R('#ffb02e', 6, 12 + (fr ? 1 : 0), 1, 2); R('#ffb02e', 9, 12 + (fr ? 0 : 1), 1, 2);
  } else if (sp === 'cow') {
    R('#ffffff', 2, 5, 11, 7); R('#2f2f33', 4, 6, 3, 3); R('#2f2f33', 9, 8, 3, 3);
    R('#ffffff', 11, 3, 5, 6); R('#f0b8b0', 13, 7, 3, 2); R('#2f2f33', 12, 4, 1, 1); R('#2f2f33', 11, 2, 1, 2); R('#cfc7b8', 14, 2, 1, 2);
    R('#ffffff', 2, 12, 2, 3 - (fr ? 1 : 0)); R('#ffffff', 5, 12, 2, 3 - (fr ? 0 : 1)); R('#ffffff', 9, 12, 2, 3 - (fr ? 1 : 0)); R('#ffffff', 12, 12, 2, 3 - (fr ? 0 : 1));
    R('#2f2f33', 1, 6, 1, 4);
  } else {
    R('#f1ece2', 2, 4, 11, 8); R('#fff9ee', 4, 3, 7, 3); R('#d9d1c2', 3, 10, 9, 2);
    R('#3a3436', 11, 5, 4, 5); R('#3a3436', 14, 4, 1, 2);
    R('#ffffff', 12, 6, 1, 1); R('#3a3436', 4, 12, 2, 3 - (fr ? 1 : 0)); R('#3a3436', 9, 12, 2, 3 - (fr ? 0 : 1));
  }
}
function drawBarnRoom(now) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3b2a1e'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
  r('#3b2a1e', 0, 0, W * T, H * T);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const px = tx * T, py = ty * T, k = K[ty][tx];
    if (ty < 2) {
      r('#b8895a', px, py, T, T); r('#9b6a44', px, py + 7, T, 1); r('#9b6a44', px + 7, py, 1, 8); r('#d3a574', px, py, T, 1);
    } else if (k === BWL && (ty === H - 1 || tx === 0 || tx === W - 1)) {
      r('#a97a4c', px, py, T, T); r('#8a5f38', px + 7, py, 1, T);
    } else {
      r((tx + ty) % 2 ? '#d9b27c' : '#d1a972', px, py, T, T);
      if (hash(tx, ty, 9) > 0.7) r('#e8c690', px + 3, py + 5, 3, 1);
      if (hash(tx, ty, 11) > 0.8) r('#c19a62', px + 8, py + 10, 2, 1);
    }
  }
  r('rgba(60,36,20,.25)', T, 2 * T, (W - 2) * T, 3);
  for (let y = 7; y <= 8; y++) { drawHay((1) * T, y * T); drawHay(12 * T, y * T); }
  drawHay(12 * T, 6 * T);
  // 門
  ob('#fff0d4', '#9b6a44', 6 * T + 1, (H - 1) * T - 1, 2 * T - 2, T + 1); r('#9b6a44', 7 * T, (H - 1) * T, 1, T);
  // 告示牌
  r('#9b6a44', 2 * T + 7, 2 * T + 8, 2, 8); ob('#f4d9a8', '#9b6a44', 2 * T + 1, 2 * T + 1, 14, 8);
  r('#7a4a3a', 2 * T + 3, 2 * T + 3, 10, 1); r('#7a4a3a', 2 * T + 3, 2 * T + 5, 7, 1); r('#e0483c', 2 * T + 11, 2 * T + 5, 2, 2);
  // 飼料槽
  ob('#9b6a44', '#6e4a2e', 6 * T, 2 * T + 6, 2 * T, 9); r('#e6c25a', 6 * T + 2, 2 * T + 6, 2 * T - 4, 3); r('#f4d97a', 6 * T + 4, 2 * T + 5, 6, 2);
  // 收成籃
  ob('#c98f62', '#8a5f38', 11 * T + 2, 2 * T + 6, 12, 9); r('#8a5f38', 11 * T + 2, 2 * T + 9, 12, 1);
  r('#ffffff', 11 * T + 4, 2 * T + 4, 3, 3); r('#fff6e0', 11 * T + 8, 2 * T + 5, 3, 2);
  const win = (wx) => { ob('#bfe6ff', '#9b6a44', wx, 8, 12, 9); r('#9b6a44', wx + 5, 8, 1, 9); };
  win(2 * T + 2); win(10 * T + 2);
  if (!rcData) return;
  nameTag('告示牌', 2 * T + 8, 2 * T - 2, '#fff3b0'); nameTag('飼料槽', 7 * T, 2 * T + 3, '#fff3b0'); nameTag('收成', 11 * T + 8, 2 * T + 3, '#fff3b0');
}
function drawHay(px, py) {
  ob('#e6c25a', '#b58a2a', px + 1, py + 3, 14, 12); r('#f4d97a', px + 3, py + 5, 10, 1); r('#f4d97a', px + 3, py + 9, 10, 1); r('#b58a2a', px + 7, py + 3, 1, 12);
}
function barnEnts(now, ents) {
  if (!rcData) return;
  const sv = srvNow();
  barnAn.forEach(a => {
    ents.push({ y: a.y + 0.6, draw: () => {
      const px = Math.round(a.x * T), py = Math.round(a.y * T) - 3, mv = a.wait <= 0, fr = mv ? Math.floor(now / 200 + a.ph) % 2 : 0;
      drawAnimal(a.sp, px, py, a.dir, fr);
      if (!a.ready) nameTag('餓了', px + 8, py - 1, '#ffb3a8');
      else if (a.ready <= sv) nameTag('可收', px + 8, py - 1 - Math.round(Math.abs(Math.sin(now / 250 + a.ph)) * 2), '#fff3b0');
    } });
  });
}
