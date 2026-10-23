'use strict';
/* 新增圖塊：村莊大門、噴水池、長椅 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 新增圖塊：村莊大門、噴水池石緣、長椅 ---------- */
function drawGate(px, py, now) {
  r('#9b6a44', px + 1, py + 3, 2, 13); r('#9b6a44', px + 13, py + 3, 2, 13);
  r('#c98f62', px + 1, py + 3, 1, 13); r('#c98f62', px + 13, py + 3, 1, 13);
  ob('#e8b27a', '#9b6a44', px, py + 1, 16, 4);
  ob('#fff6d8', '#d9a066', px + 4, py + 5, 8, 5);
  r('#ff8fa8', px + 7, py + 6, 2, 2); r('#ff8fa8', px + 6, py + 7, 1, 1); r('#ff8fa8', px + 9, py + 7, 1, 1);
  const w = Math.floor(now / 400) % 2;
  r('#ff8fa8', px + 14, py - 1 + w, 2, 2);
}
/* 塔羅小攤（廣場 x9–11、y1–2，共 48×32 像素） */
function drawTarotStall(now) {
  const px = 9 * T, py = 1 * T;
  r('rgba(70,40,90,.18)', px + 1, py + 30, 47, 2);
  // 後牆與桌子
  ob('#5a3d7a', '#3d2757', px + 2, py + 9, 44, 21);
  r('#4a3068', px + 4, py + 11, 40, 15);
  // 星空布幔
  for (let i = 0; i < 8; i++) {
    const tw = (Math.sin(now / 420 + i * 1.7) + 1) / 2;
    r(tw > 0.55 ? '#ffe9a8' : '#c9a6f0', px + 7 + (i * 11) % 36, py + 13 + (i * 5) % 9, 1 + (tw > 0.8 ? 1 : 0), 1);
  }
  // 桌布
  ob('#8d6bbd', '#4d3170', px + 1, py + 22, 46, 9);
  r('#e0b24a', px + 2, py + 23, 44, 1);
  for (let i = 0; i < 11; i++) r('#e0b24a', px + 4 + i * 4, py + 29, 2, 2);
  // 水晶球
  const gl = 0.5 + 0.5 * Math.sin(now / 600);
  r('rgba(190,150,255,' + (0.18 + 0.18 * gl).toFixed(2) + ')', px + 18, py + 11, 12, 12);
  ob('#bfe3ff', '#7a8fc9', px + 20, py + 14, 8, 8);
  r('#ffffff', px + 21, py + 15, 2, 2); r('#e4d4ff', px + 25, py + 19, 2, 1);
  r('#e0b24a', px + 19, py + 22, 10, 2);
  // 桌上的牌
  ob('#fff3d0', '#b98a2e', px + 6, py + 18, 6, 9); r('#7b5ea7', px + 8, py + 21, 2, 3);
  ob('#fff3d0', '#b98a2e', px + 12, py + 19, 6, 9); r('#e0b24a', px + 14, py + 22, 2, 3);
  ob('#7b5ea7', '#3d2757', px + 35, py + 19, 6, 9); r('#e0b24a', px + 37, py + 22, 2, 2);
  // 遮陽篷
  ob('#7b5ea7', '#3d2757', px, py, 48, 9);
  for (let i = 0; i < 6; i++) { r(i % 2 ? '#a583d6' : '#6a4a96', px + 2 + i * 8, py + 1, 4, 7); r(i % 2 ? '#a583d6' : '#6a4a96', px + 2 + i * 8, py + 8, 4, 2); }
  r('#e0b24a', px, py + 8, 48, 1);
  // 招牌星星
  const tw = 0.5 + 0.5 * Math.sin(now / 350);
  r('#ffe9a8', px + 23, py - 2, 2, 5); r('#ffe9a8', px + 21, py, 6, 1);
  r('rgba(255,233,168,' + (0.3 + 0.4 * tw).toFixed(2) + ')', px + 20, py - 3, 8, 8);
}
function drawRim(px, py, tx, ty) {
  r('#e9e2d6', px, py, T, T);
  r('#f7f2ea', px, py, T, 2);
  r('#c9c0b2', px, py + T - 2, T, 2);
  r('#d9d1c3', px + 2 + ((tx + ty) % 3) * 3, py + 5, 3, 2);
  r('#d9d1c3', px + 9, py + 10, 3, 2);
}
function drawBoard(px, py) {
  r('rgba(90,60,40,.18)', px + 1, py + 13, 14, 2);
  r('#9b6a44', px + 3, py + 9, 2, 6); r('#9b6a44', px + 11, py + 9, 2, 6);
  ob('#e8b27a', '#9b6a44', px + 1, py + 1, 14, 10);
  r('#fff6dc', px + 3, py + 3, 4, 4); r('#ffd1dc', px + 8, py + 3, 4, 3); r('#cfe8f7', px + 7, py + 7, 5, 3);
  r('#d4688a', px + 4, py + 3, 1, 1); r('#d4688a', px + 10, py + 3, 1, 1); r('#7aa8c8', px + 9, py + 8, 2, 1);
}
function drawBench(px, py) {
  r('rgba(90,60,40,.18)', px + 1, py + 13, 14, 2);
  ob('#e8b27a', '#9b6a44', px + 1, py + 4, 14, 4);
  ob('#d9a066', '#9b6a44', px + 1, py + 9, 14, 3);
  r('#9b6a44', px + 2, py + 12, 2, 3); r('#9b6a44', px + 12, py + 12, 2, 3);
}
