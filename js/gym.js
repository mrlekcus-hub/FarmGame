'use strict';
/* 健身器材 ×5 —— 雷克斯農場。載入順序：放在 bath.js、toilets.js 之後（index.html）。
   treadmill 跑步機（1×2，1500G）：站上去原地跑步、滴汗，跑久了喘
   benchpress 臥推椅（2×2，2000G）：躺下推槓鈴，一下一下往上推
   punchbag 拳擊沙包（1×2，1500G）：戴拳套連續出拳，沙包大幅擺盪
   kettlebell 壺鈴（1×1，1000G）：雙手把壺鈴舉過頭，放下再舉
   squatrack 深蹲架（2×2，2000G）：背著槓鈴在架子裡一下一下深蹲
   使用是「維持性」的：按動作鍵上去之後會一直做，直到自己按方向鍵或動作鍵離開才停。
   走的是和體重計、淋浴間同一條同步路徑（坐 = 狀態碼 3、躺 = 狀態碼 4），所以朋友（含拜訪的人）都能用，也都看得到。
   伺服器家具目錄要有這 5 筆，見 gym.sql */

const GYM_KEYS = ['treadmill', 'benchpress', 'punchbag', 'kettlebell', 'squatrack'];

/* type：sit = 站著用（走 SEAT 'sit'）；lie = 躺著用（走 SEAT 'lie'）
   dx：畫人的位置要往左右偏多少像素（以置中為準）；tag：名牌要比人的頭頂再高多少；say／col：剛上去冒的字 */
const GYM = {
  treadmill:  { name: '跑步機',   type: 'sit', dx: 0,   tag: 7,  say: '衝啊！',   col: '#bfe6c0', hint: '上去跑步' },
  benchpress: { name: '臥推椅',   type: 'lie', dx: 0,   tag: 0,  say: '來一組！', col: '#ffb3c6', hint: '躺上去推' },
  punchbag:   { name: '拳擊沙包', type: 'sit', dx: -10, tag: 7,  say: '哈！',     col: '#ffd9e2', hint: '戴上拳套開打' },
  kettlebell: { name: '壺鈴',     type: 'sit', dx: 0,   tag: 23, say: '嘿咻！',   col: '#ffe08a', hint: '舉起來' },
  squatrack:  { name: '深蹲架',   type: 'sit', dx: 0,   tag: 8,  say: '深蹲！',   col: '#ffd9e2', hint: '站進去深蹲' }
};
GYM_KEYS.forEach(k => {
  SEAT[k] = GYM[k].type;
  BATH_ACT[k] = { hint: GYM[k].hint, ms: 0, say: GYM[k].say, col: GYM[k].col, done: null, toast: null };   // 讓提示字、拜訪記錄、動作鍵都走原本的「按動作鍵」流程
});

/* ---------- 小工具 ---------- */
const gymNow = () => performance.now();
/* 從「看到有人在用」開始，連續用了多久（毫秒）。中間超過 0.7 秒沒畫就當作換人了，重新算。 */
const gymSeen = new Map();
function gymEl(it, now) {
  const s = gymSeen.get(it.id);
  if (!s || now - s.last > 700) { gymSeen.set(it.id, { t0: now, last: now }); return 0; }
  s.last = now; return now - s.t0;
}
const gymLegCol = ch => ((ch || {}).gender === 1 && ![2, 8, 10, 11, 15, 16].includes((ch || {}).fits | 0)) ? '#6d7fa8' : '#8a5a44';
/* 器材正在被用的話，家具本體要讓位（槓鈴、壺鈴會跑到人身上） */
const gymBusy = () => (typeof FXIT !== 'undefined' && FXIT) ? seatOcc(FXIT) : false;
const gymSkin = ch => SKINS[(ch || DEF_CHAR).skin] || SKINS[0];
function gymSay(txt, cx, cy, col) {
  g.font = '800 9px "Chiron GoRound TC", "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.lineWidth = 2; g.strokeStyle = '#6b4a3a'; g.strokeText(txt, cx, cy);
  g.fillStyle = col || '#ffffff'; g.fillText(txt, cx, cy);
}
/* 汗珠：頭兩側各一顆，往外往下滴 */
function gymSweat(px, py, now, seed) {
  for (let i = 0; i < 2; i++) {
    const ph = ((now / 650) + i * 0.5 + (seed || 0)) % 1, sx = px + (i ? 15 : 0) + Math.round(ph * (i ? 3 : -3)), sy = py + Math.round(ph * 9);
    g.globalAlpha = 1 - ph * 0.7; r('#8fd3f4', sx, sy, 1, 2); r('#ffffff', sx, sy, 1, 1); g.globalAlpha = 1;
  }
}
/* 人站的位置（16×16 的小人左上角）：站在器材最下面那一排、橫向置中，再加上 dx */
function gymPos(it) {
  const d = dimsOf(it.k, 0), G = GYM[it.k];
  return [(RX + it.x) * T + Math.round(d.w * T / 2 - 8) + G.dx, (RY + it.y + d.h - 1) * T];
}

/* ---------- 家具本體的樣子（沒人用的時候照設計圖，有人用的時候讓位給人） ---------- */
const GYM_SH = 'rgba(90,60,40,.18)';
FURN.treadmill = (px, py, now) => {
  const busy = gymBusy(), t = busy ? gymNow() : 0, sp = busy ? 45 : 60;
  r(GYM_SH, px + 1, py + 31, 14, 1);
  ob('#4a4f5c', '#2c2f38', px + 1, py + 10, 14, 20);
  r('#2c2f38', px + 3, py + 12, 10, 16);
  for (let i = 0; i < 4; i++) r('#6a7080', px + 3, py + 12 + ((i * 4 + (t / sp | 0)) % 16), 10, 1);
  r('#b0b6c0', px + 1, py + 2, 2, 10); r('#b0b6c0', px + 13, py + 2, 2, 10);
  ob('#6fa8dc', '#2c5a8a', px + 2, py + 1, 12, 5);
  r(busy && (t / 300 | 0) % 2 ? '#c6ffd0' : '#8fe09a', px + 4, py + 3, 3, 1); r('#ff8fa8', px + 9, py + 3, 2, 1);
};
FURN.benchpress = (px, py, now) => {
  const busy = gymBusy();
  r(GYM_SH, px + 2, py + 31, 28, 1);
  r('#b0b6c0', px + 8, py + 6, 2, 10); r('#b0b6c0', px + 22, py + 6, 2, 10);
  ob('#3a3f4a', '#22252c', px + 6, py + 19, 22, 6);
  ob('#e05a5a', '#9a2f2f', px + 6, py + 16, 20, 5);
  r('#22252c', px + 8, py + 25, 2, 6); r('#22252c', px + 24, py + 25, 2, 6);
  if (busy) return;                                    // 槓鈴在人手上，由 drawLying 畫
  const b = 0;
  r('#c9ced6', px + 1, py + 6 + b, 30, 2);
  [2, 26].forEach(a => ob('#2c2f38', '#111', px + a, py + 3 + b, 4, 8));
  [6, 22].forEach(a => ob('#555c6c', '#111', px + a, py + 4 + b, 3, 6));
};
/* 拳擊沙包：搖擺量 s 是沙包底部偏幾個像素，上段、中段依比例少偏一點，看起來像整條吊著晃 */
function bagBody(x, y, s) {
  const o = '#8a2420', c = '#d9453f', s1 = Math.round(s * 0.3), s2 = Math.round(s * 0.65);
  r(GYM_SH, x + 3, y + 31, 10, 1);
  r('#6a7080', x + 5, y, 6, 2); r('#b0b6c0', x + 7, y + 2, 2, 4);
  [[6, 12, s1], [12, 18, s2], [18, 24, s]].forEach(([a, b, off]) => { r(o, x + 4 + off, y + a, 8, b - a); r(c, x + 5 + off, y + a, 6, b - a); });
  r('#ffd34d', x + 4 + s2, y + 12, 8, 2);
  r('rgba(255,255,255,.35)', x + 5 + s1, y + 8, 1, 4); r('rgba(255,255,255,.35)', x + 5 + s2, y + 12, 1, 4);
  r(o, x + 5 + s, y + 24, 6, 2);
}
const bagSw = el => { const dt = ((el % 850) - 120 + 850) % 850; return Math.round(4 * Math.exp(-dt / 420) * Math.cos(dt / 110)); };   // 一拳打中後的阻尼擺盪（每 850 毫秒一拳，第 120 毫秒打中）
FURN.punchbag = (px, py, now) => {
  const busy = gymBusy(), s = busy ? bagSw(gymEl(FXIT, gymNow())) : Math.round(Math.sin((now || 0) / 700));
  bagBody(px, py, s);
};
FURN.kettlebell = (px, py, now) => {
  r(GYM_SH, px + 3, py + 15, 10, 1);
  if (gymBusy()) return;                               // 壺鈴在人手上
  kbBell(px, py);
};
function kbBell(x, y) {
  r('#2c2f38', x + 5, y + 2, 6, 1); r('#2c2f38', x + 4, y + 3, 2, 4); r('#2c2f38', x + 10, y + 3, 2, 4);
  ob('#3a3f4a', '#111', x + 3, y + 6, 10, 8); r('#6a7080', x + 5, y + 8, 2, 2); r('#ffd34d', x + 8, y + 10, 3, 2);
}
FURN.squatrack = (px, py, now) => {
  const busy = gymBusy();
  r(GYM_SH, px + 2, py + 31, 28, 1);
  r('#4a4f5c', px + 4, py + 2, 3, 28); r('#4a4f5c', px + 25, py + 2, 3, 28); r('#4a4f5c', px + 4, py + 2, 24, 3); r('#4a4f5c', px + 2, py + 29, 28, 2);
  r('#e05a5a', px + 7, py + 11, 3, 3); r('#e05a5a', px + 22, py + 11, 3, 3);
  if (!busy) { r('#c9ced6', px + 1, py + 9, 30, 2); [0, 28].forEach(a => ob('#2c2f38', '#111', px + a, py + 6, 4, 10)); }   // 槓鈴在人肩膀上，由 drawSeated 畫
  r('#ffd34d', px + 13, py + 5, 6, 2);
};

/* ---------- 站著用的器材：人怎麼動（自己和朋友的畫面都走 drawSeated） ---------- */
/* 每個函數收 (器材, 角色, 現在時間, 人的位置 x, y)，位置是 16×16 小人的左上角 */
const GYM_DRAW = {
  treadmill(it, ch, now, x, y) {                       // 原地跑，跑越久越喘
    const el = gymEl(it, now), ph = Math.floor(now / 120) % 2;
    drawPlayer(x, y, 'down', true, ph, ch);
    if (el > 2500) gymSweat(x, y, now, 0);
    if (el > 7000 && (el - 7000) % 4500 < 1700) gymSay('喘～', x + 8, y - 8 + Math.round(Math.sin(now / 200)), '#fff3b0');
  },
  punchbag(it, ch, now, x, y) {                        // 站在沙包左邊，一拳一拳打過去
    const el = gymEl(it, now), u = el % 850, ex = u < 120 ? u / 120 : u < 260 ? 1 - (u - 120) / 140 : 0;
    drawPlayerFx(x, y, 'right', false, 0, ch, { dx: ex > 0.5 ? 1 : 0, dy: 0, face: 'right', sy: 1, hand: 0, mv: false, ph: null });
    const skinO = shade(gymSkin(ch), 0.82), fx = x + 10 + Math.round(ex * 5) + (ex > 0.5 ? 1 : 0);
    r(skinO, x + 9, y + 7, fx - (x + 9), 2); ob('#e05a5a', '#9a2f2f', fx, y + 5, 4, 5); r('#ffb3b3', fx + 1, y + 6, 1, 1);
    if (el > 2500) gymSweat(x, y - 1, now, 0.3);
    const dt = ((el - 120) % 850 + 850) % 850, n = Math.floor((el - 120) / 850);
    if (el >= 120 && dt < 420) gymSay(['碰！', '啪！', '碰碰！', '哈！'][n % 4], x + 25, y - 6 - Math.round(dt / 140), '#ffe08a');
  },
  kettlebell(it, ch, now, x, y) {                      // 壺鈴舉過頭：舉起、停住、放下，循環
    const el = gymEl(it, now), u = (el % 2400) / 2400, ez = v => v * v * (3 - 2 * v);
    const h = u < 0.25 ? ez(u / 0.25) : u < 0.7 ? 1 : u < 0.95 ? 1 - ez((u - 0.7) / 0.25) : 0;
    const ky = Math.round(y - 1 - 16 * h), skin = gymSkin(ch), skinO = shade(skin, 0.82), shake = u >= 0.3 && u < 0.7 ? Math.round(Math.sin(now / 55)) : 0;
    drawPlayer(x, y, 'down', false, 0, ch);
    kbBell(x + shake, ky);
    const hy = ky + 3;                                 // 手握在把手兩端，手臂一路連到肩膀
    r(skinO, x + 2, hy, 2, y + 8 - hy); r(skinO, x + 12, hy, 2, y + 8 - hy);
    r(skin, x + 2, hy, 3, 2); r(skin, x + 11 + shake, hy, 3, 2); r(skin, x + 3, hy + 1, 1, 6); r(skin, x + 12, hy + 1, 1, 6);
    if (el > 4000) gymSweat(x, y, now, 0.6);
    if (u >= 0.25 && u < 0.42) gymSay('嘿咻！', x + 8, ky - 3, '#fff3b0');
  },
  squatrack(it, ch, now, x, y) {                       // 背著槓鈴在架子裡蹲下去、站起來
    const el = gymEl(it, now), n = Math.floor(el / 2400), d = 0.5 - 0.5 * Math.cos((el % 2400) / 2400 * Math.PI * 2), sy = 1 - d * 0.28;
    drawPlayerFx(x, y, 'down', false, 0, ch, { dx: 0, dy: 0, face: 'down', sy, hand: 0, mv: false, ph: null });
    const by = Math.round(y + 14 - 5 * sy), bx = x - 8, skin = gymSkin(ch);   // bx：架子左邊（人站在架子正中間）
    r('#c9ced6', bx + 1, by, 30, 2); [0, 28].forEach(a => ob('#2c2f38', '#111', bx + a, by - 3, 4, 8)); [4, 24].forEach(a => ob('#555c6c', '#111', bx + a, by - 2, 3, 6));
    r(skin, x - 1, by, 3, 2); r(skin, x + 14, by, 3, 2);
    if (el > 3000) gymSweat(x, y - 1 + Math.round(d * 3), now, 0.2);
    if (n % 2 === 1 && d > 0.85) gymSay('嘿！', x + 8, y - 9 + Math.round(d * 3), '#fff3b0');
  }
};
const _drawSeatedG0 = drawSeated;
drawSeated = function (px, py, it, ch, tile) {
  const f = GYM_DRAW[it.k];
  if (!f || !GYM[it.k] || GYM[it.k].type !== 'sit') return _drawSeatedG0(px, py, it, ch, tile);
  const q = gymPos(it); f(it, ch, gymNow(), q[0], q[1]);
};

/* 名牌：站著用的器材名牌放在小人頭頂，位置不跟著 px 走（置中、偏移都已經算在 gymPos 裡）；其餘照舊 */
function seatNameTag(name, it, px, py, col) {
  const G = GYM[it.k];
  if (G && G.type === 'sit') { const q = gymPos(it); nameTag(name, q[0] + 8, q[1] - G.tag, col); return; }
  nameTag(name, px + 8, py - (it.k === 'shower' ? 19 : it.k === 'scale' ? 29 : 7), col);
}
const _bedTagG0 = bedTag;
bedTag = function (it, slot) { return it.k === 'benchpress' ? bedPt(it, 16, -3) : _bedTagG0(it, slot); };

/* ---------- 臥推椅：躺著，槓鈴自己一下一下往上推（人和槓鈴一起跟著家具轉向、翻轉） ---------- */
function benchPerson(it, ch, x, y, now) {
  const el = gymEl(it, now), u = (el % 2200) / 2200, p = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);   // 0 在胸口、1 推到頂
  const skin = gymSkin(ch), skinO = shade(skin, 0.82), hair = HAIRS[ch.hair] || HAIRS[0], fit = OUTFITS[ch.outfit] || OUTFITS[0], legc = gymLegCol(ch);
  ob(legc, shade(legc, 0.8), x + 23, y + 12, 8, 5); r('#8a5a44', x + 30, y + 13, 2, 4);         // 腿和鞋子伸到椅子外面
  ob(fit, shade(fit, 0.8), x + 12, y + 11, 12, 7);                                              // 身體
  const hx = x + 5, hy = y + 10;                                                                  // 頭靠在椅子左端
  ob(skin, skinO, hx, hy, 8, 7); r(hair, hx, hy, 8, 3); r(hair, hx, hy + 1, 1, 3); r(hair, hx + 7, hy + 1, 1, 3);
  r('#4a2c2c', hx + 2, hy + 4, 2, 1); r('#4a2c2c', hx + 5, hy + 4, 2, 1); r('#ffa0b0', hx + 1, hy + 5, 1, 1); r('#ffa0b0', hx + 7, hy + 5, 1, 1);
  const by = y + 9 - Math.round(6 * p);                                                           // 槓鈴高度
  r(skinO, x + 14, by + 1, 2, y + 12 - (by + 1)); r(skinO, x + 20, by + 1, 2, y + 12 - (by + 1)); // 兩隻手臂
  r('#c9ced6', x + 1, by, 30, 2);
  [2, 26].forEach(a => ob('#2c2f38', '#111', x + a, by - 3, 4, 8)); [6, 22].forEach(a => ob('#555c6c', '#111', x + a, by - 2, 3, 6));
  r(skin, x + 14, by, 3, 2); r(skin, x + 20, by, 3, 2);
  if (el > 3000) gymSweat(hx - 1, hy - 4, now, 0.4);
  return { el, u, by, top: p > 0.85 };
}
const _drawLyingG0 = drawLying;
drawLying = function (it, ch, slot) {
  if (it.k !== 'benchpress') return _drawLyingG0(it, ch, slot);
  const d0 = defOf(it.k), rt = (it.r | 0) & 3, now = gymNow();
  let bx = (RX + it.x) * T, by = (RY + it.y) * T, info;
  g.save();
  if (rt && d0) {                                                                                  // 和 drawFurn 一樣：以轉過之後的佔格中心為軸旋轉
    const rw = rt & 1 ? d0.h : d0.w, rh = rt & 1 ? d0.w : d0.h;
    g.translate(bx + rw * T / 2, by + rh * T / 2); g.rotate(rt * Math.PI / 2); g.translate(-d0.w * T / 2, -d0.h * T / 2);
    bx = 0; by = 0;
  }
  if (it.f && d0) { g.translate(2 * bx + d0.w * T, 0); g.scale(-1, 1); }
  const y0 = by;
  info = benchPerson(it, ch, bx, by, now);
  g.restore();
  if (Math.floor(info.el / 2200) % 2 === 1 && info.top) { const q = bedPt(it, 16, info.by - y0 - 6); gymSay('嘿！', q[0], q[1], '#fff3b0'); }   // 文字在旋轉之外畫，才不會跟著倒過來
};

/* ---------- 按動作鍵：上去用（維持到自己離開） ---------- */
function gymEnter(it, x, y) {
  const G = GYM[it.k], d = dimsOf(it.k, it.r | 0);
  if (!G || !d || pose || fishing || cooking) return;
  if ((it.r | 0) !== 0 && G.type !== 'lie') { toast('轉過方向的' + G.name + '不能用，轉回原位就可以了', 2200); return; }   // 躺著用的可以轉方向，站著用的轉回原位
  if (seatTaken(it)) { toast(G.name + '已經有人在用了', 1400); return; }
  let tx = x, ty = y;
  if (G.type === 'sit') { tx = Math.max(RX + it.x, Math.min(RX + it.x + d.w - 1, x)); ty = RY + it.y + d.h - 1; }   // 站在最下面那一排；朋友的畫面靠這格找出你用的是哪一件
  pose = { type: G.type, id: it.id, ix: it.x, iy: it.y, ox: pl.x, oy: pl.y, face0: pl.face, tile: 0, slot: 0, sort: RY + it.y + d.h - 1 + 0.02, t: 0, gym: it.k };
  pl.x = pl.sx = tx; pl.y = pl.sy = ty; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  pop(tx, ty - (G.type === 'lie' ? 0.6 : 1.2), G.say, G.col);
  lastPosKey = ''; posAcc = 999; trackSelf();          // 讓同一間屋子裡的人看到我在用
}
const _bathActG0 = bathAct;
bathAct = function (it, x, y) { if (GYM[it.k]) return gymEnter(it, x, y); return _bathActG0(it, x, y); };
