'use strict';
/* 家具互動：檯燈、壁爐、地球儀、掛鐘、盆栽（摸葉子）、青花瓶（插花）；畫、花圈、壁架自己會動 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   狀態只存在這台裝置（localStorage 'dw_fx'，用家具編號當 key，和電視頻道同一種做法），不需要改資料庫。 */

let FXIT = null;                                    // drawFurn 正在畫的那件家具；預覽、背包圖示沒有家具時是 null
const FX_KEY = 'dw_fx';
let fxState = {}, fxTmp = {}, fxSpin = {}, fxPet = {}, fxStroke = {}, fxLast = -1, fxLampTold = false;
try { fxState = JSON.parse(localStorage.getItem(FX_KEY) || '{}') || {}; } catch (e) { fxState = {}; }
const fxBox = () => (visiting ? fxTmp : fxState);   // 拜訪朋友時只在這次有效，不寫進自己的存檔
const fxGet = it => (it && it.id != null && fxBox()[it.id]) || null;
function fxSet(it, v) {
  fxBox()[it.id] = v;
  if (!visiting) try { localStorage.setItem(FX_KEY, JSON.stringify(fxState)); } catch (e) { /* 略過 */ }
}
const fxOn = (it, def) => { const v = fxGet(it); return v && v.on != null ? !!v.on : def; };
const fxDay = () => Math.floor((srvNow() + 8 * 3600000) / 86400000);   // 以 GMT+8 算「今天」，和世界時間一致

/* ---------- 盆栽：按動作鍵摸摸葉子（不用澆水、沒有獎勵，朋友也能摸，同屋的人即時看到）。
   以前澆水累積 7 天以上開過花的盆栽，維持開花的樣子；其他一律是長葉的樣子。 ---------- */
const plantStage = it => { const v = fxGet(it); return v && (v.n | 0) >= 7 ? 2 : 1; };

/* 節慶：萬聖節（沿用 halloween.js 的開關）、聖誕（12 月，GMT+8）；花圈在節慶的夜晚亮小燈 */
function fxFest() {
  if (typeof hwOn === 'function' && hwOn()) return 'hw';
  return new Date(srvNow() + 8 * 3600000).getUTCMonth() === 11 ? 'xmas' : null;
}

/* ---------- 美術：蓋在原本的圖上 ---------- */
const _lamp0 = FURN.lamp, _fire0 = FURN.fireplace, _globe0 = FURN.globe;
FURN.lamp = (px, py, now) => {
  _lamp0(px, py, now);
  const on = FXIT ? fxOn(FXIT, false) : true;
  if (!on) { ob('#cdbf94', '#9b8d62', px + 3, py + 1, 10, 6); r('#e6dcb8', px + 5, py + 2, 3, 1); }
  else { r('#fffbe0', px + 5, py + 2, 6, 3); r('#fff6c0', px + 4, py + 5, 8, 1); }
};
FURN.fireplace = (px, py, now) => {
  _fire0(px, py, now);
  if (FXIT && !fxOn(FXIT, true)) {                   // 熄火：只剩一點餘燼
    ob('#3a2a2a', '#9b8b7a', px + 7, py + 12, 18, 17);
    r('#8a5a44', px + 9, py + 27, 14, 2); r('#5a4036', px + 12, py + 25, 8, 2);
    if (Math.floor((now || 0) / 700) % 2) { r('#8a3a2a', px + 14, py + 25, 2, 1); r('#b0482a', px + 17, py + 26, 1, 1); }
  }
};
FURN.globe = (px, py, now) => {
  _globe0(px, py, now);
  if (FXIT && fxSpin[FXIT.id] && performance.now() < fxSpin[FXIT.id]) {   // 轉動中：海洋重畫，陸地一格一格往旁邊移
    const f = Math.floor(performance.now() / 110) % 7;
    ob('#6fb7e8', '#3f7fae', px + 3, py + 1, 10, 9);
    r('#7fd08a', px + 4 + f % 6, py + 3, 3, 3); r('#7fd08a', px + 4 + (f + 3) % 7, py + 6, 2, 3);
    r('#a8ecaa', px + 4 + f % 6, py + 3, 1, 1);
  }
};
const _cat0 = FURN.cat, _lan0 = FURN.lantern;
FURN.cat = (px, py, now) => {
  _cat0(px, py, now);
  const until = FXIT && fxPet[FXIT.id];
  if (until && performance.now() < until) {          // 被摸摸：三顆愛心往上飄
    const f = 1 - (until - performance.now()) / 1500;
    [[3, '#ff8fa8'], [7, '#ff6b8a'], [11, '#ff8fa8']].forEach(([dx, c], i) => {
      const hy = py + 2 - Math.round(f * 9) - (i % 2) * 2;
      r(c, px + dx, hy, 1, 1); r(c, px + dx + 2, hy, 1, 1); r(c, px + dx, hy + 1, 3, 1); r(c, px + dx + 1, hy + 2, 1, 1);
    });
  }
};
FURN.lantern = (px, py, now) => {
  _lan0(px, py, now);
  const on = FXIT ? fxOn(FXIT, false) : true;
  if (!on) { ob('#b8706a', '#b8403a', px + 3, py + 2, 10, 10); r('#c9ad6a', px + 3, py + 6, 10, 1); r('#b8403a', px + 5, py + 1, 6, 1); r('#d9a8a0', px + 5, py + 4, 2, 2); }
  else { ob('#ff8a6a', '#b8403a', px + 3, py + 2, 10, 10); r('#ffd34d', px + 3, py + 6, 10, 1); r('#b8403a', px + 5, py + 1, 6, 1); r('#fff0b0', px + 6, py + 4, 3, 3); }
};
FURN.window = (px, py, now) => {                    // 窗外跟著現在的天氣和時段變（預覽、背包圖示一律畫白天）
  let mode = 'day';
  if (FXIT) { const w = world(), dk = darkness(w.min); mode = w.wet ? (w.snow ? 'snow' : 'rain') : dk > 0.6 ? 'night' : dk > 0.15 ? 'dusk' : 'day'; }
  const sky = { day: '#bfe6ff', dusk: '#f3b58a', night: '#2f3550', rain: '#7d8a9a', snow: '#b8c4d4' }[mode], t = Math.floor((now || 0) / 1500) % 3;
  ob(sky, '#9b6a44', px + 1, py + 1, 30, 30);
  if (mode === 'day') { r('#e4f3fb', px + 4, py + 5, 8, 3); r('#ffffff', px + 18 + t, py + 10, 7, 3); }
  else if (mode === 'dusk') { r('#f7d0b0', px + 4, py + 5, 8, 3); r('#f7d0b0', px + 18 + t, py + 10, 7, 3); r('#ffd9a8', px + 6, py + 20, 8, 3); r('#ffeccc', px + 8, py + 18, 4, 2); }
  else if (mode === 'night') {
    r('#fff3b0', px + 20, py + 6, 5, 5); r('#2f3550', px + 22, py + 5, 4, 4);
    [[6, 7], [11, 19], [23, 20], [8, 24], [14, 10]].forEach(([dx, dy], i) => { if ((Math.floor((now || 0) / 600) + i) % 4) r('#ffffff', px + dx, py + dy, 1, 1); });
  } else if (mode === 'rain') {
    r('#9aa5b3', px + 4, py + 5, 10, 3); r('#9aa5b3', px + 16, py + 7, 10, 3);
    for (let i = 0; i < 6; i++) r('#bfe0ff', px + 5 + i * 4, py + 11 + (Math.floor((now || 0) / 90) + i * 3) % 14, 1, 3);
  } else {
    r('#d4dce8', px + 4, py + 5, 10, 3); r('#d4dce8', px + 16, py + 7, 10, 3);
    for (let i = 0; i < 7; i++) r('#ffffff', px + 4 + i * 3 + ((Math.floor((now || 0) / 200) + i) % 2), py + 11 + (Math.floor((now || 0) / 160) + i * 5) % 16, 1, 1);
  }
  r('#9b6a44', px + 15, py + 2, 2, 28); r('#9b6a44', px + 2, py + 15, 28, 2);
  r('#ffb3c6', px, py, 5, 32); r('#ffb3c6', px + 27, py, 5, 32); r('#ff8fa8', px + 3, py, 1, 32); r('#ff8fa8', px + 28, py, 1, 32);
};
FURN.plant = (px, py) => {
  const st = FXIT ? plantStage(FXIT) : 1, until = FXIT && fxStroke[FXIT.id], on = until && performance.now() < until;
  const f = on ? 1 - (until - performance.now()) / 1500 : 1, l = on ? Math.round(Math.sin(f * 22) * 1.2) : 0;   // 被摸摸：葉子左右搖
  ob('#ff9b7a', '#c4603f', px + 4, py + 10, 8, 5);
  rr('#7fd08a', px + 2 + l, py + 5, 6, 6); rr('#7fd08a', px + 8 + l, py + 4, 6, 7); rr('#a8ecaa', px + 5 + l, py + 1, 6, 8); r('#c6f5c6', px + 6 + l, py + 3, 1, 2);
  if (st === 2) {
    r('#ff8fa8', px + 3 + l, py + 3, 3, 3); r('#ffd27a', px + 4 + l, py + 4, 1, 1);
    r('#ffffff', px + 10 + l, py + 2, 3, 3); r('#ffd27a', px + 11 + l, py + 3, 1, 1);
    r('#c9a8f5', px + 6 + l, py + 0, 3, 3); r('#ffd27a', px + 7 + l, py + 1, 1, 1);
  }
  if (on) [[3, '#ff8fa8'], [9, '#ffb3c6']].forEach(([dx, c], i) => {   // 兩顆愛心往上飄
    const hy = py - Math.round(f * 8) - i * 3;
    r(c, px + dx, hy, 1, 1); r(c, px + dx + 2, hy, 1, 1); r(c, px + dx, hy + 1, 3, 1); r(c, px + dx + 1, hy + 2, 1, 1);
  });
};

/* ---------- 自己會動的擺飾：畫、花圈、壁架。畫面全用伺服器時間（srvNow）算，同一間屋子的人看到的是同一格，不用傳訊號、不用存檔 ---------- */
const fxT = () => srvNow() + (FXIT && FXIT.id ? (FXIT.id | 0) * 97 : 0);
FURN.paint1 = (px, py) => {                          // 小愛心：愛心一下一下跳，畫框四個角輪流閃光
  const t = fxT(), beat = Math.floor(t / 500) % 2, s = [[2, 2], [13, 2], [13, 13], [2, 13]][Math.floor(t / 700) % 4];
  ob('#e8b27a', '#9b6a44', px + 2, py + 2, 12, 12); r('#ffe3ec', px + 4, py + 4, 8, 8);
  if (beat) { r('#ff6b8a', px + 5, py + 5, 6, 2); r('#ff6b8a', px + 4, py + 6, 8, 3); r('#ff6b8a', px + 5, py + 9, 6, 1); r('#ff6b8a', px + 6, py + 10, 4, 1); r('#ff6b8a', px + 7, py + 11, 2, 1); }
  else { r('#ff8fa8', px + 6, py + 6, 4, 2); r('#ff8fa8', px + 5, py + 7, 6, 2); r('#ff8fa8', px + 7, py + 9, 2, 2); }
  r('#fff3b0', px + s[0], py + s[1] - 1, 1, 3); r('#fff3b0', px + s[0] - 1, py + s[1], 3, 1);
};
FURN.paint2 = (px, py) => {                          // 午後草原：雲慢慢飄、太陽眨眼、草輕輕搖
  const t = fxT(), cx = Math.floor(t / 450) % 20, sw = Math.floor(t / 600) % 2, tw = Math.floor(t / 400) % 2;
  ob('#e8b27a', '#9b6a44', px + 2, py + 2, 28, 12); r('#bfe6ff', px + 4, py + 4, 24, 8);
  r('#ffffff', px + 4 + cx, py + 5, 5, 2); r('#ffffff', px + 5 + cx, py + 4, 3, 1);
  r('#ffe08a', px + 21, py + 5, 3, 3);
  if (tw) { r('#ffe08a', px + 20, py + 6, 1, 1); r('#ffe08a', px + 24, py + 6, 1, 1); r('#ffe08a', px + 22, py + 4, 1, 1); r('#ffe08a', px + 22, py + 8, 1, 1); }
  r('#8fe09a', px + 4, py + 9, 24, 3); r('#7fd08a', px + 8, py + 7, 8, 5);
  for (let i = 0; i < 6; i++) r('#7fd08a', px + 5 + i * 4 + (i % 2 ? sw : 1 - sw), py + 8, 1, 1);
};
FURN.wreath = (px, py) => {                          // 花圈：一圈小燈一直輪流閃（節慶換顏色），偶爾飄下一片花瓣
  const t = fxT(), fest = fxFest();
  rr('#7fd08a', px + 2, py + 2, 12, 3); rr('#7fd08a', px + 2, py + 11, 12, 3); rr('#7fd08a', px + 2, py + 2, 3, 12); rr('#7fd08a', px + 11, py + 2, 3, 12);
  r('#ff8fa8', px + 4, py + 3, 2, 2); r('#ffd27a', px + 10, py + 11, 2, 2); r('#ff8fa8', px + 11, py + 5, 2, 2); r('#ffffff', px + 3, py + 10, 2, 2);
  r('#ff8fa8', px + 7, py + 13, 2, 3);
  const cs = { hw: ['#ff9a3c', '#c9a8f5', '#7ae04a'], xmas: ['#ff6b6b', '#8fe09a', '#ffe08a', '#8fe0ff'] }[fest] || ['#ffd27a', '#ff8fa8', '#8fe09a', '#8fc8f4'];
  [[2, 2], [7, 1], [12, 2], [14, 7], [12, 12], [7, 14], [2, 12], [1, 7]].forEach(([dx, dy], i) => {
    if ((Math.floor(t / 450) + i) % 3 === 0) return;
    const c = cs[(i + Math.floor(t / 1350)) % cs.length];
    r(c, px + dx, py + dy, 2, 2); g.globalAlpha = 0.25; r(c, px + dx - 1, py + dy - 1, 4, 4); g.globalAlpha = 1;
  });
  const ph = t % 7000;
  if (ph < 2400) { const f = ph / 2400; r(Math.floor(t / 7000) % 2 ? '#ffffff' : '#ff8fa8', px + 3 + Math.round(f * 6), py + 14 + Math.round(f * 13), 2, 1); }
};
FURN.wshelf = (px, py) => {                          // 壁架：蠟燭火苗搖晃、暖光一明一暗、盆栽葉子輕搖
  const t = fxT(), f = Math.floor(t / 170) % 3, gl = Math.floor(t / 500) % 2, sw = Math.floor(t / 900) % 2;
  r(gl ? 'rgba(255,214,120,.12)' : 'rgba(255,214,120,.2)', px + 5, py - 1, 14, 11); r(gl ? 'rgba(255,214,120,.18)' : 'rgba(255,214,120,.3)', px + 7, py, 10, 9);
  ob('#d9a066', '#9b6a44', px + 1, py + 9, 30, 4);
  r('#8fe09a', px + 5 + sw, py + 4, 3, 5); r('#8fe09a', px + 4 + sw * 2, py + 5, 1, 2); r('#ff9b7a', px + 4, py + 7, 5, 3);
  r('#fff6d0', px + 10, py + 5, 2, 4);
  if (f === 0) { r('#ffb347', px + 10, py + 3, 2, 2); r('#fff3b0', px + 10, py + 3, 1, 1); }
  else if (f === 1) { r('#ffb347', px + 10, py + 2, 2, 3); r('#fff3b0', px + 11, py + 3, 1, 2); }
  else { r('#ffb347', px + 11, py + 3, 1, 2); r('#ffb347', px + 10, py + 4, 2, 1); r('#fff3b0', px + 10, py + 4, 1, 1); }
  r('#ff8fa8', px + 14, py + 3, 3, 6); r('#8fc8f4', px + 17, py + 4, 3, 5); r('#ffd27a', px + 20, py + 5, 3, 4);
  ob('#ffffff', '#cfcfd8', px + 25, py + 5, 4, 5);
};
/* 青花瓶：按動作鍵插花（粉紅 → 黃 → 白 → 紫），再按一次拿掉；誰按都會同步 */
const VASE_C = ['#ff8fa8', '#ffd27a', '#ffffff', '#c9a8f5'], VASE_N = ['粉紅色的花', '黃色的花', '白色的花', '紫色的花'];
const vaseC = it => ((fxGet(it) || {}).c | 0) % 5;
const _vase0 = FURN.vase;
FURN.vase = (px, py, now) => {
  _vase0(px, py, now);
  const c = FXIT ? vaseC(FXIT) : 0; if (!c) return;
  r('#7fd08a', px + 7, py - 4, 1, 7); r('#7fd08a', px + 8, py - 2, 2, 1);
  r(VASE_C[c - 1], px + 6, py - 7, 3, 3); r(c === 2 ? '#ffb347' : '#ffd27a', px + 7, py - 6, 1, 1);
};

/* ---------- 按動作鍵 ---------- */
const FX_ACT = { lamp: 1, fireplace: 1, globe: 1, clock: 1, plant: 1, cat: 1, window: 1, lantern: 1, rug: 1, rug2: 1, paint1: 1, paint2: 1, wreath: 1, vase: 1 };
function fxHint(hit) {
  if (edit.on || !FX_ACT[hit.k]) return '';
  if (hit.k === 'lamp' || hit.k === 'lantern') return '：按動作鍵' + (fxOn(hit, false) ? '關燈' : '開燈');
  if (hit.k === 'cat') return '：按動作鍵摸摸牠';
  if (hit.k === 'window') return '：按動作鍵看窗外';
  if (hit.k === 'rug' || hit.k === 'rug2') return '：按動作鍵坐在地毯上';
  if (hit.k === 'paint1' || hit.k === 'paint2') return '：按動作鍵欣賞';
  if (hit.k === 'wreath') return '：按動作鍵看看';
  if (hit.k === 'fireplace') return '：按動作鍵' + (fxOn(hit, true) ? '熄火' : '生火');
  if (hit.k === 'globe') return '：按動作鍵轉地球儀';
  if (hit.k === 'clock') return '：按動作鍵看時間';
  if (hit.k === 'plant') return '：按動作鍵摸摸葉子';
  if (hit.k === 'vase') { const c = vaseC(hit); return '：按動作鍵' + (c === 0 ? '插花' : c < 4 ? '換花的顏色' : '拿掉花'); }
  return '';
}
const GLOBE_TIPS = [
  '地球表面大約 71% 是海洋。',
  '赤道一圈大約 40,075 公里。',
  '太平洋是最大的海洋，比所有陸地加起來還大。',
  '珠穆朗瑪峰高約 8,849 公尺，是地球最高的山。',
  '撒哈拉是世界最大的熱沙漠，面積差不多和美國一樣大。',
  '俄羅斯橫跨 11 個時區，是時區最多的國家之一。',
  '台灣、馬來西亞、新加坡都是 GMT+8，和農場的時間一樣。',
  '日期變更線大致沿著經度 180 度，跨過去就差一天。',
  '亞馬遜雨林產生的氧氣，是地球上很重要的一份。',
  '農場小知識：下雨或下雪的時候，作物不用澆水。',
  '農場小知識：當季作物的賣價會多 25%。',
  '農場小知識：相鄰的作物收成時，有機會雜交出新的種子。',
  '農場小知識：圖鑑集滿 30%、60%、100%，各可領一次獎勵。',
  '農場小知識：有些蟲蝶只在清晨、黃昏或夜晚出現，有些只在雨天或晴天。',
  '農場小知識：每個整點的天氣都是重新決定的，現在下雨不代表下一小時也會。',
  '農場小知識：天黑得最晚的時候大約在晚上九點半，早上六點天就全亮了。'
];
function fxAct(hit, x, y) {
  const k = hit.k, needId = k === 'lamp' || k === 'lantern' || k === 'fireplace' || k === 'plant' || k === 'vase';
  if (needId && (typeof hit.id !== 'number' || !isFinite(hit.id))) { toast('家具還在存檔，等一下再試', 1800); return; }
  if (k === 'lamp' || k === 'lantern') {
    const on = !fxOn(hit, false); fxSet(hit, Object.assign({}, fxGet(hit), { on }));
    pop(x, y, on ? '亮了' : '關燈', '#fff3b0'); if (on) sparkle(x, y, k === 'lamp' ? '#ffe08a' : '#ff7a6c');
    if (on && !fxLampTold) { fxLampTold = true; toast('天黑或下雨的時候，會照亮周圍一圈', 3200); }
    fxSend({ id: hit.id, s: fxGet(hit) });
  } else if (k === 'cat') {
    const busy = fxPet[hit.id] > performance.now() + 600;
    fxPet[hit.id != null ? hit.id : 'c'] = performance.now() + 1500;
    if (!busy && typeof hit.id === 'number') fxSend({ id: hit.id, a: 'pet' });
    pop(x, y, ['喵～', '呼嚕嚕…', '喵嗚？', '蹭蹭～'][Math.floor(Math.random() * 4)], '#ffd9e2'); sparkle(x, y, '#ff8fa8');
  } else if (k === 'window') {
    const w = world(), dk = darkness(w.min), sea = SEA_SHORT[seasonAt(srvNow())] || '';
    const t = dk > 0.6 ? '夜晚' : dk > 0.15 ? '黃昏或清晨' : '白天', wx = w.wet ? (w.snow ? '下著雪' : '下著雨') : '天氣晴朗';
    toast('窗外：' + sea + '天的' + t + '，' + wx, 3200); pop(x, y, w.wet ? (w.snow ? '下雪' : '下雨') : (dk > 0.6 ? '夜' : '晴'), '#cfe8f7');
  } else if (k === 'rug' || k === 'rug2') {
    if (pose || fishing || cooking) return;
    if (remoteAt(x, y)) { toast('這裡已經有人坐了', 1400); return; }
    pose = { type: 'sit', ground: true, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, t: 0 };
    if ((defOf(k) || {}).layer !== 'floor') { pl.x = pl.sx = x; pl.y = pl.sy = y; }   // 地毯是平的，走上去坐；萬一目錄把它當成擋路家具就在原地坐
    pl.prog = 1; pl.face = 'down'; pressed.length = 0; lastPosKey = ''; posAcc = 999; trackSelf();
    pop(pl.x, pl.y - 0.6, '坐下', '#ffffff');
  } else if (k === 'paint1' || k === 'paint2') {
    toast(k === 'paint1' ? '《小愛心》：一顆粉粉的小愛心，掛著就覺得暖暖的。' : '《午後草原》：晴朗的天空、綠綠的草地，還有一顆小太陽。', 4200);
  } else if (k === 'wreath') {
    const f = fxFest();
    toast(f === 'hw' ? '萬聖節快樂！花圈的小燈換成了萬聖節的顏色。' : f === 'xmas' ? '聖誕快樂！花圈的小燈換成了聖誕的顏色。' : '一圈小小的花圈，小燈輪流閃著。', 3200);
    sparkle(x, y, '#8fe09a');
  } else if (k === 'fireplace') {
    const on = !fxOn(hit, true); fxSet(hit, Object.assign({}, fxGet(hit), { on }));
    pop(x, y, on ? '生火' : '熄火', on ? '#ffb347' : '#cfd2d8'); if (on) sparkle(x, y, '#ff7a3c');
    fxSend({ id: hit.id, s: fxGet(hit) });
  } else if (k === 'globe') {
    const until = performance.now() + 1700; fxSpin[hit.id != null ? hit.id : 'g'] = until;
    if (hit.id == null) return;
    pop(x, y, '轉～', '#cfe8f7'); if (typeof hit.id === 'number') fxSend({ id: hit.id, a: 'spin' });
    let i; do { i = Math.floor(Math.random() * GLOBE_TIPS.length); } while (GLOBE_TIPS.length > 1 && i === fxLast); fxLast = i;
    setTimeout(() => { if (scene === 'house') toast(GLOBE_TIPS[i], 4800); }, 1700);
  } else if (k === 'clock') {
    const w = world(), m = Math.floor(w.min), ph = { dawn: '清晨', day: '白天', dusk: '黃昏', night: '夜晚' }[phaseOf(m)] || '';
    const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
    const wx = w.wet ? (w.snow ? '下雪' : '下雨') : '晴天';
    pop(x, y, hh + ':' + mm, '#ffffff'); toast('現在 ' + hh + ':' + mm + '，' + ph + '，' + wx, 3200);
  } else if (k === 'vase') {
    const n = (vaseC(hit) + 1) % 5; fxSet(hit, Object.assign({}, fxGet(hit), { c: n }));
    pop(x, y, n ? '插上' + VASE_N[n - 1] : '拿掉花', n ? VASE_C[n - 1] : '#cfd2d8'); if (n) sparkle(x, y, VASE_C[n - 1]);
    fxSend({ id: hit.id, s: fxGet(hit) });
  } else if (k === 'plant') {
    const busy = fxStroke[hit.id] > performance.now() + 600;   // 剛摸過就不重複廣播
    fxStroke[hit.id] = performance.now() + 1500;
    if (!busy) fxSend({ id: hit.id, a: 'stroke' });
    pop(x, y, ['好舒服～', '沙沙～', '搖啊搖～', '蹭蹭～'][Math.floor(Math.random() * 4)], '#d6f5d6'); sparkle(x, y, '#8fe09a');
  }
}

/* ---------- 室內夜色與光暈：天黑或下雨時房間會暗一點，開著的檯燈、壁爐照亮周圍 ---------- */
function drawHouseLight(now, w, dark) {
  if (scene !== 'house' || !house || edit.on) return;
  const dim = Math.max(dark * 0.36, w.wet ? 0.14 : 0);
  if (dim <= 0.01) return;
  r('rgba(40,36,80,' + dim.toFixed(3) + ')', 0, 0, W * T, H * T);
  const k = Math.min(1, Math.max(0.4, dim / 0.3));
  const LIGHT = { lamp: [38, '255,214,120', 0], lantern: [30, '255,110,80', 0], fireplace: [58, '255,150,70', 1] };
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  house.items.forEach(it => {
    const L = LIGHT[it.k]; if (!L || !fxOn(it, it.k === 'fireplace')) return;
    const rc = itemRect(it); if (!rc) return;
    const cx = Math.round((RX + rc.x + rc.w / 2) * T), cy = Math.round((RY + rc.y + rc.h / 2) * T) + (it.k === 'fireplace' ? 3 : -3);
    const rad = L[0] + (L[2] ? Math.round(Math.sin(now / 130 + it.id) * 2) : 0);
    ctx.fillStyle = 'rgba(' + L[1] + ',' + (0.05 * k).toFixed(3) + ')';
    for (let q = rad; q > 6; q -= 5) { ctx.beginPath(); ctx.arc(cx, cy, q, 0, 7); ctx.fill(); }
  });
  ctx.restore();
}

/* ---------- 即時同步：同一間屋子裡的人會看到彼此開關的燈、摸貓、轉地球儀、摸盆栽 ----------
   用屋子的即時頻道廣播（和電視換頻道同一種做法，不用改資料庫）。
   在自己家：朋友按的燈會存進你自己的狀態；拜訪別人時：只在這次有效。
   新來的人會向屋主要一次目前的狀態（屋主在線才有）。盆栽的葉子誰都能摸；舊的開花狀態只有屋主說了算。 */
const FX_SYNC = { lamp: 1, lantern: 1, fireplace: 1, plant: 1, vase: 1 };
function fxSend(p) {
  try { if (net && net.ch && scene === 'house') net.ch.send({ type: 'broadcast', event: 'fx', payload: Object.assign({ i: myUid }, p) }); } catch (e) { /* 略過 */ }
}
function fxClean(k, s) {
  if (!s || typeof s !== 'object') return null;
  if (k === 'plant') { const n = s.n | 0, d = s.d | 0; return n >= 0 && n <= 9999 ? { n, d } : null; }
  if (k === 'vase') { const c = s.c | 0; return c >= 0 && c <= 4 ? { c } : null; }
  return { on: !!s.on };
}
function fxSnap() {
  const o = {};
  if (house) house.items.forEach(it => { if (FX_SYNC[it.k] && typeof it.id === 'number' && fxState[it.id]) o[it.id] = fxState[it.id]; });
  return o;
}
function fxJoined() {                                // 頻道連上時由 village.js 呼叫
  if (scene !== 'house' || !house) return;
  if (visiting) fxSend({ q: 1 });                    // 訪客：向屋主要目前的狀態
  else fxSend({ snap: fxSnap() });                   // 屋主：把目前的狀態告訴已經在屋裡的人
}
function onFx(p) {
  if (!p || p.i === myUid || scene !== 'house' || !house) return;
  const ownerUid = visiting ? visiting.uid : myUid;
  if (p.q) { if (!visiting) fxSend({ snap: fxSnap(), to: p.i }); return; }
  if (p.snap) {
    if (!visiting || p.i !== ownerUid || (p.to && p.to !== myUid) || typeof p.snap !== 'object') return;
    Object.keys(p.snap).forEach(id => {
      const it = house.items.find(x => x.id === +id && FX_SYNC[x.k]), s = it && fxClean(it.k, p.snap[id]);
      if (s) fxTmp[it.id] = s;
    });
    return;
  }
  const it = house.items.find(x => x.id === +p.id);
  if (!it) return;
  if (p.a === 'pet' && it.k === 'cat') { fxPet[it.id] = performance.now() + 1500; return; }
  if (p.a === 'stroke' && it.k === 'plant') { fxStroke[it.id] = performance.now() + 1500; return; }
  if (p.a === 'spin' && it.k === 'globe') { fxSpin[it.id] = performance.now() + 1700; return; }
  if (p.s && FX_SYNC[it.k]) {
    if (it.k === 'plant' && p.i !== ownerUid) return;   // 舊的開花狀態只認屋主
    const s = fxClean(it.k, p.s); if (s) fxSet(it, s);
  }
}
