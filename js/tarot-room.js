'use strict';
/* 塔羅小屋（Lekcus） —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 塔羅小屋：廣場的塔羅小攤可以走進去，裡面是 Lekcus ---------- */
const LK = 24, TBL = 25, DEC = 26;
const RMW = 12, RMH = 9;
const rkind = Array.from({ length: RMH }, () => Array(RMW).fill(G));
for (let y = 0; y < RMH; y++) for (let x = 0; x < RMW; x++) if (y < 2 || y === RMH - 1 || x === 0 || x === RMW - 1) rkind[y][x] = BWL;
rkind[RMH - 1][5] = BX; rkind[RMH - 1][6] = BX;
[5, 6, 7].forEach(x => { rkind[4][x] = TBL; });
rkind[3][6] = LK;
[[2, 3], [9, 3], [1, 6], [10, 6]].forEach(([x, y]) => { rkind[y][x] = DEC; });
const LK_HELLO = ['歡迎光臨！我是 Lekcus，今天想問什麼呢？', '來啦～坐近一點，我們來看看今天的牌。', '歡迎來到塔羅小屋，把心裡的問題輕輕放在心上吧。'];
const LK_CHAT = [
  '我平常在直播裡幫大家抽牌，沒想到在雷克斯農場也開了小攤。',
  '塔羅不是預言，是幫你把心裡已經知道的事看清楚。',
  '每天抽一張牌，慢慢你會發現自己的規律。',
  '農場裡的作物要等，牌也是，答案會在對的時間浮現。',
  '想要更多占卜，記得來看我的直播和社群喔！',
  '今天的天氣好，很適合給自己一點安靜的時間。'
];
let lkMsg = '', lkImg = null, lkImgOk = false;
const lkEl = $('lkm'), lkCard = $('lkcard');
/* Lekcus 的像素小人：深青色包頭、黃色髮夾、棕框眼鏡、綠色披肩 */
function lekcusArt(px, py, bob) {
  const o = '#1b0f12', hair = '#0d3b3a', hair2 = '#1f6a66', skin = '#f6b4a4', brown = '#8a3b1b';
  r('rgba(40,20,60,.25)', px + 3, py + 14, 10, 2);
  r('#ffffff', px + 1, py + 11 + bob, 3, 3); r('#ffffff', px + 12, py + 11 + bob, 3, 3);
  ob('#2f8f4f', '#1c5a32', px + 3, py + 9 + bob, 10, 6);
  r('#256f3c', px + 6, py + 10 + bob, 4, 5); r('#4fb36a', px + 4, py + 10 + bob, 2, 1);
  r(skin, px, py + 13 + bob, 2, 2); r(skin, px + 14, py + 13 + bob, 2, 2);
  ob(skin, o, px + 4, py + 3 + bob, 8, 8);
  ob(hair, o, px + 6, py - 2 + bob, 4, 4);
  r('#ffd400', px + 5, py + 1 + bob, 6, 1); r('#ffd400', px + 4, py + bob, 1, 2); r('#ffd400', px + 11, py + bob, 1, 2);
  r(hair, px + 3, py + 2 + bob, 10, 3); r(hair, px + 3, py + 4 + bob, 2, 4); r(hair, px + 11, py + 4 + bob, 2, 4);
  r(hair2, px + 5, py + 3 + bob, 2, 1); r(hair, px + 7, py + 5 + bob, 2, 1);
  r(brown, px + 4, py + 6 + bob, 3, 3); r(brown, px + 9, py + 6 + bob, 3, 3); r(brown, px + 7, py + 6 + bob, 2, 1);
  r('#1b0f12', px + 5, py + 7 + bob, 1, 1); r('#1b0f12', px + 10, py + 7 + bob, 1, 1);
  r('#d94f5a', px + 7, py + 9 + bob, 2, 1);
}
function enterLekcus() {
  if (scene !== 'plaza' || !ready || !me || paused()) return;
  pose = null;
  scene = 'tarot'; K = rkind; W = RMW; H = RMH;
  pl.x = pl.sx = 6; pl.y = pl.sy = RMH - 2; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  view.snap = true; fitView(); toast('歡迎光臨 Lekcus 塔羅小屋');
  lastPosKey = ''; posAcc = 999; trackSelf();
}
function leaveLekcus(silent) {
  if (scene !== 'tarot') return;
  closeLekcus();
  scene = 'plaza'; K = pkind; W = BW; H = BH;
  pl.x = pl.sx = 10; pl.y = pl.sy = 3; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  view.snap = true; fitView(); lastPosKey = ''; posAcc = 999; trackSelf();
  if (!silent) toast('回到廣場了');
}
function lekcusRoomAct(x, y) {
  if (catchShown) { hideCatch(); return; }
  if (y <= 1 && x >= 4 && x <= 7) { openLekcusLinks(); return; }   // 牆上的招牌 → 選擇前往 Lekcus 的 IG 或直播
  const k = K[y][x];
  if (k === BX) leaveLekcus();
  else if (k === LK || k === TBL) openLekcus();
  else if (k === DEC) pop(x, y, '星星小擺設', '#ffe9a8');
}
/* 塔羅小屋裡的 Lekcus：用 img/lekcus_walk.png（3 列：正面/右側/背面；4 格：站、左腳、站、右腳；向左 = 右側翻轉），在櫃檯後來回踱步；找不到圖就用程式畫的像素版 */
let lkWalk = null, lkWalkOk = false;
(function () { lkWalk = new Image(); lkWalk.onload = () => { lkWalkOk = true; }; lkWalk.src = 'img/lekcus_walk.png'; })();
const LK_PATH = [   // [持續毫秒, 起點x, 終點x, 面向]（x 為格子座標，櫃檯後面那一排）
  [3000, 6, 6, 'down'], [1600, 6, 7.6, 'right'], [2500, 7.6, 7.6, 'down'],
  [3200, 7.6, 4.4, 'left'], [2500, 4.4, 4.4, 'down'], [1600, 4.4, 6, 'right']
];
const LK_LOOP = LK_PATH.reduce((a, s) => a + s[0], 0);
function lekcusPose(now) {
  if (lkOpen) return { x: 6, face: 'down', mv: false };   // 對話中站回正中間面向你
  let t = now % LK_LOOP;
  for (const [d, a, b, f] of LK_PATH) {
    if (t < d) return { x: a + (b - a) * (t / d), face: f, mv: a !== b };
    t -= d;
  }
  return { x: 6, face: 'down', mv: false };
}
function lekcusEnts(now, ents) {
  const bob = Math.floor(now / 600) % 2;
  ents.push({ y: 3.5, draw: () => {
    if (!lkWalkOk) { lekcusArt(6 * T, 3 * T, bob); nameTag('Lekcus', 6 * T + 8, 3 * T - 6, '#ffe9a8'); return; }
    const ps = lekcusPose(now), cw = lkWalk.width / 4, chh = lkWalk.height / 3, hh = 24, ww = hh * cw / chh;
    const row = ps.face === 'up' ? 2 : (ps.face === 'down' ? 0 : 1), col = ps.mv ? Math.floor(now / 130) % 4 : 0;
    const cx = ps.x * T + 8, x = cx - ww / 2, y = 3 * T + 15 - hh, sm = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    r('rgba(40,20,60,.25)', cx - 5, 3 * T + 13, 10, 2);
    if (ps.face === 'left') { g.save(); g.translate(x + ww, y); g.scale(-1, 1); g.drawImage(lkWalk, col * cw, row * chh, cw, chh, 0, 0, ww, hh); g.restore(); }
    else g.drawImage(lkWalk, col * cw, row * chh, cw, chh, x, y, ww, hh);
    g.imageSmoothingEnabled = sm;
    nameTag('Lekcus', cx, y - 3, '#ffe9a8');
  } });
}
function drawTarotRoom(now) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1f1430'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
  r('#1f1430', 0, 0, W * T, H * T);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const px = tx * T, py = ty * T;
    if (ty < 2) { r(ty === 0 ? '#34204f' : '#44295f', px, py, T, T); if (ty === 1) { r('#e0b24a', px, py + T - 2, T, 1); r('#2c1b45', px, py + T - 1, T, 1); } }
    else if (tx === 0 || tx === W - 1 || ty === H - 1) { r('#3d2757', px, py, T, T); r('#4d3170', px + 7, py, 1, T); }
    else { r((tx + ty) % 2 ? '#6a4a96' : '#735199', px, py, T, T); if (hash(tx, ty, 21) > 0.8) r('#8d6bbd', px + 4, py + 6, 2, 1); }
  }
  for (let i = 0; i < 12; i++) {
    const tw = (Math.sin(now / 420 + i * 1.7) + 1) / 2;
    r(tw > 0.55 ? '#ffe9a8' : '#a583d6', T + (i * 13) % ((W - 2) * T), 2 + (i * 7) % 20, 1 + (tw > 0.85 ? 1 : 0), 1);
  }
  // 中間的星月布幔
  ob('#7b5ea7', '#e0b24a', 4 * T, 3, 4 * T, 26);
  r('#e0b24a', 4 * T + 6, 16, 4 * T - 12, 1);
  ctx.save(); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2c1b45';
  ctx.font = '800 7px "Chiron GoRound TC", "Noto Sans TC", sans-serif'; ctx.lineWidth = 2;
  ctx.strokeText('Lekcus Tarots', 6 * T, 13); ctx.fillStyle = '#ffe9a8'; ctx.fillText('Lekcus Tarots', 6 * T, 13);
  ctx.font = '800 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif'; ctx.lineWidth = 1.5;
  ctx.strokeText('susumatehyo', 6 * T, 24); ctx.fillStyle = '#ffffff'; ctx.fillText('susumatehyo', 6 * T, 24);
  ctx.restore();
  // 兩側的藥水架
  [T + 4, 8 * T + 8].forEach(sx => {
    ob('#5a3d7a', '#2c1b45', sx, 6, 36, 20); r('#2c1b45', sx + 2, 16, 32, 1);
    ['#ff8fa8', '#8fd3f4', '#8fe09a', '#ffd27a'].forEach((c, i) => { r(c, sx + 4 + i * 8, 10, 4, 6); r('#ffffff', sx + 5 + i * 8, 9, 2, 1); r(c, sx + 4 + i * 8, 19, 4, 5); });
  });
  // 地毯
  ob('#8d6bbd', '#e0b24a', 3 * T + 2, 5 * T + 4, 6 * T - 4, 2 * T - 8);
  r('#6a4a96', 3 * T + 6, 5 * T + 8, 6 * T - 12, 2 * T - 16);
  r('#ffe9a8', 95, 93, 2, 6); r('#ffe9a8', 93, 95, 6, 2);
  // 櫃檯
  ob('#8d6bbd', '#4d3170', 5 * T, 4 * T + 3, 3 * T, 13);
  r('#e0b24a', 5 * T + 1, 4 * T + 4, 3 * T - 2, 1);
  for (let i = 0; i < 6; i++) r('#e0b24a', 5 * T + 3 + i * 8, 4 * T + 13, 2, 2);
  ob('#fff3d0', '#b98a2e', 5 * T + 2, 4 * T, 5, 7); r('#7b5ea7', 5 * T + 3, 4 * T + 2, 3, 3);
  ob('#fff3d0', '#b98a2e', 7 * T + 9, 4 * T, 5, 7); r('#e0b24a', 7 * T + 10, 4 * T + 2, 3, 3);
  const gl = 0.5 + 0.5 * Math.sin(now / 600);
  r('rgba(190,150,255,' + (0.18 + 0.18 * gl).toFixed(2) + ')', 6 * T + 1, 4 * T - 7, 14, 14);
  ob('#bfe3ff', '#7a8fc9', 6 * T + 4, 4 * T - 4, 8, 8); r('#ffffff', 6 * T + 5, 4 * T - 3, 2, 2);
  r('#e0b24a', 6 * T + 3, 4 * T + 4, 10, 2);
  // 燭台與盆栽
  [[2, 3], [9, 3]].forEach(([cx, cy]) => {
    const px = cx * T, py = cy * T, f = Math.floor(now / 140 + cx) % 3;
    r('rgba(255,200,120,.12)', px - 4, py - 6, 24, 24);
    r('rgba(20,10,30,.3)', px + 3, py + 14, 10, 2);
    ob('#e0b24a', '#8a6a1f', px + 5, py + 9, 6, 6); r('#fff3d0', px + 7, py + 4, 2, 6);
    r('#ffb347', px + 7, py + 1 + (f === 1 ? 1 : 0), 2, 3); r('#fff0a0', px + 7, py + 2 + (f === 1 ? 1 : 0), 1, 1);
  });
  FURN.plant(1 * T, 6 * T); FURN.plant(10 * T, 6 * T);
  // 門
  ob('#c08a62', '#8c5b3c', 5 * T + 1, (H - 1) * T - 1, 2 * T - 2, T + 1); r('#8c5b3c', 6 * T, (H - 1) * T, 1, T);
  r('#ffd34d', 6 * T - 3, (H - 1) * T + 7, 2, 2); r('#ffd34d', 6 * T + 2, (H - 1) * T + 7, 2, 2);
}
const LK_LINKS = { live: 'https://www.bigo.tv/user/lekcus', ig: 'https://www.instagram.com/lekcusong/' };
let lkMode = 'chat';
function renderLekcusLinks() {
  lkCard.dataset.m = 'links';
  lkCard.dataset.m = 'links';
  const a = (cls, href, txt) => '<a class="btn ' + cls + ' wide" style="display:block;text-align:center;text-decoration:none" href="' + href + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>';
  lkCard.innerHTML = '<div class="shop-h"><h2>Lekcus</h2><span class="chip">連結</span></div>' +
    '<p class="lkline">想去哪裡找 Lekcus？</p>' +
    a('', LK_LINKS.live, '前往 Lekcus 的直播') +
    a('ghost', LK_LINKS.ig, '前往 Lekcus 的 Instagram') +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
}
function openLekcusLinks() {
  if (!ready || !me || authOpen || paused() || lkOpen) return;
  lkMode = 'links'; lkOpen = true; pressed.length = 0;
  renderLekcusLinks(); lkEl.hidden = false; lkCard.focus();
}
function renderLekcus() {
  lkCard.dataset.m = lkMode;
  if (lkMode === 'links') { renderLekcusLinks(); return; }
  if (lkMode === 'match') { renderMatch(); return; }
  if (lkMode === 'worry') { renderWorry(); return; }
  lkCard.innerHTML = '<div class="shop-h"><h2>Lekcus</h2><span class="chip">塔羅占卜師</span></div>' +
    '<div class="lkrow"><div class="lkport" id="lkport"><canvas width="16" height="16"></canvas></div><p class="lkline">' + esc(lkMsg) + '</p></div>' +
    '<div class="lkbtns"><button type="button" class="btn wide" data-a="draw">請 Lekcus 幫我抽今天的牌</button>' +
    '<button type="button" class="btn ghost wide" data-a="g-match">🃏 翻牌配對</button>' +
    '<button type="button" class="btn ghost wide" data-a="g-worry">🔮 客人的煩惱</button>' +
    '<button type="button" class="btn ghost wide" data-a="chat">聊聊天</button>' +
    '<button type="button" class="btn ghost wide" data-a="close">先告辭</button></div>';
  const box = $('lkport');
  if (lkImgOk && lkImg) { box.innerHTML = ''; box.appendChild(lkImg.cloneNode()); }
  else { const c2 = box.querySelector('canvas').getContext('2d'); g = c2; try { lekcusArt(0, 0, 0); } catch (e) { /* 略過 */ } g = ctx; }
}
function openLekcus() {
  if (!ready || !me || authOpen || paused() || lkOpen) return;
  if (!lkImg) {   // 把你的卡通圖存成 img/lekcus.png，對話視窗就會用它
    lkImg = new Image(); lkImg.alt = 'Lekcus';
    lkImg.onload = () => { lkImgOk = true; if (lkOpen) renderLekcus(); };
    lkImg.src = 'img/lekcus.png';
  }
  lkMode = 'chat'; lkOpen = true; pressed.length = 0; lkMsg = LK_HELLO[Math.floor(Math.random() * LK_HELLO.length)];
  renderLekcus(); lkEl.hidden = false; lkCard.focus();
}
function closeLekcus() { lkOpen = false; lkEl.hidden = true; clearTimeout(mgTimer); mg = null; wy = null; }
