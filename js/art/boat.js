'use strict';
/* 出海團的畫法：柴犬船長、側視船圖、甲板場景、起霧與極光、16 種海魚 —— 雷克斯農場。
   所有檔案共用同一個全域範圍，載入順序見 index.html（要在 art/icons.js 之後）。全部用程式畫，不需要外部圖檔。 */

/* ---------- 小工具：橢圓像素遮罩 ---------- */
const bEll = (cx, cy, rx, ry) => (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };
function bFill(cx, cy, rx, ry, fill, out, col, belly) {
  const m = bEll(cx, cy, rx, ry);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!m(x, y)) continue;
    const edge = !m(x + 1, y) || !m(x - 1, y) || !m(x, y + 1) || !m(x, y - 1);
    r(col(edge ? out : (belly && y + 0.5 > cy + ry * 0.35 ? belly : fill)), x, y, 1, 1);
  }
}
const bReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- 16 種海魚（16×16、朝右）：一般的魚用 drawFish 內建的橢圓畫法，特殊形狀用 draw 函式 ---------- */
const SEA_HAB = {   // 伺服器的 get_state 沒回傳 habitat 時，用這張表判斷（key → sea / mystery）
  sardine: 'sea', mackerel: 'sea', blackbream: 'sea', flounder: 'sea', fishnet: 'sea', clownfish: 'sea', pufferfish: 'sea', bonito: 'sea', salmon: 'sea', yellowfin: 'sea', swordfish: 'sea',
  glowjelly: 'mystery', anglerfish: 'mystery', auroraeel: 'mystery', ghostwhale: 'mystery', seadragon: 'mystery'
};
const habitatOf = f => (f && (f.habitat || SEA_HAB[f.key])) || 'fresh';
Object.assign(FISH_ART, {
  sardine:    { rx: 4.6, ry: 2.2, body: '#8fb4d0', belly: '#eef6fb', fin: '#6f94b0', out: '#4a6a86', stripe: [[4, 6, '#4a6a86'], [5, 6, '#4a6a86'], [6, 6, '#4a6a86'], [7, 6, '#4a6a86'], [8, 6, '#4a6a86'], [9, 6, '#4a6a86']] },
  mackerel:   { rx: 5.6, ry: 2.8, body: '#4f8fa8', belly: '#dcefe8', fin: '#3a6f86', out: '#26485a', stripe: [[4, 6, '#26485a'], [5, 7, '#26485a'], [6, 6, '#26485a'], [7, 7, '#26485a'], [8, 6, '#26485a'], [9, 7, '#26485a'], [10, 6, '#26485a']] },
  blackbream: { rx: 5.6, ry: 3.9, body: '#5a5a68', belly: '#b8b8c4', fin: '#44444f', out: '#2a2a34', stripe: [[6, 7, '#6f6f80'], [7, 7, '#6f6f80'], [8, 7, '#6f6f80'], [9, 7, '#6f6f80']] },
  flounder:   { rx: 6,   ry: 3.3, body: '#b8a074', belly: '#cdb88c', fin: '#8f7a50', out: '#5a4a2a', spot: [[5, 7, '#7a6540'], [7, 9, '#7a6540'], [9, 7, '#7a6540'], [10, 9, '#7a6540'], [6, 10, '#7a6540']] },
  clownfish:  { rx: 5,   ry: 3.5, body: '#ff8a2a', belly: '#ffb060', fin: '#ff6a10', out: '#a8400a', stripe: [[6, 5, '#ffffff'], [6, 6, '#ffffff'], [6, 7, '#ffffff'], [6, 8, '#ffffff'], [6, 9, '#ffffff'], [6, 10, '#ffffff'], [10, 5, '#ffffff'], [10, 6, '#ffffff'], [10, 7, '#ffffff'], [10, 8, '#ffffff'], [10, 9, '#ffffff']] },
  bonito:     { rx: 6,   ry: 3.2, body: '#3a5a8a', belly: '#c8d8e8', fin: '#2a4268', out: '#1a2a48', stripe: [[5, 6, '#6a8ab8'], [6, 7, '#6a8ab8'], [7, 6, '#6a8ab8'], [8, 7, '#6a8ab8'], [9, 6, '#6a8ab8'], [10, 7, '#6a8ab8']] },
  salmon:     { rx: 6,   ry: 3.3, body: '#d49a8a', belly: '#ffe3d6', fin: '#b86a5a', out: '#7a3a2e', spot: [[5, 6, '#7a3a2e'], [7, 6, '#7a3a2e'], [9, 6, '#7a3a2e'], [6, 7, '#7a3a2e'], [8, 7, '#7a3a2e'], [10, 7, '#7a3a2e']] },
  yellowfin:  { rx: 6.6, ry: 3.5, body: '#3a6aa8', belly: '#e8e8f0', fin: '#f0d020', out: '#1a3a68', stripe: [[4, 8, '#f0d020'], [5, 8, '#f0d020'], [6, 8, '#f0d020'], [7, 8, '#f0d020'], [8, 8, '#f0d020'], [9, 8, '#f0d020'], [10, 8, '#f0d020'], [11, 8, '#f0d020']] },
  auroraeel:  { rx: 7,   ry: 1.7, body: '#5ad0a8', belly: '#c8f0e0', fin: '#8a6ae0', out: '#2a6a58', shape: 'eel', stripe: [[3, 8, '#ff9ad8'], [5, 8, '#b79cff'], [7, 8, '#ff9ad8'], [9, 8, '#b79cff'], [11, 8, '#ff9ad8'], [4, 7, '#b79cff'], [8, 7, '#ff9ad8']] },
  pufferfish: { draw: col => {
    bFill(8, 8.5, 4.8, 4.4, '#e8d890', '#8a7a3a', col, '#fff8d8');
    [[3, 4], [5, 2], [8, 1], [11, 2], [13, 4], [14, 8], [13, 12], [11, 14], [8, 15], [5, 14], [3, 12], [2, 8]].forEach(([x, y]) => r(col('#8a7a3a'), x, y, 1, 1));
    r(col('#ffffff'), 10, 6, 2, 2); r(col(INK), 11, 7, 1, 1);
    r(col('#c0705a'), 11, 10, 2, 1);
    [[5, 6], [7, 5], [6, 9], [8, 10]].forEach(([x, y]) => r(col('#c9b860'), x, y, 1, 1));
    r(col('#c9b860'), 1, 7, 2, 3);
  } },
  swordfish:  { draw: col => {
    bFill(7, 8, 5, 2.8, '#4a6f9a', '#1f3a5a', col, '#dce8f2');
    r(col('#1f3a5a'), 11, 8, 5, 1); r(col('#7a8fa8'), 12, 7, 3, 1);
    r(col('#2f5a8a'), 4, 3, 5, 1); r(col('#2f5a8a'), 5, 4, 4, 1); r(col('#2f5a8a'), 6, 5, 2, 1);
    r(col('#2f5a8a'), 0, 6, 2, 1); r(col('#2f5a8a'), 0, 10, 2, 1); r(col('#2f5a8a'), 1, 7, 2, 3);
    r(col('#ffffff'), 9, 7, 1, 1); r(col(INK), 10, 7, 1, 1);
  } },
  glowjelly:  { draw: col => {
    [[3, 4], [4, 5], [5, 5], [5, 5], [5, 4]].forEach(([hw], i) => {
      const y = 2 + i; r(col(i === 0 ? '#3a8ac8' : '#7fd0ff'), 8 - hw, y, hw * 2, 1);
    });
    r(col('#3a8ac8'), 3, 6, 10, 1); r(col('#d8f4ff'), 6, 3, 3, 1); r(col('#d8f4ff'), 5, 4, 1, 1);
    [[4, '#ff9ad8'], [6, '#a8e4ff'], [9, '#a8e4ff'], [11, '#ff9ad8']].forEach(([x, c], k) => { for (let y = 7; y < 14; y++) r(col(c), x + ((y + k) % 2), y, 1, 1); });
    r(col('#ffffff'), 7, 4, 1, 1); r(col('#ffffff'), 10, 4, 1, 1);
  } },
  anglerfish: { draw: col => {
    bFill(7, 9.5, 5.6, 4, '#5a4a7a', '#2a1f40', col, '#8a7aaa');
    r(col('#2a1f40'), 1, 8, 2, 3);                                      // 尾
    r(col('#2a1f40'), 9, 5, 1, 1); r(col('#2a1f40'), 10, 4, 1, 1); r(col('#2a1f40'), 11, 3, 1, 1); r(col('#2a1f40'), 12, 3, 1, 1);   // 釣竿
    r(col('#fff3a8'), 12, 1, 3, 3); r(col('#ffe27a'), 13, 2, 1, 1);    // 燈籠
    r(col('#1a1030'), 10, 10, 5, 2); [10, 12, 14].forEach(x => r(col('#ffffff'), x, 10, 1, 1)); [11, 13].forEach(x => r(col('#ffffff'), x, 11, 1, 1));
    r(col('#ffffff'), 9, 7, 2, 2); r(col('#ff5f6e'), 10, 8, 1, 1);
  } },
  ghostwhale: { draw: col => {
    bFill(8, 9, 7, 4, '#cfd8f0', '#8a96c8', col, '#f4f7ff');
    r(col('#8a96c8'), 0, 5, 2, 1); r(col('#cfd8f0'), 0, 6, 2, 1); r(col('#cfd8f0'), 1, 7, 2, 1); r(col('#8a96c8'), 0, 11, 2, 1); r(col('#cfd8f0'), 0, 10, 2, 1);   // 尾鰭
    r(col('#e8f0ff'), 8, 3, 1, 2); r(col('#e8f0ff'), 7, 2, 1, 1); r(col('#e8f0ff'), 9, 2, 1, 1); r(col('#e8f0ff'), 7, 1, 3, 1);   // 噴水
    r(col('#8fe8ff'), 12, 8, 2, 2); r(col('#ffffff'), 12, 8, 1, 1);
    [[5, 9], [7, 11], [9, 9]].forEach(([x, y]) => r(col('#b0bce0'), x, y, 2, 1));
  } },
  seadragon:  { draw: col => {
    [[12, 4], [11, 5], [10, 6], [9, 7], [8, 8], [8, 9], [9, 10], [10, 11], [10, 12], [9, 13], [8, 13]].forEach(([x, y], i) => {
      r(col('#1f8a80'), x - 1, y - 1, 3, 3); r(col(i % 2 ? '#3ac8b8' : '#6fe0d0'), x, y, 2, 2);
    });
    [[13, 4], [14, 4], [14, 5]].forEach(([x, y]) => r(col('#3ac8b8'), x, y, 1, 1));
    r(col('#ffffff'), 12, 3, 1, 1); r(col(INK), 12, 3, 1, 1);
    [[10, 4], [9, 5], [8, 6], [7, 7], [6, 8], [6, 10]].forEach(([x, y]) => r(col('#ff9ad8'), x, y, 1, 1));
    r(col('#ffd27a'), 11, 3, 1, 1); r(col('#ffd27a'), 12, 2, 1, 1);
    [[10, 9], [11, 10], [8, 12]].forEach(([x, y]) => r(col('#b79cff'), x, y, 1, 1));
  } },
  fishnet:    { draw: col => {
    ob(col('#b9a67a'), col('#6a5a3a'), 2, 4, 12, 9);
    for (let x = 4; x < 13; x += 3) r(col('#6a5a3a'), x, 5, 1, 7);
    for (let y = 6; y < 12; y += 3) r(col('#6a5a3a'), 3, y, 10, 1);
    r(col('#ff8a3a'), 3, 2, 2, 2); r(col('#ff8a3a'), 10, 2, 2, 2); r(col('#6a5a3a'), 4, 3, 7, 1);
  } }
});
/* 大型魚（鯨、旗魚、鰻）用比例變化來區分，不按實際體型畫：圖鑑與釣到時的圖都是 16×16 */

/* ---------- 柴犬船長（廣場上的 NPC，16×16，每 0.45 秒搖一次尾巴，呼吸動畫）---------- */
function captainArt(px, py, now, face) {
  const bob = Math.floor(now / 600) % 2, wag = Math.floor(now / 450) % 2, o = '#a8641e';
  r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 2);
  ob('#f0a04a', o, px + 12, py + 9 + wag, 3, 3); r('#fff0d0', px + 13, py + 9 + wag, 1, 1);          // 尾巴
  ob('#3b5b98', '#243a66', px + 4, py + 9 + bob, 8, 6);                                               // 藏青外套
  r('#ffd34d', px + 7, py + 10 + bob, 1, 1); r('#ffd34d', px + 7, py + 12 + bob, 1, 1);               // 金釦子
  r('#243a66', px + 3, py + 11 + bob, 1, 3); r('#243a66', px + 12, py + 11 + bob, 1, 3);
  r('#f0a04a', px + 3, py + 14, 2, 1); r('#f0a04a', px + 11, py + 14, 2, 1);                          // 腳
  r('#f0a04a', px + 3, py + 2 + bob, 2, 2); r('#f0a04a', px + 11, py + 2 + bob, 2, 2);                // 耳朵
  ob('#f0a04a', o, px + 3, py + 3 + bob, 10, 7);                                                      // 橘色臉
  r('#fff0d0', px + 4, py + 7 + bob, 8, 3); r('#fff0d0', px + 6, py + 6 + bob, 4, 1);                 // 奶油色嘴鼻
  r('#3a2a2a', px + 7, py + 7 + bob, 2, 1);
  r('#3a2a2a', px + 5, py + 5 + bob, 1, 2); r('#3a2a2a', px + 10, py + 5 + bob, 1, 2);
  r('#ff9a8a', px + 4, py + 7 + bob, 1, 1); r('#ff9a8a', px + 11, py + 7 + bob, 1, 1);
  ob('#ffffff', '#9fb3c8', px + 3, py - 1 + bob, 10, 4);                                              // 白色船長帽
  r('#2e4a78', px + 3, py + 2 + bob, 10, 1); r('#ffd34d', px + 7, py + bob, 2, 2);
}
function drawCaptain(px, py, now) { captainArt(px, py, now); }
/* 對話視窗與面板上的柴犬船長頭像（16×16 的小圖） */
function captainPortrait(c2d, now) { g = c2d; c2d.clearRect(0, 0, 16, 16); captainArt(0, 1, now || 0); g = ctx; }

/* ---------- 側視船圖（128×80）：柴犬船長漁船，藍船身、白船艙、橘浮球、煙囪（沒有吊臂和漁網）---------- */
function boatSide(c2d, now, o) {
  o = o || {}; g = c2d; c2d.clearRect(0, 0, 128, 80);
  const t = now || 0, bob = o.still ? 0 : Math.round(Math.sin(t / 700) * 1.5), mystery = !!o.mystery;
  c2d.save(); c2d.translate(0, bob);
  const hull = mystery ? '#4a6fb8' : '#3f7fc4', hull2 = mystery ? '#33508a' : '#2c5c96';
  // 煙囪與煙
  ob('#7a8590', '#4a5560', 58, 6, 10, 16); r('#e8453c', 58, 10, 10, 3);
  if (!o.still) for (let i = 0; i < 3; i++) { const ph = ((t / 1400) + i / 3) % 1; c2d.globalAlpha = 0.85 * (1 - ph); rr('#ffffff', 60 + Math.round(Math.sin(ph * 6 + i) * 3) + ph * 8, 4 - Math.round(ph * 18), 6, 5); }
  c2d.globalAlpha = 1;
  // 船艙
  ob('#e8453c', '#a82c26', 38, 20, 50, 8);
  ob('#ffffff', '#9fb3c8', 42, 28, 42, 20);
  ob('#8fd3ff', '#5a8fc0', 48, 32, 10, 9); ob('#8fd3ff', '#5a8fc0', 70, 32, 10, 9);
  // 窗邊的柴犬船長
  g = c2d; r('#f0a04a', 50, 36, 6, 5); r('#fff0d0', 51, 39, 4, 2); r('#3a2a2a', 52, 39, 2, 1); r('#3a2a2a', 51, 37, 1, 1); r('#3a2a2a', 54, 37, 1, 1);
  r('#ffffff', 49, 34, 8, 2); r('#2e4a78', 49, 35, 8, 1); r('#f0a04a', 49, 36, 1, 2); r('#f0a04a', 56, 36, 1, 2);
  ob('#c08a62', '#8c5b3c', 62, 36, 6, 12); r('#ffd34d', 66, 42, 1, 1);
  // 旗子
  r('#5e3a24', 86, 6, 1, 16); r('#ffd34d', 87, 6, 9, 5); r('#ff8a3a', 87, 9, 9, 2);
  // 船身
  for (let i = 0; i < 18; i++) {
    const inset = Math.floor(i * 0.85), y = 46 + i;
    r(i < 3 ? '#ffffff' : (i > 13 ? hull2 : hull), 10 + inset, y, 108 - inset * 2 + Math.min(10, Math.round(i * 0.3)), 1);
  }
  r(hull2, 14, 49, 104, 1); r('#e8453c', 16, 52, 100, 2);
  for (let i = 0; i < 17; i++) r('#243a66', 10 + Math.floor(i * 0.85), 46 + i, 1, 1);
  [[22, 53], [62, 53], [96, 53]].forEach(([bx, by]) => { ob('#ff8a3a', '#c4561a', bx, by, 9, 9); r('#ffffff', bx + 3, by + 1, 3, 7); r('#ffffff', bx + 1, by + 3, 7, 3); });
  ob('#ffffff', '#9fb3c8', 100, 52, 4, 4);
  c2d.restore();
  // 海
  const wv = o.still ? 0 : t / 400;
  r(mystery ? '#2f5f96' : '#4aa0e0', 0, 62, 128, 18); r(mystery ? '#25507f' : '#3a8ac8', 0, 70, 128, 10);
  for (let i = 0; i < 10; i++) { const wx = (i * 14 + wv * 6) % 128; r('#bfe6ff', Math.round(wx), 62 + (i % 3) * 5, 8, 1); r('#9ad3f6', Math.round((wx + 5) % 128), 66 + (i % 2) * 6, 5, 1); }
  if (mystery) { c2d.globalAlpha = 0.4; for (let i = 0; i < 3; i++) rr('#cfe0ff', ((i * 50 + t / 60) % 160) - 20, 14 + i * 18, 70, 6); c2d.globalAlpha = 1; }
  g = ctx;
}

/* ---------- 廣場碼頭：柴犬船長旁邊的水池上停著他的船（畫在廣場地圖座標上）---------- */
function drawPlazaBoat(now) {
  if (scene !== 'plaza') return;
  const bp = bldProg();
  if (bp) { drawBoatBuild(now, bp); drawSeaEdge(now); return; }   // 還在建造：施工中的碼頭與船
  const x0 = (PXO + 14) * T, y0 = (PYO + 10) * T - 4, bob = Math.round(Math.sin(now / 800));
  r('rgba(20,60,100,.25)', x0 + 3, y0 + 31, 60, 3);
  ob('#e8453c', '#a82c26', x0 + 12, y0 + 4 + bob, 26, 6);
  ob('#ffffff', '#9fb3c8', x0 + 14, y0 + 10 + bob, 22, 9); ob('#8fd3ff', '#5a8fc0', x0 + 17, y0 + 12 + bob, 5, 5); ob('#8fd3ff', '#5a8fc0', x0 + 28, y0 + 12 + bob, 5, 5);
  ob('#7a8590', '#4a5560', x0 + 22, y0 - 2 + bob, 5, 7); r('#e8453c', x0 + 22, y0 + bob, 5, 2);
  ob('#3f7fc4', '#243a66', x0 + 2, y0 + 19 + bob, 54, 9); r('#ffffff', x0 + 3, y0 + 19 + bob, 52, 1); r('#e8453c', x0 + 4, y0 + 22 + bob, 50, 1);
  [[8, 21], [28, 21], [46, 21]].forEach(([bx, by]) => ob('#ff8a3a', '#c4561a', x0 + bx, y0 + by + bob, 4, 4));
  r('#5e3a24', x0 + 34, y0 - 5 + bob, 1, 9); r('#ffd34d', x0 + 35, y0 - 5 + bob, 5, 3);
  r('#e8d4a8', x0 - 2, y0 + 24 + bob, 4, 2);   // 繫船繩
  r('#7a5128', 311, 229 + bob, 2, 12); r('#7a5128', 318, 229 + bob, 2, 12);   // 從棧橋爬上船身的梯子
  for (let y = 231; y <= 239; y += 3) r('#a87a44', 311, y + bob, 9, 1);
  drawSeaEdge(now);
}

/* ---------- 甲板場景（3/4 俯視，16×12 格，和廣場、小村同一個格子大小）---------- */
function drawBoatScene(now) {
  const w = world(), dark = darkness(w.min), cur = (typeof voy !== 'undefined' && voy.cur) || null;
  const docked = !!cur && cur.status === 'lobby', fog = typeof voyFogLevel === 'function' ? voyFogLevel(now) : 0;
  // 地圖外（畫面比地圖大的時候）：延伸天空與海面，不要露出上一個場景的殘影
  r(dark > 0.5 ? '#26306a' : '#9fd8ff', -480, -480, W * T + 960, 480 + T); r('#3f8fd0', -480, 2 * T, W * T + 960, (H - 2) * T + 480);
  // 天空（上面兩排）
  const sk = ['#bfe6ff', '#9fd8ff'], skn = ['#1b2150', '#26306a'];
  for (let ty = 0; ty < 2; ty++) { r(dark > 0.5 ? skn[ty] : sk[ty], 0, ty * T, W * T, T); if (dark > 0.2 && dark <= 0.5) { ctx.globalAlpha = dark * 1.5; r(skn[ty], 0, ty * T, W * T, T); ctx.globalAlpha = 1; } }
  if (dark > 0.4) for (let i = 0; i < 14; i++) { const tw = (Math.sin(now / 500 + i * 1.9) + 1) / 2; r(tw > 0.5 ? '#ffffff' : '#a8b4e8', (i * 37) % (W * T), 2 + (i * 11) % 26, 1, 1); }
  else for (let i = 0; i < 3; i++) { const cx = ((i * 90 + now / 160) % (W * T + 40)) - 30; rr('#ffffff', Math.round(cx), 4 + i * 8, 28, 6); rr('#ffffff', Math.round(cx) + 8, 1 + i * 8, 16, 6); }
  // 海
  const base = fog > 0 ? '#3a7ec0' : '#3f8fd0';
  r(base, 0, 2 * T, W * T, (H - 2) * T);
  const flow = docked ? 0.0018 : 0.0075, off = bReduce ? 0 : now * flow;
  for (let ty = 2; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (K[ty][tx] !== WA) continue;
    const px = tx * T, py = ty * T;
    if ((tx + ty) % 2) r('rgba(255,255,255,.05)', px, py, T, T);
    for (let k = 0; k < 2; k++) {
      const hx = (hash(tx, ty, 11 + k) * 20 + off * 16 * (k ? 0.7 : 1)) % 20 - 2, hy = 2 + hash(tx, ty, 13 + k) * 11 | 0;
      if (hx >= -2 && hx < 14) r(k ? '#7fc4ee' : '#9ad3f6', px + Math.max(0, Math.round(hx)), py + hy, 3, 1);
    }
  }
  // 船尾的白色航跡（出海中）
  if (!docked) for (let i = 0; i < 6; i++) { const ph = ((now / 700) + i / 6) % 1; ctx.globalAlpha = 0.7 * (1 - ph); r('#ffffff', Math.round((2 - ph * 2.2) * T), (4 + i % 6) * T + 3 + (i * 7) % 9, 5, 1); }
  ctx.globalAlpha = 1;
  // 碼頭（集合中）
  if (docked) {
    for (let ty = 6; ty <= 7; ty++) for (let tx = 0; tx <= 1; tx++) { r((tx + ty) % 2 ? '#c9a06a' : '#b8895a', tx * T, ty * T, T, T); r('#8c5b3c', tx * T, ty * T + T - 1, T, 1); }
    [[0, 5], [0, 8]].forEach(([tx, ty]) => { ob('#8c5b3c', '#5e3a24', tx * T + 4, ty * T + 4, 8, 10); });
    r('#e8d4a8', 2 * T - 2, 6 * T + 6, 4, 2); r('#e8d4a8', 2 * T - 2, 7 * T + 6, 4, 2);
  }
  // 船身陰影與船舷
  ctx.save();
  r('rgba(20,50,90,.28)', 2 * T + 2, 10 * T + 3, 12 * T, 5);
  ob('#8c5b3c', '#5e3a24', 2 * T - 1, 3 * T - 1, 12 * T + 2, 8 * T + 2);                 // 船舷外框
  for (let ty = 3; ty <= 10; ty++) for (let tx = 2; tx <= 13; tx++) {
    const px = tx * T, py = ty * T, k = K[ty][tx];
    if (k === BRL) continue;
    r((tx + ty) % 2 ? '#c9a06a' : '#d1aa74', px, py, T, T);                                // 甲板木板
    r('#a8804a', px, py + 5, T, 1); r('#a8804a', px, py + 11, T, 1);
    if (hash(tx, ty, 17) < 0.5) r('#a8804a', px + 4 + (hash(tx, ty, 19) * 8 | 0), py + (hash(tx, ty, 21) < 0.5 ? 0 : 6), 1, 5);
  }
  // 欄杆
  for (let ty = 3; ty <= 10; ty++) for (let tx = 2; tx <= 13; tx++) {
    if (K[ty][tx] !== BRL) continue;
    const px = tx * T, py = ty * T;
    r('#7a5030', px, py, T, T); r('#a8764a', px + 1, py + 1, T - 2, T - 2);
    r('#e8d4a8', px, py + (ty === 3 ? T - 5 : 3), T, 2);
    if (tx % 2 === 0 || ty % 2 === 0) { r('#5e3a24', px + 6, py + 2, 4, 12); r('#e8d4a8', px + 6, py + 2, 4, 2); }
  }
  // 船頭（右邊的尖角）：三層由寬到窄疊起來
  ob('#a8764a', '#5e3a24', 13 * T + 8, 5 * T + 2, 10, 4 * T - 4);
  ob('#a8764a', '#5e3a24', 14 * T, 5 * T + 8, 12, 4 * T - 16);
  ob('#a8764a', '#5e3a24', 14 * T + 8, 6 * T + 2, 10, 2 * T - 4);
  r('#e8d4a8', 14 * T + 2, 6 * T + 4, 6, 2 * T - 8);
  // 船艙（左上）：屋頂、牆、窗、門、煙囪
  { const cx = 4 * T, cy = 4 * T, cw = 5 * T, ch = 2 * T;
    ob('#e8453c', '#a82c26', cx - 2, cy - 4, cw + 4, 15);
    for (let x = 0; x < cw; x += 8) r('#ff7a6a', cx + x + 1, cy - 2, 3, 1);
    ob('#ffffff', '#9fb3c8', cx, cy + 10, cw, ch - 10);
    [8, 56].forEach(wx => { ob('#8fd3ff', '#5a8fc0', cx + wx, cy + 14, 14, 10); r('#ffffff', cx + wx + 2, cy + 15, 3, 1); });
    ob('#c08a62', '#8c5b3c', cx + 32, cy + 12, 14, 20); r('#ffd34d', cx + 42, cy + 22, 2, 2);
    ob('#7a8590', '#4a5560', cx + 54, cy - 12, 9, 12); r('#e8453c', cx + 54, cy - 8, 9, 3);
    if (!bReduce) for (let i = 0; i < 3; i++) { const ph = ((now / 1500) + i / 3) % 1; ctx.globalAlpha = 0.8 * (1 - ph); rr('#ffffff', cx + 55 + Math.round(Math.sin(ph * 6 + i) * 3), cy - 14 - Math.round(ph * 14), 6, 4); }
    ctx.globalAlpha = 1;
    r('#5e3a24', cx + 16, cy - 16, 1, 12); r('#ffd34d', cx + 17, cy - 16, 8, 4); r('#ff8a3a', cx + 17, cy - 13, 8, 1);   // 旗子
  }
  // 橘色浮球、木桶、釣竿架
  [[3, 4], [12, 4], [3, 9], [12, 9]].forEach(([tx, ty]) => { const px = tx * T, py = ty * T; r('rgba(60,40,20,.2)', px + 3, py + 12, 10, 2); ob('#ff8a3a', '#c4561a', px + 3, py + 4, 10, 10); r('#ffffff', px + 7, py + 5, 2, 8); r('#ffffff', px + 4, py + 8, 8, 2); });
  [[11, 5]].forEach(([tx, ty]) => { const px = tx * T, py = ty * T; ob('#9b6a44', '#5e3a24', px + 2, py + 3, 12, 12); r('#5e3a24', px + 2, py + 7, 12, 1); r('#5e3a24', px + 2, py + 11, 12, 1); });
  ctx.restore();
  void dark;
}

/* ---------- 起霧與極光（只在 boat 場景且 mystery = true；有「減少動畫」偏好時畫靜止畫面）---------- */
function drawBoatFx(now, level) {
  if (level <= 0) return;
  const WP = W * T, HP = H * T, t = bReduce ? 0 : now;
  // 極光：天空區域三條正弦形的綠、紫、粉色帶狀，lighter 混合模式，一個循環約 10 秒
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cols = [[90, 255, 170], [170, 120, 255], [255, 140, 220]];
  cols.forEach((c, k) => {
    for (let x = 0; x < WP; x += 2) {
      const ph = (t / 10000) * Math.PI * 2, y0 = 8 + k * 7 + Math.sin(x / 38 + ph + k * 1.7) * 6 + Math.sin(x / 17 - ph * 2 + k) * 2;
      const a = (0.16 + 0.10 * Math.sin(x / 55 + ph * 2 + k * 2)) * level;
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
      ctx.fillRect(x, Math.round(y0), 2, 14 - k * 2);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a * 0.5).toFixed(3) + ')';
      ctx.fillRect(x, Math.round(y0) + 14 - k * 2, 2, 8);
    }
  });
  ctx.restore();
  // 整體偏藍的暗調
  r('rgba(30,50,90,' + (0.30 * level).toFixed(3) + ')', -480, -480, WP + 960, HP + 960);
  // 三層半透明、橫向漂移的白藍色帶狀霧（alpha 0.25）
  for (let L = 0; L < 3; L++) {
    const sp = (L + 1) * 0.012, y0 = 2 * T + L * 3.2 * T;
    for (let i = 0; i < 5; i++) {
      const wd = 70 + (i * 23 + L * 31) % 40, x = (((i * 61 + L * 47) + t * sp * (L % 2 ? -1 : 1)) % (WP + 120) + WP + 120) % (WP + 120) - 80;
      ctx.globalAlpha = 0.14 * level;
      rr(L === 1 ? '#cfe0ff' : '#e8f2ff', Math.round(x), Math.round(y0 + Math.sin(t / 2400 + i + L) * 3) + i * 7 % 18, wd, 9 + L * 2);
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- 廣場的棧橋與通往大海的水道 ---------- */
function drawPier(px, py, tx, ty, now) {
  if (tx >= PIER_WX) drawWater(px, py, tx, ty, now); else drawGrass(px, py, tx, ty);
  const bp = bldProg();
  if (bp && bp.s === 1 && tx - PIER_X0 >= Math.floor(bp.p * (PIER_X1 - PIER_X0 + 1))) {   // 階段 1：橋板從岸邊一段一段鋪上去，還沒鋪的地方只有木樁
    if ((tx - PIER_X0) % 2 === 0) { ob('#7a5128', '#3e2713', px + 6, py - 1, 3, 14); r('#d9c08a', px + 7, py - 1, 1, 2); }
    return;
  }
  r('rgba(20,60,100,.28)', px, py + 15, T, 3);
  r('#c99a5e', px, py + 1, T, 13); r('#e0b97c', px, py + 1, T, 1); r('#7a5128', px, py + 13, T, 2);
  for (let i = 0; i < T; i += 4) r('#9a6c3a', px + i, py + 1, 1, 13);
  if ((tx - PIER_X0) % 2 === 0) { ob('#7a5128', '#3e2713', px + 1, py - 3, 3, 14); r('#d9c08a', px + 2, py - 3, 1, 2); }
  r('#e8d4a8', px, py - 1, T, 1);
}
/* 水道盡頭的大海：越靠右水色越深，加幾道緩緩飄過的浪花（有「減少動畫」偏好時不動） */
function drawSeaEdge(now) {
  if (scene !== 'plaza') return;
  for (let i = 0; i < 10; i++) { ctx.globalAlpha = 0.07 + i * 0.045; r('#1f5f9f', 400 + i * 8, 12 * T, 8, 5 * T); }
  ctx.globalAlpha = 1;
  const t = bReduce ? 0 : now;
  for (let k = 0; k < 7; k++) {
    const wx = 412 + ((k * 23 + t / 90) % 62), wy = 12 * T + 6 + (k * 13) % 60;
    r('rgba(255,255,255,.55)', Math.round(wx), wy, 5, 1); r('rgba(255,255,255,.35)', Math.round(wx) + 1, wy + 1, 3, 1);
  }
}

/* ---------- 出海碼頭的建造（全服捐材料）：bld 是 voyage_build_info；沒讀到或已完工就回傳 null（畫成完工的樣子） ---------- */
function bldProg() {
  if (!bld || bld.done || !bld.need) return null;
  const ks = ['wood', 'stone', 'copper'].filter(k => bld.need[k] > 0);
  const p = ks.length ? ks.reduce((t, k) => t + Math.min(1, (bld.have[k] | 0) / bld.need[k]), 0) / ks.length : 1;
  return { s: bld.stage | 0, p: Math.max(0, Math.min(1, p)), q: ((bld.stage | 0) - 1 + p) / 4 };
}
/* 施工中的船：階段 2 骨架（龍骨、肋骨、船板）、階段 3 船身上色與船艙、階段 4 煙囪、浮球與旗；鷹架一直在，完工才拆 */
function drawBoatBuild(now, bp) {
  const x0 = (PXO + 14) * T, y0 = (PYO + 10) * T - 4, s = bp.s, p = bp.p, W0 = '#c99a5e', W1 = '#7a5128';
  if (s < 2) return;
  r('rgba(20,60,100,.25)', x0 + 3, y0 + 31, 60, 3);
  if (s === 2) {
    r(W1, x0 + 2, y0 + 25, 54, 3); r(W0, x0 + 2, y0 + 25, 54, 1);                               // 龍骨
    const ribs = Math.floor(7 * Math.min(1, p * 1.6));
    for (let i = 0; i < ribs; i++) { r(W0, x0 + 6 + i * 8, y0 + 11, 2, 15); r(W1, x0 + 6 + i * 8, y0 + 11, 2, 1); }
    r(W0, x0 + 4, y0 + 13, 50, 1);
    if (p > 0.5) { const wd = Math.round(54 * (p - 0.5) / 0.5); for (let k = 0; k < 4; k++) r(k % 2 ? '#b98a52' : W0, x0 + 2, y0 + 19 + k * 2, wd, 2); r(W1, x0 + 2, y0 + 27, wd, 1); }
  } else {
    ob('#3f7fc4', '#243a66', x0 + 2, y0 + 19, 54, 9); r('#ffffff', x0 + 3, y0 + 19, 52, 1); r('#e8453c', x0 + 4, y0 + 22, 50, 1);   // 船身
    if (s === 3) {
      ob(W0, W1, x0 + 14, y0 + 10, 22, 9);                                                        // 船艙（還是原木色）
      if (p > 0.4) { ob('#ffffff', '#9fb3c8', x0 + 14, y0 + 10, 22, 9); }
      if (p > 0.7) { ob('#8fd3ff', '#5a8fc0', x0 + 17, y0 + 12, 5, 5); ob('#8fd3ff', '#5a8fc0', x0 + 28, y0 + 12, 5, 5); }
    } else {
      ob('#e8453c', '#a82c26', x0 + 12, y0 + 4, 26, 6); ob('#ffffff', '#9fb3c8', x0 + 14, y0 + 10, 22, 9);
      ob('#8fd3ff', '#5a8fc0', x0 + 17, y0 + 12, 5, 5); ob('#8fd3ff', '#5a8fc0', x0 + 28, y0 + 12, 5, 5);
      if (p > 0.25) { ob('#7a8590', '#4a5560', x0 + 22, y0 - 2, 5, 7); r('#e8453c', x0 + 22, y0, 5, 2); }
      [[8, 21], [28, 21], [46, 21]].forEach(([bx, by], i) => { if (p > 0.3 + i * 0.2) ob('#ff8a3a', '#c4561a', x0 + bx, y0 + by, 4, 4); });
      if (p > 0.9) { r('#5e3a24', x0 + 34, y0 - 5, 1, 9); r('#ffd34d', x0 + 35, y0 - 5, 5, 3); }
    }
  }
  [0, 1, 2].forEach(i => { r(W1, x0 - 4 + i * 30, y0 - 4, 2, 30); r('#e0b97c', x0 - 6 + i * 30, y0 + 6, 6, 1); r('#e0b97c', x0 - 6 + i * 30, y0 + 16, 6, 1); });   // 鷹架
  r(W1, x0 - 4, y0 - 4, 62, 2);
}
/* 岸邊的建造告示牌（BB）：上面的綠色進度條是整體進度；完工後變成金色星星 */
function drawBuildBoard(px, py, now) {
  drawGrass(px, py, Math.round(px / T), Math.round(py / T));
  const bp = bldProg(), done = !!bld && !!bld.done, q = done ? 1 : bp ? bp.q : 1;
  r('rgba(60,40,20,.25)', px + 1, py + 14, 14, 2);
  r('#7a5128', px + 3, py + 8, 2, 7); r('#7a5128', px + 11, py + 8, 2, 7);
  ob('#e8c48a', '#7a5128', px, py + 1, 16, 9); r('#ffffff', px + 2, py + 3, 12, 2); r('#d9c08a', px + 2, py + 6, 12, 3);
  r(done ? '#ffd34d' : '#6fcf7a', px + 2, py + 6, Math.round(12 * q), 3);
  if (!done && bp && Math.floor(now / 600) % 2) r('#ffd34d', px + 13, py - 1, 2, 2);   // 閃一下：有事可做
  ob('#c99a5e', '#7a5128', px + 1, py + 10, 5, 5);                                          // 旁邊的小木箱
}
