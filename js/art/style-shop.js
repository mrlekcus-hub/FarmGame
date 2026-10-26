'use strict';
/* 造型屋（理髮＋帽子＋眼鏡）：小村的外觀與店裡的室內 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
const STY_T = 16;
/* 招牌小圖示（都在 7×5 左右的小格子裡） */
function icScissors(x, y, c) { r(c, x, y, 1, 1); r(c, x + 2, y, 1, 1); r(c, x + 1, y + 1, 1, 1); r(c, x, y + 2, 1, 1); r(c, x + 2, y + 2, 1, 1); r(c, x + 3, y + 1, 3, 1); r(c, x + 4, y, 1, 1); r(c, x + 4, y + 2, 1, 1); }
function icHat(x, y, c, o) { r(o, x + 1, y, 4, 1); r(c, x + 1, y + 1, 4, 2); r(o, x, y + 3, 6, 1); r('#ffffff', x + 1, y + 2, 4, 1); }
function icGlass(x, y, c) { r(c, x, y, 3, 1); r(c, x, y + 2, 3, 1); r(c, x, y + 1, 1, 1); r(c, x + 2, y + 1, 1, 1); r(c, x + 4, y, 3, 1); r(c, x + 4, y + 2, 3, 1); r(c, x + 4, y + 1, 1, 1); r(c, x + 6, y + 1, 1, 1); r(c, x + 3, y, 1, 1); }
/* 外觀 A：彩色遮陽棚 —— 薄荷屋頂、粉白條紋棚、兩扇櫥窗（一邊帽子、一邊眼鏡） */
function drawStyleBldg(ox, oy, lit) {
  const w = 80, h = 48, dx = ox + 40;
  ob('#fffaf0', '#d9c3a0', ox + 2, oy + 22, w - 4, 26);
  ob('#7fcfa8', '#4f9e7c', ox, oy + 2, w, 22);
  for (let y = 6; y < 20; y += 5) for (let x = (y % 2) * 4 + 4; x < w - 4; x += 8) r('#c5f0dc', ox + x, oy + y, 2, 2);
  ob('#fffaf0', '#c9a37a', dx - 15, oy + 6, 30, 13);                              // 招牌
  icScissors(dx - 12, oy + 11, '#6a7a8a'); icHat(dx - 3, oy + 10, '#b79bf0', '#7a5fc0'); icGlass(dx + 6, oy + 11, '#d9667f');
  for (let i = 0; i < 16; i++) {                                                    // 條紋遮陽棚
    const x = ox + 2 + i * 5, c = i % 2 ? '#ffffff' : '#ff9bb3';
    r(c, x, oy + 24, 5, 6); r(c, x + 1, oy + 30, 3, 1); r(shade(c, 0.88), x, oy + 24, 5, 1);
  }
  [[ox + 5, 'hat'], [ox + w - 27, 'glass']].forEach(([wx, k]) => {
    ob('#ffffff', '#a8764a', wx, oy + 32, 22, 14); r(lit ? '#fff3b0' : '#dff1fb', wx + 2, oy + 34, 18, 9);
    r('#c08a62', wx + 2, oy + 43, 18, 2);
    if (k === 'hat') { r('#8c5b3c', wx + 10, oy + 40, 2, 3); hatNew(8, 'down', wx + 3, oy + 37, '#b79bf0', shade('#b79bf0', 0.82)); }
    else glassNew(4, 'down', wx + 3, oy + 28);
    r('#ffffff', wx + 3, oy + 35, 2, 1);
  });
  ob('#c08a62', '#8c5b3c', dx - 6, oy + h - 16, 12, 16); r('#d9a378', dx - 4, oy + h - 14, 8, 14); r('#ffd34d', dx + 2, oy + h - 8, 2, 2);
  r('#ff8fa8', dx - 8, oy + h - 3, 3, 3); r('#ffd34d', dx + 5, oy + h - 3, 3, 3);
}
/* ---------- 室內：10×8 格（每格 16），牆在上面 3 格，櫃檯在第 4 列，店員站在 (4,3)，門在下面 ---------- */
function styleRoomBase(wall, wallD, fa, fb) {
  const T = STY_T;
  r('#3b2a1e', 0, 0, 10 * T, 8 * T);
  for (let ty = 0; ty < 8; ty++) for (let tx = 0; tx < 10; tx++) {
    const px = tx * T, py = ty * T, isW = ty < 3 || ty === 7 || tx === 0 || tx === 9;
    if (ty < 3) { r(wall, px, py, T, T); if (ty === 2) r(wallD, px, py + T - 2, T, 2); }
    else if (isW) { r(wallD, px, py, T, T); r(shade(wallD, 0.9), px + 7, py, 1, T); }
    else r((tx + ty) % 2 ? fa : fb, px, py, T, T);
  }
}
const sHatList = [4, 5, 6, 7, 8, 9, 10, 11], sHatCol = [0, 1, 3, 2, 4, 5, 0, 2];
const hatAt = (i, px, py) => { const hc = HATCOL[sHatCol[i % 8]]; hatNew(sHatList[i % 8], 'down', px, py, hc, shade(hc, 0.82)); };
function styleCounter(top, side, items) {
  const T = STY_T;
  ob(top, side, 3 * T, 4 * T + 3, 3 * T, T - 3); r(shade(top, 1.15), 3 * T, 4 * T + 3, 3 * T, 2);
  if (items) items();
}
function styleDoor() { const T = STY_T; ob('#fff0d4', '#9b6a44', 4 * T + 1, 7 * T - 1, 2 * T - 2, T + 1); r('#9b6a44', 5 * T, 7 * T, 1, T); }
function styleMannequin(tx, ty, ch) { try { drawPlayer(tx * STY_T, ty * STY_T, 'down', false, 0, ch); } catch (e) {} }
/* 室內 A：粉彩衣帽間 —— 左邊帽架、中間大鏡子、右邊眼鏡牆，兩尊試戴模特 */
function drawStyleRoom(now) {
  const T = STY_T;
  styleRoomBase('#ffe3ec', '#f3b8cb', '#fff0f4', '#ffe0ea');
  [T + 8, 2 * T + 9].forEach((by, row) => {
    for (let tx = 1; tx <= 3; tx++) { r('#b8895a', tx * T, by, T, 3); r('#8c5b3c', tx * T, by + 3, T, 1); hatAt(row * 3 + tx - 1, tx * T, by - 5); }
  });
  ob('#d6ecf8', '#8a6a4a', 4 * T + 1, 3, 2 * T - 2, 26); r('#ffffff', 4 * T + 4, 6, 2, 8); r('#ffffff', 4 * T + 8, 6, 1, 3);   // 鏡子
  for (let i = 0; i < 6; i++) { r('#ffd84a', 4 * T + 1 + i * 5, 2, 2, 2); r('#ffd84a', 4 * T + 1 + i * 5, 28, 2, 2); }
  r('#c23a63', 6 * T + 4, 4, 1, 1);
  ob('#f6d3e0', '#c9889c', 6 * T + 2, 4, 3 * T - 4, 2 * T + 3);                    // 眼鏡牆（絨布板）
  for (let k = 0; k < 6; k++) { const gx = 6 * T + 2 + (k % 3) * 15 - 1 + (k % 3 === 0 ? 1 : 0), gy = 4 + (k >> 1 > 0 ? 0 : 0); glassNew(k + 1 > 7 ? 7 : k + 1, 'down', 6 * T + (k % 3) * 16 - 1, (k < 3 ? -1 : 11)); }
  styleCounter('#ff9bb3', '#d4688a', () => { icGlass(3 * T + 6, 4 * T, '#6a7a8a'); ob('#ffffff', '#d4688a', 5 * T + 5, 4 * T, 6, 4); });
  styleMannequin(1, 5, { ...DEF_CHAR, hat: 8, hatc: 4, glass: 7, style: 14, hair: 3, outfit: 4, fits: 15 });
  styleMannequin(8, 5, { ...DEF_CHAR, hat: 5, hatc: 1, glass: 1, style: 15, hair: 2, outfit: 6, fits: 7 });
  styleDoor(); drawNpc(4 * T, 3 * T, 'jian', now);
}
