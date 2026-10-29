'use strict';
/* 洗澡間家具 ×9 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html（放在 house.js、social.js 之後）。
   坐／躺：toilet、stool = 'sit'；bathtub、ofuro = 'lie'（沿用 SEAT）。
   按動作鍵：shower、sink、washer、scale、towel（BATH_ACT）。馬桶起身會衝水（包住 standUp）。 */

/* 伺服器家具目錄要有這 9 筆（key、名稱、佔格、圖層、價格），見 bath-catalog.md */
const BATH_KEYS = ['toilet', 'bathtub', 'ofuro', 'shower', 'sink', 'stool', 'washer', 'scale', 'towel'];

/* 正在播放的效果：家具 id → { t0, dur }；畫面用 performance.now() 計時（和 requestAnimationFrame 的 now 同一條時間軸） */
const bathFx = new Map();
/* 這件家具上現在有沒有人（自己或同一間屋子裡的朋友）在坐／躺／站著用；體重計和健身器材靠它決定要不要亮、要不要動 */
const seatOcc = it => !!(it && it.id != null && ((pose && pose.id === it.id) || seatTaken(it)));
function bathStart(id, dur) { bathFx.set(id, { t0: performance.now(), dur }); }
function bathOn(id, now) {   // 還在播放就回傳 0~1 的進度，結束了回傳 -1
  const f = bathFx.get(id); if (!f) return -1;
  const p = ((now || performance.now()) - f.t0) / f.dur;
  if (p >= 1) { bathFx.delete(id); return -1; }
  return Math.max(0, p);
}

const BATH_FURN = {
  toilet(px, py) {                                     // 馬桶（1×1）：坐，起身會衝水
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    ob('#ffffff', '#8e9db0', px + 4, py + 0, 8, 6); r('#8fc8f4', px + 7, py + 1, 2, 1);
    ob('#ffffff', '#8e9db0', px + 2, py + 5, 12, 7); r('#e4f3fb', px + 4, py + 7, 8, 3); r('#8fd3f4', px + 6, py + 8, 4, 1);
    ob('#ffffff', '#8e9db0', px + 5, py + 11, 6, 4); r('#c9ced6', px + 6, py + 13, 4, 1);
  },
  bathtub(px, py, now) {                               // 浴缸（2×2）：躺著泡澡，泡泡會飄
    r('rgba(90,60,40,.18)', px + 3, py + 30, 26, 2);
    r('#b0b6c0', px + 25, py + 2, 2, 7); r('#b0b6c0', px + 21, py + 2, 6, 2); r('#ff8fa8', px + 24, py + 1, 4, 1);
    r('#8fd3f4', px + 21, py + 4 + (Math.floor(now / 300) % 3), 1, 1);
    ob('#ffffff', '#8e9db0', px + 1, py + 8, 30, 21);
    r('#e4f3fb', px + 3, py + 10, 26, 17);
    r('#8fd3f4', px + 4, py + 12, 24, 13); r('#bfe9fb', px + 4, py + 12, 24, 2);
    for (let i = 0; i < 5; i++) {
      const bx = px + 5 + i * 5 + Math.round(Math.sin(now / 700 + i * 1.7) * 1.5), by = py + 14 + (i % 2) * 5 + Math.round(Math.sin(now / 900 + i));
      rr('#ffffff', bx, by, 4, 3); r('#bfe9fb', bx + 1, by + 1, 1, 1);
    }
    r('#c9ced6', px + 4, py + 29, 3, 2); r('#c9ced6', px + 25, py + 29, 3, 2);
  },
  ofuro(px, py, now) {                                 // 檜木泡澡桶（2×2）：冒熱氣、漂著柚子
    r('rgba(90,60,40,.18)', px + 3, py + 30, 26, 2);
    ob('#d9a066', '#9b6a44', px + 2, py + 9, 28, 20);
    for (let i = 0; i < 4; i++) r('#c98f62', px + 8 + i * 6, py + 11, 1, 17);
    r('#6b6b7a', px + 2, py + 14, 28, 1); r('#6b6b7a', px + 2, py + 24, 28, 1);
    ob('#e8b27a', '#9b6a44', px + 3, py + 6, 26, 8);
    rr('#8fd3f4', px + 5, py + 8, 22, 4); r('#bfe9fb', px + 7, py + 8, 8, 1);
    r('#ffd34d', px + 17, py + 9, 3, 2); r('#fff0a0', px + 18, py + 9, 1, 1); r('#ffd34d', px + 11, py + 10, 3, 2);
    for (let i = 0; i < 3; i++) { const ph = ((now / 1100) + i / 3) % 1; r('rgba(255,255,255,' + (0.7 - ph * 0.6).toFixed(2) + ')', px + 9 + i * 7 + Math.round(Math.sin(ph * 6 + i) * 2), py + 5 - Math.floor(ph * 8), 2, 2); }
    r('#9b6a44', px + 5, py + 29, 3, 2); r('#9b6a44', px + 24, py + 29, 3, 2);
  },
  shower(px, py) {                                     // 淋浴間（1×2）：按動作鍵，水才會流
    r('rgba(90,60,40,.18)', px + 2, py + 31, 12, 1);
    ob('#d6eefb', '#8e9db0', px + 1, py + 1, 14, 30);
    r('#ffffff', px + 3, py + 9, 1, 10); r('#ffffff', px + 3, py + 21, 1, 3);
    r('#b0b6c0', px + 8, py + 3, 6, 1); r('#b0b6c0', px + 13, py + 3, 1, 3);
    ob('#c9ced6', '#8e9db0', px + 3, py + 4, 8, 3);
    r('#cfd2d8', px + 2, py + 27, 12, 3); r('#8e9db0', px + 6, py + 28, 4, 1);
  },
  sink(px, py, now) {                                  // 洗手台（2×1）
    r('rgba(90,60,40,.18)', px + 2, py + 15, 28, 1);
    ob('#e8b27a', '#9b6a44', px + 1, py + 8, 30, 8); r('#9b6a44', px + 16, py + 10, 1, 5);
    r('#fff3b0', px + 13, py + 12, 2, 2); r('#fff3b0', px + 18, py + 12, 2, 2);
    ob('#ffffff', '#8e9db0', px + 0, py + 5, 32, 4);
    ob('#e4f3fb', '#8e9db0', px + 9, py + 3, 14, 4); r('#8fd3f4', px + 11, py + 4, 10, 1);
    r('#b0b6c0', px + 15, py + 0, 2, 4); r('#b0b6c0', px + 15, py + 0, 5, 1);
    r('#8fd3f4', px + 19, py + 1 + (Math.floor((now || 0) / 350) % 3), 1, 1);
    ob('#ff9bb3', '#d4688a', px + 3, py + 1, 4, 5); r('#8fc8f4', px + 4, py - 1, 1, 3); r('#ffd27a', px + 5, py - 1, 1, 3);
    ob('#ffd27a', '#e0a12e', px + 25, py + 3, 5, 3);
  },
  stool(px, py) {                                      // 洗澡小板凳（1×1）：坐
    r('rgba(90,60,40,.18)', px + 3, py + 15, 10, 1);
    ob('#8fc8f4', '#4a8fc4', px + 3, py + 6, 10, 4); r('#4a8fc4', px + 7, py + 7, 2, 1); r('#cfeaf7', px + 4, py + 7, 3, 1);
    r('#4a8fc4', px + 4, py + 10, 2, 5); r('#4a8fc4', px + 10, py + 10, 2, 5);
    ob('#ffe08a', '#e0a12e', px + 6, py + 2, 5, 4); r('#ff9b3c', px + 10, py + 3, 2, 1); r('#4a2c2c', px + 8, py + 3, 1, 1);
  },
  washer(px, py) {                                     // 洗衣機（1×2）：按動作鍵，滾筒才會轉
    r('rgba(90,60,40,.18)', px + 2, py + 31, 12, 1);
    ob('#f1f3f7', '#8e9db0', px + 1, py + 1, 14, 30);
    r('#d6dbe3', px + 2, py + 2, 12, 6); r('#ff8fa8', px + 3, py + 4, 3, 3); r('#8fe09a', px + 9, py + 4, 4, 2);
    ob('#c9ced6', '#8e9db0', px + 2, py + 11, 12, 12);
    ob('#8fd3f4', '#6a8fae', px + 4, py + 13, 8, 8);
    r('#ff8fa8', px + 5, py + 18, 2, 2); r('#ffffff', px + 8, py + 17, 2, 2); r('#ffd27a', px + 7, py + 15, 2, 2);
    r('#8e9db0', px + 3, py + 31, 3, 1); r('#8e9db0', px + 10, py + 31, 3, 1);
  },
  scale(px, py) {                                      // 體重計（1×1，平放）
    r('rgba(90,60,40,.18)', px + 3, py + 13, 11, 1);
    ob('#f1f3f7', '#8e9db0', px + 2, py + 3, 12, 10);
    ob('#bfe6c0', '#5a8a5a', px + 5, py + 4, 6, 3); r('#3a5a3a', px + 6, py + 5, 1, 1); r('#3a5a3a', px + 8, py + 5, 2, 1);
    r('#d6dbe3', px + 4, py + 9, 3, 3); r('#d6dbe3', px + 9, py + 9, 3, 3);
  },
  towel(px, py, now) {                                 // 毛巾架（掛牆 2×1）
    r('#b0b6c0', px + 2, py + 2, 28, 2); r('#b0b6c0', px + 2, py + 1, 2, 4); r('#b0b6c0', px + 28, py + 1, 2, 4);
    const sw = Math.round(Math.sin((now || 0) / 1200));
    ob('#ffb3c6', '#d4688a', px + 5, py + 3, 8, 12 + sw); r('#ffe3ec', px + 6, py + 9, 6, 1);
    ob('#8fc8f4', '#4a8fc4', px + 15, py + 3, 9, 13); r('#e4f3fb', px + 16, py + 9, 7, 1);
    ob('#ffd27a', '#e0a12e', px + 26, py + 3, 4, 8 - sw); r('#fff3b0', px + 27, py + 7, 2, 1);
  }
};
Object.assign(FURN, BATH_FURN);
Object.assign(SEAT, { toilet: 'sit', stool: 'sit', bathtub: 'lie', ofuro: 'lie', shower: 'sit', scale: 'sit' });   // shower：走進去洗（按動作鍵），別人看得到誰在裡面

/* ---------- 疊在家具上的動態效果（只在按過動作鍵之後的幾秒） ---------- */
Object.assign(DCONT, {
  toilet(it, px, py, now) {                            // 衝水：水在碗裡打轉、慢慢變少再補回來
    const p = bathOn(it.id, now); if (p < 0) return;
    r('#6aa8d8', px + 7, py + 1, 2, 1);
    r('#e4f3fb', px + 4, py + 7, 8, 3);
    const lvl = p < 0.7 ? 1 - p / 0.7 : (p - 0.7) / 0.3;   // 水位先降後升
    if (lvl > 0.15) r('#8fd3f4', px + 5 + Math.round((1 - lvl) * 2), py + 8, Math.max(2, Math.round(6 * lvl)), 1);
    if (p < 0.7) for (let i = 0; i < 4; i++) { const a = now / 80 + i * 1.57, rad = 3.2 * (1 - p / 0.7) + 0.6; r('#ffffff', px + 8 + Math.round(Math.cos(a) * rad), py + 8 + Math.round(Math.sin(a) * rad * 0.5), 1, 1); }
  },
  shower(it, px, py, now) {                            // 蓮蓬頭出水＋地上的水花
    const p = bathOn(it.id, now); if (p < 0) return;
    const t = Math.floor(now / 90);
    for (let i = 0; i < 7; i++) r('#8fd3f4', px + 4 + (i * 5) % 7, py + 8 + ((t * 2 + i * 5) % 17), 1, 2);
    r('#bfe9fb', px + 3 + (t % 3) * 4, py + 26, 2, 1); r('#bfe9fb', px + 11 - (t % 3) * 3, py + 26, 1, 1);
    r('rgba(255,255,255,.55)', px + 4 + (t % 4), py + 2 - (t % 2), 2, 1);   // 蒸氣
  },
  sink(it, px, py, now) {                              // 水龍頭流水
    const p = bathOn(it.id, now); if (p < 0) return;
    r('#8fd3f4', px + 19, py + 1, 1, 3); r('#bfe9fb', px + 18 + (Math.floor(now / 100) % 2), py + 4, 3, 1);
    r('#8fd3f4', px + 11, py + 4, 10, 1);
  },
  washer(it, px, py, now) {                            // 滾筒轉動、機身微微震動
    const p = bathOn(it.id, now); if (p < 0) return;
    r('#8fd3f4', px + 4, py + 13, 8, 8);
    const a = now / 140, cols = ['#ff8fa8', '#ffffff', '#ffd27a'];
    for (let i = 0; i < 3; i++) r(cols[i], px + 7 + Math.round(Math.cos(a + i * 2.1) * 2), py + 16 + Math.round(Math.sin(a + i * 2.1) * 2), 2, 2);
    r('#ff5a5a', px + 3, py + 4, 3, 3);                // 運轉燈
    if (Math.floor(now / 90) % 2) r('#ffffff', px + 7, py + 9, 2, 1);
  },
  scale(it, px, py, now) {                             // 有人站上去（自己或朋友）：螢幕數字亂跳，之後停在「輕」，人在上面就一直亮著，離開才熄
    const bo = bathOn(it.id, now);                     // 轉過方向的體重計站不上去，只會播一下短短的亮燈
    if (!seatOcc(it) && bo < 0) return;
    const own = pose && pose.id === it.id, p = own ? Math.min(1, (performance.now() - pose.scale) / BATH_ACT.scale.ms) : bo >= 0 ? bo : 1;   // 別人站上去的時間我不知道，直接看停好的樣子
    r('#2f5a2f', px + 5, py + 4, 6, 3);
    if (p < 0.55) { const t = Math.floor(now / 70); for (let i = 0; i < 3; i++) if ((t + i) % 2) r('#bfe6c0', px + 6 + i * 2, py + 5, 1, 1); }
    else { r('#bfe6c0', px + 6, py + 5, 4, 1); r('#ff8fa8', px + 11, py + 3, 2, 2); }
    r('#ffd27a', px + 4, py + 8, 8, 1);                // 腳印位置亮起來
  },
  towel(it, px, py, now) {                             // 毛巾被拉動、飄起
    const p = bathOn(it.id, now); if (p < 0) return;
    const w = Math.round(Math.sin(now / 90) * 1);
    r('#ffe3ec', px + 6 + w, py + 12, 6, 1); r('#e4f3fb', px + 16 - w, py + 13, 7, 1);
    r('#fff3b0', px + 2 + Math.floor(p * 12), py - 1 - Math.round(Math.sin(p * 9) * 1), 1, 1);
  }
});

/* ---------- 坐馬桶／板凳、躺浴缸／泡澡桶 的畫法（其他家具照舊交給原本的 drawSeated／drawLying） ---------- */
/* 淋浴間（B 霧面玻璃）：人站在裡面，隔著霧面玻璃看得到，頭上有泡泡，水一直流。
   px, py ＝ 淋浴間下面那一格（人站的那格）；整個淋浴間 1×2，頂端在 py - 16。 */
function drawShowerInside(px, py, ch, now) {
  const t = Math.floor(now / 90);
  /* ① 玻璃後面的水柱（在人的後面） */
  for (let i = 0; i < 5; i++) r('#bfe9fb', px + 8 + (i % 3) * 2 - (i > 2 ? 4 : 0), py - 11 + ((t * 2 + i * 7) % 20), 1, 3);
  /* ② 人（腳被下面的玻璃擋住） */
  g.save(); g.beginPath(); g.rect(px - 2, py - 14, 20, 23); g.clip();
  drawPlayer(px, py - 1, 'down', false, 0, ch);
  g.restore();
  /* ③ 霧面玻璃：整片蓋一層霧白，邊框蓋回來 */
  r('rgba(226,241,252,.5)', px + 2, py - 14, 12, 24);
  r('#8e9db0', px + 1, py - 15, 1, 28); r('#8e9db0', px + 14, py - 15, 1, 28); r('#8e9db0', px + 1, py - 15, 14, 1);
  r('rgba(255,255,255,.75)', px + 3, py - 9, 1, 9); r('rgba(255,255,255,.75)', px + 3, py + 2, 1, 3);
  /* ④ 玻璃上流下來的水痕 */
  for (let i = 0; i < 4; i++) {
    const yy = py - 13 + ((t + i * 5) % 17);
    const sx = px + [4, 7, 10, 12][i];
    r('rgba(143,211,244,.95)', sx, yy, 1, 3 + (i & 1)); r('rgba(255,255,255,.8)', sx, yy, 1, 1);
  }
  /* ⑤ 下半段霧得更白，看不到腳；底座蓋回來，地上有水花 */
  r('rgba(214,236,250,.9)', px + 2, py + 6, 12, 5);
  r('#cfd2d8', px + 2, py + 11, 12, 3); r('#8e9db0', px + 6, py + 12, 4, 1);
  r('#bfe9fb', px + 3 + (t % 3) * 4, py + 10, 2, 1); r('#ffffff', px + 11 - (t % 3) * 3, py + 10, 1, 1);
  /* ⑥ 頭上的泡泡：一團泡沫，幾顆往上飄 */
  const fx = px + 8, fy = py - 3;
  rr('#ffffff', fx - 4, fy - 1, 8, 3); rr('#ffffff', fx - 2, fy - 3, 5, 3); r('#bfe9fb', fx - 1, fy - 1, 1, 1); r('#bfe9fb', fx + 2, fy, 1, 1);
  for (let i = 0; i < 4; i++) {
    const ph = ((now / 1300) + i / 4) % 1, bx = px + 4 + i * 3 + Math.round(Math.sin(now / 420 + i * 1.9) * 1), by = fy - 4 - Math.floor(ph * 9);
    r('rgba(255,255,255,' + (1 - ph * 0.8).toFixed(2) + ')', bx, by, 2, 2); r('rgba(143,211,244,' + (0.9 - ph * 0.8).toFixed(2) + ')', bx + 1, by + 1, 1, 1);
  }
  /* ⑦ 蓮蓬頭那邊冒的蒸氣 */
  r('rgba(255,255,255,.55)', px + 4 + (t % 4), py - 14 - (t % 2), 2, 1);
}
/* 體重計：站上去 → 角色被輕輕托起、羽毛飄落，頭上跳出粗描邊的「輕飄飄～」（取代原本上方的小提示） */
function drawScaleFloat(px, py, ch, now, t0) {
  const e = t0 ? Math.min(1, (now - t0) / 450) : 1, lift = Math.round(e * 4 + Math.sin(now / 260) * e * 1.2);
  for (let i = 0; i < 6; i++) {
    const ph = ((now / 1500) + i / 6) % 1, fx = px + 7 + Math.round(Math.sin(ph * 6 + i * 2.3) * 10), fy = py - 20 + Math.floor(ph * 22);
    if (e < 0.6) break;
    r('#ffffff', fx, fy, 3, 1); r('#cfe8f7', fx + 1, fy + 1, 2, 1); r('#ffffff', fx + (i & 1 ? -1 : 3), fy - 1, 1, 1);
  }
  drawPlayer(px, py - 9 - lift, 'down', false, 0, ch);
  if (e >= 0.6) {
    g.font = '800 9px "Chiron GoRound TC", "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
    const ty = py - 19 + Math.round(Math.sin(now / 300));
    g.lineWidth = 2; g.strokeStyle = '#6b4a3a'; g.strokeText('輕飄飄～', px + 8, ty);
    g.fillStyle = '#ffffff'; g.fillText('輕飄飄～', px + 8, ty);
  }
}
const _drawSeated0 = drawSeated;
drawSeated = function (px, py, it, ch, tile) {
  if (it.k === 'scale') return drawScaleFloat(px, py, ch, performance.now(), pose && pose.id === it.id ? pose.scale : 0);
  if (it.k === 'shower') return drawShowerInside(px, py, ch, performance.now());
  if (it.k !== 'toilet' && it.k !== 'stool') return _drawSeated0(px, py, it, ch, tile);
  g.save(); g.beginPath(); g.rect(px - 4, py - 14, 24, 24); g.clip();
  drawPlayer(px, py - 2, 'down', false, 0, ch);
  g.restore();
  if (it.k === 'toilet') { ob('#ffffff', '#8e9db0', px + 2, py + 10, 12, 4); r('#e4f3fb', px + 4, py + 11, 8, 1); r('#c9ced6', px + 6, py + 13, 4, 1); }
  else { ob('#8fc8f4', '#4a8fc4', px + 3, py + 10, 10, 3); r('#4a8fc4', px + 4, py + 13, 2, 2); r('#4a8fc4', px + 10, py + 13, 2, 2); }
};
const _drawLying0 = drawLying;
drawLying = function (it, ch, slot) {
  if (it.k !== 'bathtub' && it.k !== 'ofuro') return _drawLying0(it, ch, slot);
  const d0 = defOf(it.k), rt = (it.r | 0) & 3, turned = !!(rt && d0);
  let bx = (RX + it.x) * T, by = (RY + it.y) * T;
  if (turned) {
    const rw = rt & 1 ? d0.h : d0.w, rh = rt & 1 ? d0.w : d0.h;
    g.save(); g.translate(bx + rw * T / 2, by + rh * T / 2); g.rotate(rt * Math.PI / 2); g.translate(-d0.w * T / 2, -d0.h * T / 2);
    bx = 0; by = 0;
  }
  const skin = SKINS[ch.skin] || SKINS[0], hair = HAIRS[ch.hair] || HAIRS[0], hx = bx + 12;
  const now = performance.now();
  if (it.k === 'bathtub') {                            // 頭露在泡泡上面，身體埋在泡泡裡
    const hy = by + 9;
    ob(skin, shade(skin, 0.82), hx + 1, hy, 8, 7);
    r(hair, hx + 1, hy, 8, 3); r(hair, hx + 1, hy + 1, 1, 3); r(hair, hx + 8, hy + 1, 1, 3);
    r('#4a2c2c', hx + 3, hy + 4, 2, 1); r('#4a2c2c', hx + 6, hy + 4, 2, 1); r('#ffa0b0', hx + 2, hy + 5, 1, 1); r('#ffa0b0', hx + 8, hy + 5, 1, 1);
    rr('#8fd3f4', bx + 5, by + 16, 22, 8);
    for (let i = 0; i < 6; i++) { const q = bx + 6 + i * 3.5 + Math.round(Math.sin(now / 700 + i) * 1); rr('#ffffff', Math.round(q), by + 15 + (i % 3), 5, 4); }
    r('#bfe9fb', bx + 9, by + 16, 3, 1);
  } else {                                             // 泡澡桶：頭上頂一條小毛巾，水面到下巴
    const hy = by + 2;
    ob(skin, shade(skin, 0.82), hx + 1, hy, 8, 7);
    r(hair, hx + 1, hy, 8, 2); r('#ffffff', hx + 1, hy - 1, 8, 2); r('#e4f3fb', hx + 2, hy, 6, 1);
    r('#4a2c2c', hx + 3, hy + 4, 2, 1); r('#4a2c2c', hx + 6, hy + 4, 2, 1); r('#ffa0b0', hx + 2, hy + 5, 1, 1); r('#ffa0b0', hx + 8, hy + 5, 1, 1);
    rr('#8fd3f4', bx + 5, by + 8, 22, 4); r('#bfe9fb', bx + 7, by + 8, 8, 1);
    r('#ffd34d', bx + 19, by + 9, 3, 2); r('#ffd34d', bx + 8, by + 10, 3, 2);
  }
  if (turned) g.restore();
};

/* ---------- 起身：馬桶會衝水 ---------- */
const _standUp0 = standUp;
standUp = function () {
  const it = pose && pose.id != null && house ? house.items.find(i => i.id === pose.id) : null;
  const sh = pose && pose.shower ? pose : null;
  _standUp0();
  if (it && it.k === 'toilet') { bathStart(it.id, 1700); pop(RX + it.x, RY + it.y - 0.5, '嘩啦～', '#8fd3f4'); }
  if (sh && it && performance.now() - sh.shower >= sh.ms - 400) { const a = BATH_ACT.shower; pop(RX + it.x, RY + it.y + 0.6, a.done, '#fff3b0'); toast(a.toast, 2200); }   // 洗滿才算洗好，中途跑出來不算
};

/* ---------- 按動作鍵：淋浴、洗手、洗衣、體重計、毛巾架 ---------- */
const BATH_ACT = {
  shower: { hint: '進去淋浴', ms: 4500, say: '嘩啦啦～', col: '#8fd3f4', done: '洗得香香的！', toast: '洗好澡了，整個人清爽！' },
  sink:   { hint: '洗手', ms: 2600, say: '洗手手～', col: '#8fd3f4', done: '乾乾淨淨！', toast: null },
  washer: { hint: '洗衣服', ms: 6000, say: '嗡嗡嗡…', col: '#cfe8f7', done: '洗好了！', toast: null },
  scale:  { hint: '站上去量體重', ms: 3200, say: '嗶…', col: '#bfe6c0', done: null, toast: null },   // ms：數字亂跳多久才停好（站上去之後是維持性的，沒有自動下來）
  towel:  { hint: '拿毛巾擦乾', ms: 1800, say: '擦擦擦～', col: '#ffb3c6', done: null, toast: '擦得乾乾爽爽，毛巾軟軟香香的' }
};
/* 淋浴間：走進去洗。轉過方向的淋浴間改回原本的「站在外面按一下出水」。 */
function showerEnter(it, a) {
  const d = dimsOf(it.k, 0); if (!d || pose || fishing || cooking) return false;
  if (seatTaken(it)) { toast('淋浴間有人在用了', 1400); return true; }
  const bx = RX + it.x, by = RY + it.y + d.h - 1, tok = performance.now();
  pose = { type: 'sit', id: it.id, ix: it.x, iy: it.y, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, sort: by + 0.02, t: 0, shower: tok, ms: a.ms };
  pl.x = pl.sx = bx; pl.y = pl.sy = by; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  pop(bx, by - 1.2, a.say, a.col);
  lastPosKey = ''; posAcc = 999; trackSelf();         // 讓同一間屋子裡的人看到我在淋浴間裡
  setTimeout(() => { if (pose && pose.shower === tok) standUp(); }, a.ms);
  return true;
}
function scaleEnter(it, a) {
  if (pose || fishing || cooking) return false;
  if (seatTaken(it)) { toast('體重計上已經有人了', 1400); return true; }
  const bx = RX + it.x, by = RY + it.y, tok = performance.now();
  pose = { type: 'sit', id: it.id, ix: it.x, iy: it.y, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, sort: by + 0.02, t: 0, scale: tok };
  pl.x = pl.sx = bx; pl.y = pl.sy = by; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  lastPosKey = ''; posAcc = 999; trackSelf();          // 螢幕數字亂跳 a.ms 毫秒後停在「輕」；維持到自己按方向鍵或動作鍵下來為止，不會自己結束
  return true;
}
function bathAct(it, x, y) {
  const a = BATH_ACT[it.k]; if (!a) return;
  if (it.k === 'scale' && !(((it.r | 0) & 3)) && scaleEnter(it, a)) return;
  if (it.k === 'shower' && !(((it.r | 0) & 3)) && showerEnter(it, a)) return;
  if (bathOn(it.id) >= 0) return;                      // 正在播放，不要連按
  bathStart(it.id, a.ms);
  pop(x, y - 0.4, a.say, a.col);
  if (a.toast) toast(a.toast, 2200);
  if (a.done) setTimeout(() => { if (scene === 'house') pop(x, y - 0.4, a.done, '#fff3b0'); }, a.ms - 200);
}
