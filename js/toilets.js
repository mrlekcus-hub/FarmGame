'use strict';
/* 特色馬桶 ×4 —— 雷克斯農場。載入順序：放在 bath.js 之後（index.html）。
   toilet_cat 貓咪馬桶：坐下喵一聲
   toilet_smart 智慧免治：坐下暖座，兩邊飄愛心（目愛心）
   toilet_duck 小黃鴨馬桶：起身呱呱＋衝水
   toilet_gold 黃金馬桶：坐下金光閃閃（身邊閃星星）
   都是 1×1、可以坐；起身會衝水（和普通馬桶一樣）。朋友來拜訪也能坐，坐著的人在別人畫面裡也看得到效果（效果畫在 drawSeated，朋友畫面同一條路徑）。
   伺服器家具目錄要有這 4 筆（價格 = 普通馬桶 + 300），見 toilets.sql */

const TOILET_KEYS = ['toilet_cat', 'toilet_smart', 'toilet_duck', 'toilet_gold'];

/* 坐下／起身說的話：sit＝坐下時、up＝起身時（up2＝起身後稍晚再冒一個） */
const TOILET_SAY = {
  toilet_cat:   { sit: '喵～', col: '#ffb3c6', up: '嘩啦～', upCol: '#8fd3f4' },
  toilet_smart: { sit: '暖暖的～', col: '#ffb3c6', up: '嘩啦～', upCol: '#8fd3f4', toast: '暖座＋免治，太幸福了' },
  toilet_duck:  { sit: null, col: '#ffe08a', up: '呱呱！', upCol: '#ffe08a', up2: '嘩啦～', up2Col: '#8fd3f4' },
  toilet_gold:  { sit: '閃閃發光～', col: '#fff3b0', up: '嘩啦～', upCol: '#8fd3f4' }
};

/* 小愛心（5×5）、星星（3×3） */
const tHeart = (c, x, y) => { r(c, x, y, 2, 1); r(c, x + 3, y, 2, 1); r(c, x, y + 1, 5, 2); r(c, x + 1, y + 3, 3, 1); r(c, x + 2, y + 4, 1, 1); };
const tStar = (c, x, y) => { r(c, x + 1, y, 1, 3); r(c, x, y + 1, 3, 1); };

const TOILET_FURN = {
  toilet_cat(px, py, now) {                            // 粉紅貓咪：兩隻耳朵、一張臉，偶爾眨眼
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    r('#c25a82', px + 3, py + 0, 3, 3); r('#c25a82', px + 10, py + 0, 3, 3); r('#ffb3c6', px + 4, py + 1, 1, 1); r('#ffb3c6', px + 11, py + 1, 1, 1);
    ob('#e07aa0', '#a84470', px + 3, py + 1, 10, 6);
    if ((now | 0) % 3200 < 140) { r('#4a2c2c', px + 5, py + 4, 2, 1); r('#4a2c2c', px + 9, py + 4, 2, 1); }
    else { r('#4a2c2c', px + 5, py + 3, 2, 2); r('#4a2c2c', px + 9, py + 3, 2, 2); r('#ffffff', px + 5, py + 3, 1, 1); r('#ffffff', px + 9, py + 3, 1, 1); }
    r('#ffd0dc', px + 7, py + 5, 2, 1);
    ob('#ffffff', '#a84470', px + 2, py + 6, 12, 6); r('#e4f3fb', px + 4, py + 8, 8, 3); r('#8fd3f4', px + 6, py + 9, 4, 1);
    ob('#e07aa0', '#a84470', px + 5, py + 11, 6, 4); r('#ffd0dc', px + 5, py + 14, 2, 1); r('#ffd0dc', px + 9, py + 14, 2, 1);
  },
  toilet_smart(px, py, now) {                          // 智慧免治：水箱有彩條、右邊一排按鈕（輪流亮）
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    ob('#eef1f6', '#8e9db0', px + 2, py + 0, 9, 6); r('#8fc8f4', px + 4, py + 1, 5, 1); r('#f4a6b8', px + 4, py + 3, 5, 1);
    ob('#c9ced6', '#8e9db0', px + 11, py + 2, 4, 11);
    const on = Math.floor(now / 500) % 3;
    r(on === 0 ? '#c6ffd0' : '#8fe09a', px + 12, py + 3, 2, 2); r(on === 1 ? '#fff3b0' : '#ffd27a', px + 12, py + 6, 2, 2); r(on === 2 ? '#d6f0ff' : '#8fc8f4', px + 12, py + 9, 2, 2);
    ob('#ffffff', '#8e9db0', px + 1, py + 5, 11, 7); r('#e4f3fb', px + 3, py + 8, 7, 3); r('#8fd3f4', px + 5, py + 9, 3, 1);
    ob('#eef1f6', '#8e9db0', px + 4, py + 11, 6, 4); r('#c9ced6', px + 5, py + 14, 4, 1);
  },
  toilet_duck(px, py, now) {                           // 小黃鴨：橘色鴨嘴往右伸出來
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    ob('#ffd34d', '#c9981a', px + 3, py + 0, 8, 6); r('#4a2c2c', px + 5, py + 2, 1, 1); r('#ffa0b0', px + 4, py + 4, 1, 1);
    const bk = (Math.floor(now / 900) % 6) === 0 ? 1 : 0;   // 偶爾嘴巴動一下
    ob('#ff9b3c', '#c46a1a', px + 11, py + 2 + bk, 5, 2);
    ob('#ffd34d', '#c9981a', px + 2, py + 5, 12, 7); r('#fff3b0', px + 4, py + 7, 8, 4); r('#8fd3f4', px + 6, py + 9, 4, 1);
    ob('#ffd34d', '#c9981a', px + 5, py + 11, 6, 4); r('#ff9b3c', px + 5, py + 14, 2, 1); r('#ff9b3c', px + 9, py + 14, 2, 1);
  },
  toilet_gold(px, py, now) {                           // 黃金馬桶：亮面高光，左上角閃星星
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    ob('#ffd34d', '#a87a00', px + 4, py + 1, 8, 6); r('#fff3a0', px + 5, py + 2, 2, 4); r('#c9981a', px + 10, py + 2, 1, 4); r('#fff3a0', px + 7, py + 6, 3, 1);
    ob('#ffd34d', '#a87a00', px + 2, py + 6, 12, 7); r('#fff3a0', px + 3, py + 7, 1, 4); r('#8fd3f4', px + 6, py + 9, 4, 1); r('#fff3b0', px + 4, py + 8, 8, 1);
    ob('#ffd34d', '#a87a00', px + 5, py + 12, 6, 3); r('#c9981a', px + 6, py + 14, 4, 1);
    if (Math.floor(now / 450) % 3 !== 2) tStar('#fff7c0', px + 0, py + 0);
    if (Math.floor(now / 450) % 3 === 1) tStar('#ffffff', px + 13, py + 3);
  }
};
Object.assign(FURN, TOILET_FURN);
TOILET_KEYS.forEach(k => { SEAT[k] = 'sit'; });

/* ---------- 起身衝水：水在碗裡打轉、慢慢變少再補回來 ---------- */
TOILET_KEYS.forEach(k => {
  DCONT[k] = function (it, px, py, now) {
    const p = bathOn(it.id, now); if (p < 0) return;
    r('#e4f3fb', px + 4, py + 8, 8, 3);
    const lvl = p < 0.7 ? 1 - p / 0.7 : (p - 0.7) / 0.3;
    if (lvl > 0.15) r('#8fd3f4', px + 5 + Math.round((1 - lvl) * 2), py + 9, Math.max(2, Math.round(6 * lvl)), 1);
    if (p < 0.7) for (let i = 0; i < 4; i++) { const a = now / 80 + i * 1.57, rad = 3.2 * (1 - p / 0.7) + 0.6; r('#ffffff', px + 8 + Math.round(Math.cos(a) * rad), py + 9 + Math.round(Math.sin(a) * rad * 0.5), 1, 1); }
  };
});

/* ---------- 坐著的樣子（自己和朋友畫面都走這裡）：人只畫上半身，前緣蓋回去，再加效果 ---------- */
const TOILET_SEAT = {
  toilet_cat:   { fill: '#ffffff', edge: '#a84470', base: '#e07aa0' },
  toilet_smart: { fill: '#ffffff', edge: '#8e9db0', base: '#c9ced6', fx(px, py, now) {      // 暖座：兩邊飄愛心
    r('rgba(255,170,130,.55)', px + 4, py + 11, 8, 1);
    for (let i = 0; i < 4; i++) {
      const ph = ((now / 1500) + i / 4) % 1, left = i % 2 === 0;
      const hx = px + (left ? -5 : 14) + Math.round(Math.sin(now / 420 + i * 1.7) * 1), hy = py - 4 - Math.floor(ph * 13);
      tHeart('rgba(255,110,150,' + (1 - ph * 0.85).toFixed(2) + ')', hx, hy);
    }
  } },
  toilet_duck:  { fill: '#fff3b0', edge: '#c9981a', base: '#ffd34d' },
  toilet_gold:  { fill: '#ffd34d', edge: '#a87a00', base: '#c9981a', fx(px, py, now) {     // 金光：身邊一直閃星星
    const sp = [[-4, -8, 0], [15, -4, 1.3], [-3, 4, 2.6], [14, 7, 3.9], [7, -17, 5.2]];
    sp.forEach(([dx, dy, ph]) => { const s = Math.sin(now / 260 + ph); if (s > 0.2) tStar(s > 0.8 ? '#ffffff' : '#ffe680', px + dx, py + dy); });
  } }
};
const _drawSeatedT0 = drawSeated;
drawSeated = function (px, py, it, ch, tile) {
  const st = TOILET_SEAT[it.k];
  if (!st) return _drawSeatedT0(px, py, it, ch, tile);
  g.save(); g.beginPath(); g.rect(px - 4, py - 14, 24, 24); g.clip();
  drawPlayer(px, py - 2, 'down', false, 0, ch);
  g.restore();
  ob(st.fill, st.edge, px + 2, py + 10, 12, 4); r('#e4f3fb', px + 4, py + 11, 8, 1); r(st.base, px + 6, py + 13, 4, 1);
  if (st.fx) st.fx(px, py, performance.now());
};

/* ---------- 坐下：喵／暖暖的／閃閃發光（只有自己這邊冒字） ---------- */
const _takeSeatT0 = takeSeat;
takeSeat = function (it, x, y) {
  const had = pose;
  _takeSeatT0(it, x, y);
  const s = TOILET_SAY[it.k];
  if (!had && pose && pose.id === it.id && s) {
    if (s.sit) pop(x, y - 1, s.sit, s.col);
    if (s.toast) toast(s.toast, 2000);
  }
};

/* ---------- 起身：衝水（照普通馬桶），小黃鴨多一聲呱呱 ---------- */
const _standUpT0 = standUp;
standUp = function () {
  const it = pose && pose.id != null && house ? house.items.find(i => i.id === pose.id) : null;
  _standUpT0();
  const s = it && TOILET_SAY[it.k];
  if (!s) return;
  bathStart(it.id, 1700);
  const x = RX + it.x, y = RY + it.y - 0.5;
  pop(x, y, s.up, s.upCol);
  if (s.up2) setTimeout(() => { if (scene === 'house') pop(x, y + 0.4, s.up2, s.up2Col); }, 450);
};
