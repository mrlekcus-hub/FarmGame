'use strict';
/* 家具互動：檯燈、壁爐、地球儀、掛鐘、盆栽 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   狀態只存在這台裝置（localStorage 'dw_fx'，用家具編號當 key，和電視頻道同一種做法），不需要改資料庫。 */

let FXIT = null;                                    // drawFurn 正在畫的那件家具；預覽、背包圖示沒有家具時是 null
const FX_KEY = 'dw_fx';
let fxState = {}, fxTmp = {}, fxSpin = {}, fxLast = -1, fxLampTold = false;
try { fxState = JSON.parse(localStorage.getItem(FX_KEY) || '{}') || {}; } catch (e) { fxState = {}; }
const fxBox = () => (visiting ? fxTmp : fxState);   // 拜訪朋友時只在這次有效，不寫進自己的存檔
const fxGet = it => (it && it.id != null && fxBox()[it.id]) || null;
function fxSet(it, v) {
  fxBox()[it.id] = v;
  if (!visiting) try { localStorage.setItem(FX_KEY, JSON.stringify(fxState)); } catch (e) { /* 略過 */ }
}
const fxOn = (it, def) => { const v = fxGet(it); return v && v.on != null ? !!v.on : def; };
const fxDay = () => Math.floor((srvNow() + 8 * 3600000) / 86400000);   // 以 GMT+8 算「今天」，和世界時間一致

/* ---------- 盆栽成長：每天澆水一次，累積天數 → 嫩芽（0～2 天）／長葉（3～6 天）／開花（7 天以上） ---------- */
const plantStage = it => { const v = fxGet(it); const n = v && v.n ? v.n | 0 : 0; return n >= 7 ? 2 : n >= 3 ? 1 : (v || !visiting) ? 0 : 1; };

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
FURN.plant = (px, py) => {
  const st = FXIT ? plantStage(FXIT) : 1;
  ob('#ff9b7a', '#c4603f', px + 4, py + 10, 8, 5);
  if (st === 0) { r('#7fd08a', px + 7, py + 6, 1, 5); r('#a8ecaa', px + 5, py + 5, 3, 2); r('#a8ecaa', px + 8, py + 4, 3, 2); }
  else {
    rr('#7fd08a', px + 2, py + 5, 6, 6); rr('#7fd08a', px + 8, py + 4, 6, 7); rr('#a8ecaa', px + 5, py + 1, 6, 8); r('#c6f5c6', px + 6, py + 3, 1, 2);
    if (st === 2) {
      r('#ff8fa8', px + 3, py + 3, 3, 3); r('#ffd27a', px + 4, py + 4, 1, 1);
      r('#ffffff', px + 10, py + 2, 3, 3); r('#ffd27a', px + 11, py + 3, 1, 1);
      r('#c9a8f5', px + 6, py + 0, 3, 3); r('#ffd27a', px + 7, py + 1, 1, 1);
    }
  }
};

/* ---------- 按動作鍵 ---------- */
const FX_ACT = { lamp: 1, fireplace: 1, globe: 1, clock: 1, plant: 1 };
function fxHint(hit) {
  if (edit.on || !FX_ACT[hit.k]) return '';
  if (hit.k === 'lamp') return '：按動作鍵' + (fxOn(hit, false) ? '關燈' : '開燈');
  if (hit.k === 'fireplace') return '：按動作鍵' + (fxOn(hit, true) ? '熄火' : '生火');
  if (hit.k === 'globe') return '：按動作鍵轉地球儀';
  if (hit.k === 'clock') return '：按動作鍵看時間';
  if (hit.k === 'plant') return visiting ? '' : '：按動作鍵澆水';
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
  const k = hit.k, needId = k === 'lamp' || k === 'fireplace' || k === 'plant';
  if (needId && (typeof hit.id !== 'number' || !isFinite(hit.id))) { toast('家具還在存檔，等一下再試', 1800); return; }
  if (k === 'lamp') {
    const on = !fxOn(hit, false); fxSet(hit, Object.assign({}, fxGet(hit), { on }));
    pop(x, y, on ? '亮了' : '關燈', '#fff3b0'); if (on) sparkle(x, y, '#ffe08a');
    if (on && !fxLampTold) { fxLampTold = true; toast('天黑或下雨的時候，檯燈會照亮周圍一圈', 3200); }
  } else if (k === 'fireplace') {
    const on = !fxOn(hit, true); fxSet(hit, Object.assign({}, fxGet(hit), { on }));
    pop(x, y, on ? '生火' : '熄火', on ? '#ffb347' : '#cfd2d8'); if (on) sparkle(x, y, '#ff7a3c');
  } else if (k === 'globe') {
    const until = performance.now() + 1700; fxSpin[hit.id != null ? hit.id : 'g'] = until;
    if (hit.id == null) return;
    pop(x, y, '轉～', '#cfe8f7');
    let i; do { i = Math.floor(Math.random() * GLOBE_TIPS.length); } while (GLOBE_TIPS.length > 1 && i === fxLast); fxLast = i;
    setTimeout(() => { if (scene === 'house') toast(GLOBE_TIPS[i], 4800); }, 1700);
  } else if (k === 'clock') {
    const w = world(), m = Math.floor(w.min), ph = { dawn: '清晨', day: '白天', dusk: '黃昏', night: '夜晚' }[phaseOf(m)] || '';
    const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
    const wx = w.wet ? (w.snow ? '下雪' : '下雨') : '晴天';
    pop(x, y, hh + ':' + mm, '#ffffff'); toast('現在 ' + hh + ':' + mm + '，' + ph + '，' + wx, 3200);
  } else if (k === 'plant') {
    if (visiting) { pop(x, y, '這是朋友的盆栽', '#fff3b0'); return; }
    const v = fxGet(hit) || {}, today = fxDay();
    if (v.d === today) { pop(x, y, '今天澆過了', '#cfe8f7'); return; }
    const before = plantStage(hit); fxSet(hit, { n: (v.n | 0) + 1, d: today });
    splash(x, y); pop(x, y, '澆水！', '#8fd3f4');
    const after = plantStage(hit);
    if (after > before) toast(after === 2 ? '盆栽開花了！' : '盆栽長出葉子了', 2600);
  }
}

/* ---------- 室內夜色與光暈：天黑或下雨時房間會暗一點，開著的檯燈、壁爐照亮周圍 ---------- */
function drawHouseLight(now, w, dark) {
  if (scene !== 'house' || !house || edit.on) return;
  const dim = Math.max(dark * 0.36, w.wet ? 0.14 : 0);
  if (dim <= 0.01) return;
  r('rgba(40,36,80,' + dim.toFixed(3) + ')', 0, 0, W * T, H * T);
  const k = Math.min(1, Math.max(0.4, dim / 0.3));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  house.items.forEach(it => {
    const lamp = it.k === 'lamp', fire = it.k === 'fireplace';
    if ((!lamp && !fire) || !fxOn(it, fire)) return;
    const rc = itemRect(it); if (!rc) return;
    const cx = Math.round((RX + rc.x + rc.w / 2) * T), cy = Math.round((RY + rc.y + rc.h / 2) * T) + (lamp ? -3 : 3);
    const rad = (lamp ? 38 : 58) + (fire ? Math.round(Math.sin(now / 130 + it.id) * 2) : 0);
    ctx.fillStyle = fire ? 'rgba(255,150,70,' + (0.05 * k).toFixed(3) + ')' : 'rgba(255,214,120,' + (0.05 * k).toFixed(3) + ')';
    for (let q = rad; q > 6; q -= 5) { ctx.beginPath(); ctx.arc(cx, cy, q, 0, 7); ctx.fill(); }
  });
  ctx.restore();
}
