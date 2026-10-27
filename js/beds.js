'use strict';
/* 床 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   單人床：bed（粉紅愛心）、bed_b～bed_e，2×2 格、一個枕頭。
   雙人床：dbed_a～dbed_e，3×2 格、兩個枕頭，可以同時躺兩個人（左邊、右邊各一個位子）。
   圖案左右對稱（家具翻轉、人躺上去蓋回被子時才不會對不上）。
   BEDS：n = 可躺人數；hx = 每個位子的頭（以未轉向的床左上角為準）；clip = 每個位子蓋回被子的橫向範圍。
   要和後端 furniture 表的 key、w、h 一致（見 beds.sql）。 */
const BEDS = { bed: { n: 1, hx: [11], clip: [[0, 32]] } };
const BED_STY = {
  b: { wood: '#f3d9a8', dk: '#b8935a', pil: '#ffffff', pild: '#e0d6c6', q: '#fff6e0', qd: '#d9c9a0', fold: '#bfe0f5', deco: '#8fc8f4', line: '#bfe0f5' },
  c: { wood: '#8a6a4a', dk: '#5a4430', pil: '#f4fff0', pild: '#c8dcc0', q: '#8fd8b0', qd: '#4fa37a', fold: '#c6f0d6', deco: '#e8fff0' },
  d: { wood: '#f2c0d8', dk: '#b8789a', pil: '#ffffff', pild: '#e6d7e6', q: '#d9c4f5', qd: '#9a7ac8', fold: '#efe4ff', deco: '#ffd27a' },
  e: { wood: '#6a5a8a', dk: '#3f3358', pil: '#e8ecff', pild: '#aab0d8', q: '#4a5fa8', qd: '#2f3f78', fold: '#6f86d0', deco: '#ffe08a' },
  a: { wood: '#e8b27a', dk: '#9b6a44', pil: '#ffffff', pild: '#e6d7c3', q: '#ff9bb3', qd: '#d4688a', fold: '#ffc2d2', deco: '#fffaf0' },
};
/* 在寬 W 的床上畫一個圖案，同時畫在鏡像的位置（左邊從 x 起、寬 w） */
const bedMir = (W, x, w, fn) => { fn(x); fn(W - x - w); };
const bedStar = (c, x, y) => { r(c, x + 1, y, 1, 3); r(c, x, y + 1, 3, 1); };   // 3×3 的十字／星星（x 是左邊）
const bedHeart = (c, x, y) => { r(c, x + 1, y, 2, 1); r(c, x, y + 1, 1, 1); r(c, x + 3, y + 1, 1, 1); r(c, x + 1, y + 2, 2, 1); };   // 4×3 小愛心（x 是左邊）
function bedSingle(k, px, py) {
  const s = BED_STY[k];
  ob(s.wood, s.dk, px + 6, py + 1, 20, 30);
  ob(s.pil, s.pild, px + 11, py + 4, 10, 6); r('#ffffff', px + 13, py + 6, 3, 1);
  ob(s.q, s.qd, px + 8, py + 12, 16, 18); r(s.fold, px + 8, py + 15, 16, 2);
  if (k === 'b') { r(s.line, px + 10, py + 21, 12, 1); r(s.line, px + 10, py + 25, 12, 1); r(s.deco, px + 14, py + 22, 4, 2); }
  else if (k === 'c') { bedMir(32, 11, 3, x => bedStar(s.deco, px + x, py + 21)); r(s.deco, px + 15, py + 26, 2, 1); }
  else if (k === 'd') {
    r(s.dk, px + 5, py, 2, 31); r(s.dk, px + 25, py, 2, 31); r(s.deco, px + 5, py, 2, 2); r(s.deco, px + 25, py, 2, 2);
    r('rgba(255,255,255,.55)', px + 7, py + 1, 5, 10); r('rgba(255,255,255,.55)', px + 20, py + 1, 5, 10);
    r(s.deco, px + 15, py + 21, 2, 2); r(s.deco, px + 14, py + 22, 4, 1);
  } else if (k === 'e') {
    bedMir(32, 11, 3, x => bedStar(s.deco, px + x, py + 21)); r(s.deco, px + 15, py + 26, 2, 1);
    r(s.deco, px + 13, py + 5, 3, 3); r(s.pil, px + 15, py + 4, 3, 3);   // 枕頭上的月亮
  }
}
function bedDouble(k, px, py) {
  const s = BED_STY[k];
  r('rgba(90,60,40,.18)', px + 2, py + 30, 44, 2);
  ob(s.wood, s.dk, px + 1, py, 46, 31);
  ob(s.wood, s.dk, px + 1, py, 46, 5);                                  // 床頭板
  ob(s.pil, s.pild, px + 5, py + 4, 16, 8); ob(s.pil, s.pild, px + 27, py + 4, 16, 8);   // 兩個枕頭
  r('#ffffff', px + 8, py + 6, 5, 1); r('#ffffff', px + 30, py + 6, 5, 1);
  ob(s.q, s.qd, px + 3, py + 13, 42, 17); r(s.fold, px + 3, py + 16, 42, 3);
  r(s.qd, px + 23, py + 19, 2, 11);                                     // 中線
  if (k === 'a') { bedMir(48, 8, 4, x => bedHeart(s.deco, px + x, py + 22)); bedMir(48, 15, 4, x => bedHeart(s.deco, px + x, py + 25)); }
  else if (k === 'b') {
    for (let y = 21; y < 29; y += 4) { r(s.line, px + 5, py + y, 18, 1); r(s.line, px + 25, py + y, 18, 1); }
    bedMir(48, 8, 3, x => r(s.deco, px + x, py + 25, 3, 2));
  } else if (k === 'c') {
    bedMir(48, 8, 3, x => bedStar(s.deco, px + x, py + 21)); bedMir(48, 16, 3, x => bedStar(s.deco, px + x, py + 25));
    r(s.q, px + 10, py + 2, 28, 1);
  } else if (k === 'd') {
    r(s.dk, px + 1, py, 2, 31); r(s.dk, px + 45, py, 2, 31); r(s.deco, px + 1, py, 2, 2); r(s.deco, px + 45, py, 2, 2);
    bedMir(48, 3, 8, x => r('rgba(255,255,255,.55)', px + x, py + 1, 8, 11));
    r(s.deco, px + 21, py + 22, 2, 2); r(s.deco, px + 25, py + 22, 2, 2); r(s.deco, px + 23, py + 24, 2, 2);
  } else if (k === 'e') {
    bedMir(48, 8, 3, x => bedStar(s.deco, px + x, py + 21)); bedMir(48, 17, 3, x => bedStar(s.deco, px + x, py + 25));
    r(s.deco, px + 10, py + 5, 4, 3); r(s.pil, px + 12, py + 4, 3, 3);   // 左邊枕頭上的月亮
    bedStar(s.deco, px + 33, py + 5);                                    // 右邊枕頭上的星星
  }
}
['b', 'c', 'd', 'e'].forEach(k => { FURN['bed_' + k] = (px, py) => bedSingle(k, px, py); BEDS['bed_' + k] = BEDS.bed; SEAT['bed_' + k] = 'lie'; });
['a', 'b', 'c', 'd', 'e'].forEach(k => { FURN['dbed_' + k] = (px, py) => bedDouble(k, px, py); BEDS['dbed_' + k] = { n: 2, hx: [8, 30], clip: [[0, 24], [24, 48]] }; SEAT['dbed_' + k] = 'lie'; });

/* 未轉向的床格 (lx, ly) ↔ 目前畫面上的格子（床可以轉 90 度的倍數；和 drawFurn 的旋轉方式一致） */
function bedLocal(it, x, y) {
  const d = defOf(it.k), rt = (it.r | 0) & 3, nx = x - (RX + it.x), ny = y - (RY + it.y);
  if (!d || !rt) return [nx, ny];
  return rt === 1 ? [ny, d.h - 1 - nx] : rt === 2 ? [d.w - 1 - nx, d.h - 1 - ny] : [d.w - 1 - ny, nx];
}
function bedWorld(it, lx, ly) {
  const d = defOf(it.k), rt = (it.r | 0) & 3;
  let nx = lx, ny = ly;
  if (d && rt) [nx, ny] = rt === 1 ? [d.h - 1 - ly, lx] : rt === 2 ? [d.w - 1 - lx, d.h - 1 - ly] : [ly, d.w - 1 - lx];
  return [RX + it.x + nx, RY + it.y + ny];
}
/* 站在畫面上 (x, y) 的人，躺的是這張床的哪個位子 */
function bedSlotAt(it, x, y) {
  const sp = BEDS[it.k] || BEDS.bed;
  return sp.n > 1 && bedLocal(it, x, y)[0] >= 2 ? 1 : 0;
}
/* 名牌放在頭上方（回傳畫面像素座標） */
function bedTag(it, slot) { const sp = BEDS[it.k] || BEDS.bed; return bedPt(it, sp.hx[slot | 0] + 5, 1); }
