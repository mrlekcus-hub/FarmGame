'use strict';
/* 圖塊與大型建物的畫法 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 圖塊 ---------- */
function drawGrass(px, py, tx, ty) {
  const gp = GRASSP[SEA], gb = GRASSB[SEA];
  r((tx + ty) % 2 ? gp[0] : gp[1], px, py, T, T);
  const a = hash(tx, ty, 1), b = hash(tx, ty, 2), c = hash(tx, ty, 3);
  r(gb[0], px + (a * 12 | 0) + 1, py + (b * 10 | 0) + 4, 1, 2);
  r(gb[0], px + (a * 12 | 0) + 3, py + (b * 10 | 0) + 5, 1, 1);
  r(gb[0], px + (b * 12 | 0) + 1, py + (c * 10 | 0) + 8, 1, 2);
  r(gb[1], px + (c * 13 | 0), py + (a * 13 | 0), 1, 1);
  const f = hash(tx, ty, 4);
  if (f > 0.9 && (SEA === 'spring' || SEA === 'summer' || (SEA === 'autumn' && f > 0.96))) {
    const pc = ['#ffffff', '#ffc2d4', '#fff0a0', '#d6c2ff'][(f * 1000 | 0) % 4];
    const fx0 = 4 + (hash(tx, ty, 5) * 8 | 0), fy0 = 4 + (hash(tx, ty, 6) * 8 | 0);
    r(pc, px + fx0, py + fy0 - 1, 1, 1); r(pc, px + fx0 - 1, py + fy0, 1, 1);
    r(pc, px + fx0 + 1, py + fy0, 1, 1); r(pc, px + fx0, py + fy0 + 1, 1, 1);
    r('#ffd34d', px + fx0, py + fy0, 1, 1);
  }
}
function drawPath(px, py, tx, ty) {
  r('#f7e5b8', px, py, T, T);
  const x1 = px + (hash(tx, ty, 5) * 11 | 0) + 1, y1 = py + (hash(tx, ty, 6) * 11 | 0) + 1;
  r('#e6cc95', x1, y1, 2, 1); r('#fff6dc', x1, y1 - 1, 1, 1);
  const x2 = px + (hash(tx, ty, 7) * 11 | 0) + 1, y2 = py + (hash(tx, ty, 8) * 11 | 0) + 1;
  r('#e6cc95', x2, y2, 2, 1); r('#fff6dc', x2, y2 - 1, 1, 1);
}
function drawWater(px, py, tx, ty, now) {
  r('#86d6f3', px, py, T, T);
  r('#6cc5e8', px, py + 11, T, 5);
  const ph = Math.floor(now / 500 + tx * 1.7 + ty * 2.3) % 4;
  r('#bff0fd', px + 2 + ph * 2, py + 3 + (ph % 2) * 5, 4, 1);
  r('#bff0fd', px + 9 - ph, py + 9 - (ph % 2) * 4, 3, 1);
  if ((Math.floor(now / 380) + tx * 3 + ty * 5) % 7 === 0) {
    r('#ffffff', px + 7, py + 6, 1, 1); r('#ffffff', px + 6, py + 7, 3, 1); r('#ffffff', px + 7, py + 8, 1, 1);
  }
  if (hash(tx, ty, 13) > 0.8 && isWater(tx - 1, ty) && isWater(tx + 1, ty) && isWater(tx, ty - 1) && isWater(tx, ty + 1)) {
    ob('#9fe8a6', '#5fb870', px + 4, py + 5, 8, 6);
    r('#86d6f3', px + 8, py + 5, 2, 2);
    r('#ffb3c6', px + 6, py + 6, 2, 2); r('#fff', px + 6, py + 6, 1, 1);
  }
  const sand = '#fbeab5';
  if (!isWater(tx, ty - 1)) r(sand, px, py, T, 2);
  if (!isWater(tx, ty + 1)) r(sand, px, py + T - 2, T, 2);
  if (!isWater(tx - 1, ty)) r(sand, px, py, 2, T);
  if (!isWater(tx + 1, ty)) r(sand, px + T - 2, py, 2, T);
}
function drawTree(px, py, tx, ty) {
  drawGrass(px, py, tx, ty);
  const pink = hash(tx, ty, 12) > 0.55;
  r('rgba(107,72,72,.16)', px + 2, py + 13, 12, 3);
  r('#b98a62', px + 6, py + 10, 4, 6); r('#9a6a4a', px + 9, py + 10, 1, 6);
  const pal = TREEP[SEA][pink ? 0 : 1];
  ob(pal[0], pal[1], px, py + 1, 16, 12);
  r(pal[2], px + 3, py + 3, 5, 2); r(pal[2], px + 10, py + 6, 2, 2);
  r(pal[3], px + 4, py + 9, 4, 1); r(pal[3], px + 10, py + 10, 3, 1);
  if (SEA === 'winter') { r('#ffffff', px + 2, py + 1, 12, 2); r('#dcebf3', px + 1, py + 3, 3, 1); }
}
function drawSoil(px, py, wet) {
  r(wet ? '#a56f4b' : '#c98f62', px, py, T, T);
  const f = wet ? '#8d5a3a' : '#b57a4f';
  for (let i = 3; i < T; i += 4) r(f, px + 1, py + i, T - 2, 1);
  r(wet ? '#c9e8f7' : '#e1b085', px + 3, py + 1, 2, 1);
  r(wet ? '#c9e8f7' : '#e1b085', px + 10, py + 9, 2, 1);
  r(wet ? '#7c4e32' : '#a9724a', px, py + T - 1, T, 1);
  r(wet ? '#b58260' : '#dba879', px, py, T, 1);
}
function face(px, py, ex, ey) {
  r(INK, px + ex, py + ey, 1, 2); r(INK, px + ex + 3, py + ey, 1, 2);
  r('rgba(255,90,130,.55)', px + ex - 2, py + ey + 2, 2, 1); r('rgba(255,90,130,.55)', px + ex + 4, py + ey + 2, 2, 1);
  r(INK, px + ex + 1, py + ey + 2, 2, 1);
}
function drawCrop(px, py, c, now) {
  const stage = c.p >= 1 ? 2 : (c.p >= 0.5 ? 1 : 0);
  if (stage === 0) {
    r('#5fbf6a', px + 7, py + 10, 2, 3);
    rr('#8fe09a', px + 4, py + 8, 4, 3); rr('#8fe09a', px + 8, py + 7, 4, 3);
  } else if (stage === 1) {
    r('#5fbf6a', px + 7, py + 7, 2, 7);
    rr('#7fd08a', px + 2, py + 8, 6, 4); rr('#7fd08a', px + 8, py + 6, 6, 4); rr('#a8ecaa', px + 6, py + 3, 4, 5);
    r('#c6f5c6', px + 3, py + 9, 2, 1); r('#c6f5c6', px + 10, py + 7, 2, 1);
  } else if (c.t === 'radish') {
    rr('#7fd08a', px + 3, py + 1, 4, 5); rr('#7fd08a', px + 9, py + 1, 4, 5); rr('#5fbf6a', px + 6, py + 2, 4, 5);
    ob('#ff9bb3', '#d4688a', px + 3, py + 6, 10, 9);
    r('#ffd0dc', px + 5, py + 7, 2, 1);
    face(px, py, 6, 9);
  } else if (c.t === 'tomato') {
    ob('#ff7a6c', '#c4403a', px + 2, py + 5, 12, 10);
    r('#5fbf6a', px + 4, py + 4, 8, 2); r('#5fbf6a', px + 7, py + 2, 2, 3); r('#8fe09a', px + 5, py + 4, 2, 1);
    r('#ffc9c2', px + 4, py + 7, 2, 1);
    face(px, py, 6, 9);
  } else if (c.t === 'beet') {
    rr('#7fd08a', px + 4, py + 1, 3, 5); rr('#5fbf6a', px + 8, py + 2, 3, 4);
    ob('#c9457c', '#7a2048', px + 3, py + 6, 10, 9); r('#e98cb2', px + 5, py + 7, 2, 1);
    face(px, py, 6, 9);
  } else if (c.t === 'corn') {
    r('#5fbf6a', px + 7, py + 8, 2, 7); rr('#7fd08a', px + 2, py + 4, 5, 8); rr('#7fd08a', px + 9, py + 5, 5, 7);
    ob('#ffe27a', '#d9a93a', px + 5, py + 1, 6, 11); r('#fff3b0', px + 6, py + 2, 1, 8); r('#d9a93a', px + 8, py + 3, 1, 8);
  } else if (c.t === 'melon') {
    ob('#9bd67a', '#4f8f3a', px + 1, py + 4, 14, 11);
    r('#6bb86a', px + 4, py + 5, 1, 9); r('#6bb86a', px + 8, py + 5, 1, 9); r('#6bb86a', px + 12, py + 5, 1, 9);
    r('#6bb86a', px + 7, py + 2, 2, 3); r('#d8f5b8', px + 3, py + 6, 2, 1);
    face(px, py, 6, 9);
  } else {
    ob('#ffb45c', '#d9772a', px + 1, py + 5, 14, 10);
    r('#f59a38', px + 4, py + 6, 1, 8); r('#f59a38', px + 11, py + 6, 1, 8);
    r('#6bb86a', px + 7, py + 2, 2, 4); r('#6bb86a', px + 9, py + 3, 3, 1);
    r('#ffd9a0', px + 3, py + 7, 2, 1);
    face(px, py, 6, 9);
  }
  if (stage === 2 && Math.floor(now / 450) % 2) {
    r('#fff6a8', px + 13, py + 1, 1, 3); r('#fff6a8', px + 12, py + 2, 3, 1);
  }
}

/* ---------- 大型建物 ---------- */
function drawHouse(lit, now) {
  const ox = 2 * T, oy = 1 * T;
  r('rgba(107,72,72,.16)', ox + 2, oy + 46, 78, 3);
  ob('#e9a98b', '#c97f6a', ox + 58, oy - 3, 9, 11);
  for (let i = 0; i < 3; i++) {
    const ph = ((now / 1100) + i / 3) % 1;
    g.globalAlpha = 0.9 * (1 - ph);
    rr('#ffffff', (ox + 60 + Math.sin(ph * 6 + i) * 2) | 0, (oy - 5 - ph * 13) | 0, 4 + (ph * 3 | 0), 3 + (ph * 2 | 0));
  }
  g.globalAlpha = 1;
  ob('#fff0d4', '#d9b88a', ox + 3, oy + 21, 74, 27);
  for (let i = 11; i < 75; i += 8) r('#f6dfb8', ox + i, oy + 24, 1, 20);
  r('#ecd0a2', ox + 4, oy + 43, 72, 4);
  ob('#f58fa5', '#d9667f', ox + 8, oy + 1, 64, 10);
  ob('#f58fa5', '#d9667f', ox, oy + 6, 80, 16);
  for (let x = 0; x < 80; x += 8) { rr('#d9667f', ox + x, oy + 19, 8, 5); rr('#f58fa5', ox + x + 1, oy + 19, 6, 4); }
  for (let y = 9; y < 18; y += 5) for (let x = (y % 2) * 4 + 4; x < 76; x += 8) r('#ffd3de', ox + x, oy + y, 2, 2);
  ob('#c08a62', '#8c5b3c', ox + 32, oy + 31, 16, 17);
  r('#d9a378', ox + 34, oy + 33, 12, 15);
  const hp = '#ffd9e2';
  r(hp, ox + 36, oy + 35, 2, 1); r(hp, ox + 40, oy + 35, 2, 1); r(hp, ox + 36, oy + 36, 6, 1);
  r(hp, ox + 37, oy + 37, 4, 1); r(hp, ox + 38, oy + 38, 2, 1);
  r('#ffd34d', ox + 43, oy + 42, 2, 2);
  rr('#ff9db5', ox + 30, oy + 46, 20, 2);
  [10, 58].forEach(wx => {
    ob('#ffffff', '#d9b88a', ox + wx - 1, oy + 28, 14, 13);
    r(lit ? '#ffe28a' : '#a8defa', ox + wx + 1, oy + 30, 10, 9);
    r('#ffffff', ox + wx + 5, oy + 30, 2, 9); r('#ffffff', ox + wx + 1, oy + 34, 10, 2);
    if (!lit) r('#d8f4ff', ox + wx + 2, oy + 31, 2, 1);
    rr('#c08a62', ox + wx - 1, oy + 41, 14, 3);
    r('#ff8fa8', ox + wx, oy + 40, 2, 2); r('#ffc857', ox + wx + 5, oy + 40, 2, 2); r('#ff8fa8', ox + wx + 10, oy + 40, 2, 2);
    r('#7fd08a', ox + wx + 3, oy + 41, 2, 1); r('#7fd08a', ox + wx + 8, oy + 41, 2, 1);
  });
}
function drawShop(lit, now) {   // 柴犬雜貨攤：藍白洋傘、綠色櫃檯、紅圍巾小柴犬（2×2 格，在 (9,3)）
  const ox = 9 * T, oy = 3 * T, w = Math.floor(now / 350) % 2;
  r('rgba(107,72,72,.16)', ox + 2, oy + 30, 28, 2);
  r('#8c5b3c', ox + 15, oy + 8, 2, 12);
  for (let i = 0; i < 8; i++) r(i % 2 ? '#ffffff' : '#6fb7e8', ox + i * 4, oy + 3, 4, 6);
  r('#6fb7e8', ox + 5, oy + 1, 22, 2); r('#ffffff', ox + 12, oy, 8, 1);
  r('#e8a060', ox + 10, oy + 10, 3, 3); r('#e8a060', ox + 19, oy + 10, 3, 3); r('#f5d0b0', ox + 11, oy + 11, 1, 2); r('#f5d0b0', ox + 20, oy + 11, 1, 2);
  rr('#e8a060', ox + 10, oy + 12, 12, 9);
  rr('#fff0e0', ox + 13, oy + 17, 6, 4);
  r('#2e2a35', ox + 13, oy + 15, 1, 2); r('#2e2a35', ox + 18, oy + 15, 1, 2); r('#2e2a35', ox + 15, oy + 18, 2, 1);
  r('#e8a060', ox + 22 + w, oy + 19 - w, 2, 3);
  r('#fff0e0', ox + 12, oy + 21, 8, 4); r('#e0453a', ox + 12, oy + 21, 8, 2); r('#e0453a', ox + 14, oy + 23, 4, 1);
  ob('#8fbf6a', '#5f8f46', ox + 2, oy + 24, 28, 7); r('#a8d98a', ox + 4, oy + 25, 24, 1);
  rr('#ffffff', ox + 4, oy + 20, 6, 4); r('#2e2a35', ox + 5, oy + 22, 4, 1);
  rr('#ffffff', ox + 22, oy + 20, 6, 4); r('#2e2a35', ox + 23, oy + 22, 4, 1);
  rr('#ff8fa8', ox + 11, oy + 24, 3, 2); rr('#ffd34d', ox + 18, oy + 24, 3, 2);
  if (lit) { g.globalAlpha = 0.5; rr('#ffe28a', ox + 8, oy + 14, 16, 10); g.globalAlpha = 1; }
}
