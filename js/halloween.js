'use strict';
/* 萬聖節佈置（廣場，A2「南瓜小徑」）—— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 只在 HW_FROM～HW_TO（月日，含頭尾，台灣／馬來西亞時間 UTC+8，用伺服器時間）出現，過了自動消失。
   測試用：網址加 ?halloween=1 強制顯示、?halloween=0 強制關閉。 */
const HW_FROM = 1020, HW_TO = 1102;
let hwChk = 0, hwVal = false, hwArt = null;
function hwOn() {
  const t = performance.now();
  if (t - hwChk < 1000 && hwChk) return hwVal;
  hwChk = t;
  let v = null;
  try { const q = location.search; if (/[?&]halloween=1/.test(q)) v = true; else if (/[?&]halloween=0/.test(q)) v = false; } catch (e) { /* 略過 */ }
  if (v === null) {
    const d = new Date((typeof srvNow === 'function' ? srvNow() : Date.now()) + 8 * 3600000), md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    v = md >= HW_FROM && md <= HW_TO;
  }
  return (hwVal = v);
}
/* A2 南瓜小徑：左側糖果攤（新地圖 (2,7)～(3,8)）、大路往下一條南瓜小徑（x=6），通到左下角的魔女空地。
   下面的座標都是舊廣場座標（＝新地圖座標 − (5,3)）。 */
const HW_JACKS = [[-1, 11], [-1, 12], [3, 11], [3, 12]];                       // 魔女空地四角的南瓜燈
const HW_PUMPS = [[0, 8, 0], [0, 9, 3], [0, 10, -2], [2, 8, 2], [2, 9, 0], [2, 10, -3],   // 小徑兩旁（夜裡會依序亮起）
  [5, 10, 1], [5, 11, 0], [-4, 14, 0], [-3, 13, 2]];                            // 散落的南瓜
const HW_PATHN = 6;   // 小徑夾在前 6 顆南瓜中間
const HW_CORN = [[0, 5], [2, 5], [4, 13]];
const HW_CAULD = [1, 12];                                                        // 魔女鍋（新地圖 (6,15)）
const HW_SX = -3, HW_SY = 4;                                                     // 糖果攤左上角（舊廣場座標，格）
const HW_PATH = [[6, 11], [6, 12], [6, 13], [6, 14], [5, 15], [6, 15], [7, 15], [5, 16], [6, 16], [7, 16]];   // 小徑與空地（新地圖座標，只是地面花紋，照樣能走）
const HW_PATHSET = new Set(HW_PATH.map(a => a[0] + ',' + a[1]));
const HW_BLK = new Set();
HW_JACKS.forEach(a => HW_BLK.add(a[0] + ',' + a[1])); HW_PUMPS.forEach(a => HW_BLK.add(a[0] + ',' + a[1])); HW_BLK.add(HW_CAULD.join(','));
[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(a => HW_BLK.add((HW_SX + a[0]) + ',' + (HW_SY + a[1])));   // 糖果攤
const hwBlocked = (x, y) => scene === 'plaza' && hwOn() && HW_BLK.has((x - PXO) + ',' + (y - PYO));   // 大件裝飾不能走過去（地上的落葉、糖果玉米可以）
const hwHash = (a, b, c) => { const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return n - Math.floor(n); };
const HW_SPR = {
  pump: { p: { G: '#4a7a2a', O: '#f08a24', D: '#c2571a' }, r: ['....GG....', '..OOOOOO..', '.ODOOOODO.', 'ODOOOOOODO', 'ODOOOOOODO', '.ODOOOODO.', '..OOOOOO..', '...DDDD...'] },
  jack: { p: { G: '#4a7a2a', O: '#f08a24', K: '#3a1a0a' }, r: ['....GG....', '..OOOOOO..', '.OOOOOOOO.', 'OOKKOOKKOO', 'OOKKOOKKOO', 'OOOOKKOOOO', 'OKKKKKKKKO', '.OOOOOOOO.', '..OOOOOO..'] },
  ghost: { p: { W: '#ffffff', K: '#2a1a3a' }, r: ['...WWW...', '..WWWWW..', '.WWWWWWW.', '.WKWWWKW.', '.WWWWWWW.', '.WWWKWWW.', 'WWWWWWWWW', 'WWWWWWWWW', 'WW.WWW.WW', 'WWW.W.WWW'] },
  cauld: { p: { K: '#2a2a3a', L: '#5a5a6a', G: '#7ae04a' }, r: ['..KKKKKKKK..', '.KGGGGGGGGK.', 'KKKKKKKKKKKK', 'KLLKKKKKKKKK', 'KKKKKKKKKKKK', 'KKKKKKKKKKKK', '.KKKKKKKKKK.', '..KKKKKKKK..', '..KK....KK..', '..KK....KK..'] },
  corn: { p: { W: '#ffffff', O: '#f08a24', Y: '#ffd34d' }, r: ['..W..', '.WWW.', '.OOO.', 'OOOOO', 'YYYYY', 'YYYYY'] }
};
function hwSpr(g, d, px, py, al) {
  if (al != null) g.globalAlpha = al;
  d.r.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = d.p[row[i]]; if (c) { g.fillStyle = c; g.fillRect(px + i, py + j, 1, 1); } } });
  g.globalAlpha = 1;
}
function hwAt(g, name, a, b, dy, al, dx) {   // 放在格子 (a,b) 的正中、底部對齊；dy 有給就不畫影子（飄著的東西）
  const d = HW_SPR[name], w = d.r[0].length, h = d.r.length, px = Math.round(a * T + (T - w) / 2 + (dx || 0)), py = Math.round(b * T + T - h - 1 + (dy || 0));
  if (!dy) { g.fillStyle = 'rgba(60,40,20,.2)'; g.fillRect(px, py + h - 1, w, 2); }
  hwSpr(g, d, px, py, al);
}
function hwBuild() {   // 不會動的部分先畫在一張圖上，每一幀只貼一次（整張新廣場大小；佈置本身用舊廣場座標，畫的時候位移）
  const WP = PLW * T, HP = PLH * T;
  const cv = document.createElement('canvas'); cv.width = WP; cv.height = HP;
  const g = cv.getContext('2d'), R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  HW_PATH.forEach(a => {   // 南瓜小徑與魔女空地的地面（和大路同一種沙色）
    const px = a[0] * T, py = a[1] * T;
    R('#f7e5b8', px, py, T, T);
    for (let k = 0; k < 2; k++) { const x1 = px + (hash(a[0], a[1], 5 + k * 2) * 11 | 0) + 1, y1 = py + (hash(a[0], a[1], 6 + k * 2) * 11 | 0) + 1; R('#e6cc95', x1, y1, 2, 1); R('#fff6dc', x1, y1 - 1, 1, 1); }
  });
  for (let i = 0; i < 44; i++) {   // 落葉（整張地圖都有）
    const tx = 1 + (hwHash(i, 1, 5) * (PLW - 2) | 0), ty = 1 + (hwHash(i, 2, 6) * (PLH - 2) | 0);
    if (pkind[ty][tx] === G && !HW_PATHSET.has(tx + ',' + ty) && !HW_BLK.has((tx - PXO) + ',' + (ty - PYO))) R(i % 2 ? '#e0483c' : '#f08a24', tx * T + (hwHash(i, 3, 7) * 13 | 0), ty * T + (hwHash(i, 4, 8) * 13 | 0), 2, 1);
  }
  g.save(); g.translate(PXO * T, PYO * T);
  HW_CORN.forEach(a => hwAt(g, 'corn', a[0], a[1]));
  HW_JACKS.forEach(a => hwAt(g, 'jack', a[0], a[1]));
  HW_PUMPS.forEach(a => hwAt(g, 'pump', a[0], a[1], 0, null, a[2]));
  R('rgba(122,224,74,.25)', HW_CAULD[0] * T - 2, HW_CAULD[1] * T + 14, 20, 4); hwAt(g, 'cauld', HW_CAULD[0], HW_CAULD[1]);
  // 糖果攤（佔 HW_SX,HW_SY 起 2×2 格）
  const sx = HW_SX * T, sy = HW_SY * T;
  R('#8a4a2a', sx, sy + 8, 2, 24); R('#8a4a2a', sx + 30, sy + 8, 2, 24);
  for (let i = 0; i < 8; i++) R(i % 2 ? '#ffffff' : '#e0483c', sx + i * 4, sy + 2, 4, 8);
  R('#e0483c', sx, sy + 10, 32, 2); R('#c07a4a', sx, sy + 20, 32, 12); R('#a8602e', sx, sy + 20, 32, 2);
  [['#ff8ab0', 3], ['#ffd34d', 12], ['#5ab0f0', 21]].forEach(j => { R(j[0], sx + j[1], sy + 12, 6, 8); R('#8a4a2a', sx + j[1], sy + 10, 6, 2); });
  g.fillStyle = '#ff6a8a'; g.beginPath(); g.arc(sx + 16, sy - 6, 5, 0, 6.283); g.fill(); R('#fff', sx + 14, sy - 8, 4, 1); R('#fff', sx + 15, sy - 5, 3, 1); R('#fff', sx + 16, sy - 1, 1, 3);
  g.restore();
  // 彩旗（拉滿整個廣場的寬度）
  g.strokeStyle = '#7a4a2a'; g.lineWidth = 1; g.beginPath();
  for (let px = 0; px <= WP; px += 2) { const y = 5 + 10 * Math.sin(Math.PI * px / WP); if (px) g.lineTo(px, y); else g.moveTo(px, y); }
  g.stroke();
  const cl = ['#f08a24', '#8a5ad0', '#7ae04a', '#e0483c'];
  for (let px = 10, n = 0; px < WP - 8; px += 14, n++) { const y = 5 + 10 * Math.sin(Math.PI * px / WP); g.fillStyle = cl[n % 4]; g.beginPath(); g.moveTo(px, y); g.lineTo(px + 9, y); g.lineTo(px + 4.5, y + 8); g.fill(); }
  return cv;
}
const hwGhost = now => [Math.round(Math.sin(now / 2300) * 14), Math.round(Math.sin(now / 500) * 2) - 4];   // 幽靈的水平飄移、上下浮動（像素）；基準格 (-2,9)
function drawHalloween(now) {
  if (scene !== 'plaza' || !hwOn()) return;
  if (!hwArt) hwArt = hwBuild();
  ctx.drawImage(hwArt, 0, 0);
  ctx.save(); ctx.translate(PXO * T, PYO * T);   // 以下用舊廣場座標
  const gh = hwGhost(now);
  hwAt(ctx, 'ghost', -2, 9, gh[1], 0.95, gh[0]);   // 魔女空地旁飄著的小幽靈
  const cx = HW_CAULD[0] * T + 2, cy = HW_CAULD[1] * T + 4;   // 魔女鍋冒泡
  const boil = (typeof hwBoilUntil === 'number' && performance.now() < hwBoilUntil) || (typeof cooking !== 'undefined' && cooking && cooking.hw && cooking.phase === 'heat');   // 正在煮料理時泡泡變多變快
  for (let i = 0; i < (boil ? 10 : 3); i++) {
    const ph = (now / (boil ? 350 : 700) + i * 0.37) % 1, bx = cx + 4 + (i % 6) * 2.4 + Math.sin(now / 200 + i) * 1.5, by = cy - ph * (boil ? 22 : 16);
    ctx.globalAlpha = 1 - ph; ctx.fillStyle = boil && i % 2 ? '#d8ff9a' : '#9af06a'; ctx.beginPath(); ctx.arc(bx, by, 1.5 + (1 - ph), 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* 夜晚特效（A2）：南瓜小徑依序亮起、南瓜燈燭火搖曳、魔女鍋的魔法陣與冒煙、幽靈拖尾、糖果攤彩燈。
   由 plaza-light.js 在夜色濾鏡之後呼叫；a 是燈光強度 0～1（天越黑越亮）。ctx 是新地圖座標，不位移。 */
function hwNight(now, a) {
  const FX = PXO * T, FY = PYO * T, flick = (i, s) => 0.5 + 0.5 * Math.sin(now / s + i * 5.1) * Math.sin(now / (s * 2.6) + i * 2.3);
  // 1) 小徑兩旁的南瓜：像跑馬燈一樣依序亮起來
  HW_PUMPS.forEach((p, i) => {
    const cx = FX + p[0] * T + 8 + p[2], cy = FY + p[1] * T + 9;
    const on = i < HW_PATHN ? 0.5 + 0.5 * Math.sin(now / 420 - p[1] * 0.95) : flick(i, 260) * 0.6 + 0.2;
    plDisc(ctx, cx, cy, 12, '255,160,50', a * on * 0.9);
    if (on > 0.72) { ctx.globalAlpha = a; r('#ffe066', Math.round(cx) - 1, Math.round(cy) - 1, 2, 1); ctx.globalAlpha = 1; }
  });
  // 2) 南瓜燈：燭火不規則閃動
  HW_JACKS.forEach((p, i) => plDisc(ctx, FX + p[0] * T + 8, FY + p[1] * T + 8, 15, '255,170,60', a * flick(i, 90) * 0.55));
  // 3) 魔女鍋：地上的魔法陣（綠、紫兩圈反向轉）、冒煙、火花
  const cx = FX + HW_CAULD[0] * T + 8, cy = FY + HW_CAULD[1] * T + T - 3;
  const pulse = 0.55 + 0.45 * Math.sin(now / 600);
  for (let i = 0; i < 14; i++) {
    const t = now / 2600 + i / 14 * 6.283, x = Math.round(cx + Math.cos(t) * 21), y = Math.round(cy + Math.sin(t) * 7);
    ctx.globalAlpha = a * (i % 3 ? 0.55 : 1) * pulse; r(i % 3 ? '#7ae04a' : '#d8ff9a', x, y, 1, 1);
  }
  for (let i = 0; i < 8; i++) {
    const t = -now / 1800 + i / 8 * 6.283, x = Math.round(cx + Math.cos(t) * 12), y = Math.round(cy + Math.sin(t) * 4);
    ctx.globalAlpha = a * pulse; r(i % 2 ? '#a070e0' : '#d0b0ff', x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  plDisc(ctx, cx, cy - 4, 20, '122,224,74', a * 0.35 * pulse);
  for (let i = 0; i < 7; i++) {   // 綠煙往上飄、越飄越大越淡
    const ph = (now / 2200 + i / 7) % 1, x = cx + Math.sin(ph * 5 + i * 2) * 4 + ph * 3, y = cy - 12 - ph * 36;
    plDisc(ctx, x, y, 2 + ph * 4, '150,240,110', a * (1 - ph) * 0.55);
  }
  for (let i = 0; i < 6; i++) {   // 火花
    const ph = (now / 900 + i * 0.37) % 1, x = Math.round(cx - 4 + hash(i, 3, 9) * 9 + Math.sin(ph * 9 + i) * 3), y = Math.round(cy - 12 - ph * 26);
    ctx.globalAlpha = a * (1 - ph); r(i % 2 ? '#d8ff9a' : '#c8a0ff', x, y, 1, 1); ctx.globalAlpha = 1;
  }
  // 4) 幽靈：身後拖著淡淡的光尾
  const gh = hwGhost(now), gx = FX + (-2) * T + 8 + gh[0], gy = FY + 9 * T + 6 + gh[1];
  const dir = Math.cos(now / 2300) >= 0 ? -1 : 1;   // 往右飄時尾巴在左邊
  for (let i = 1; i <= 4; i++) plDisc(ctx, gx + dir * i * 4, gy + 2 + i, 5 - i * 0.7, '210,200,255', a * (0.5 - i * 0.1));
  // 5) 糖果攤：屋簷下一串彩燈輪流閃
  const lc = ['#ff6a8a', '#ffd34d', '#7ae04a', '#5ab0f0'];
  for (let i = 0; i < 8; i++) {
    const on = Math.floor(now / 350 + i) % 4 === 0 ? 1 : 0.45, bx = FX + HW_SX * T + 2 + i * 4, by = FY + HW_SY * T + 11;
    ctx.globalAlpha = a * on; r(lc[i % 4], bx, by, 2, 2); ctx.globalAlpha = 1;
    if (on === 1) plDisc(ctx, bx + 1, by + 1, 5, '255,220,150', a * 0.5);
  }
}
