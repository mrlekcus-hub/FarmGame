'use strict';
/* 工具圖示、魚、蟲與蝴蝶的像素圖 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 工具圖示 ---------- */
function drawIcon(c2d, i) {
  g = c2d;
  g.clearRect(0, 0, 16, 16);
  if (i === 0) {
    for (let k = 0; k < 10; k++) { r('#6a4a2c', 2 + k, 14 - k, 2, 2); r('#a07850', 2 + k, 14 - k, 2, 1); }
    r('#8e9db0', 10, 1, 5, 2); r('#8e9db0', 13, 1, 2, 6); r('#cfe0f0', 10, 1, 4, 1); r('#7a5a3a', 12, 9, 3, 1); r('#7a5a3a', 11, 10, 1, 1);
  } else if (i === 1) {
    ob('#8fd3f4', '#4aa3d4', 3, 6, 9, 8);
    r('#ffffff', 5, 8, 2, 2);
    r('#4aa3d4', 12, 7, 3, 1); r('#4aa3d4', 14, 7, 1, 5); r('#4aa3d4', 12, 11, 3, 1);
    r('#4aa3d4', 0, 3, 3, 1); r('#8fd3f4', 1, 4, 2, 1); r('#8fd3f4', 2, 5, 2, 2);
    r('#ffb3c6', 8, 9, 1, 1); r('#ffb3c6', 10, 9, 1, 1); r('#ffb3c6', 8, 10, 3, 1); r('#ffb3c6', 9, 11, 1, 1);
  } else if (TOOLS[i].id === 'rod') {
    for (let k = 0; k < 11; k++) { r('#8c5b3c', 2 + k, 14 - k, 2, 2); r('#c08a62', 2 + k, 14 - k, 2, 1); }
    r('#ffffff', 13, 2, 1, 7); r('#ffffff', 12, 2, 1, 1);
    ob('#ff6b6b', '#c84a4a', 11, 9, 4, 4); r('#ffffff', 12, 10, 2, 1);
    r('#ffd27a', 1, 13, 3, 2);
  } else if (TOOLS[i].id === 'net') {
    for (let k = 0; k < 8; k++) { r('#8c5b3c', 2 + k, 14 - k, 2, 2); r('#c08a62', 2 + k, 14 - k, 2, 1); }
    ob('#f4fbff', '#8e9db0', 8, 1, 7, 7);
    r('#cfe3ee', 10, 3, 1, 4); r('#cfe3ee', 12, 3, 1, 4); r('#cfe3ee', 9, 5, 5, 1);
  } else if (TOOLS[i].id === 'pick') {
    for (let k = 0; k < 9; k++) { r('#8c5b3c', 3 + k, 14 - k, 2, 2); r('#c08a62', 3 + k, 14 - k, 2, 1); }
    ob('#dfe7ee', '#6f7f93', 2, 2, 12, 3); r('#6f7f93', 2, 4, 2, 3); r('#6f7f93', 12, 4, 2, 3);
  } else if (TOOLS[i].id === 'axe') {
    for (let k = 0; k < 11; k++) { r('#b0463c', 2 + k, 14 - k, 2, 2); r('#e07a62', 2 + k, 14 - k, 2, 1); }
    ob('#cfe0f0', '#4a6a8c', 6, 1, 8, 7); r('#4a6a8c', 6, 3, 2, 3); r('#ffffff', 9, 2, 3, 1); r('#8fb0d0', 10, 4, 3, 3);
  } else if (TOOLS[i].id === 'yard') {
    ob('#e8b27a', '#9b6a44', 1, 7, 14, 3); ob('#e8b27a', '#9b6a44', 1, 12, 14, 3);
    [2, 7, 12].forEach(x0 => ob('#fff0d4', '#9b6a44', x0, 3, 3, 12)); r('#ff8fa8', 7, 1, 2, 2);
  } else if (TOOLS[i].id === 'fert') {
    ob('#c9a15a', '#7a5a3a', 3, 4, 10, 10); r('#7a5a3a', 5, 3, 6, 2); r('#f3e1b0', 5, 8, 6, 3); r('#8c6a44', 6, 9, 4, 1);
  } else {
    const c = CROPS[TOOLS[i].crop].c;
    ob('#fffaf0', '#e0b896', 3, 2, 10, 13);
    rr(c, 5, 6, 6, 6);
    r(INK, 6, 8, 1, 1); r(INK, 9, 8, 1, 1); r(INK, 7, 10, 2, 1);
    r('#5fbf6a', 7, 3, 2, 2); r('#8fe09a', 9, 3, 2, 1);
  }
  g = ctx;
}


/* ---------- 魚的像素圖（16x16，朝右） ---------- */
const FISH_ART = {
  minnow:   { rx: 4,   ry: 2.4, body: '#cfe3ee', belly: '#ffffff', fin: '#9ec3d9', out: '#6f98b0', stripe: [[3, 8, '#8fb5cc'], [4, 8, '#8fb5cc'], [5, 8, '#8fb5cc'], [6, 8, '#8fb5cc'], [7, 8, '#8fb5cc'], [8, 8, '#8fb5cc'], [9, 8, '#8fb5cc'], [10, 8, '#8fb5cc']] },
  crucian:  { rx: 5,   ry: 3.4, body: '#c8a66a', belly: '#ecdca6', fin: '#a8844a', out: '#7a5c30' },
  tilapia:  { rx: 5,   ry: 3.4, body: '#e69a8a', belly: '#ffd9cf', fin: '#cf7a6c', out: '#a0554a', stripe: [[6, 6, '#cf7a6c'], [6, 7, '#cf7a6c'], [8, 6, '#cf7a6c'], [8, 7, '#cf7a6c'], [10, 6, '#cf7a6c'], [10, 7, '#cf7a6c']] },
  carp:     { rx: 5.5, ry: 3.6, body: '#d6a23a', belly: '#f2d88a', fin: '#b8821f', out: '#865d12', whisk: true },
  bass:     { rx: 5.5, ry: 3.2, body: '#6f9a7a', belly: '#d5e8d2', fin: '#4f7a5e', out: '#34574a', stripe: [[5, 6, '#4f7a5e'], [6, 6, '#4f7a5e'], [7, 6, '#4f7a5e'], [8, 6, '#4f7a5e'], [9, 6, '#4f7a5e'], [10, 6, '#4f7a5e']] },
  catfish:  { rx: 5.5, ry: 3,   body: '#6c6a80', belly: '#a8a6bd', fin: '#55536a', out: '#3c3a52', whisk: true },
  sunfish:  { rx: 4.8, ry: 4.8, body: '#ffcf4a', belly: '#fff0a6', fin: '#f0a020', out: '#b8741a', spot: [[11, 9, '#ff6b4a'], [11, 10, '#ff6b4a']] },
  eel:      { rx: 7,   ry: 1.6, body: '#5a7a6a', belly: '#a6c4a6', fin: '#46604f', out: '#2f4538', shape: 'eel' },
  koi:      { rx: 5.5, ry: 3.4, body: '#fff6ee', belly: '#ffffff', fin: '#ffd9cf', out: '#c89a8a', spot: [[5, 6, '#ff6b4a'], [6, 6, '#ff6b4a'], [6, 7, '#ff6b4a'], [9, 8, '#ff6b4a'], [10, 8, '#ff6b4a'], [8, 6, '#2b2b2b'], [9, 6, '#2b2b2b']] },
  rainbow:  { rx: 5.5, ry: 3.4, body: '#8fd3ff', belly: '#ffffff', fin: '#c9a8ff', out: '#5a8fc0', stripe: [[4, 6, '#ff8fa8'], [5, 6, '#ff8fa8'], [6, 6, '#ffd27a'], [7, 6, '#ffd27a'], [8, 6, '#8fe09a'], [9, 6, '#8fe09a'], [10, 6, '#b79cff'], [4, 9, '#ffd27a'], [6, 9, '#8fe09a'], [8, 9, '#8fd3ff'], [10, 9, '#ff8fa8']] },
  moonfish: { rx: 5,   ry: 4.4, body: '#dfe6ff', belly: '#ffffff', fin: '#b6c4ff', out: '#7a86c8', spot: [[6, 7, '#fff6a8'], [9, 6, '#fff6a8'], [8, 10, '#fff6a8']] },
  mosstrout: { rx: 5.5, ry: 3.1, body: '#7a9a5a', belly: '#e8ecc0', fin: '#5a7a3a', out: '#3a5230', spot: [[5, 7, '#a8c878'], [7, 6, '#a8c878'], [9, 7, '#a8c878'], [6, 8, '#a8c878'], [8, 5, '#a8c878']] },
  amberfish: { rx: 5,   ry: 3.6, body: '#e0a030', belly: '#ffe9a6', fin: '#c0761a', out: '#7a4a12', stripe: [[5, 7, '#ffd070'], [6, 7, '#ffd070'], [7, 7, '#ffd070'], [8, 7, '#ffd070'], [9, 7, '#ffd070']] },
  maplefish: { rx: 5.2, ry: 3.6, body: '#d8503a', belly: '#ffd9a8', fin: '#ff9a3a', out: '#8a2a1e', spot: [[6, 6, '#ffcf4a'], [8, 6, '#ffcf4a'], [7, 8, '#ffcf4a'], [10, 7, '#ffcf4a']] },
  boot:     { shape: 'boot' }
};
function drawFish(c2d, key, dim) {
  g = c2d; g.clearRect(0, 0, 16, 16);
  const A = FISH_ART[key];
  if (!A) { g = ctx; return; }
  const col = (c) => dim ? '#cdbfb8' : c;
  if (A.shape === 'boot') {
    ob(col('#a87a52'), dim ? '#a89a92' : '#6a4630', 5, 2, 5, 8);
    ob(col('#a87a52'), dim ? '#a89a92' : '#6a4630', 5, 8, 9, 5);
    r(col('#5a3a28'), 5, 12, 9, 1); r(col('#d9c7a8'), 6, 4, 3, 1); r(col('#d9c7a8'), 6, 6, 3, 1);
    g = ctx; return;
  }
  if (typeof A.draw === 'function') { A.draw(col); g = ctx; return; }   // 出海團的海魚有自己的畫法（js/art/boat.js）
  const cx = 8.5, cy = 8, eel = A.shape === 'eel';
  const wv = x => eel ? Math.sin(x * 0.75) * 1.7 : 0;
  const tail = (x, y) => {
    const k = (cx - A.rx) - x;
    if (k < -1 || k > 3) return false;
    return Math.abs(y + 0.5 - cy - wv(x)) <= (eel ? 1 : 0.7 + k * 0.85);
  };
  const body = (x, y) => { const dx = (x + 0.5 - cx) / A.rx, dy = (y + 0.5 - cy - wv(x)) / A.ry; return dx * dx + dy * dy <= 1; };
  const mask = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && (body(x, y) || tail(x, y));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!mask(x, y)) continue;
    const edge = !mask(x + 1, y) || !mask(x - 1, y) || !mask(x, y + 1) || !mask(x, y - 1);
    let c = A.body;
    if (!body(x, y)) c = A.fin;
    else if (y + 0.5 > cy + wv(x) + A.ry * 0.35) c = A.belly;
    if (edge) c = A.out;
    r(col(c), x, y, 1, 1);
  }
  if (!eel && A.ry > 3) for (let x = Math.round(cx) - 2; x <= Math.round(cx); x++) r(col(A.fin), x, Math.round(cy - A.ry) - 1, 1, 1);
  (A.stripe || []).forEach(([x, y, c]) => { if (mask(x, y)) r(col(c), x, y, 1, 1); });
  (A.spot || []).forEach(([x, y, c]) => { if (mask(x, y)) r(col(c), x, y, 1, 1); });
  if (A.whisk) { r(col(A.out), Math.round(cx + A.rx), Math.round(cy + 1), 2, 1); r(col(A.out), Math.round(cx + A.rx), Math.round(cy + 2), 1, 1); }
  const ex = Math.round(cx + A.rx - 2), ey = Math.round(cy - (eel ? 0 : 1) + wv(ex));
  r(col('#ffffff'), ex, ey, 1, 1); r(dim ? '#cdbfb8' : INK, ex + 1, ey, 1, 1);
  g = ctx;
}
const RARITY = { junk: ['雜物', '#a8a0a0'], common: ['普通', '#7fb06a'], uncommon: ['少見', '#4aa3d4'], rare: ['稀有', '#b36be0'], legend: ['傳說', '#e0a12e'] };

/* ---------- 蟲與蝴蝶的像素圖（16x16，fr = 0/1 拍翅或動腳的兩格動畫） ---------- */
const BF_ART = {
  whitebf:  { a: '#ffffff', b: '#eef0f5', o: '#a8a8bc', sp: '#555566' },
  yellowbf: { a: '#ffe14a', b: '#ffcf2a', o: '#c89a10', sp: '#c88a10' },
  swallow:  { a: '#ffe66a', b: '#ffd23a', o: '#4a3a1a', sp: '#4a3a1a', tail: true },
  monarch:  { a: '#ff9a2a', b: '#ff8a1a', o: '#3a2a1a', sp: '#ffffff' },
  bluebf:   { a: '#4aa8ff', b: '#2f86e0', o: '#1d4f9a', sp: '#bfe4ff' },
  moth:     { a: '#cdbca4', b: '#b8a68c', o: '#7a6a58', sp: '#8a7a66', moth: true },
  luna:     { a: '#b8f0c0', b: '#9fe0ab', o: '#5f9a6e', sp: '#ffd27a', tail: true, moth: true }
};
const BUG_FLY = { dragonfly: 1, firefly: 1, forestbee: 1 };
const isFlyer = key => !!BF_ART[key] || !!BUG_FLY[key];
/* 在 (ox, oy) 畫一隻；呼叫前要先把 g 設好。dim = 沒抓過的剪影 */
function bugPix(key, fr, ox, oy, dim) {
  const DIM = '#cdbfb8';
  const P = (c, x, y, w = 1, h = 1) => r(dim ? DIM : c, ox + x, oy + y, w, h);
  const RR = (c, x, y, w, h) => { P(c, x + 1, y, w - 2, h); P(c, x, y + 1, w, h - 2); };
  const OB = (c, o, x, y, w, h) => { RR(o, x, y, w, h); RR(c, x + 1, y + 1, w - 2, h - 2); };
  const A = BF_ART[key], dk = '#4a3030';
  if (A) {
    const wd = fr ? 3 : 5;
    if (A.moth) {
      OB(A.a, A.o, 8 - wd - 1, 4, wd + 1, 6, 1); OB(A.a, A.o, 8, 4, wd + 1, 6);
      if (!fr) { P(A.sp, 4, 6); P(A.sp, 11, 6); }
      P(dk, 7, 4, 2, 7); P(dk, 6, 2); P(dk, 9, 2); P(dk, 5, 1); P(dk, 10, 1);
    } else {
      OB(A.a, A.o, 8 - wd - 1, 2, wd + 1, 5); OB(A.a, A.o, 8, 2, wd + 1, 5);
      OB(A.b, A.o, 8 - wd, 7, wd, 4); OB(A.b, A.o, 8, 7, wd, 4);
      if (!fr) { P(A.sp, 5, 4); P(A.sp, 10, 4); P(A.sp, 6, 8); P(A.sp, 9, 8); }
      P(dk, 7, 3, 2, 8); P(dk, 6, 1); P(dk, 9, 1); P(dk, 5, 0); P(dk, 10, 0);
    }
    if (A.tail) { P(A.o, fr ? 6 : 5, 12); P(A.o, fr ? 9 : 10, 12); P(A.o, fr ? 6 : 5, 13); P(A.o, fr ? 9 : 10, 13); }
    return;
  }
  const L = fr ? 1 : 0;
  if (key === 'ladybug') {
    OB('#e84a4a', '#7a2a2a', 4, 5, 8, 7); P('#2a2a2a', 6, 4, 4, 2); P('#2a2a2a', 8, 6, 1, 6);
    P('#2a2a2a', 5, 7); P('#2a2a2a', 10, 7); P('#2a2a2a', 6, 10); P('#2a2a2a', 10, 10);
    P(dk, 3, 6 + L); P(dk, 3, 9 - L); P(dk, 12, 6 + L); P(dk, 12, 9 - L); P('#ffffff', 6, 4); P('#ffffff', 9, 4);
  } else if (key === 'ant') {
    OB('#6a4a38', '#2a1a12', 1, 8, 4, 4); OB('#6a4a38', '#2a1a12', 5, 8, 3, 3); OB('#6a4a38', '#2a1a12', 9, 7, 5, 5);
    P('#ffffff', 12, 8); P(dk, 13, 5); P(dk, 14, 4); P(dk, 11, 5);
    P(dk, 5 + L, 11, 1, 2); P(dk, 8 - L, 11, 1, 2); P(dk, 2 + L, 12, 1, 2);
  } else if (key === 'grasshopper') {
    OB('#8fd05a', '#4a7a2a', 3, 7, 9, 3); OB('#8fd05a', '#4a7a2a', 11, 5, 4, 4);
    P('#2a2a2a', 13, 6); P('#6aa83a', 4, 7, 6, 1); P(dk, 14, 3, 1, 2); P('#4a7a2a', 3, 10, 1, 2 + L); P('#4a7a2a', 2, 11 + L, 3, 1); P('#4a7a2a', 8, 10, 1, 2); P('#4a7a2a', 11, 10, 1, 2);
  } else if (key === 'cricket') {
    OB('#8a5a38', '#3a2214', 3, 6, 9, 5); OB('#8a5a38', '#3a2214', 11, 5, 4, 4);
    P('#ffffff', 13, 6); P('#3a2214', 14, 6); P('#3a2214', 14, 2, 1, 3); P('#3a2214', 15, 1); P('#3a2214', 12, 2, 1, 3);
    P('#6a4228', 4, 7, 6, 2 - L); P('#3a2214', 3, 11, 1, 2); P('#3a2214', 2, 12 + L, 3, 1); P('#3a2214', 9, 11, 1, 2);
  } else if (key === 'snail') {
    OB('#e8d8b8', '#a89878', 1, 9, 14, 4); OB('#e8a860', '#8a5a2a', 4, 3, 8, 8);
    P('#8a5a2a', 7, 6, 3, 1); P('#8a5a2a', 9, 6, 1, 3); P('#8a5a2a', 7, 8, 3, 1); P('#8a5a2a', 7, 7, 1, 1);
    P(dk, 13, 6 + L, 1, 3); P(dk, 15, 6, 1, 3); P('#2a2a2a', 13, 5 + L); P('#2a2a2a', 15, 5);
  } else if (key === 'dragonfly') {
    P('#3a8fd8', 3, 8, 9, 1); P('#6ab4f0', 3, 9, 9, 1); OB('#ff6b6b', '#a83a3a', 11, 7, 4, 3); P('#ffffff', 13, 7);
    const wy = L ? 6 : 4;
    P('#e0f2ff', 5, wy, 4, 2); P('#e0f2ff', 9, wy, 4, 2); P('#a8d4f4', 5, wy, 4, 1); P('#a8d4f4', 9, wy, 4, 1);
  } else if (key === 'mantis') {
    P('#6ab04a', 3, 8, 8, 2); P('#4a8a34', 3, 10, 8, 1); OB('#8fd05a', '#4a7a2a', 11, 4, 4, 4); P('#2a2a2a', 13, 5);
    P('#6ab04a', 11, 8, 1, 4); P('#6ab04a', 12, 11 - L, 3, 1); P('#4a8a34', 4, 10, 1, 3); P('#4a8a34', 8, 10, 1, 3);
  } else if (key === 'firefly') {
    OB('#4a3a2a', '#1a1208', 3, 6, 7, 5); OB('#4a3a2a', '#1a1208', 9, 6, 3, 4);
    OB('#fff27a', '#e0b020', 2, 7, 3, 3); P('#ff9a4a', 9, 6); P('#cfd8e0', 5, 3 + L, 5, 2); P('#ff8a6a', 10, 7, 2, 1); P('#2a2a2a', 11, 7);
    P(dk, 4, 11, 1, 2); P(dk, 8, 11, 1, 2 - L);
  } else if (key === 'beetle') {
    OB('#6a4228', '#2a160c', 3, 6, 9, 7); P('#8a5a38', 5, 7, 4, 1); P('#2a160c', 4, 9, 7, 1);
    OB('#4a2a18', '#2a160c', 10, 6, 4, 4); P('#2a160c', 12, 3, 1, 3); P('#2a160c', 13, 2, 2, 1); P('#2a160c', 14, 3, 1, 1);
    P('#ffffff', 12, 7); P('#2a160c', 3, 13 - L, 1, 1); P('#2a160c', 6, 13, 1, 1 + L); P('#2a160c', 10, 13 - L, 1, 1);
  } else if (key === 'stag') {
    OB('#3a3a52', '#0c0c16', 3, 6, 8, 6); P('#5a5a78', 5, 7, 3, 1);
    OB('#2a2a3a', '#0c0c16', 10, 6, 4, 4); P('#0c0c16', 14, 4, 1, 3); P('#0c0c16', 13, 3, 1, 2); P('#0c0c16', 14, 9, 1, 3); P('#0c0c16', 13, 11, 1, 1);
    P('#ffffff', 12, 7); P('#0c0c16', 3, 12 - L, 1, 2); P('#0c0c16', 8, 12, 1, 2 - L);
  } else if (key === 'rhino') {
    OB('#6a3a22', '#241008', 2, 6, 9, 7); P('#8a5a38', 4, 7, 5, 1); P('#241008', 3, 9, 7, 1);
    OB('#4a2a18', '#241008', 10, 6, 4, 4); P('#241008', 13, 3, 1, 3); P('#241008', 14, 2, 2, 1); P('#241008', 12, 4, 1, 2);
    P('#ffffff', 12, 7); P('#241008', 3, 13 - L); P('#241008', 6, 13, 1, 1 + L); P('#241008', 9, 13 - L);
  } else if (key === 'cicada') {
    OB('#e4f4f4', '#8ab4b4', 2, L ? 4 : 3, 9, 5); OB('#4a6a4a', '#1a2a1a', 4, 6, 8, 4); P('#6a8a6a', 5, 7, 5, 1);
    OB('#5a7a5a', '#1a2a1a', 11, 5, 4, 5); P('#ff6b4a', 12, 6); P('#ff6b4a', 14, 6); P('#1a2a1a', 5, 10, 1, 2 + L); P('#1a2a1a', 9, 10, 1, 3 - L);
  } else if (key === 'forestbee') {
    const wy = L ? 3 : 5;
    P('#e8f4ff', 4, wy, 3, 3); P('#e8f4ff', 8, wy, 3, 3); P('#a8d0f0', 4, wy, 3, 1); P('#a8d0f0', 8, wy, 3, 1);
    OB('#ffd23a', '#4a3010', 3, 7, 8, 5); P('#2a1a08', 5, 7, 1, 5); P('#2a1a08', 8, 7, 1, 5);
    OB('#3a2a18', '#1a1208', 11, 7, 3, 4); P('#ffffff', 13, 8); P('#2a1a08', 1, 10, 2, 1); P('#2a1a08', 12, 5, 1, 2);
  }
}
function drawBug(c2d, key, dim) {
  g = c2d; g.clearRect(0, 0, 16, 16);
  bugPix(key, 0, 0, 0, dim);
  g = ctx;
}

/* ====== 設定：換成你自己的 Supabase 專案 ====== */
const SUPABASE_URL = 'https://pzvbqerczorxfqxeohys.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AXpCghngjhaldiWbFyNvmw_5tl2xZSX';
const EMAIL_DOMAIN = 'dewfarm.example.com';   // 帳號會轉成 帳號@這個網域（不會寄信）
/* ============================================ */

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const STEP_MS = 120;
