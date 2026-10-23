'use strict';
/* 屋子：室內、家具、布置、進出 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 屋子：室內房間、家具、布置 ---------- */
const RX = 4, RY = 5, RW = 12, RH = 7;           // 地板左上角（地圖格）與大小
const hkind = Array.from({ length: H }, () => Array(W).fill(TR));
for (let y = RY; y < RY + RH; y++) for (let x = RX; x < RX + RW; x++) hkind[y][x] = G;
hkind[12][10] = GT;
let house = null;                                // { style, items, cat }
const edit = { on: false, hold: null, sel: null, hover: null };
let tmpSeq = 0, fOpen = false, fTab = 'wall';
const iconRowColor = { wall: ['#fff1d6', '#ffd9e2', '#cfe8f7', '#d6f2e3', '#d9a066'], floor: ['#e0b080', '#f0d4a8', '#ffe0e8', '#cfd2d8', '#d8d08a'] };
const WALL_NAMES = ['奶油牆', '粉紅條紋牆', '天藍圓點牆', '薄荷葉子牆', '木板牆'];
const FLOOR_NAMES = ['木地板', '淺色木地板', '粉紅格子地板', '灰色磚地板', '草蓆地板'];

function drawWallTile(px, py, tx, ty, st) {
  const base = iconRowColor.wall[st] || iconRowColor.wall[0];
  r(base, px, py, T, T);
  if (st === 0) { r('#f6e0b8', px + 3 + (tx % 2) * 6, py + 4, 2, 2); r('#f6e0b8', px + 9 - (tx % 2) * 5, py + 11, 2, 2); }
  else if (st === 1) { for (let i = 1; i < T; i += 4) r('#ffc2d2', px + i, py, 2, T); }
  else if (st === 2) { r('#b0d6ee', px + 4, py + 3, 3, 3); r('#b0d6ee', px + 11, py + 10, 3, 3); r('#e4f3fb', px + 5, py + 4, 1, 1); }
  else if (st === 3) { r('#b8e3cb', px + 3, py + 3, 4, 2); r('#b8e3cb', px + 5, py + 5, 2, 2); r('#b8e3cb', px + 10, py + 10, 4, 2); r('#b8e3cb', px + 12, py + 8, 2, 2); }
  else { r('#c98f62', px, py + 7, T, 1); r('#c98f62', px, py + 15, T, 1); r('#e8b27a', px, py, T, 1); r('#e8b27a', px, py + 8, T, 1); r('#c98f62', px + 5 + (ty % 2) * 6, py, 1, 7); r('#c98f62', px + 10 - (ty % 2) * 6, py + 8, 1, 7); }
}
function drawFloorTile(px, py, tx, ty, st) {
  const base = iconRowColor.floor[st] || iconRowColor.floor[0];
  r(base, px, py, T, T);
  if (st === 0 || st === 1) {
    const ln = st === 0 ? '#c99a6a' : '#dcbc8a';
    r(ln, px, py + 3, T, 1); r(ln, px, py + 7, T, 1); r(ln, px, py + 11, T, 1); r(ln, px, py + 15, T, 1);
    r(ln, px + ((tx * 5 + ty * 3) % 12) + 2, py, 1, 3); r(ln, px + ((tx * 7 + ty) % 12) + 1, py + 4, 1, 3); r(ln, px + ((tx + ty * 5) % 12) + 2, py + 8, 1, 3); r(ln, px + ((tx * 3 + ty * 7) % 12) + 1, py + 12, 1, 3);
  } else if (st === 2) {
    r('#ffd0dc', px, py, 8, 8); r('#ffd0dc', px + 8, py + 8, 8, 8); r('#ffc2d2', px, py + 7, T, 1);
  } else if (st === 3) {
    r('#b8bcc4', px, py + 7, T, 1); r('#b8bcc4', px + 7, py, 1, T); r('#b8bcc4', px, py + 15, T, 1); r('#b8bcc4', px + 15, py, 1, T); r('#e4e6ea', px + 2, py + 2, 3, 1);
  } else {
    for (let i = 0; i < T; i += 4) { r('#c2b870', px, py + i, T, 1); r('#e8e1a8', px + i, py + 2 + ((i / 4) % 2) * 2, 1, 2); }
  }
}

/* 每種家具的像素畫：px, py 是左上角像素，尺寸等於 w×h 格 */
const FURN = {
  bed(px, py) {   // 單人床：窄床置中、一個枕頭（左右對稱，翻轉不影響）
    ob('#e8b27a', '#9b6a44', px + 6, py + 1, 20, 30);
    ob('#ffffff', '#e6d7c3', px + 11, py + 4, 10, 6);
    ob('#ff9bb3', '#d4688a', px + 8, py + 12, 16, 18);
    r('#ffc2d2', px + 8, py + 15, 16, 2); r('#fffaf0', px + 15, py + 21, 2, 2); r('#fffaf0', px + 14, py + 20, 4, 1); r('#fffaf0', px + 13, py + 21, 1, 1); r('#fffaf0', px + 18, py + 21, 1, 1);
  },
  sofa(px, py) {
    ob('#ff9bb3', '#d4688a', px + 2, py + 1, 28, 8);
    ob('#ffb3c6', '#d4688a', px + 5, py + 6, 22, 7);
    ob('#ff9bb3', '#d4688a', px, py + 4, 6, 10); ob('#ff9bb3', '#d4688a', px + 26, py + 4, 6, 10);
    r('#9b6a44', px + 3, py + 14, 2, 2); r('#9b6a44', px + 27, py + 14, 2, 2);
  },
  table(px, py) {
    ob('#e8b27a', '#9b6a44', px + 1, py + 4, 30, 6);
    r('#9b6a44', px + 3, py + 10, 2, 6); r('#9b6a44', px + 27, py + 10, 2, 6);
    r('#8fe09a', px + 23, py + 1, 1, 4); r('#ff8fa8', px + 22, py - 1, 3, 3); r('#ffffff', px + 23, py, 1, 1);
    r('#fff', px + 8, py + 2, 5, 2); r('#d4688a', px + 9, py + 3, 3, 1);
  },
  chair(px, py) {
    ob('#e8b27a', '#9b6a44', px + 3, py + 1, 10, 7);
    ob('#ffb3c6', '#9b6a44', px + 3, py + 8, 10, 3);
    r('#9b6a44', px + 4, py + 11, 2, 4); r('#9b6a44', px + 10, py + 11, 2, 4);
  },
  shelf(px, py) {
    ob('#d9a066', '#9b6a44', px + 1, py + 1, 14, 30);
    r('#9b6a44', px + 2, py + 10, 12, 1); r('#9b6a44', px + 2, py + 20, 12, 1);
    const cols = ['#ff8fa8', '#8fc8f4', '#ffd27a', '#8fe09a', '#c9a8f5'];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) r(cols[(i + row * 2) % 5], px + 3 + i * 3, py + 3 + row * 10 + (i % 2), 2, 6 - (i % 2));
  },
  plant(px, py) {
    ob('#ff9b7a', '#c4603f', px + 4, py + 10, 8, 5);
    rr('#7fd08a', px + 2, py + 5, 6, 6); rr('#7fd08a', px + 8, py + 4, 6, 7); rr('#a8ecaa', px + 5, py + 1, 6, 8);
    r('#c6f5c6', px + 6, py + 3, 1, 2);
  },
  lamp(px, py) {
    r('#9b6a44', px + 7, py + 6, 2, 9); r('#9b6a44', px + 4, py + 14, 8, 2);
    ob('#ffe08a', '#e0a12e', px + 3, py + 1, 10, 6); r('#fff6c0', px + 5, py + 2, 3, 1);
  },
  wardrobe(px, py) {
    ob('#d9a066', '#9b6a44', px + 1, py + 1, 30, 30);
    r('#9b6a44', px + 15, py + 3, 2, 26);
    ob('#e8b27a', '#c98f62', px + 3, py + 4, 11, 24); ob('#e8b27a', '#c98f62', px + 18, py + 4, 11, 24);
    r('#ffd27a', px + 12, py + 15, 2, 3); r('#ffd27a', px + 18, py + 15, 2, 3);
  },
  tv(px, py, now) {
    ob('#4a4a58', '#2f2f3a', px + 5, py - 6, 22, 14);
    r(Math.floor(now / 700) % 2 ? '#bfe6ff' : '#ffd9e2', px + 7, py - 4, 18, 10); r('#ffffff', px + 9, py - 3, 4, 1);
    ob('#c98f62', '#9b6a44', px + 1, py + 8, 30, 7);
    r('#9b6a44', px + 15, py + 9, 2, 5);
  },
  piano(px, py) {
    ob('#4a4a58', '#2f2f3a', px + 1, py - 3, 30, 17);
    r('#ffffff', px + 3, py + 8, 26, 5);
    for (let i = 0; i < 8; i++) r('#cfcfd8', px + 6 + i * 3, py + 8, 1, 5);
    for (let i = 0; i < 6; i++) if (i !== 2) r('#2f2f3a', px + 5 + i * 4, py + 8, 2, 3);
    r('#6b6b7a', px + 5, py - 1, 22, 2);
  },
  cat(px, py, now) {
    ob('#e8b27a', '#9b6a44', px + 1, py + 8, 14, 7);
    ob('#ffd27a', '#d9a066', px + 4, py + 3, 8, 8);
    r('#d9a066', px + 4, py + 2, 2, 2); r('#d9a066', px + 10, py + 2, 2, 2);
    r('#4a2c2c', px + 6, py + 6, 1, 1); r('#4a2c2c', px + 9, py + 6, 1, 1); r('#ff8fa8', px + 7, py + 8, 2, 1);
    if (Math.floor(now / 900) % 2) { r('#8fc8f4', px + 12, py, 2, 1); r('#8fc8f4', px + 13, py + 1, 1, 1); r('#8fc8f4', px + 12, py + 2, 2, 1); }
  },
  fireplace(px, py, now) {
    ob('#d9d1c3', '#9b8b7a', px + 1, py + 3, 30, 28);
    for (let i = 0; i < 4; i++) { r('#c4baa8', px + 2, py + 8 + i * 6, 28, 1); r('#c4baa8', px + 6 + (i % 2) * 8, py + 4 + i * 6, 1, 5); }
    ob('#e8e1d4', '#9b8b7a', px, py, 32, 4);
    ob('#3a2a2a', '#9b8b7a', px + 7, py + 12, 18, 17);
    const f = Math.floor(now / 160) % 3;
    r('#ff7a3c', px + 11, py + 21 - f, 10, 7 + f); r('#ffb347', px + 13, py + 23 - f, 6, 5 + f); r('#fff0a0', px + 15, py + 25, 2, 3);
    r('#8a5a44', px + 9, py + 27, 14, 2);
  },
  rug(px, py) {
    ob('#ffe3ec', '#ffb3c6', px + 1, py + 1, 30, 30);
    r('#ffc2d2', px + 4, py + 4, 24, 1); r('#ffc2d2', px + 4, py + 27, 24, 1); r('#ffc2d2', px + 4, py + 4, 1, 24); r('#ffc2d2', px + 27, py + 4, 1, 24);
    r('#ff8fa8', px + 14, py + 13, 4, 3); r('#ff8fa8', px + 13, py + 14, 6, 2); r('#ff8fa8', px + 15, py + 16, 2, 2);
  },
  rug2(px, py) {
    ob('#cfe8f7', '#8fc8f4', px + 1, py + 1, 46, 30);
    r('#b0d6ee', px + 4, py + 4, 40, 1); r('#b0d6ee', px + 4, py + 27, 40, 1);
    for (let i = 0; i < 5; i++) { r('#ffffff', px + 8 + i * 8, py + 12, 3, 3); r('#ffffff', px + 12 + i * 8, py + 19, 3, 3); }
  },
  window(px, py, now) {
    ob('#bfe6ff', '#9b6a44', px + 1, py + 1, 30, 30);
    r('#e4f3fb', px + 4, py + 5, 8, 3); r('#ffffff', px + 18 + (Math.floor(now / 1500) % 3), py + 10, 7, 3);
    r('#9b6a44', px + 15, py + 2, 2, 28); r('#9b6a44', px + 2, py + 15, 28, 2);
    r('#ffb3c6', px, py, 5, 32); r('#ffb3c6', px + 27, py, 5, 32); r('#ff8fa8', px + 3, py, 1, 32); r('#ff8fa8', px + 28, py, 1, 32);
  },
  paint1(px, py) {
    ob('#e8b27a', '#9b6a44', px + 2, py + 2, 12, 12); r('#ffe3ec', px + 4, py + 4, 8, 8);
    r('#ff8fa8', px + 6, py + 6, 4, 2); r('#ff8fa8', px + 5, py + 7, 6, 2); r('#ff8fa8', px + 7, py + 9, 2, 2);
  },
  paint2(px, py) {
    ob('#e8b27a', '#9b6a44', px + 2, py + 2, 28, 12);
    r('#bfe6ff', px + 4, py + 4, 24, 8); r('#8fe09a', px + 4, py + 9, 24, 3); r('#7fd08a', px + 8, py + 7, 8, 5); r('#ffe08a', px + 21, py + 5, 3, 3);
  },
  clock(px, py) {
    ob('#ffffff', '#9b6a44', px + 2, py + 2, 12, 12);
    const d = new Date(), mi = d.getMinutes(), hr = (d.getHours() % 12) + mi / 60;
    const hand = (len, ang, col) => { for (let i = 0; i <= len; i++) r(col, px + 8 + Math.round(Math.sin(ang) * i), py + 8 - Math.round(Math.cos(ang) * i), 1, 1); };
    hand(3, hr / 12 * Math.PI * 2, '#6b4848'); hand(4, mi / 60 * Math.PI * 2, '#ff8fa8');
    r('#6b4848', px + 8, py + 8, 1, 1);
  },
  wreath(px, py) {
    rr('#7fd08a', px + 2, py + 2, 12, 3); rr('#7fd08a', px + 2, py + 11, 12, 3); rr('#7fd08a', px + 2, py + 2, 3, 12); rr('#7fd08a', px + 11, py + 2, 3, 12);
    r('#ff8fa8', px + 4, py + 3, 2, 2); r('#ffd27a', px + 10, py + 11, 2, 2); r('#ff8fa8', px + 11, py + 5, 2, 2); r('#ffffff', px + 3, py + 10, 2, 2);
    r('#ff8fa8', px + 7, py + 13, 2, 3);
  },
  wshelf(px, py) {
    ob('#d9a066', '#9b6a44', px + 1, py + 9, 30, 4);
    r('#8fe09a', px + 5, py + 4, 3, 5); r('#ff9b7a', px + 4, py + 7, 5, 3);
    r('#ff8fa8', px + 14, py + 3, 3, 6); r('#8fc8f4', px + 17, py + 4, 3, 5); r('#ffd27a', px + 20, py + 5, 3, 4);
    ob('#ffffff', '#cfcfd8', px + 25, py + 5, 4, 5);
  },
  wardrobe(px, py) {                               // 衣櫥（2x2）：按動作鍵換造型
    r('rgba(90,60,40,.18)', px + 2, py + 30, 28, 2);
    ob('#d9a066', '#9b6a44', px + 2, py + 3, 28, 28);
    r('#e8b27a', px + 4, py + 5, 11, 24); r('#e8b27a', px + 17, py + 5, 11, 24);
    r('#9b6a44', px + 15, py + 3, 2, 28);
    r('#fff3b0', px + 12, py + 16, 2, 3); r('#fff3b0', px + 18, py + 16, 2, 3);
    r('#ff8fa8', px + 7, py + 8, 5, 3); r('#8fc8f4', px + 20, py + 8, 5, 3);
    r('#9b6a44', px + 4, py + 31, 3, 1); r('#9b6a44', px + 25, py + 31, 3, 1);
  },
  mirror(px, py) {                                 // 鏡子（掛牆 1x2）：按動作鍵換造型
    ob('#d9a066', '#9b6a44', px + 1, py + 2, 14, 28);
    r('#cfeaf7', px + 3, py + 4, 10, 24); r('#eaf7fd', px + 4, py + 5, 3, 10); r('#ffffff', px + 4, py + 6, 1, 6);
    r('#b4d9ea', px + 9, py + 18, 3, 8);
  },
  dtable(px, py) {                                 // 餐桌（2x1）：桌布加四格擺盤位置，菜由 DCONT 疊上去
    r('rgba(90,60,40,.18)', px + 2, py + 14, 28, 2);
    ob('#e8b27a', '#9b6a44', px + 1, py + 3, 30, 11);
    r('#fff7ea', px + 2, py + 4, 28, 3); r('#ff8fa8', px + 2, py + 7, 28, 1);
  },
  aquarium(px, py, now) {                          // 魚缸（2x2）：只畫缸體，裡面的魚由 DCONT 疊上去
    r('rgba(90,60,40,.18)', px + 2, py + 30, 28, 2);
    ob('#d9a066', '#9b6a44', px + 1, py + 26, 30, 6);
    r('#e8b27a', px + 3, py + 27, 26, 1);
    ob('#e4f3fb', '#8e9db0', px + 1, py + 2, 30, 25);
    r('#8fd3f4', px + 3, py + 5, 26, 20);
    r('#bfe9fb', px + 3, py + 5, 26, 2);
    r('#f3dc9a', px + 3, py + 22, 26, 3);
    r('#e0c477', px + 7, py + 23, 2, 1); r('#e0c477', px + 15, py + 22, 2, 1); r('#e0c477', px + 23, py + 23, 2, 1);
    r('#5fbf6a', px + 5, py + 15, 2, 8); r('#8fe09a', px + 7, py + 17, 1, 6); r('#5fbf6a', px + 25, py + 14, 2, 9); r('#8fe09a', px + 24, py + 17, 1, 6);
    const b = (now / 800) % 1;
    r('#ffffff', px + 16, py + 21 - Math.floor(b * 15), 1, 1); r('#e4f7ff', px + 19, py + 21 - Math.floor(((b + 0.5) % 1) * 15), 1, 1);
    r('rgba(255,255,255,.55)', px + 4, py + 6, 1, 9);
  },
  specimen(px, py) {                               // 標本架（掛牆 3x2）：6 個小格，蟲蝶由 DCONT 疊上去
    ob('#c98f62', '#9b6a44', px + 1, py + 1, 46, 30);
    for (let rr_ = 0; rr_ < 2; rr_++) for (let c = 0; c < 3; c++) {
      const x = px + 2 + c * 15, y = py + 2 + rr_ * 14;
      r('#fff6dc', x, y, 14, 13); r('#efe0bd', x, y + 12, 14, 1);
    }
  }
};
FURN.kitchen = (px, py, now) => {                  // 廚房灶台（2×1）：爐子＋冒煙的鍋子
  ob('#f1e3cf', '#9b6a44', px + 1, py + 4, 30, 11);
  r('#c9a67a', px + 1, py + 4, 30, 2);
  ob('#8d8d9a', '#5b5b68', px + 3, py + 6, 11, 6);
  r('#3b3b46', px + 5, py + 7, 3, 2); r('#3b3b46', px + 9, py + 7, 3, 2);
  ob('#d96b6b', '#8f3a3a', px + 18, py + 2, 10, 7); r('#f3a0a0', px + 19, py + 3, 8, 1);
  r('#8f3a3a', px + 17, py + 4, 1, 2); r('#8f3a3a', px + 28, py + 4, 1, 2);
  const st = Math.floor((now || 0) / 450) % 3;
  r('rgba(255,255,255,.75)', px + 21 + st, py - (st % 2), 1, 2); r('rgba(255,255,255,.5)', px + 24 - st, py + 1 - ((st + 1) % 2), 1, 1);
  r('#9b6a44', px + 3, py + 15, 2, 1); r('#9b6a44', px + 27, py + 15, 2, 1);
};
FURN.lantern = (px, py, now) => {                  // 紙燈籠（商人專屬）
  r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 1);
  r('#9b6a44', px + 7, py + 11, 2, 4); ob('#ff7a6c', '#b8403a', px + 3, py + 2, 10, 10);
  r('#ffd34d', px + 3, py + 6, 10, 1); r('#b8403a', px + 5, py + 1, 6, 1); r('#ffb3a8', px + 5, py + 4, 2, 2);
};
FURN.globe = (px, py, now) => {                    // 地球儀
  r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 1);
  ob('#9b6a44', '#6e4a2e', px + 4, py + 12, 8, 3); r('#6e4a2e', px + 7, py + 9, 2, 4);
  ob('#6fb7e8', '#3f7fae', px + 3, py + 1, 10, 9); r('#7fd08a', px + 5, py + 3, 3, 3); r('#7fd08a', px + 9, py + 5, 2, 3);
};
FURN.vase = (px, py, now) => {                     // 青花瓶
  r('rgba(90,60,40,.18)', px + 4, py + 14, 8, 1);
  ob('#fafcff', '#7a8fb8', px + 4, py + 5, 8, 10); r('#7a8fb8', px + 6, py + 1, 4, 5); r('#fafcff', px + 6, py + 2, 4, 1);
  r('#4a6fb8', px + 5, py + 8, 6, 1); r('#4a6fb8', px + 6, py + 10, 4, 1); r('#4a6fb8', px + 7, py + 12, 2, 1);
};
const SEAT = { chair: 'sit', sofa: 'sit', bed: 'lie' };   // 可以坐／躺的家具
const STYLER = { wardrobe: 1, mirror: 1 };   // 在自己家按動作鍵就能換造型
const DISP = { aquarium: { n: 4, kind: 'fish' }, specimen: { n: 6, kind: 'bug' } };   // 要和 SQL 的 _display_slots / _display_kind 一致
const dispOf = it => (house && house.disp && house.disp[it.id]) || [];
/* 展示品（疊在家具上面；不跟著翻轉，所以魚永遠朝游動方向） */
const DCONT = {
  tv(it, px, py, now) {   // 電視畫面：0 = 原本的卡通（不蓋掉），1～4 依頻道畫
    const c = tvOf(it.id); if (!c) return;
    const x = px + 7, y = py - 4, t = Math.floor(now / 350);
    if (c === 1) {   // 烹飪節目：冒煙的鍋子
      r('#2c2230', x, y, 18, 10); r('#9b5a2a', x + 4, y + 5, 1, 2); r('#9b5a2a', x + 13, y + 5, 1, 2); r('#d9884a', x + 5, y + 5, 8, 4);
      r('#e8e8f0', x + 6 + (t % 3) * 2, y + 3 - (t % 2), 2, 1); r('#e8e8f0', x + 10 - (t % 3), y + 2, 1, 1);
    } else if (c === 2) {   // 釣魚節目：水面、游動的魚、浮標
      r('#5aa6d8', x, y, 18, 10); r('#7cc2ea', x, y, 18, 3); r('#3f86bd', x, y + 8, 18, 2);
      const f = t % 6; r('#ffb347', x + 2 + f * 2, y + 6, 3, 2); r('#ffb347', x + 1 + f * 2, y + 6, 1, 2);
      r('#ffffff', x + 14, y, 1, 3 + (t % 2)); r('#ff5a5a', x + 13, y + 3 + (t % 2), 3, 2);
    } else if (c === 3) {   // 天氣預報：照遊戲裡現在的天氣畫
      const w = world();
      r(w.wet ? '#7d8a9a' : '#7fc4f0', x, y, 18, 10);
      if (!w.wet) { r('#ffd34d', x + 11, y + 1, 5, 5); r('#fff0a0', x + 12, y + 2, 3, 3); }
      r('#ffffff', x + 3, y + 2, 7, 3); r('#ffffff', x + 5, y + 1, 4, 1);
      if (w.wet) for (let i = 0; i < 5; i++) r(w.snow ? '#ffffff' : '#bfe0ff', x + 3 + i * 3, y + 5 + ((t + i) % 4), 1, w.snow ? 1 : 2);
    } else if (c === 4) {   // 今日情報：藍底、一條條文字、閃爍的紅點
      r('#1f3b73', x, y, 18, 10); r('#ffd34d', x + 1, y + 1, 6, 1); r('#cfe0ff', x + 1, y + 3, 16, 1); r('#cfe0ff', x + 1, y + 5, 12, 1); r('#cfe0ff', x + 1, y + 7, 14, 1);
      if (t % 2) r('#ff5a5a', x + 15, y + 1, 2, 2);
    }
  },
  dtable(it, px, py) {
    const arr = dispOf(it);
    for (let s = 0; s < 4; s++) {
      const d = arr[s]; if (!d || !(d.n > 0)) continue;
      let hsh = 0; for (const ch of d.k) hsh = (hsh * 31 + ch.charCodeAt(0)) % 360;
      r('#ffffff', px + 3 + s * 7, py + 4, 6, 5); r('hsl(' + hsh + ',70%,60%)', px + 4 + s * 7, py + 5, 4, 3);
    }
  },
  aquarium(it, px, py, now) {
    const arr = dispOf(it);
    if (!arr.some(Boolean)) return;
    g.save(); g.beginPath(); g.rect(px + 3, py + 5, 26, 20); g.clip();
    for (let s = 0; s < 4; s++) {
      if (!arr[s]) continue;
      const ph = now / 1500 + s * 1.9, dir = Math.cos(ph) >= 0 ? 1 : -1;
      const cx = Math.round(px + 16 + Math.sin(ph) * 7), cy = py + 6 + (s % 2) * 7 + Math.round(Math.sin(now / 900 + s * 2.1) * 1.5);
      g.save(); g.translate(cx, cy); if (dir < 0) g.scale(-1, 1);
      g.drawImage(showSprite('fish', arr[s].k), -6, 0, 12, 12);
      g.restore();
    }
    g.restore();
  },
  specimen(it, px, py) {
    const arr = dispOf(it);
    for (let s = 0; s < 6; s++) {
      const x = px + 2 + (s % 3) * 15, y = py + 2 + ((s / 3) | 0) * 14;
      if (arr[s]) g.drawImage(showSprite('bug', arr[s].k), x + 1, y, 12, 12);
      else r('#e3d3ae', x + 6, y + 6, 2, 2);
    }
  }
};

function drawFurn(it, px, py, now) {
  const f = FURN[it.k], d = defOf(it.k);
  if (!f || !d) return;
  const rt = (it.r | 0) & 3;
  let ox = px, oy = py;
  g.save();
  if (rt) {   // 旋轉：以轉過之後的佔格中心為軸（90 度的倍數，像素不會糊）
    const rw = rt & 1 ? d.h : d.w, rh = rt & 1 ? d.w : d.h;
    g.translate(px + rw * T / 2, py + rh * T / 2); g.rotate(rt * Math.PI / 2); g.translate(-d.w * T / 2, -d.h * T / 2);
    ox = 0; oy = 0;
  }
  if (!it.f) f(ox, oy, now);
  else { g.save(); g.translate(2 * ox + d.w * T, 0); g.scale(-1, 1); f(ox, oy, now); g.restore(); }
  if (it.id != null && DCONT[it.k]) DCONT[it.k](it, ox, oy, now);
  g.restore();
}
const defOf = k => (house && house.cat[k]) || null;
/* 家具轉過之後的佔格（轉 90／270 度長寬對調，要和 SQL 的 _house_fits 一致） */
const dimsOf = (k, r) => { const d = defOf(k); if (!d) return null; return (r & 1) ? { ...d, w: d.h, h: d.w } : d; };
const itemRect = it => { const d = dimsOf(it.k, it.r | 0); return d ? { x: it.x, y: it.y, w: d.w, h: d.h, layer: d.layer } : null; };
/* 屋子大小固定 12×7（要和 SQL 的 _house_fits 一致） */
const houseW = () => RW;   // 屋子大小不受等級限制
const houseD = () => RH;
function fitsLocal(k, x, y, ignoreId, rot) {
  const d = dimsOf(k, rot | 0);
  if (!d || x < 0 || x + d.w > houseW()) return false;
  if (d.layer === 'wall') { if (y < -2 || y + d.h > 0) return false; }
  else if (y < 0 || y + d.h > houseD()) return false;
  return !house.items.some(it => {
    if (ignoreId != null && it.id === ignoreId) return false;
    const g = itemRect(it);
    return g && g.layer === d.layer && g.x < x + d.w && x < g.x + g.w && g.y < y + d.h && y < g.y + g.h;
  });
}
function houseBlocked(mx, my) {
  if (!house) return false;
  const lx = mx - RX, ly = my - RY;
  return house.items.some(it => { const g = itemRect(it); return g && g.layer === 'floor' && lx >= g.x && lx < g.x + g.w && ly >= g.y && ly < g.y + g.h; });
}
const itemAtLocal = (lx, ly) => {
  let hit = null, pr = -1;
  house.items.forEach(it => {
    const g = itemRect(it);
    if (!g || lx < g.x || lx >= g.x + g.w || ly < g.y || ly >= g.y + g.h) return;
    const p = g.layer === 'floor' ? 3 : (g.layer === 'wall' ? 2 : 1);
    if (p > pr) { pr = p; hit = it; }
  });
  return hit;
};
function applyHouse(d) {
  const cat = {}, list = [];
  (d.catalog || []).forEach(c => { cat[c.key] = c; list.push(c); });
  const disp = {};
  (d.display || []).forEach(x => { const id = +x.id, s = x.s | 0; if (s < 0 || s > 15 || (x.t !== 'fish' && x.t !== 'bug' && x.t !== 'dish')) return; (disp[id] || (disp[id] = []))[s] = { t: x.t, k: String(x.k), n: x.n | 0 }; });
  const by = {}; (d.dish_by || []).forEach(x => { (by[+x.id] || (by[+x.id] = {}))[x.s | 0] = { u: String(x.uid), n: clean(x.name, 8) }; });
  house = { by, style: d.style || { wall: 0, floor: 0 }, items: (d.items || []).map(i => ({ id: +i.id, k: i.k, x: i.x | 0, y: i.y | 0, f: !!i.f, r: (i.r | 0) & 3 })), cat, list, disp };
}
async function loadHouse() { applyHouse(await rpc('house_get')); }
function reloadHouse() {
  enqueue(async () => { const [st, hs] = await Promise.all([rpc('get_state'), rpc('house_get')]); applyState(st); applyHouse(hs); refreshHud(); renderHousePanel(); }).catch(e => toast(errText(e)));
}

/* ---------- 進出屋子 ---------- */
let enterBusy = false;
async function enterHouse() {
  if (enterBusy) return;
  enterBusy = true;
  try { if (!house) await withTimeout(loadHouse(), 12000); }
  catch (e) { enterBusy = false; toast('進不了屋子：' + errText(e) + '（再按一次動作鍵可重試）', 7000); return; }
  enterBusy = false;
  if (scene !== 'farm') return;
  tutEvent('house');
  scene = 'house'; K = hkind;
  pl.x = pl.sx = 10; pl.y = pl.sy = 11; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  edit.on = false; edit.hold = null; edit.sel = null; myShow = null;
  $('hpanel').hidden = false; $('game').classList.remove('editing');
  renderHousePanel();
  joinHouseRoom(myUid);        // 自己的家也連上頻道，朋友來拜訪時才看得到你
}
