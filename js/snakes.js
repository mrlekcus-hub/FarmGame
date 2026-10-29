'use strict';
/* 蛇梯棋（廣場左上角）—— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 蛇梯棋：1～4 人（單人也能玩，可加電腦），外觀是「秋楓橘」6×6 棋盤，在廣場上縮成 4×4 格，放在地圖左上角 (2,2)～(5,5) ----------
   沒有後端：靠廣場的即時頻道（事件 snl）同步。房主（開桌的人）是唯一的裁判：擲骰、移動都由房主算，
   其他人只送「我要擲骰／加入／離開」，收到的狀態一律當作不可信資料先檢查再用。 */
const SN_COLS = ['#ff6a8a', '#5ab0f0', '#ffd34d', '#7ad66a'];
const SN_LAD = [[2, 14], [22, 34], [8, 20]], SN_SNK = [[24, 12], [33, 9], [30, 18]];
const SN_LINK = {}; SN_LAD.forEach(([a, b]) => { SN_LINK[a] = b; }); SN_SNK.forEach(([a, b]) => { SN_LINK[a] = b; });
const SN_X = 2 * 16, SN_Y = 2 * 16, SN_PX = 64;   // 棋盤在廣場上的像素位置與大小：縮成 4×4 格（tile 2..5），整張圖由 100×100 縮小；點開來玩時還是原大小
const SN_STEP = 220, SN_SLIDE = 650, SN_TURN_MS = 45000;
const SN_D = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
function snDisc(g2, cx, cy, rad, col) { g2.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy); for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) g2.fillRect(cx + x, cy + y, 1, 1); }

/* ---------- 像素小圖（取代 emoji：舊手機沒有字型會變方框）。每張用字母對照色盤，畫成 canvas 再轉成圖 ---------- */
const SN_SPR = {
  ladder: { p: { R: '#7a4a2a', L: '#e0a060' }, r: ['..R......R..', '..R......R..', '..RLLLLLLR..', '..R......R..', '..R......R..', '..RLLLLLLR..', '..R......R..', '..R......R..', '..RLLLLLLR..', '..R......R..', '..R......R..', '..RLLLLLLR..'] },
  snake: { p: { A: '#ffb03a', B: '#e0483c', W: '#ffffff', K: '#2a1a1a', T: '#ff4a6a' }, r: ['...BBBB.....', '..BWKBBB....', '..BBBBBBT...', '..AAAAA.....', '...BBBB.....', '......AAA...', '......AAA...', '...BBBB.....', '..AAA.......', '..AAA.......', '...BBBBBB...', '........AA..'] },
  dice: { p: { K: '#5a2a1a', W: '#fff6e0', R: '#e0483c' }, r: ['.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWRRWWWWWWWK', 'KWRRWWWWWWWK', 'KWWWWWWWWWWK', 'KWWWWRRWWWWK', 'KWWWWRRWWWWK', 'KWWWWWWWWWWK', 'KWWWWWWWRRWK', 'KWWWWWWWRRWK', 'KWWWWWWWWWWK', '.KKKKKKKKKK.'] },
  trophy: { p: { G: '#c9962a', Y: '#ffd34d' }, r: ['GGGGGGGGGGGG', 'GYYYYYYYYYYG', 'GYYYYYYYYYYG', '.GYYYYYYYYG.', '..GYYYYYYG..', '...GYYYYG...', '....GYYG....', '.....GG.....', '.....GG.....', '....GGGG....', '...GGGGGG...', '...GGGGGG...'] },
  crown: { p: { Y: '#ffd34d', G: '#c9962a', R: '#e0483c' }, r: ['Y....YY....Y', 'YY..YYYY..YY', 'YYYYYYYYYYYY', 'YYYYYRRYYYYY', 'YYYYYYYYYYYY', 'GGGGGGGGGGGG'] },
  bot: { p: { K: '#3a2a2a', G: '#b4b8c4', B: '#5ab0f0' }, r: ['.....KK.....', '..KKKKKKKK..', '.KGGGGGGGGK.', '.KGBBGGBBGK.', '.KGGGGGGGGK.', '.KGKKKKKKGK.', '.KGGGGGGGGK.', '..KKKKKKKK..', '..KGGGGGGK..', '.KKGGGGGGKK.', '..KK....KK..', '..KK....KK..'] },
  eye: { p: { K: '#5a2a1a', W: '#ffffff', I: '#5ab0f0', P: '#2a1a1a' }, r: ['...KKKKKK...', '.KKWWWWWWKK.', 'KWWWIIIIWWWK', 'KWWWIPPIWWWK', 'KWWWIPPIWWWK', '.KKWWIIWWKK.', '...KKKKKK...'] },
  wdice: { p: { K: '#5a2a1a', W: '#fff6e0', R: '#e0483c' }, r: ['.KKKKKK.', 'KWWWWWWK', 'KWRWWRWK', 'KWWWWWWK', 'KWWWWWWK', 'KWRWWRWK', 'KWWWWWWK', '.KKKKKK.'] },
  weye: { p: { K: '#5a2a1a', W: '#ffffff', I: '#5ab0f0', P: '#2a1a1a' }, r: ['..KKKKK..', '.KWWWWWK.', 'KWWIPIWWK', '.KWWIWWK.', '..KKKKK..'] }
};
const snSprCache = {};
function snSprCanvas(name, sc) {
  const key = name + '@' + sc; if (snSprCache[key]) return snSprCache[key];
  const d = SN_SPR[name], cv = document.createElement('canvas'); cv.width = d.r[0].length * sc; cv.height = d.r.length * sc;
  const g2 = cv.getContext('2d');
  d.r.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = d.p[row[i]]; if (c) { g2.fillStyle = c; g2.fillRect(i * sc, j * sc, sc, sc); } } });
  return (snSprCache[key] = cv);
}
const snIcoUrl = {};
function snIcon(name, w) {   // 放在文字旁邊的小圖
  if (!snIcoUrl[name]) snIcoUrl[name] = snSprCanvas(name, 4).toDataURL();
  return '<img class="snico" src="' + snIcoUrl[name] + '" width="' + w + '" alt="">';
}
const snEl = $('snm'), snCard = $('sncard');
let snOpen = false, sn = null, snArt = null, snAnims = {}, snSeen = -1, snRollOk = 0, snBusy = 0, snGone = {}, snHostGone = 0, snDue = 0, snDueMv = -1, snUiKey = '', snRaf = 0, snWatchAt = 0, snChat = [], snChatGid = '', snChatAt = 0;

/* ---------- 畫棋盤（低解析度 100×100，1 格 16 像素，和廣場的 tile 一樣大） ---------- */
const snCell = n => { const i = n - 1, rw = Math.floor(i / 6), c = rw % 2 ? 5 - i % 6 : i % 6; return { x: 2 + c * 16, y: 2 + (5 - rw) * 16 }; };
const snCtr = n => { const c = snCell(n); return [c.x + 8, c.y + 8]; };
const snR = (g2, c, x, y, w, h) => { g2.fillStyle = c; g2.fillRect(Math.round(x), Math.round(y), w, h); };
function snNum(g2, n, x, y, c) { String(n).split('').forEach((d, i) => { const s = SN_D[d]; for (let k = 0; k < 15; k++) if (s[k] === '1') snR(g2, c, x + i * 4 + k % 3, y + Math.floor(k / 3), 1, 1); }); }
function snLadder(g2, a, b) {
  const [x1, y1] = snCtr(a), [x2, y2] = snCtr(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), px = -dy / L, py = dx / L, o = 3;
  for (let s = 0; s <= L; s++) { const t = s / L, x = x1 + dx * t, y = y1 + dy * t; [-1, 1].forEach(sd => { snR(g2, 'rgba(0,0,0,.18)', x + px * o * sd + 1, y + py * o * sd + 1, 2, 2); snR(g2, '#7a4a2a', x + px * o * sd, y + py * o * sd, 2, 2); }); }
  for (let s = 3; s < L; s += 5) { const t = s / L, x = x1 + dx * t, y = y1 + dy * t; for (let k = -o; k <= o; k++) snR(g2, '#e0a060', x + px * k, y + py * k, 2, 1); }
}
function snSnake(g2, a, b) {
  const [x1, y1] = snCtr(a), [x2, y2] = snCtr(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), px = -dy / L, py = dx / L;
  const P = t => { const w = Math.sin(t * Math.PI * 3) * 4; return [x1 + dx * t + px * w, y1 + dy * t + py * w]; };
  const N = Math.floor(L * 1.4);
  for (let i = N; i >= 0; i--) { const t = i / N, [x, y] = P(t); snDisc(g2, x + 1, y + 1, t > 0.85 ? 1 : 2, 'rgba(0,0,0,.18)'); }
  for (let i = N; i >= 0; i--) { const t = i / N, [x, y] = P(t); snDisc(g2, x, y, t > 0.85 ? 1 : (t < 0.08 ? 3 : 2), Math.floor(i / 3) % 2 ? '#e0483c' : '#ffb03a'); }
  const [hx, hy] = P(0);
  snDisc(g2, hx, hy, 3, '#e0483c'); snR(g2, '#fff', hx - 2, hy - 2, 2, 2); snR(g2, '#fff', hx + 1, hy - 2, 2, 2); snR(g2, '#2a1a1a', hx - 1, hy - 2, 1, 2); snR(g2, '#2a1a1a', hx + 2, hy - 2, 1, 2);
  snR(g2, '#ff4a6a', hx, hy + 2, 1, 2); snR(g2, '#ff4a6a', hx - 1, hy + 3, 3, 1);
}
function snBuildArt() {
  if (snArt) return snArt;
  snArt = document.createElement('canvas'); snArt.width = snArt.height = 100;
  const g2 = snArt.getContext('2d'); g2.imageSmoothingEnabled = false;
  snR(g2, '#8a4a2a', 0, 0, 100, 100); snR(g2, '#c07a4a', 1, 1, 98, 1); snR(g2, '#5a2a1a', 0, 98, 100, 2); snR(g2, '#e8a050', 2, 2, 96, 96);
  for (let n = 1; n <= 36; n++) {
    const c = snCell(n);
    snR(g2, '#ffdca8', c.x, c.y, 16, 16); snR(g2, '#e8a050', c.x, c.y + 15, 16, 1); snR(g2, '#e8a050', c.x + 15, c.y, 1, 16);
    if (n % 4 === 0) { snR(g2, ['#e0483c', '#fff', '#ffd34d'][n % 3], c.x + 11, c.y + 10, 1, 1); snR(g2, ['#e0483c', '#fff', '#ffd34d'][(n + 1) % 3], c.x + 12, c.y + 10, 1, 1); }
    snNum(g2, n, c.x + 2, c.y + 2, '#8a3a1a');
  }
  [[0, 0], [96, 0], [0, 96], [96, 96]].forEach(([x, y]) => snR(g2, '#5a2a1a', x, y, 4, 4));
  SN_LAD.forEach(([a, b]) => snLadder(g2, a, b)); SN_SNK.forEach(([a, b]) => snSnake(g2, a, b));
  { const c = snCell(36), cx = c.x + 11, cy = c.y + 11;
    snR(g2, '#c9962a', cx - 1, cy - 4, 3, 9); snR(g2, '#c9962a', cx - 4, cy - 1, 9, 3); snR(g2, '#ffd34d', cx - 1, cy - 3, 3, 7); snR(g2, '#ffd34d', cx - 3, cy - 1, 7, 3); snR(g2, '#fff6c8', cx - 1, cy - 1, 3, 3); }
  { const c = snCell(1); snR(g2, '#5a3a2a', c.x + 10, c.y + 3, 1, 10); snR(g2, '#ff6a8a', c.x + 11, c.y + 3, 4, 3); }   // 起點小旗
  return snArt;
}

/* ---------- 規則 ---------- */
function snPath(from, roll) {   // 走到 36 要剛好，多出來的步數往回退
  const cells = []; let p = from, dir = 1;
  for (let i = 0; i < roll; i++) { if (p === 36) dir = -1; p += dir; cells.push(p); }
  return cells;
}
const snAnimMs = l => l.path.length * SN_STEP + (l.k ? SN_SLIDE : 0);
const snSeatOf = id => sn ? sn.seats.findIndex(s => s.id === id) : -1;
const snName = id => id === myUid ? (me ? me.name : '你') : ((remotes.get(id) || {}).name || '旅人');
const snIsHost = () => !!sn && sn.host === myUid;
function snSend(p) {
  if (!(net && net.ok && syncScene())) return;
  try { net.ch.send({ type: 'broadcast', event: 'snl', payload: p }); } catch (e) { /* 略過 */ }
}
function snBroadcast() { if (sn && snIsHost()) snSend({ t: 'st', i: myUid, s: sn }); }
function snPush() { sn.seq = (sn.seq | 0) + 1; snBroadcast(); snRenderUi(); }
function snRemoveSeat(k) {
  const was = sn.seats[k]; sn.seats.splice(k, 1);
  if (was) delete snAnims[was.id];
  if (!sn.seats.length || !sn.seats.some(s => !s.bot)) { snClear(); return false; }
  if (sn.ph === 'play') { if (k < sn.turn) sn.turn--; if (sn.turn >= sn.seats.length) sn.turn = 0; }
  if (sn.ph === 'end') sn.win = -1, sn.ph = 'lobby';
  return true;
}
function snClear() { const was = snIsHost(); if (was) snSend({ t: 'st', i: myUid, s: null }); sn = null; snAnims = {}; snRenderUi(); }
function snNewTable() {
  sn = { gid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), seq: 1, host: myUid, ph: 'lobby', seats: [], spec: [], turn: 0, mv: 0, win: -1, last: null, msg: '' };
  snJoin(myUid, false);
  sn.msg = '桌子開好了！可以加電腦，或等朋友加入。'; snPush();
}
function snJoin(id, bot) {
  if (sn.seats.length >= 4 || snSeatOf(id) >= 0 && !bot) return;
  const si = sn.spec.indexOf(id); if (si >= 0) sn.spec.splice(si, 1);   // 坐下就不再是觀戰者
  const used = new Set(sn.seats.map(s => s.col)); let col = 0; while (used.has(col)) col++;
  const nb = sn.seats.filter(s => s.bot).length + 1;
  sn.seats.push({ id: bot ? 'bot' + nb + '-' + Math.random().toString(36).slice(2, 5) : id, name: bot ? '電腦' + nb : clean(snName(id), 8) || '旅人', col, pos: 1, bot: !!bot });
}
function snRoll() {
  const k = sn.turn, s = sn.seats[k], roll = 1 + Math.floor(Math.random() * 6), path = snPath(s.pos, roll), end = path[path.length - 1];
  const to = SN_LINK[end] || end, kind = SN_LINK[end] ? (SN_LINK[end] > end ? 'ladder' : 'snake') : '';
  s.pos = to; sn.mv = (sn.mv | 0) + 1; sn.last = { id: s.id, roll, path, to, k: kind, n: sn.mv };
  let m = s.name + ' 擲出 ' + roll + '，走到 ' + end + (kind === 'ladder' ? '，爬上梯子到 ' + to + '！' : kind === 'snake' ? '，被蛇咬了，滑到 ' + to + '…' : '');
  if (to === 36) { sn.ph = 'end'; sn.win = k; m = s.name + ' 到達終點！（擲出 ' + roll + '）'; }
  else if (roll === 6) m += ' 再擲一次！';
  else sn.turn = (k + 1) % sn.seats.length;
  sn.msg = m;
  snBusy = performance.now() + snAnimMs(sn.last) + 400;
  snStartAnim(sn.last, true);
}
function snStartAnim(l, mine) {
  if (!l || l.n <= snSeen) return;
  snSeen = l.n;
  if (!mine) snRollOk = performance.now() + snAnimMs(l) + 300; else snRollOk = snBusy;
  const times = []; let t = 0;
  l.path.forEach(() => { t += SN_STEP; times.push(t); });
  const cells = l.path.slice();
  if (l.k) { cells.push(l.to); t += SN_SLIDE; times.push(t); }
  snAnims[l.id] = { cells, times, t0: performance.now() };
}
function snApply(from, a) {   // 只有房主會走到這裡
  if (!sn || !snIsHost()) return;
  const k = snSeatOf(from), now = performance.now();
  if (a === 'watch') { if (k < 0 && !sn.spec.includes(from) && sn.spec.length < 8) { sn.spec.push(from); snPush(); } return; }
  if (a === 'unwatch') { const si = sn.spec.indexOf(from); if (si >= 0) { sn.spec.splice(si, 1); snPush(); } return; }
  if (a === 'join') { if (sn.ph === 'lobby' && k < 0 && sn.seats.length < 4) { snJoin(from, false); sn.msg = snName(from) + ' 加入了'; snPush(); } return; }
  if (a === 'leave') {
    if (k < 0) return;
    if (from === sn.host) {   // 房主離開：交給下一位真人
      const nx = sn.seats.find(s => !s.bot && s.id !== from);
      if (!nx) { snClear(); return; }
      sn.host = nx.id; sn.msg = snName(from) + ' 離開了，房主換成 ' + nx.name;
      if (snRemoveSeat(k)) { sn.seq = (sn.seq | 0) + 1; snSend({ t: 'st', i: myUid, s: sn, ho: true }); snRenderUi(); }
      return;
    }
    const nm = sn.seats[k].name; if (snRemoveSeat(k)) { sn.msg = nm + ' 離開了'; snPush(); } return;
  }
  if (a === 'bot') { if (from === sn.host && sn.ph === 'lobby' && sn.seats.length < 4) { snJoin('', true); sn.msg = '電腦加入了'; snPush(); } return; }
  if (a === 'rmbot') { if (from === sn.host && sn.ph === 'lobby') { const b = sn.seats.map(s => s.bot).lastIndexOf(true); if (b >= 0) { snRemoveSeat(b); sn.msg = '移除了一位電腦'; snPush(); } } return; }
  if (a === 'start') {
    if (from !== sn.host || sn.ph !== 'lobby' || !sn.seats.length) return;
    sn.ph = 'play'; sn.turn = 0; sn.win = -1; sn.last = null; sn.seats.forEach(s => { s.pos = 1; }); snAnims = {};
    sn.msg = '開始！輪到 ' + sn.seats[0].name + ' 擲骰子（擲到 6 可以再擲一次）'; snBusy = now + 300; snPush(); return;
  }
  if (a === 'again') { if (from === sn.host && sn.ph === 'end') { sn.ph = 'lobby'; sn.win = -1; sn.last = null; sn.turn = 0; sn.seats.forEach(s => { s.pos = 1; }); snAnims = {}; sn.msg = '再來一局！'; snPush(); } return; }
  if (a === 'roll') {
    if (sn.ph !== 'play' || now < snBusy) return;
    const s = sn.seats[sn.turn];
    if (!s || !(s.id === from || (s.bot && from === sn.host))) return;
    snRoll(); snPush();
  }
}
/* 房主定時檢查：電腦自動擲骰、真人太久沒動作代擲、有人離線就移出座位 */
function snTick() {
  if (!sn) return;
  const now = performance.now();
  if (snIsHost()) {
    if (sn.ph === 'play' && now >= snBusy) {
      const s = sn.seats[sn.turn];
      if (snDueMv !== sn.mv) { snDueMv = sn.mv; snDue = now + (s && s.bot ? 1100 : SN_TURN_MS); }
      if (s && now >= snDue) { snDueMv = -1; snApply(s.bot ? myUid : s.id, 'roll'); }
    }
    for (let i = sn.seats.length - 1; i >= 0 && sn; i--) {
      const s = sn.seats[i]; if (s.bot || s.id === myUid) continue;
      if (remotes.has(s.id)) { snGone[s.id] = 0; continue; }
      snGone[s.id] = (snGone[s.id] | 0) + 1;
      if (snGone[s.id] >= 6) { snGone[s.id] = 0; const nm = s.name; if (snRemoveSeat(i)) { sn.msg = nm + ' 離線了'; snPush(); } }
    }
    if (sn) for (let i = sn.spec.length - 1; i >= 0; i--) {   // 觀戰的人離線也要移掉
      const id = sn.spec[i];
      if (remotes.has(id)) { snGone[id] = 0; continue; }
      snGone[id] = (snGone[id] | 0) + 1;
      if (snGone[id] >= 6) { snGone[id] = 0; sn.spec.splice(i, 1); snPush(); }
    }
  } else if (!remotes.has(sn.host)) {
    snHostGone++;
    if (snHostGone >= 8) {   // 房主不見了：在場的真人座位中，排最前面的人接手（每個人算出來的結果一樣）
      snHostGone = 0;
      const nx = sn.seats.find(s => !s.bot && s.id !== sn.host && (s.id === myUid || remotes.has(s.id)));
      if (nx && nx.id === myUid) {
        const k = snSeatOf(sn.host); sn.host = myUid; if (k >= 0 && !snRemoveSeat(k)) return;
        sn.msg = '房主離開了，由你接手'; snPush();
      } else if (!nx) { sn = null; snAnims = {}; snRenderUi(); }
    }
  } else snHostGone = 0;
  if (sn && snSeatOf(myUid) < 0) {   // 面板開著就自動觀戰（頭上會出現眼睛），關掉就離開觀戰
    const inSpec = sn.spec.includes(myUid);
    if (snOpen && !inSpec && now >= snWatchAt) { snWatchAt = now + 2500; snAct('watch'); }
    else if (!snOpen && inSpec && now >= snWatchAt) { snWatchAt = now + 2500; snAct('unwatch'); }
  }
  snTick.n = (snTick.n | 0) + 1;
  if (snIsHost() && sn && snTick.n % 6 === 0 && remotes.size) snBroadcast();   // 心跳：新來的人、漏收的人會補上
}
setInterval(snTick, 1000);

/* ---------- 收訊息 ---------- */
function snClean(s) {
  if (!s || typeof s !== 'object' || typeof s.gid !== 'string' || s.gid.length > 24 || typeof s.host !== 'string' || s.host.length > 64) return null;
  if (!['lobby', 'play', 'end'].includes(s.ph) || !Array.isArray(s.seats)) return null;
  const seats = s.seats.slice(0, 4).filter(q => q && typeof q.id === 'string').map(q => ({ id: q.id.slice(0, 64), name: clean(q.name, 8) || '旅人', col: intIn(q.col, 0, 3, 0), pos: intIn(q.pos, 1, 36, 1), bot: !!q.bot }));
  if (!seats.length) return null;
  const spec = Array.isArray(s.spec) ? s.spec.slice(0, 8).filter(v => typeof v === 'string' && v.length <= 64) : [];
  let last = null;
  if (s.last && typeof s.last === 'object' && Array.isArray(s.last.path) && s.last.path.length >= 1 && s.last.path.length <= 6 && typeof s.last.id === 'string') {
    last = { id: s.last.id.slice(0, 64), roll: intIn(s.last.roll, 1, 6, 1), path: s.last.path.map(v => intIn(v, 1, 36, 1)), to: intIn(s.last.to, 1, 36, 1), k: s.last.k === 'ladder' || s.last.k === 'snake' ? s.last.k : '', n: intIn(s.last.n, 0, 1e6, 0) };
  }
  return { gid: s.gid, seq: intIn(s.seq, 0, 1e9, 0), host: s.host, ph: s.ph, seats, spec, turn: intIn(s.turn, 0, seats.length - 1, 0), mv: intIn(s.mv, 0, 1e6, 0), win: intIn(s.win, -1, 3, -1), last, msg: clean(s.msg, 60) };
}
function onSnl(p) {
  if (!p || typeof p !== 'object' || typeof p.i !== 'string' || p.i === myUid || !remotes.has(p.i)) return;
  if (p.t === 'ask') { if (snIsHost()) snBroadcast(); return; }
  if (p.t === 'say') { snHear(p); return; }
  if (p.t === 'act') { if (snIsHost() && typeof p.a === 'string') snApply(p.i, p.a); return; }
  if (p.t !== 'st') return;
  if (p.s === null) { if (sn && sn.host === p.i) { sn = null; snAnims = {}; snRenderUi(); } return; }
  const s = snClean(p.s);
  if (!s || !(s.host === p.i || (p.ho === true && sn && sn.host === p.i && sn.gid === s.gid))) return;   // 房主交棒時，是舊房主送出、名單裡寫新房主
  if (sn && sn.gid === s.gid && s.seq <= sn.seq) return;
  if (sn && sn.gid !== s.gid && sn.gid < s.gid) return;   // 兩邊同時開桌：先開的那桌留下
  const first = !sn || sn.gid !== s.gid;
  sn = s; snHostGone = 0;
  if (first) snSeen = s.last ? s.last.n : -1;               // 剛看到這桌：不補播舊的動畫
  else if (s.ph === 'lobby') snSeen = -1;
  if (!first && s.last) snStartAnim(s.last, false);
  snRenderUi();
}

/* ---------- 在廣場上畫（棋盤＋棋子）---------- */
function snDisp(s, now) {
  const a = snAnims[s.id];
  if (!a) return { n: s.pos, hop: 0 };
  const t = now - a.t0;
  if (t >= a.times[a.times.length - 1]) { delete snAnims[s.id]; return { n: s.pos, hop: 0 }; }
  let i = 0; while (a.times[i] < t) i++;
  const st = i ? a.times[i - 1] : 0, f = (t - st) / (a.times[i] - st);
  return { n: a.cells[i], hop: Math.sin(f * Math.PI) };
}
function snTokens(g2, ox, oy, now) {
  if (!sn) return;
  sn.seats.forEach((s, i) => {
    const d = snDisp(s, now), c = snCell(d.n);
    const px = ox + c.x + [3, 9, 3, 9][i], py = oy + c.y + [4, 4, 9, 9][i] - Math.round(d.hop * 3);
    snR(g2, 'rgba(0,0,0,.22)', px - 1, py + 6, 6, 1);
    snR(g2, '#3a2a2a', px - 1, py - 1, 5, 8); snR(g2, SN_COLS[s.col], px, py + 2, 3, 4); snR(g2, '#ffe0c8', px, py, 3, 2); snR(g2, 'rgba(255,255,255,.55)', px, py + 2, 1, 2);
    if (sn.ph === 'play' && i === sn.turn) { const b = Math.round(Math.sin(now / 180)); snR(g2, '#fff6c8', px, py - 4 + b, 3, 1); snR(g2, '#ffd34d', px + 1, py - 3 + b, 1, 1); }
  });
}
function drawSnakeBoard(now) {
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';   // 縮小的圖用平滑，數字才不會碎掉
  ctx.drawImage(snBuildArt(), SN_X, SN_Y, SN_PX, SN_PX);
  ctx.translate(SN_X, SN_Y); ctx.scale(SN_PX / 100, SN_PX / 100);
  snTokens(ctx, 0, 0, now);
  ctx.restore();
}

/* ---------- 介面 ---------- */
function snCanRoll() {
  if (!sn || sn.ph !== 'play') return false;
  const s = sn.seats[sn.turn];
  return !!s && s.id === myUid && performance.now() >= snRollOk && !Object.keys(snAnims).length;
}
const snMember = id => !!sn && (sn.seats.some(q => !q.bot && q.id === id) || sn.spec.includes(id));
function snRenderUi() {
  const el = $('snui'); if (!el) return;
  const k = snSeatOf(myUid), host = snIsHost();
  let h = '';
  if (!sn) {
    h += '<p class="empty">廣場上還沒有人開桌。<br>1～4 人都能玩，一個人也可以，還能加電腦陪你。</p><button type="button" class="btn wide" data-a="open">' + snIcon('dice', 16) + ' 開一桌</button>';
  } else {
    h += '<div class="snchips">' + sn.seats.map((s, i) => '<span class="snchip' + (sn.ph === 'play' && i === sn.turn ? ' cur' : '') + (sn.ph === 'end' && i === sn.win ? ' win' : '') + '"><i style="background:' + SN_COLS[s.col] + '"></i>' + esc(s.name) + (s.id === myUid ? '（你）' : '') + (s.bot ? snIcon('bot', 14) : '') + (s.id === sn.host && !s.bot ? snIcon('crown', 14) : '') + (sn.ph !== 'lobby' ? ' <small>' + s.pos + '</small>' : '') + '</span>').join('') +
      Array.from({ length: 4 - sn.seats.length }, () => '<span class="snchip empty">空位</span>').join('') + '</div>';
    const mi = sn.ph === 'end' ? snIcon('trophy', 16) : (sn.ph === 'play' && sn.last && sn.last.k ? snIcon(sn.last.k === 'ladder' ? 'ladder' : 'snake', 16) : '');
    h += '<p class="mk-msg snmsg">' + mi + esc(sn.msg || (sn.ph === 'lobby' ? '等人到齊就開始' : '')) + '</p>';
    if (sn.spec.length) h += '<p class="snspec">' + snIcon('eye', 16) + '<span>觀戰 ' + sn.spec.length + '：' + esc(sn.spec.map(id => clean(snName(id), 8)).join('、')) + '</span></p>';
    if (sn.ph === 'lobby') {
      h += '<div class="v-quick">';
      if (k < 0 && sn.seats.length < 4) h += '<button type="button" class="btn" data-a="join">加入遊戲</button>';
      if (host) {
        if (sn.seats.length < 4) h += '<button type="button" class="btn ghost" data-a="bot">＋ 加電腦</button>';
        if (sn.seats.some(s => s.bot)) h += '<button type="button" class="btn ghost" data-a="rmbot">－ 移除電腦</button>';
        h += '<button type="button" class="btn" data-a="start">開始遊戲</button>';
      } else if (k >= 0) h += '<span class="snwait">等房主按開始…</span>';
      h += '</div>';
      if (k >= 0) h += '<button type="button" class="btn ghost wide" data-a="leave">離開座位</button>';
    } else if (sn.ph === 'play') {
      h += '<button type="button" class="btn wide" data-a="roll"' + (snCanRoll() ? '' : ' disabled') + '>' + snIcon('dice', 16) + ' ' + (k >= 0 && sn.turn === k ? '擲骰子' : '等 ' + esc((sn.seats[sn.turn] || {}).name || '') + ' 擲骰子') + '</button>';
      if (k >= 0) h += '<button type="button" class="btn ghost wide" data-a="leave">離開這局</button>';
    } else {
      if (host) h += '<button type="button" class="btn wide" data-a="again">再來一局</button>';
      else h += '<span class="snwait">等房主再開一局…</span>';
      if (k >= 0) h += '<button type="button" class="btn ghost wide" data-a="leave">離開座位</button>';
    }
    if (k < 0 && sn.ph !== 'lobby') h += '<p class="empty">你在旁邊觀戰。這局結束後可以加入下一局。</p>';
    h += '<p class="snhint">規則：擲到 6 可再擲一次；要剛好走到 36，多的步數會往回退。' + snIcon('ladder', 14) + ' 往上、' + snIcon('snake', 14) + ' 往下。</p>';
  }
  snUiKey = (sn ? sn.seq + ':' : '-') + (snCanRoll() ? 1 : 0);
  el.innerHTML = h;
  snRenderChat();
}

/* ---------- 遊戲內聊天：只有同桌的玩家和觀戰者看得到，走同一條 snl 頻道（事件 say），不會在廣場冒泡 ---------- */
const SN_QUICK = ['加油', '好慘', '哈哈', '再來'];
function snChatSync() { const g = sn ? sn.gid : ''; if (g !== snChatGid) { snChatGid = g; snChat = []; } }
function snChatAdd(id, text, mine) {
  snChatSync();
  const q = sn && sn.seats.find(x => x.id === id), nm = clean(snName(id), 8) || '旅人';
  snChat.push({ n: nm, t: text, m: mine, c: q ? q.col : -1 });
  if (snChat.length > 30) snChat.shift();
  snRenderChat();
  if (!mine && !snOpen && typeof feedPush === 'function') feedPush(nm, text, false);   // 面板關著的玩家，訊息會出現在畫面上的浮動聊天
}
function snRenderChat() {
  const box = $('snchat'); if (!box) return;
  snChatSync(); box.hidden = !sn; if (!sn) return;
  const lg = $('snlog'); if (!lg) return;
  lg.innerHTML = snChat.length ? snChat.slice(-6).map(m => '<div class="snl' + (m.m ? ' me' : '') + '"><i style="background:' + (m.c >= 0 ? SN_COLS[m.c] : '#c9a98a') + '"></i><b>' + esc(m.n) + '</b> ' + esc(m.t) + '</div>').join('') : '<div class="snl none">還沒有人說話，打個招呼吧</div>';
  lg.scrollTop = lg.scrollHeight;
}
function snSay(text) {
  text = clean(text, 40).trim();
  if (!text || !sn || !(net && net.ok && syncScene())) return;
  const now = performance.now();
  if (now - snChatAt < 900) { toast('慢一點，別洗頻喔', 1200); return; }
  if (!snMember(myUid)) { toast('正在加入觀戰，請再試一次', 1400); return; }
  snChatAt = now;
  snSend({ t: 'say', i: myUid, g: sn.gid, x: text });
  snChatAdd(myUid, text, true);
}
function snHear(p) {
  if (!sn || typeof p.g !== 'string' || p.g !== sn.gid || !snMember(p.i) || !snMember(myUid)) return;
  const text = clean(p.x, 40).trim(); if (!text) return;
  snChatAdd(p.i, text, false);
}

/* ---------- 廣場上：玩家頭上的小標記（骰子＝正在玩，眼睛＝觀戰）---------- */
const snMark = id => !sn ? '' : (sn.seats.some(q => !q.bot && q.id === id) ? 'wdice' : (sn.spec.includes(id) ? 'weye' : ''));
function snDrawMarks(now, rx, ry) {
  if (!sn || scene !== 'plaza') return;
  const one = (id, x, y, busy, low) => {
    const k = snMark(id); if (!k || busy) return;   // 正在說話／輸入／表情時先讓位給氣泡
    const c = snSprCanvas(k, 1), bob = Math.round(Math.sin(now / 260 + id.length));
    ctx.drawImage(c, Math.round(x + 8 - c.width / 2), Math.round(y - 12 - (low ? 2 : 0) - c.height + bob));
  };
  one(myUid, rx * T, ry * T, myTyping || (myBubble && now - myBubble.at < 6000) || (myEmo && now - myEmo.at < 3200) || (myShow && now - myShow.at < (myShow.dur || 7000)), !!pose);
  remotes.forEach(rp => {
    if (!hereRp(rp)) return;
    one(rp.id, rp.x * T, rp.y * T, typingOn(rp) || (rp.bubble && now - rp.bubble.at < 6000) || (rp.emo && now - rp.emo.at < 3200) || (rp.show && now - rp.show.at < 7000), rp.sit || rp.gsit);
  });
}
function snFrame() {
  const now = performance.now();
  if (!snOpen) return;
  const c = $('snc');
  if (c) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 100, 100); x.drawImage(snBuildArt(), 0, 0); snTokens(x, 0, 0, now); }
  const key = (sn ? sn.seq + ':' : '-') + (snCanRoll() ? 1 : 0);
  if (key !== snUiKey) snRenderUi();
  snRaf = requestAnimationFrame(snFrame);
}
function openSnakes() {
  if (!ready || !me || authOpen || paused() || snOpen || scene !== 'plaza') return;
  snOpen = true; pressed.length = 0;
  snCard.innerHTML = '<div class="shop-h"><h2>' + snIcon('snake', 22) + ' 蛇梯棋</h2><span class="chip">1～4 人</span></div><canvas id="snc" width="100" height="100"></canvas><div id="snui"></div>' +
    '<div id="snchat" class="snchat" hidden><div id="snlog" class="snlog"></div><div class="snq">' + SN_QUICK.map(q => '<button type="button" class="snqb" data-q="' + q + '">' + q + '</button>').join('') + '</div>' +
    '<form id="snform" class="snform" autocomplete="off"><input id="snin" maxlength="40" placeholder="輸入訊息…" enterkeyhint="send"><button type="submit" class="btn">送出</button></form></div>' +
    '<button type="button" class="btn ghost wide snclose" data-a="close">關閉</button>';
  snRenderUi(); snEl.hidden = false; snCard.focus();
  if (!sn) snSend({ t: 'ask', i: myUid });
  else if (snSeatOf(myUid) < 0) { snWatchAt = performance.now() + 2500; snAct('watch'); }
  cancelAnimationFrame(snRaf); snRaf = requestAnimationFrame(snFrame);
}
function closeSnakes() {
  if (sn && snSeatOf(myUid) < 0 && sn.spec.includes(myUid)) { snWatchAt = performance.now() + 2500; snAct('unwatch'); }
  snOpen = false; snEl.hidden = true; cancelAnimationFrame(snRaf); }
function snAct(a) {
  if (a === 'close') { closeSnakes(); return; }
  if (a === 'open') { if (!sn) snNewTable(); return; }
  if (!sn) return;
  if (snIsHost()) snApply(myUid, a); else snSend({ t: 'act', i: myUid, a });
}
function snLeaveMe() { if (!sn) return; if (snSeatOf(myUid) >= 0) snAct('leave'); else if (sn.spec.includes(myUid)) snAct('unwatch'); }
function snReset() { sn = null; snChat = []; snChatGid = ''; snAnims = {}; snGone = {}; snHostGone = 0; if (snOpen) closeSnakes(); }
snCard.addEventListener('submit', e => {
  if (!e.target || e.target.id !== 'snform') return;
  e.preventDefault();
  const inp = $('snin'); if (!inp) return;
  const v = inp.value; inp.value = ''; snSay(v);
});
snCard.addEventListener('click', e => {
  const qb = e.target.closest('[data-q]'); if (qb) { snSay(qb.dataset.q); return; }
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; snAct(b.dataset.a); });
snEl.addEventListener('click', e => { if (e.target === snEl) closeSnakes(); });
