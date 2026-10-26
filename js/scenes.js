'use strict';
/* 小村、森林、山洞的場景 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 雷克斯小村：場景切換、建築與水井的畫法 ---------- */
function enterTown() {
  if (scene !== 'farm') return;
  pose = null; scene = 'town'; K = tkind; W = TW; H = TH;
  critters.length = 0; critSlot = -1;
  pl.x = pl.sx = TW - 2; pl.y = pl.sy = 11; pl.prog = 1; pl.face = 'left'; pressed.length = 0;
  view.snap = true; fitView(); toast('來到雷克斯小村');
}
function leaveTown(silent) {
  if (scene !== 'town') return;
  scene = 'farm'; K = kind; W = BW; H = BH;
  pl.x = pl.sx = 1; pl.y = pl.sy = 5; pl.prog = 1; pl.face = 'right'; pressed.length = 0;
  view.snap = true; fitView(); if (!silent) toast('回到農場了');
}
function townAct(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const k = K[y][x], t = curTool();
  if (catchShown) { hideCatch(); return; }
  if (fishing) { fishAct(); return; }
  if (k === FG) { leaveTown(); return; }
  if (k === FW) { if (!featLocked('forest', x, y)) enterForest(); return; }
  if (k === CS) { enterStylist('fit'); return; }
  if (k === BS) { enterStylist('hair'); return; }
  if (k === FS) { enterStylist('furn'); return; }
  if (k === RS) { enterStylist('ranch'); return; }
  if (k === WK) { enterStylist('work'); return; }
  if (k === NP) { openNpc(NPCS.indexOf(npcAt(x, y))); return; }
  if (k === BD) { openBoard(); return; }
  if ((x === MXT || x === MXT + 1) && y === MYT && merchantHere()) { openMerchant(); return; }
  if (k === WL) { pop(x, y, '清涼的井水', '#cfe8f7'); return; }
  if (k === WA) { if (t.id === 'rod') startFish(x, y); else pop(x, y, '這是池塘（換成釣竿就能釣魚）', '#cfe8f7'); return; }
}

/* ---------- 西邊森林：場景切換與互動 ---------- */
function enterForest() {
  if (scene !== 'town') return;
  pose = null; scene = 'forest'; K = fkind; W = FOW; H = FOH;
  critters.length = 0; critSlot = -1;
  pl.x = pl.sx = FOW - 2; pl.y = pl.sy = 13; pl.prog = 1; pl.face = 'left'; pressed.length = 0;
  view.snap = true; fitView(); toast('來到西邊的森林');
}
function leaveForest(silent) {
  if (scene !== 'forest') return;
  scene = 'town'; K = tkind; W = TW; H = TH;
  critters.length = 0; critSlot = -1;
  pl.x = pl.sx = 1; pl.y = pl.sy = 11; pl.prog = 1; pl.face = 'right'; pressed.length = 0;
  view.snap = true; fitView(); if (!silent) toast('回到小村了');
}
function forestAct(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const k = K[y][x], t = curTool();
  if (catchShown) { hideCatch(); return; }
  if (fishing) { fishAct(); return; }
  if (k === FE) { leaveForest(); return; }
  if (k === CV) { if (featLocked('cave', x, y)) return; enterCave(); return; }
  if (k === NP) { openNpc(NPCS.indexOf(npcAt(x, y))); return; }
  if (k === WA) { if (t.id === 'rod') startFish(x, y); else pop(x, y, '這是森林的池塘（換成釣竿就能釣魚）', '#cfe8f7'); return; }
  if (t.id === 'net') { swingNet(x, y); return; }
  if (k === TR) { pop(x, y, '一棵大樹', '#ffffff'); return; }
}

/* ---------- 山洞：森林北邊，裡面有 6 顆礦石 ---------- */
function enterCave() {
  if (scene !== 'forest') return;
  pose = null; scene = 'cave'; K = cakind; W = CAW; H = CAH;
  critters.length = 0; critSlot = -1;
  pl.x = pl.sx = 8; pl.y = pl.sy = CAH - 2; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  view.snap = true; fitView(); toast('走進山洞');
}
function leaveCave(silent) {
  if (scene !== 'cave') return;
  scene = 'forest'; K = fkind; W = FOW; H = FOH;
  pl.x = pl.sx = 14; pl.y = pl.sy = 6; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  view.snap = true; fitView(); if (!silent) toast('回到森林了');
}
function caveAct(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const k = K[y][x];
  if (catchShown) { hideCatch(); return; }
  if (k === CX) { leaveCave(); return; }
  if (k === RK) { mineRock(x, y); return; }
}
function drawCaveRoom(now) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#17141c'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
  r('#17141c', 0, 0, W * T, H * T);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const px = tx * T, py = ty * T, k = K[ty][tx];
    if (k === CW) {
      r('#4a4658', px, py, T, T); r('#5e5a70', px, py, T, 3); r('#37334a', px, py + T - 3, T, 3);
      if (hash(tx, ty, 5) < 0.5) r('#6f6b84', px + 3 + (tx * 5) % 8, py + 5, 3, 2);
    } else if (k === CX) {
      r((tx + ty) % 2 ? '#3a3648' : '#34303f', px, py, T, T);
      r('#fff3b0', px + 2, py + 4, T - 4, T - 4); r('#ffffff', px + 4, py + 6, T - 8, T - 8);   // 洞口透進來的光
    } else {
      r((tx + ty) % 2 ? '#3a3648' : '#34303f', px, py, T, T);
      if (hash(tx, ty, 6) < 0.18) r('#4a4658', px + 2 + (tx * 7) % 10, py + 3 + (ty * 3) % 9, 3, 2);
    }
  }
  [[2, 1], [13, 1], [2, 10], [13, 10]].forEach(([tx, ty]) => {       // 牆上的火把
    const px = tx * T, py = ty * T;
    r('#6e4a2e', px + 7, py + 6, 2, 8);
    r(Math.floor(now / 160 + tx) % 2 ? '#ffb23a' : '#ff8f3a', px + 6, py + 2, 4, 5); r('#fff3b0', px + 7, py + 4, 2, 2);
    ctx.globalAlpha = 0.12; r('#ffb23a', px - 10, py - 8, 36, 30); ctx.globalAlpha = 1;
  });
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (K[ty][tx] === RK) drawRock(tx * T, ty * T, ROCKS.findIndex(q => q[0] === tx && q[1] === ty));
}
function drawWell(px, py, now) {
  r('rgba(90,60,40,.18)', px + 1, py + 13, 14, 2);
  ob('#c9c3b8', '#8d877c', px + 2, py + 6, 12, 8); ob('#6fb7e8', '#3f7fae', px + 4, py + 7, 8, 4);
  r('#9b6a44', px + 2, py + 1, 2, 7); r('#9b6a44', px + 12, py + 1, 2, 7); ob('#e0786a', '#9b3f3a', px + 1, py, 14, 3);
  if (Math.floor(now / 700) % 2) r('#ffffff', px + 6, py + 8, 2, 1);
}
const BLD_PAL = {
  chief:   { wall: '#fff0d4', wo: '#d9b88a', roof: '#8c5b3c', ro: '#5e3a24', dot: '#a8764d' },
  cottage: { wall: '#fff0d4', wo: '#d9b88a', roof: '#f58fa5', ro: '#d9667f', dot: '#ffd3de' },
  ranch:   { wall: '#e0786a', wo: '#9b3f3a', roof: '#9b6a44', ro: '#6e4a2e', dot: '#b88458' },
  mine:    { wall: '#9a9ca8', wo: '#5e616e', roof: '#8d909b', ro: '#5e616e', dot: '#b4b8c4' },
  salon:   { wall: '#f6fff2', wo: '#b8d9b0', roof: '#7fcfa8', ro: '#4f9e7c', dot: '#c5f0dc' }
};
/* 家具店外觀：森林木屋（綠屋頂、原木牆、窗邊擺椅子和檯燈） */
function drawFurnBldg(ox, oy, lit) {
  ob('#b8895a', '#8c5b3c', ox + 58, oy - 4, 9, 12);
  ob('#d9a56c', '#a8764a', ox + 3, oy + 20, 74, 28);
  for (let y = 24; y < 46; y += 5) r('#c08a58', ox + 4, oy + y, 72, 1);
  ob('#7fc48a', '#4f9a62', ox + 8, oy, 64, 10); ob('#7fc48a', '#4f9a62', ox, oy + 6, 80, 16);
  for (let x = 0; x < 80; x += 8) { rr('#4f9a62', ox + x, oy + 18, 8, 5); rr('#7fc48a', ox + x + 1, oy + 18, 6, 4); }
  for (let y = 7; y < 16; y += 5) for (let x = (y % 2) * 4 + 4; x < 76; x += 8) r('#b8e6c0', ox + x, oy + y, 2, 2);
  ob('#fff0d4', '#a8764a', ox + 27, oy + 9, 26, 9);                                    // 招牌：一張椅子
  rr('#e26b88', ox + 37, oy + 10, 3, 6); rr('#e26b88', ox + 37, oy + 14, 9, 3); r('#e26b88', ox + 38, oy + 17, 1, 1); r('#e26b88', ox + 44, oy + 17, 1, 1);
  ob('#c08a62', '#8c5b3c', ox + 32, oy + 28, 16, 20); r('#d9a378', ox + 34, oy + 30, 12, 18); r('#ffd34d', ox + 43, oy + 39, 2, 2);
  [8, 58].forEach((wx, i) => {
    ob('#ffffff', '#a8764a', ox + wx - 1, oy + 26, 14, 14); r(lit ? '#fff3b0' : '#ffe28a', ox + wx + 1, oy + 28, 10, 10);
    if (i === 0) { rr('#d9667f', ox + wx + 2, oy + 29, 3, 7); rr('#d9667f', ox + wx + 2, oy + 33, 9, 3); r('#9b3f5a', ox + wx + 3, oy + 36, 1, 2); r('#9b3f5a', ox + wx + 8, oy + 36, 1, 2); }
    else { rr('#ffd34d', ox + wx + 2, oy + 29, 8, 5); r('#8c5b3c', ox + wx + 5, oy + 34, 2, 4); }
    rr('#c08a62', ox + wx - 1, oy + 40, 14, 3); r('#ff8fa8', ox + wx, oy + 39, 2, 2); r('#ffc857', ox + wx + 5, oy + 39, 2, 2); r('#ff8fa8', ox + wx + 10, oy + 39, 2, 2);
  });
}
function drawBldg(b, now, lit) {
  const ox = b.x * T, oy = b.y * T, w = b.w * T, h = b.h * T, P_ = BLD_PAL[b.t], dx = ox + (w >> 1);
  r('rgba(107,72,72,.16)', ox + 2, oy + h - 2, w - 4, 3);
  if (b.t === 'furn') { drawFurnBldg(ox, oy, lit); return; }
  if (b.t === 'salon') { drawStyleBldg(ox, oy, lit); return; }
  if (b.t === 'mine') {
    ob(P_.roof, P_.ro, ox, oy + 4, w, h - 4);
    for (let i = 0; i < 9; i++) r(P_.dot, ox + 6 + (i * 9) % (w - 12), oy + 8 + (i * 7) % (h - 24), 3, 2);
    ob('#2e2a35', '#1c1822', dx - 11, oy + h - 26, 22, 26);
    r('#9b6a44', dx - 13, oy + h - 28, 3, 28); r('#9b6a44', dx + 10, oy + h - 28, 3, 28); r('#9b6a44', dx - 13, oy + h - 30, 26, 3);
    ob('#ffe58a', '#c9971a', dx + 14, oy + h - 22, 4, 6); if (lit || Math.floor(now / 500) % 2) { g.globalAlpha = .25; rr('#ffe58a', dx + 8, oy + h - 28, 16, 16); g.globalAlpha = 1; }
    r('#d98a52', ox + 8, oy + 10, 2, 2); r('#8fd3ff', ox + w - 14, oy + 18, 2, 2);
    return;
  }
  ob(P_.wall, P_.wo, ox + 2, oy + (h >> 1) - 2, w - 4, (h >> 1) + 0);
  if (b.t === 'ranch') { for (let x = ox + 6; x < ox + w - 4; x += 8) r('#c9584a', x, oy + (h >> 1), 1, (h >> 1) - 3); }
  ob(P_.roof, P_.ro, ox, oy + 2, w, (h >> 1) + 4);
  for (let y = 6; y < (h >> 1); y += 5) for (let x = (y % 2) * 4 + 4; x < w - 4; x += 8) r(P_.dot, ox + x, oy + y, 2, 2);
  ob('#c08a62', '#8c5b3c', dx - 6, oy + h - 16, 12, 16); r('#d9a378', dx - 4, oy + h - 14, 8, 14);
  if (b.t === 'ranch') {   // 外觀 B：穀倉風（拉高的屋頂、閣樓乾草窗、風向雞、白色 X 大木門）
    const vb = Math.floor(now / 600) % 2;
    ob(P_.roof, P_.ro, ox + 12, oy - 6, 56, 12);
    for (let x = 16; x < 64; x += 8) r(P_.dot, ox + x, oy - 3 + (x / 8 % 2) * 4, 2, 2);
    ob('#c9584a', '#8a2e26', dx - 6, oy - 2, 12, 10); ob('#e8c070', '#a8802a', dx - 4, oy, 8, 6); r('#c9984a', dx - 2, oy + 3, 4, 1);
    r('#5e3a24', dx, oy - 14, 1, 9); r('#e8453c', dx - 2, oy - 17 + vb, 4, 3); r('#ffb62e', dx - 3, oy - 16 + vb, 1, 1);
    ob('#e8d4a8', '#8c5b3c', dx - 10, oy + h - 18, 20, 18); r('#8c5b3c', dx, oy + h - 18, 1, 18); r('#ffffff', dx - 8, oy + h - 16, 16, 1);
    for (let i = 0; i < 8; i++) { r('#ffffff', dx - 9 + i * 2, oy + h - 17 + i * 2, 2, 1); r('#ffffff', dx + 8 - i * 2, oy + h - 17 + i * 2, 2, 1); }
  }
  const win = lit ? '#fff3b0' : '#cfe8f7';
  ob(win, '#7aa8c8', ox + 8, oy + (h >> 1) + 4, 9, 8); ob(win, '#7aa8c8', ox + w - 17, oy + (h >> 1) + 4, 9, 8);
  if (b.sign || b.t === 'salon') {                  // 店的招牌
    const sc = b.t === 'salon' ? '#6a7a8a' : '#e26b88';
    ob('#fffaf0', '#c9a37a', dx - 6, oy + 7, 12, 9);
    if (b.t === 'salon') { [[-3, 9], [2, 9], [-2, 10], [1, 10], [-1, 11], [0, 11], [-2, 12], [1, 12], [-3, 13], [2, 13]].forEach(([a, c]) => r(sc, dx + a, oy + c, 1, 1)); }
    else { r(sc, dx - 4, oy + 9, 3, 1); r(sc, dx + 1, oy + 9, 3, 1); r(sc, dx - 4, oy + 10, 8, 1); r(sc, dx - 3, oy + 11, 6, 3); }
  }
  if (b.t === 'chief') {   // 園藝工坊外觀 A：鋤頭招牌、窗邊花箱、門邊水壺
    ob('#fffaf0', '#c9a37a', dx - 6, oy + 7, 12, 9); r('#8c5b3c', dx, oy + 9, 1, 6); r('#7a8590', dx - 3, oy + 9, 6, 2);
    [ox + 7, ox + w - 18].forEach((bx, i) => { r('#9b6a44', bx, oy + (h >> 1) + 13, 11, 3); r(i ? '#ffd34d' : '#ff8fa8', bx + 1, oy + (h >> 1) + 11, 2, 2); r(i ? '#ff8fa8' : '#ffd34d', bx + 5, oy + (h >> 1) + 11, 2, 2); r(i ? '#ffd34d' : '#ff8fa8', bx + 8, oy + (h >> 1) + 11, 2, 2); });
    ob('#6fb7e8', '#3f7fae', dx + 8, oy + h - 8, 5, 4);
  }
  if (b.t === 'chief') { ob('#e9a98b', '#c97f6a', ox + w - 14, oy - 4, 7, 9); for (let i = 0; i < 2; i++) { const ph = ((now / 1100) + i / 2) % 1; g.globalAlpha = .8 * (1 - ph); rr('#ffffff', ox + w - 13 + Math.round(Math.sin(ph * 6 + i) * 2), oy - 7 - Math.round(ph * 10), 4, 3); } g.globalAlpha = 1; }
}
