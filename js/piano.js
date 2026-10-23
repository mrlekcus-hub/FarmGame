'use strict';
/* 鋼琴 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 鋼琴：自由彈奏／音符瀑布（可選樂譜、可關節奏）；彈的音會廣播給同一間房的人，距離越遠越小聲 ---------- */
const PN_DEG = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };      // 音高 % 12 → 白鍵是 C 大調第幾級（沒有 = 黑鍵）
const PN_C = [60, 62, 64, 65, 67, 69, 71];                      // 簡譜 1–7 對應的 MIDI 音高（中央 C 起）
const PN_KEYS_W = "asdfghjkl;'", PN_KEYS_B = 'wertyuiop[';      // 電腦鍵盤：白鍵由左到右、黑鍵在兩顆白鍵之間（第 i 個縫）
/* 簡譜：數字 1–7（8 = 高音 1），數字後面加 ' 是高八度、加 , 是低八度，0 = 休止；「:n」是拍數，預設 1 拍；數字前面加 # 是升半音（黑鍵，只有 1 2 4 5 6 有）*/
/* 收藏中的樂譜（暫不開放；之後改成 NPC 販售，買了再放進 PN_SONGS） */
const PN_VAULT = [
];
const PN_SONGS = [
  { n: '晴天', x: 1, d: 3, bpm: 126, s: "3 2 4 3:2 1 5 7 1' 7 5 1:2 1 6 6 6 5 5 5 4 3 2 3 4 3:2 3 #4 #5 3 #4 #5 7 2' 7 1' 1':2 1' 1' 1 5 5 6 5 4:2 2 3 4 5 6 1' 6 7 7:3" },
  { n: '小星星', d: 1, bpm: 100, s: '1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2 5 5 4 4 3 3 2:2 5 5 4 4 3 3 2:2 1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2' },
  { n: '歡樂頌', d: 1, bpm: 104, s: '3 3 4 5 5 4 3 2 1 1 2 3 3:1.5 2:.5 2:2 3 3 4 5 5 4 3 2 1 1 2 3 2:1.5 1:.5 1:2' },
  { n: '小綿羊', d: 1, bpm: 108, s: '3 2 1 2 3 3 3:2 2 2 2:2 3 5 5:2 3 2 1 2 3 3 3 3 2 2 3 2 1:4' },
  { n: '小蜜蜂', d: 1, bpm: 112, s: '5 3 3:2 4 2 2:2 1 2 3 4 5 5 5:2 5 3 3:2 4 2 2:2 1 3 5 5 1:4' },
  { n: '兩隻老虎', d: 2, bpm: 110, s: '1 2 3 1 1 2 3 1 3 4 5:2 3 4 5:2 5:.5 6:.5 5:.5 4:.5 3 1 5:.5 6:.5 5:.5 4:.5 3 1 1 5 1:2 1 5 1:2' },
  { n: '鈴兒響叮噹', d: 2, bpm: 120, s: '3 3 3:2 3 3 3:2 3 5 1:1.5 2:.5 3:4 4 4 4:1.5 4:.5 4 3 3 3:.5 3:.5 3 2 2 3 2:2 5:2' },
  { n: '蒲公英的約定', x: 1, d: 3, bpm: 84, s: "3 5 1' 3' 3' 4' 2':2 2' 5' 7 1':2 3' 4' 5' 1' 1' 2' 3' 3':2 3 5 1' 3' 3' 4' 2':2 2' 5' 7 1':2 3' 4' 5' 1' 1' 2' 1' 1':2 6' 5' 3' 2' 1' 3' 4' 2':2 6' 5' 7 1':2 3' 4' 5' 1' 1' 2' 3' 3':2 3 5 1' 3' 3' 2' 2':2 2' 5' 7 1':2 3' 4' 5' 1' 1' 2' 1':3" },
  { n: '如果可以', x: 1, d: 3, bpm: 128, s: "3 5 7 1' 2' 1' 2' 4' 3' 2' 3' 4' 3' 2':2 3' 6 6 6 #5 3 2' 3' 3':2 6' 5' 3' 2' 3' 6 6 5 3' 4' 2':2 #5' 3' 2' 3' 1':2 1' 7 1' 1' 7 1' 6 7 1' 2' 3' 5' 5':3" },
  { n: '永不失聯的愛', x: 1, d: 3, bpm: 96, s: "5 1' 2' 3' 2' 1' 7 6 2' 2':2 5 7 1' 2' 1' 7 5 3 1' 1':2 5 1' 2' 3' 2' 1' 7 6 2' 2':2 1' 2' 1' 2' 1' 2' 1' 2' 5' 5':2 3' 3' 4' 5' 4' 3' 1' 6 4' 4':2 2' 2' 3' 4' 3' 1' 6 5 3' 3':2 2' 1':2 5 1' 2' 3' 2' 1' 7 6 2' 2':2 5 2' 1' 2' 1' 2' 3' 2' 1':3 1' 2' 1' 3' 6' 6' 3' 3' 6' 6' 3' 3' 7' 7':2 1' 7' 7' 6' 6' 5' 5' 3' 3' 6' 2' 1':2 6 6 5' 4':2 5 5 3' 2':2 1' 2' 1' 2' 1' 2' 4' 3':2 1' 2' 1' 3' 6' 6' 3' 3' 6' 6' 3' 3' 7' 7':2 1' 7' 7' 6' 6' 5' 5' 3' 3' 6' 2' 1':2 6 6 5' 4':2 5 5 3' 2':2 3' 1' 7 1':2 5 1' 2' 3' 2' 1' 7 6 2' 2':2 5 7 1' 2' 1' 7 5 3 1' 1':2 5 1' 2' 3' 2' 1' 7 6 2' 2':2 1' 2' 1' 2' 1' 2' 1' 2' 5' 5':2 3' 3':2 3' 3' 4' 5' 4' 3' 1' 6 4' 4':2 2' 2' 3' 4' 3' 1' 6 5 3' 3':2 2' 1':2 5 1' 2' 3' 2' 1' 7 6 2' 2':2 5 2' 1' 2' 1' 2' 3' 2' 1':3" }
];
const PN_OWN = [];   // 之後 NPC 賣的樂譜：買了就把 PN_VAULT 裡的曲子編號放進來
const PN_W = 560, PN_H = 200, PN_DEFW = [60, 62, 64, 65, 67, 69, 71, 72], PN_HIT = 176, PN_FT = 2000, PN_PPM = PN_HIT / PN_FT, PN_WIN = 260;
const PN_COL = ['#ff8fa8', '#ffab4a', '#ffd34d', '#7fd08a', '#8fd3ff', '#b79bf0', '#ff9bd0', '#ff8fa8'];
const pnEl = $('pnm'), pnCard = $('pncard');
const pnS = { song: -1, rhythm: true, notes: [], t: 0, nxt: 0, hit: 0, combo: 0, best: 0, done: false, last: 0, raf: 0, fb: null, flash: [], hl: -2, emoAt: 0, view: 'pick', tab: 'free', pick: 0, speed: 1 };
let pnCtx = null, pnWs = [], pnBs = {}, pnW = PN_DEFW.slice(), pnCv = null, pnCx = null, pnScShown = '', pnQ = [], pnQTm = 0;

function pnTone(m, vol, delay) {
  if (musicVol <= 0) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    pnCtx = pnCtx || new AC(); if (pnCtx.state === 'suspended') pnCtx.resume();
    const t = pnCtx.currentTime + 0.01 + (delay || 0), f = 440 * Math.pow(2, (m - 69) / 12);
    const v = 0.3 * (vol == null ? 1 : vol) * Math.max(0.3, musicVol / 100);
    const o1 = pnCtx.createOscillator(), o2 = pnCtx.createOscillator(), g1 = pnCtx.createGain(), g2 = pnCtx.createGain();
    o1.type = 'triangle'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.22;
    g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.012); g1.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o1.connect(g1); o2.connect(g2); g2.connect(g1); g1.connect(pnCtx.destination);
    o1.start(t); o2.start(t); o1.stop(t + 1.15); o2.stop(t + 1.15);
  } catch (e) { /* 沒有聲音也沒關係 */ }
}
/* 彈的音先收集 0.22 秒再一次送出（一則最多 8 個音），不會把即時連線塞爆 */
function pnSend(m) {
  if (!(syncScene() && net && net.ok)) return;
  pnQ.push({ t: performance.now(), m });
  if (pnQ.length >= 8) pnFlush(); else if (!pnQTm) pnQTm = setTimeout(pnFlush, 220);
}
function pnFlush() {
  clearTimeout(pnQTm); pnQTm = 0;
  if (!pnQ.length) return;
  const q = pnQ.splice(0, 8), b = q[0].t;
  try { if (net && net.ok) net.ch.send({ type: 'broadcast', event: 'pno', payload: { i: myUid, n: q.map(x => [Math.round(x.t - b), x.m]) } }); } catch (e) { /* 略過 */ }
}
/* 別人彈的琴：同一個世界才聽得到，4 格內全音量、再遠越來越小聲，約 16 格外聽不到 */
let pnHeard = 0;   // 最後一次聽到附近有人彈琴的時間；3 秒內 BGM 先停，免得蓋過琴聲
function onPno(p) {
  if (!p || typeof p !== 'object' || typeof p.i !== 'string' || p.i === myUid || !Array.isArray(p.n) || p.n.length > 8) return;
  const rp = remotes.get(p.i); if (!rp || rp.w !== worldKey()) return;
  const now = performance.now();
  if (!rp.pnT || now - rp.pnT >= 1000) { rp.pnT = now; rp.pnC = 0; }
  rp.pnC += p.n.length; if (rp.pnC > 24) return;
  const d = Math.hypot((rp.tx != null ? rp.tx : rp.x) - pl.x, (rp.ty != null ? rp.ty : rp.y) - pl.y);
  const vol = d <= 4 ? 1 : clamp(1 - (d - 4) / 12, 0, 1);
  if (vol < 0.05) return;
  { const was = performance.now() - pnHeard < 3000; pnHeard = now; if (!was) { try { syncBgm(); } catch (e) { /* 略過 */ } } }
  p.n.forEach(a => {
    if (!Array.isArray(a)) return;
    const dt = intIn(a[0], 0, 800, 0), m = intIn(a[1], 48, 84, -1);
    if (m >= 0) pnTone(m, vol * 0.85, 0.15 + dt / 1000);
  });
  if (!rp.emo || now - rp.emo.at > 2000) rp.emo = { id: 'music', at: now };
  if (!rp.pnSay || now - rp.pnSay > 30000) { rp.pnSay = now; addSys(rp.name + ' 在彈鋼琴 🎹'); }
}

function pnBuild() {
  const rb = '<button type="button" class="btn small ghost pn-rhy" data-a="rhy"></button><button type="button" class="btn small ghost pn-spd" data-a="spd" title="點一下換速度"></button>';
  pnCard.innerHTML = '<h2>🎹 鋼琴</h2>' +
    '<div id="pnPick"><div class="pn-tabs" role="tablist">' +
    '<button type="button" role="tab" data-a="tab" data-t="free">免費</button><button type="button" role="tab" data-a="tab" data-t="own">已購買</button><button type="button" role="tab" data-a="tab" data-t="shop">商店 🔒</button><button type="button" role="tab" data-a="tab" data-t="try">嘗試</button></div>' +
    '<div class="pn-wall" id="pnWall"></div>' +
    '<div class="pn-bar" id="pnBar"><span class="pn-nm" id="pnNm"></span>' + rb + '<button type="button" class="pn-go" data-a="go">彈</button></div>' +
    '<button type="button" class="pn-free" data-a="free">自由彈奏（不看樂譜）</button></div>' +
    '<div id="pnPlay" hidden><div class="pn-row"><button type="button" class="btn small ghost" data-a="back">‹ 選曲</button>' + rb + '<button type="button" class="btn small ghost" data-a="again">↻ 重來</button><span class="pn-sc" id="pnSc"></span><button type="button" class="btn small pn-out" data-a="close">離開</button></div>' +
    '<canvas id="pnCv" width="' + PN_W + '" height="' + PN_H + '"></canvas>' +
    '<p class="empty pn-tip" id="pnTip"></p>' +
    '<div class="pn-kb" id="pnKb"></div>' +
    '<small class="empty" style="text-align:center">電腦鍵盤：A S D F G H J K L ; \' 由左到右是白鍵、上一排 W E R T Y U I O P [ 是黑鍵 · 你彈的聲音，同一間房的人也聽得到</small></div>' +
    '<button type="button" class="btn wide" id="pnLeave" data-a="close">離開</button>';
  pnCv = $('pnCv'); pnCx = pnCv.getContext('2d');
  pnKeys(pnW, true);
}
/* 琴鍵範圍跟著樂譜走：音域在 C4–C5 內就是 8 顆白鍵，超出就多開幾顆（最多 11 顆有電腦鍵盤對應） */
function pnLabel(m) {
  const o = Math.floor(m / 12) - 5;
  return (PN_DEG[m % 12] + 1) + (o > 0 ? '\u0307'.repeat(o) : o < 0 ? '\u0323'.repeat(-o) : '');
}
function pnKeys(ws, force) {
  if (!force && ws.length === pnW.length && ws.every((m, i) => m === pnW[i])) return;
  pnW = ws.slice(); pnS.hl = -2;
  const kb = $('pnKb'); kb.innerHTML = ''; pnWs = []; pnBs = {};
  const n = pnW.length, bw = 100 / n * 0.62;
  pnW.forEach((m, i) => {
    const d = document.createElement('div'); d.className = 'pn-w'; d.textContent = pnLabel(m);
    d.addEventListener('pointerdown', e => { e.preventDefault(); pnHit('w', i); }); kb.appendChild(d); pnWs.push(d);
  });
  pnW.forEach((m, i) => {
    if (pnW[i + 1] - m !== 2) return;
    const d = document.createElement('div'); d.className = 'pn-b'; d.style.width = bw + '%'; d.style.left = ((i + 1) / n * 100 - bw / 2) + '%';
    d.addEventListener('pointerdown', e => { e.preventDefault(); pnHit('b', i); }); kb.appendChild(d); pnBs[i] = d;
  });
}
function pnRefresh() {
  const v = pnS.view; pnFit();
  $('pnPick').hidden = v !== 'pick'; $('pnPlay').hidden = v !== 'play'; $('pnLeave').hidden = v === 'play';
  pnCard.querySelectorAll('[data-a="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === pnS.tab)));
  const stars = d => '★'.repeat(d) + '☆'.repeat(3 - d), wall = $('pnWall');
  const songTab = pnS.tab === 'try' || pnS.tab === 'free';
  if (songTab && !(PN_SONGS[pnS.pick] && !!PN_SONGS[pnS.pick].x === (pnS.tab === 'try'))) { const f = PN_SONGS.findIndex(sg => !!sg.x === (pnS.tab === 'try')); if (f >= 0) pnS.pick = f; }   // 目前選的歌不在這個分頁，就改選這頁第一首
  if (songTab) wall.innerHTML = PN_SONGS.map((sg, i) => !!sg.x === (pnS.tab === 'try') ? '<button type="button" class="pn-rec' + (i === pnS.pick ? ' sel' : '') + '" data-a="pick" data-i="' + i + '"><span class="pn-disc"></span>' + sg.n + '<span class="pn-stars">' + stars(sg.d || 1) + '</span></button>' : '').join('');
  else if (pnS.tab === 'own') wall.innerHTML = PN_OWN.length ? '' : '<div class="pn-empty">還沒有買過樂譜<br>到商人那邊逛逛吧</div>';
  else wall.innerHTML = '<div class="pn-rec locked"><span class="pn-disc"></span>🔒 商人有賣</div><div class="pn-rec locked"><span class="pn-disc"></span>🔒 商人有賣</div><div class="pn-rec locked"><span class="pn-disc"></span>🔒 商人有賣</div><div class="pn-empty">商人開賣後，這裡可以看到價錢並購買</div>';
  $('pnBar').hidden = !songTab;
  const cur = PN_SONGS[pnS.pick]; if (cur) $('pnNm').innerHTML = cur.n + '<small>難度 ' + stars(cur.d || 1) + '</small>';
  pnCard.querySelectorAll('.pn-spd').forEach(b => { b.textContent = '⏱ 速度 ' + pnS.speed + '×'; });
  pnCard.querySelectorAll('.pn-rhy').forEach(b => { b.textContent = '🥁 節奏 ' + (pnS.rhythm ? '開' : '關'); b.setAttribute('aria-pressed', String(pnS.rhythm)); });
  $('pnTip').textContent = (pnS.song < 0 ? '自由彈奏：想彈什麼都可以。按「‹ 選曲」可以挑樂譜。'
    : pnS.rhythm ? '節奏開：音符掉到亮線時按對應的琴鍵，抓準時機分數更高。' : '節奏關：音符會停下來等你，按對了才繼續，慢慢彈也沒關係。') + (pnS.song >= 0 && pnS.notes.some(x => x.b) ? '深色音符是黑鍵，掉在兩條白鍵道中間。' : '');
}
function pnSelect(i) {
  pnS.song = i; pnS.t = 0; pnS.nxt = 0; pnS.hit = 0; pnS.combo = 0; pnS.best = 0; pnS.done = false; pnS.fb = null; pnS.flash = []; pnS.notes = [];
  if (i >= 0) {
    const sg = PN_SONGS[i], bm = 60000 / (sg.bpm * pnS.speed); let at = PN_FT;
    sg.s.split(/\s+/).forEach(tok => {
      const m = /^(#?)([0-8])([',]?)(?::(\d*\.?\d+))?$/.exec(tok); if (!m) return;
      const d = +m[2], b = m[4] ? +m[4] : 1, sh = !!m[1] && (d === 1 || d === 2 || d === 4 || d === 5 || d === 6);   // 黑鍵：p 記白鍵音高，b = true 表示它右邊那顆黑鍵
      if (d > 0 && (!m[1] || sh)) pnS.notes.push({ p: d === 8 ? 72 : PN_C[d - 1] + (m[3] === "'" ? 12 : m[3] === ',' ? -12 : 0), b: sh, k: 0, at, h: Math.max(14, b * bm * PN_PPM * 0.82), st: 0 });
      at += b * bm;
    });
    const lo = Math.min(...pnS.notes.map(x => x.p)), hi = Math.max(...pnS.notes.map(x => x.p + (x.b ? 2 : 0)));
    let ws = PN_DEFW;
    if (lo < 60 || hi > 72) { ws = []; for (let m = lo; m <= hi; m++) if (PN_DEG[m % 12] != null) ws.push(m); }
    pnKeys(ws);
  } else pnKeys(PN_DEFW);
  pnS.notes.forEach(x => { x.k = pnW.indexOf(x.p); });
  pnS.notes = pnS.notes.filter(x => x.k >= 0 && (!x.b || pnBs[x.k]));
  pnRefresh();
}
function pnHit(kind, i) {
  const m = kind === 'w' ? pnW[i] : (pnBs[i] ? pnW[i] + 1 : 0); if (!m) return;
  pnTone(m, 1);
  const el = kind === 'w' ? pnWs[i] : pnBs[i];
  if (el) { el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 160); }
  pnSend(m);
  const now = performance.now();
  if (now - pnS.emoAt > 2500) { pnS.emoAt = now; myEmo = { id: 'music', at: now }; }
  if (pnS.song < 0 || pnS.done) return;
  const bk = kind === 'b', fi = bk ? 100 + i : i;
  if (pnS.rhythm) {
    let best = null, bd = 1e9;
    pnS.notes.forEach(n => { if (n.st === 0 && n.k === i && !!n.b === bk) { const d = Math.abs(n.at - pnS.t); if (d < bd) { bd = d; best = n; } } });
    if (best && bd <= PN_WIN) {
      best.st = 1; pnS.hit++; pnS.combo++; pnS.best = Math.max(pnS.best, pnS.combo);
      pnS.fb = { t: bd <= 110 ? 'Perfect!' : 'Good', at: now }; pnS.flash[fi] = now;
    }
  } else {
    const n = pnS.notes[pnS.nxt];
    if (n && n.k === i && !!n.b === bk) {
      n.st = 1; pnS.hit++; pnS.combo++; pnS.best = Math.max(pnS.best, pnS.combo); pnS.flash[fi] = now;
      while (pnS.notes[pnS.nxt] && pnS.notes[pnS.nxt].st !== 0) pnS.nxt++;
    }
  }
}
function pnStep(now) {
  if (!pnOpen) return;
  if (scene !== 'house') { closePiano(); return; }
  const dt = Math.min(50, now - pnS.last); pnS.last = now;
  if (pnS.song >= 0 && !pnS.done) {
    if (pnS.rhythm) {
      pnS.t += dt;
      pnS.notes.forEach(n => { if (n.st === 0 && pnS.t - n.at > PN_WIN) { n.st = 2; pnS.combo = 0; } });
    } else {
      const nx = pnS.notes[pnS.nxt];
      pnS.t = nx ? Math.min(pnS.t + dt, nx.at) : pnS.t + dt;
    }
    if (pnS.notes.length && pnS.notes.every(n => n.st !== 0)) pnS.done = true;
  }
  /* 節奏關：下一顆要按的鍵標黃色 */
  const want = pnS.song >= 0 && !pnS.rhythm && !pnS.done && pnS.notes[pnS.nxt] ? pnS.notes[pnS.nxt].k + (pnS.notes[pnS.nxt].b ? 100 : 0) : -1;
  if (want !== pnS.hl) { pnS.hl = want; pnWs.forEach((d, i) => d.classList.toggle('nx', i === want)); Object.keys(pnBs).forEach(i => pnBs[i].classList.toggle('nx', +i + 100 === want)); }
  if (pnS.view === 'play') pnDraw(now);
  const sc = pnS.song < 0 ? '' : '命中 ' + pnS.hit + '/' + pnS.notes.length + (pnS.combo > 1 ? ' · 連擊 ' + pnS.combo : '');
  if (sc !== pnScShown) { pnScShown = sc; $('pnSc').textContent = sc; }
  pnS.raf = requestAnimationFrame(pnStep);
}
function pnDraw(now) {
  const c = pnCx; if (!c) return;
  c.clearRect(0, 0, PN_W, PN_H);
  const bg = c.createLinearGradient(0, 0, 0, PN_H); bg.addColorStop(0, '#4a3470'); bg.addColorStop(1, '#241838');
  c.fillStyle = bg; c.fillRect(0, 0, PN_W, PN_H);
  const LW = PN_W / pnW.length;
  for (let i = 1; i < pnW.length; i++) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(Math.round(i * LW), 0, 1, PN_H); }
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, PN_HIT, PN_W, 2);
  const BW = LW * 0.62;
  pnS.flash.forEach((at, k) => {
    const a = 1 - (now - at) / 300; if (!(a > 0)) return;
    c.fillStyle = 'rgba(255,255,255,' + (a * 0.55).toFixed(2) + ')';
    if (k >= 100) c.fillRect((k - 99) * LW - BW / 2, PN_HIT - 28, BW, 30); else c.fillRect(k * LW + 2, PN_HIT - 28, LW - 4, 30);
  });
  pnS.notes.forEach(n => {
    if (n.st === 1) return;
    const yb = PN_HIT - (n.at - pnS.t) * PN_PPM, yt = yb - n.h;
    if (yb < 0 || yt > PN_H) return;
    c.globalAlpha = n.st === 2 ? 0.22 : 1;
    if (n.b) {   // 黑鍵音符：掉在兩條白鍵道中間，深色＋彩色邊框
      const bx = (n.k + 1) * LW - BW / 2;
      c.fillStyle = '#17102a'; c.fillRect(bx, yt, BW, n.h);
      c.strokeStyle = PN_COL[PN_DEG[n.p % 12]]; c.lineWidth = 2; c.strokeRect(bx + 1, yt + 1, BW - 2, Math.max(2, n.h - 2));
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx, yt, BW, 3);
    } else {
      c.fillStyle = PN_COL[PN_DEG[n.p % 12]]; c.fillRect(n.k * LW + 4, yt, LW - 8, n.h);
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(n.k * LW + 4, yt, LW - 8, 3);
    }
    c.globalAlpha = 1;
  });
  c.textAlign = 'center';
  if (pnS.fb && now - pnS.fb.at < 450) { c.fillStyle = '#fff'; c.font = '700 20px sans-serif'; c.fillText(pnS.fb.t, PN_W / 2, PN_HIT - 40); }
  if (pnS.song < 0) { c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 16px sans-serif'; c.fillText('♪ 選一首樂譜，音符會從這裡掉下來', PN_W / 2, 90); }
  if (pnS.done) {
    c.fillStyle = 'rgba(20,10,40,.72)'; c.fillRect(0, 0, PN_W, PN_H);
    c.fillStyle = '#ffe9a8'; c.font = '800 26px sans-serif'; c.fillText('彈完了！🎉', PN_W / 2, 84);
    c.fillStyle = '#fff'; c.font = '700 16px sans-serif'; c.fillText('命中 ' + pnS.hit + '/' + pnS.notes.length + ' · 最高連擊 ' + pnS.best, PN_W / 2, 116);
  }
}
function openPiano() {
  if (paused() || pnOpen) return;
  pnOpen = true; pressed.length = 0;
  pnS.view = 'pick'; pnS.tab = 'free'; pnS.rhythm = true;
  pnBuild(); pnScShown = ''; pnS.hl = -2; pnSelect(-1);
  pnEl.hidden = false; pnCard.focus(); pnFit(); try { syncBgm(); } catch (e) { /* 略過 */ }
  pnS.last = performance.now(); pnS.raf = requestAnimationFrame(pnStep);
}
/* 手機畫面太小時，把鋼琴視窗整個縮小一點，才看得到全部（含琴鍵和離開鈕） */
function pnFit() {
  if (!pnOpen) return;
  pnCard.style.zoom = '';
  requestAnimationFrame(() => {
    if (!pnOpen) return;
    pnCard.style.zoom = '';
    const cs = getComputedStyle(pnEl), avail = pnEl.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0) - 4, h = pnCard.offsetHeight;
    if (h > avail && avail > 0) pnCard.style.zoom = String(Math.max(0.5, avail / h * 0.97).toFixed(3));
  });
}
window.addEventListener('resize', pnFit);
function closePiano() { const was = pnOpen; pnOpen = false; pnEl.hidden = true; cancelAnimationFrame(pnS.raf); pnFlush(); pnCard.style.zoom = ''; if (was) { try { syncBgm(); } catch (e) { /* 略過 */ } } }
pnCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'close') closePiano();
  else if (a === 'tab') { pnS.tab = b.dataset.t; pnRefresh(); }
  else if (a === 'pick') { pnS.pick = +b.dataset.i; pnRefresh(); }
  else if (a === 'go') { pnS.view = 'play'; pnSelect(pnS.pick); }
  else if (a === 'free') { pnS.view = 'play'; pnSelect(-1); }
  else if (a === 'back') { pnS.view = 'pick'; pnSelect(-1); }
  else if (a === 'rhy') { pnS.rhythm = !pnS.rhythm; if (pnS.view === 'play') pnSelect(pnS.song); else pnRefresh(); }
  else if (a === 'again') pnSelect(pnS.song);
  else if (a === 'spd') { const L = [0.5, 0.7, 0.85, 1, 1.2, 1.5], k = L.indexOf(pnS.speed); pnS.speed = L[(k + 1) % L.length]; if (pnS.view === 'play' && pnS.song >= 0) pnSelect(pnS.song); else pnRefresh(); }
});
/* 鋼琴開著的時候，電腦鍵盤只拿來彈琴（不會誤觸走路、背包等快捷鍵） */
window.addEventListener('keydown', e => {
  if (!pnOpen || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePiano(); return; }
  const k = e.key.length === 1 ? e.key.toLowerCase() : '', wi = k ? PN_KEYS_W.indexOf(k) : -1, bi = k ? PN_KEYS_B.indexOf(k) : -1;
  if (pnS.view === 'play' && k && ((wi >= 0 && wi < pnW.length) || (bi >= 0 && pnBs[bi]))) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) { if (wi >= 0) pnHit('w', wi); else pnHit('b', bi); } return; }
  if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') return;
  e.stopPropagation();
}, true);
