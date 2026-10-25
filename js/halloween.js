'use strict';
/* 萬聖節佈置（廣場）—— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
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
const HW_JACKS = [[2, 8], [6, 8], [13, 6], [16, 6], [8, 11], [12, 11]];
const HW_PUMPS = [[15, 4, 0], [16, 4, 3], [17, 5, -2], [15, 5, 2], [18, 4, 1], [7, 2, 0], [7, 4, 2], [8, 3, -3], [12, 1, 3], [12, 2, 0]];
const HW_CORN = [[3, 8], [5, 8], [15, 6]];
const HW_CAULD = [4, 8];
const HW_BLK = new Set();
HW_JACKS.forEach(a => HW_BLK.add(a[0] + ',' + a[1])); HW_PUMPS.forEach(a => HW_BLK.add(a[0] + ',' + a[1])); HW_BLK.add(HW_CAULD.join(','));
[[13, 1], [14, 1], [13, 2], [14, 2]].forEach(a => HW_BLK.add(a.join(',')));   // 糖果攤
const hwBlocked = (x, y) => scene === 'plaza' && hwOn() && HW_BLK.has(x + ',' + y);   // 大件裝飾不能走過去（地上的落葉、糖果玉米可以）
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
function hwBuild() {   // 不會動的部分先畫在一張圖上，每一幀只貼一次
  const cv = document.createElement('canvas'); cv.width = BW * T; cv.height = BH * T;
  const g = cv.getContext('2d'), R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  for (let i = 0; i < 26; i++) {   // 落葉
    const tx = 1 + (hwHash(i, 1, 5) * 18 | 0), ty = 1 + (hwHash(i, 2, 6) * 12 | 0);
    if (pkind[ty][tx] === G && !HW_BLK.has(tx + ',' + ty) && !(tx <= 6 && ty <= 6)) R(i % 2 ? '#e0483c' : '#f08a24', tx * T + (hwHash(i, 3, 7) * 13 | 0), ty * T + (hwHash(i, 4, 8) * 13 | 0), 2, 1);
  }
  HW_CORN.forEach(a => hwAt(g, 'corn', a[0], a[1]));
  HW_JACKS.forEach(a => hwAt(g, 'jack', a[0], a[1]));
  HW_PUMPS.forEach(a => hwAt(g, 'pump', a[0], a[1], 0, null, a[2]));
  R('rgba(122,224,74,.25)', HW_CAULD[0] * T - 2, HW_CAULD[1] * T + 14, 20, 4); hwAt(g, 'cauld', HW_CAULD[0], HW_CAULD[1]);
  // 糖果攤（佔 (13,1)～(14,2)）
  R('#8a4a2a', 208, 24, 2, 24); R('#8a4a2a', 238, 24, 2, 24);
  for (let i = 0; i < 8; i++) R(i % 2 ? '#ffffff' : '#e0483c', 208 + i * 4, 18, 4, 8);
  R('#e0483c', 208, 26, 32, 2); R('#c07a4a', 208, 36, 32, 12); R('#a8602e', 208, 36, 32, 2);
  [['#ff8ab0', 211], ['#ffd34d', 220], ['#5ab0f0', 229]].forEach(j => { R(j[0], j[1], 28, 6, 8); R('#8a4a2a', j[1], 26, 6, 2); });
  g.fillStyle = '#ff6a8a'; g.beginPath(); g.arc(224, 10, 5, 0, 6.283); g.fill(); R('#fff', 222, 8, 4, 1); R('#fff', 223, 11, 3, 1); R('#fff', 224, 15, 1, 3);
  // 彩旗
  g.strokeStyle = '#7a4a2a'; g.lineWidth = 1; g.beginPath();
  for (let px = 0; px <= 320; px += 2) { const y = 5 + 10 * Math.sin(Math.PI * px / 320); if (px) g.lineTo(px, y); else g.moveTo(px, y); }
  g.stroke();
  const cl = ['#f08a24', '#8a5ad0', '#7ae04a', '#e0483c'];
  for (let px = 10, n = 0; px < 312; px += 14, n++) { const y = 5 + 10 * Math.sin(Math.PI * px / 320); g.fillStyle = cl[n % 4]; g.beginPath(); g.moveTo(px, y); g.lineTo(px + 9, y); g.lineTo(px + 4.5, y + 8); g.fill(); }
  return cv;
}
function drawHalloween(now) {
  if (scene !== 'plaza' || !hwOn()) return;
  if (!hwArt) hwArt = hwBuild();
  ctx.drawImage(hwArt, 0, 0);
  const gy = Math.round(Math.sin(now / 500) * 2);
  hwAt(ctx, 'ghost', 7, 5, gy - 4, 0.95);   // 噴水池旁飄著的小幽靈
  const cx = HW_CAULD[0] * T + 2, cy = HW_CAULD[1] * T + 4;   // 魔女鍋冒泡
  const boil = (typeof hwBoilUntil === 'number' && performance.now() < hwBoilUntil) || (typeof cooking !== 'undefined' && cooking && cooking.hw && cooking.phase === 'heat');   // 正在煮料理時泡泡變多變快
  for (let i = 0; i < (boil ? 10 : 3); i++) {
    const ph = (now / (boil ? 350 : 700) + i * 0.37) % 1, bx = cx + 4 + (i % 6) * 2.4 + Math.sin(now / 200 + i) * 1.5, by = cy - ph * (boil ? 22 : 16);
    ctx.globalAlpha = 1 - ph; ctx.fillStyle = boil && i % 2 ? '#d8ff9a' : '#9af06a'; ctx.beginPath(); ctx.arc(bx, by, 1.5 + (1 - ph), 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
  }
}
