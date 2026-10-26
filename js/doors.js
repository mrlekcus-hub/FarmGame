'use strict';
/* 門的款式（另外購買）—— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 門格子在 house.walls 裡是大寫字母 A~P（索引 0~15）。
   索引 0~4：舊版「布簾門口」，顏色跟著牆面花紋（0~4）換色，舊資料維持原樣不用搬。
   索引 5~8：新的固定款式，依序是 door_1 木板門、door_2 珠簾、door_3 花藤拱門、door_4 雷克斯骨拱。
   款式編號 k（0~4）→ 字母索引：k = 0 用 0（奶油布簾），k ≥ 1 用 4 + k。
   相連的門合併成一個大門口，整組一律用最左邊（橫牆）或最上面（直牆）那一格的款式。 */
const DOORS = [
  { key: 'door_0', name: '布簾門口', price: 0,   blurb: '初始款：木框、小布簾、踏墊' },
  { key: 'door_1', name: '木板門',   price: 600, blurb: '鐵鉸鏈木板門，兩端各一扇門扇' },
  { key: 'door_2', name: '珠簾',     price: 700, blurb: '竹框掛彩色珠串，腳邊粉紅小地毯' },
  { key: 'door_3', name: '花藤拱門', price: 800, blurb: '木格架爬滿藤蔓和小花，腳邊踏石' },
  { key: 'door_4', name: '雷克斯骨拱', price: 900, blurb: '恐龍骨頭門框，橫樑掛牙齒，踏墊是腳印' }
];
const DOOR_BY_KEY = {};
DOORS.forEach((d, i) => { d.layer = 'door_style'; d.w = 1; d.h = 1; d.idx = i; DOOR_BY_KEY[d.key] = d; });
const doorLetterIdx = k => k <= 0 ? 0 : 4 + k;                // 款式 → 字母索引
const doorStyleOf = st => st < 5 ? 0 : st - 4;                // 字母索引 → 款式（0~4 都是布簾）
const doorOwned = k => k === 0 || have('f:' + DOORS[k].key) > 0;
const doorPrice = k => { const c = house && house.cat && house.cat[DOORS[k].key]; return c ? c.price | 0 : DOORS[k].price; };

/* 決定性的小亂數：同一格每次畫出來都一樣（藤蔓不會閃） */
const dHash = (x, y, s) => ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0;
const dRnd = (x, y, s) => (dHash(x, y, s) % 1000) / 1000;

/* ---------- 橫牆（上下走過）：地面層 ---------- */
function doorHzGround(px, py, c) {
  const k = c.dk, l = !c.dw, rt = !c.de;                        // l / rt：這一格是整組門的左端／右端
  r('rgba(60,40,30,.12)', px, py + 5, T, 11);
  if (k === 1) {
    const x0 = l ? 4 : 0, w = T - x0 - (rt ? 4 : 0);
    r('#8a6a44', px + x0, py + 14, w, 2); r('#a58058', px + x0, py + 14, w, 1);
    if (l) doorPost(px, py, 0);
    if (rt) doorPost(px, py, 12);
    if (l) doorLeaf(px + 4, py, false);          // 單格門只有一扇；兩格以上時兩端各一扇
    else if (rt) doorLeaf(px + 8, py, true);
  } else if (k === 2) {
    r('#ffc4d6', px + 4, py + 13, 8, 2); r('#ffd9e6', px + 5, py + 12, 6, 1); r('#e39ab4', px + 4, py + 15, 8, 1);
    if (l) { r('#7fa655', px, py + 2, 2, 14); r('#a3c97a', px, py + 2, 1, 14); r('#4f7a35', px + 1, py + 2, 1, 14); }
    if (rt) { r('#7fa655', px + 14, py + 2, 2, 14); r('#a3c97a', px + 14, py + 2, 1, 14); r('#4f7a35', px + 15, py + 2, 1, 14); }
  } else if (k === 3) {
    const wd = '#d9b27a', wl = '#b88a52';
    if (l) { r(wd, px, py + 3, 3, 13); r(wl, px + 2, py + 3, 1, 13); for (let y = 6; y < 16; y += 3) r(wl, px, py + y, 3, 1); r('#8a6a44', px, py + 14, 3, 2); r('#ff8fb0', px + 1, py + 13, 1, 1); }
    if (rt) { r(wd, px + 13, py + 3, 3, 13); r(wl, px + 13, py + 3, 1, 13); for (let y = 6; y < 16; y += 3) r(wl, px + 13, py + y, 3, 1); r('#8a6a44', px + 13, py + 14, 3, 2); r('#ffd24a', px + 14, py + 13, 1, 1); }
    r('#b9b5ad', px + 5, py + 13, 3, 2); r('#d6d2c9', px + 5, py + 13, 3, 1); r('#b9b5ad', px + 9, py + 14, 3, 2); r('#d6d2c9', px + 9, py + 14, 3, 1);
  } else {
    const b = '#fffbe8', bs = '#d9ceaa', fp = '#5e8a46', x0 = l ? 4 : 0, w = T - x0 - (rt ? 4 : 0);
    r('#8fbf6a', px + x0, py + 12, w, 3); r('#6f9f50', px + x0, py + 15, w, 1);
    r(fp, px + 5, py + 13, 1, 1); r(fp, px + 7, py + 12, 1, 2); r(fp, px + 9, py + 13, 1, 1); r(fp, px + 7, py + 14, 2, 1);
    if (l) { r(b, px + 1, py + 4, 3, 10); r(bs, px + 3, py + 4, 1, 10); r(b, px, py + 3, 5, 3); r(bs, px + 4, py + 3, 1, 3); r(b, px, py + 13, 5, 3); r(bs, px + 4, py + 13, 1, 3); }
    if (rt) { r(b, px + 12, py + 4, 3, 10); r(bs, px + 14, py + 4, 1, 10); r(b, px + 11, py + 3, 5, 3); r(bs, px + 15, py + 3, 1, 3); r(b, px + 11, py + 13, 5, 3); r(bs, px + 15, py + 13, 1, 3); }
  }
}
function doorPost(px, py, x) { r(DOOR_WOOD.base, px + x, py + 3, 4, 12); r(DOOR_WOOD.hi, px + x, py + 3, 1, 12); r(DOOR_WOOD.dark, px + x + 3, py + 3, 1, 12); r(DOOR_WOOD.deep, px + x, py + 14, 4, 2); r(DOOR_WOOD.dark, px + x, py + 3, 4, 1); }
function doorLeaf(x0, py, flip) {                                // 木板門的門扇：4 格寬、鉸鏈在門柱那一側
  const cols = ['#c48c52', '#a8703c', '#7d5430', '#5a3a20'];
  r('rgba(60,40,30,.2)', flip ? x0 - 3 : x0 + 4, py + 11, 3, 4);
  for (let i = 0; i < 4; i++) r(cols[i], x0 + (flip ? 3 - i : i), py + 7, 1, 7);
  r('#4a4a52', x0, py + 8, 4, 1); r('#4a4a52', x0, py + 12, 4, 1);
  const hx = x0 + (flip ? 3 : 0); r('#7a7a86', hx, py + 8, 1, 1); r('#7a7a86', hx, py + 12, 1, 1);
  r('#f2c94c', x0 + (flip ? 0 : 3), py + 10, 1, 1);
}

/* ---------- 橫牆：橫樑層（畫在玩家之後） ---------- */
function doorHzLintel(px, py, c) {
  const k = c.dk, D = DOOR_WOOD, l = !c.dw, rt = !c.de, tx = RX + c.x;
  if (k === 1) {
    r(D.hi, px, py, T, 3); r('#f0c890', px, py, T, 1); r(D.base, px, py + 3, T, 3); r(D.dark, px, py + 6, T, 1);
    if (l) r(D.dark, px, py, 1, 7); if (rt) r(D.dark, px + T - 1, py, 1, 7);
  } else if (k === 2) {
    r('#7fa655', px, py, T, 4); r('#a3c97a', px, py, T, 1); r('#4f7a35', px, py + 3, T, 1);
    for (let i = 4; i < T; i += 6) r('#4f7a35', px + i, py, 1, 4);
    const pal = ['#ff8fb0', '#ffd24a', '#7ac7e8', '#9be0b0'];
    for (let xx = 1; xx < T; xx += 2) {
      if ((l && xx < 3) || (rt && xx > 12)) continue;
      const len = 6 + ((xx + tx) % 3);
      for (let y = 4; y < 4 + len; y++) r(y % 2 ? '#d8c8a8' : pal[(xx + y) % 4], px + xx, py + y, 1, 1);
      r(pal[xx % 4], px + xx, py + 4 + len, 1, 2);
    }
  } else if (k === 3) {
    const wd = '#d9b27a', wl = '#b88a52', g1 = '#5fae4e', g2 = '#3f8a3a', fc = ['#ff8fb0', '#ffffff', '#ffd24a', '#ffd1e0'];
    r(wd, px, py, T, 3); r(wl, px, py + 2, T, 1);
    for (let y = 0; y < 9; y++) for (let x = 0; x < T; x++) {
      const arch = y <= 3 || (y <= 5 && ((l && x < 5) || (rt && x > 10))) || ((l && x < 3) || (rt && x > 12));
      if (!arch) continue;
      if (dRnd(tx * 16 + x, y, 1) < (y <= 3 ? 0.78 : 0.55)) r(dRnd(tx * 16 + x, y, 2) < .5 ? g1 : g2, px + x, py + y, 1, 1);
    }
    for (let x = 2; x < T - 1; x += 5) r(fc[(x + tx) % 4], px + x, py + ((x + tx) % 3) + 1, 1, 1);
  } else {
    const b = '#fffbe8', bs = '#d9ceaa', bd = '#b0a47e';
    r(b, px, py, T, 4); r(bs, px, py + 4, T, 1); r(bd, px, py, T, 1); r(b, px, py, T, 1);
    r('#c4505a', px + (l ? 2 : 0), py + 5, T - (l ? 2 : 0) - (rt ? 2 : 0), 1);
    for (let x = 1; x < T - 2; x += 4) {
      if ((l && x < 5) || (rt && x > 10)) continue;
      r(b, px + x, py + 6, 2, 1); r(b, px + x, py + 7, 2, 1); r(b, px + x, py + 8, 1, 1); r(bd, px + x + 1, py + 6, 1, 2);
    }
    for (let x = 4; x < T - 3; x += 8) r(bd, px + x, py + 1, 1, 2);
  }
}

/* ---------- 直牆（左右走過）：每格自己畫，整組只有南北兩端有端柱 ---------- */
function doorVertPost(px, py, y0, k) {
  if (k === 2) { r('#a3c97a', px + 4, py + y0, 8, 1); r('#7fa655', px + 4, py + y0 + 1, 8, 3); r('#4f7a35', px + 4, py + y0 + 4, 8, 1); r('#4f7a35', px + 7, py + y0 + 1, 1, 3); return; }
  const D = DOOR_WOOD;
  r(D.hi, px + 2, py + y0, 12, 1); r(D.dark, px + 2, py + y0 + 1, 12, 1); r(D.base, px + 3, py + y0 + 2, 10, 2); r(D.hi, px + 3, py + y0 + 2, 10, 1); r(D.deep, px + 3, py + y0 + 4, 10, 1);
}
function doorVertGround(px, py, c) {
  const k = c.dk, nE = !c.dn, sE = !c.ds, ya = nE ? 5 : 0, yb = sE ? 11 : 16, tx = RX + c.x, ty = RY + c.y;
  r('rgba(60,40,30,.12)', px + 3, py, 10, T);
  if (k === 1) {
    r('#8a6a44', px + 4, py + ya, 6, yb - ya); r('#a58058', px + 4, py + ya, 1, yb - ya);
    if (nE || sE) {
      r('rgba(60,40,30,.22)', px + 10, py + 11, 6, 1);
      r('#c48c52', px + 10, py + 5, 6, 2); r('#a8703c', px + 10, py + 7, 6, 4); r('#7d5430', px + 12, py + 7, 1, 4); r('#7d5430', px + 14, py + 7, 1, 4); r('#5a3a20', px + 10, py + 10, 6, 1);
      r('#4a4a52', px + 10, py + 5, 1, 6); r('#7a7a86', px + 10, py + 5, 1, 1); r('#f2c94c', px + 15, py + 8, 1, 1);
    }
    if (nE) doorVertPost(px, py, 0, 1); if (sE) doorVertPost(px, py, 11, 1);
  } else if (k === 2) {
    r('#ffd9e6', px + 4, py + 5, 8, 1); r('#ffc4d6', px + 2, py + 6, 12, 4); r('#ffc4d6', px + 4, py + 10, 8, 1); r('#e39ab4', px + 4, py + 11, 8, 1);
    r('#7fa655', px + 6, py + ya, 4, yb - ya); r('#a3c97a', px + 6, py + ya, 4, 1); r('#4f7a35', px + 9, py + ya, 1, yb - ya);
    const pal = ['#ff8fb0', '#ffd24a', '#7ac7e8', '#9be0b0'];
    for (let y = ya; y < yb; y++) { r(y % 2 ? pal[y % 4] : '#d8c8a8', px + 10, py + y, 1, 1); r(pal[(y + 1) % 4], px + 11, py + y, 1, 1); }
    if (nE) doorVertPost(px, py, 0, 2); if (sE) doorVertPost(px, py, 11, 2);
  } else if (k === 3) {
    const wd = '#d9b27a', wl = '#b88a52', g1 = '#5fae4e', g2 = '#3f8a3a', fc = ['#ff8fb0', '#ffffff', '#ffd24a', '#ffd1e0'];
    r('#b9b5ad', px + 11, py + 5, 4, 2); r('#d6d2c9', px + 11, py + 5, 4, 1); r('#b9b5ad', px + 11, py + 9, 4, 2); r('#d6d2c9', px + 11, py + 9, 4, 1);
    if (nE) { r('#8a6a44', px + 2, py, 3, 3); r('#ff8fb0', px + 3, py + 1, 1, 1); }
    if (sE) { r('#8a6a44', px + 2, py + 13, 3, 3); r('#ffd24a', px + 3, py + 14, 1, 1); }
    r(wd, px + 5, py, 6, T); r(wl, px + 5, py, 1, T); r(wl, px + 10, py, 1, T);
    for (let y = 3; y < T; y += 4) r(wl, px + 5, py + y, 6, 1);
    for (let y = 0; y < T; y++) for (let x = 4; x < 12; x++) {
      const edge = (nE && y < 5) || (sE && y >= 11);
      if (!edge && (x < 5 || x > 10)) continue;
      if (dRnd(tx * 16 + x, ty * 16 + y, 3) < (x >= 5 && x <= 10 ? 0.8 : 0.5)) r(dRnd(tx * 16 + x, ty * 16 + y, 4) < .5 ? g1 : g2, px + x, py + y, 1, 1);
    }
    for (let y = 1, i = ty; y < T; y += 3, i++) r(fc[i % 4], px + 6 + ((i * 3) % 5), py + y, 1, 1);
  } else {
    const b = '#fffbe8', bs = '#d9ceaa', bd = '#b0a47e', fp = '#5e8a46';
    r('#8fbf6a', px, py + 5, 5, 7); r('#6f9f50', px, py + 12, 5, 1);
    r(fp, px + 1, py + 6, 1, 1); r(fp, px + 1, py + 10, 1, 1); r(fp, px, py + 8, 1, 1); r(fp, px + 2, py + 8, 2, 1); r(fp, px + 3, py + 7, 1, 3);
    r(b, px + 5, py, 6, T); r(bs, px + 10, py, 1, T); r(bd, px + 5, py, 1, T); r(b, px + 6, py, 3, T);
    for (let y = 4; y < T - 2; y += 3) r(bs, px + 5, py + y, 6, 1);
    if (nE) { r(b, px + 4, py, 8, 3); r(bs, px + 4, py + 3, 8, 1); r(bd, px + 4, py, 1, 3); }
    if (sE) { r(b, px + 4, py + 13, 8, 3); r(bs, px + 4, py + 12, 8, 1); r(bd, px + 4, py + 13, 1, 3); }
    const g0 = nE ? 4 : 0, g1 = sE ? 12 : 16;
    r('#c4505a', px + 11, py + g0, 1, g1 - g0);
    for (let y = 2; y < T - 2; y += 4) {
      if ((nE && y < 4) || (sE && y > 9)) continue;
      r(b, px + 12, py + y, 2, 2); r(b, px + 14, py + y, 1, 1); r(bd, px + 12, py + y + 2, 2, 1); r(bd, px + 14, py + y + 1, 1, 1);
    }
  }
}

/* ---------- 家具店、背包的小圖示：一格橫牆門（16×16） ---------- */
function doorIcon(k) {
  r('#e0b080', 0, 0, 16, 16);
  if (k === 0) { doorCurtainIcon(); return; }                    // 初始款：跟遊戲裡 render.js 畫的布簾門口一樣（奶油色）
  const c = { dk: k, dw: false, de: false, dn: false, ds: false, x: 0, y: 0 };
  doorHzGround(0, 0, c);
  doorHzLintel(0, 0, c);
}
function doorCurtainIcon() {
  const D = DOOR_WOOD, cloth = iconRowColor.wall[0], mat = shadeHex(cloth, -0.08), matEdge = shadeHex(cloth, -0.35), trim = shadeHex(cloth, -0.25);
  r('rgba(60,40,30,.12)', 0, 5, 16, 11);                                           // 門內的淡淡陰影
  r(mat, 4, 12, 8, 3); r(matEdge, 4, 15, 8, 1);                                    // 踏墊
  for (let i = 5; i < 12; i += 4) r(shadeHex(cloth, 0.35), i, 13, 2, 1);
  [0, 12].forEach(x => { r(D.base, x, 3, 4, 12); r(D.hi, x, 3, 1, 12); r(D.dark, x + 3, 3, 1, 12); r(D.deep, x, 14, 4, 2); r(D.dark, x, 3, 4, 1); });   // 兩側門柱
  r(D.hi, 0, 0, 16, 3); r('#f0c890', 0, 0, 16, 1); r(D.base, 0, 3, 16, 3); r(D.dark, 0, 6, 16, 1);   // 橫樑
  for (let i = 0; i < 16; i += 4) { r(shadeHex(cloth, 0.1), i, 7, 4, 2); r(trim, i, 9, 4, 1); r(shadeHex(cloth, 0.1), i + 1, 9, 2, 1); }   // 一排小布簾
  r(D.dark, 0, 0, 1, 7); r(D.dark, 15, 0, 1, 7);
}
