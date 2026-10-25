'use strict';
/* 登入封面 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 登入封面：用遊戲自己的美術畫出小屋、樹和自己的角色；白天看到太陽，晚上看到月亮 ---------- */
const COVER_KEY = 'dw_cover';
function coverSave() { if (!me) return; try { localStorage.setItem(COVER_KEY, JSON.stringify({ n: me.name, l: me.look })); } catch (e) { /* 略過 */ } }
function coverLoad() {
  try { const v = JSON.parse(localStorage.getItem(COVER_KEY) || 'null'); if (v && typeof v.n === 'string') return { n: v.n, l: v.l && typeof v.l === 'object' ? v.l : {} }; } catch (e) { /* 略過 */ }
  return null;
}
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')'; };
const coverCv = $('cover'), coverNm = $('cover-nm');
const CV_DAY = ['#8fd0ff', '#a9dcff', '#c4e8ff', '#dff3ff'], CV_NIGHT = ['#12153a', '#1b1f4f', '#2a2a62', '#3a2f6b'];
const coverReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
/* 風：一陣一陣由左吹向右（pixel 風格，只偏移 0～2 格像素） */
const windAt = (t, x) => { const w = Math.sin(t / 900 - x / 140), gst = Math.sin(t / 3700) * 0.5 + 0.5; return w * (0.35 + gst * 0.65); };
function coverTree(px, py, tx, ty, t) {
  drawGrass(px, py, tx, ty);
  const pink = hash(tx, ty, 12) > 0.55;
  const w = windAt(t, px + tx * 9), sw = Math.round(w * 1.4), sy = (Math.sin(t / 700 + tx) > 0.6) ? 1 : 0;
  r('rgba(107,72,72,.16)', px + 2, py + 13, 12, 3);
  r('#b98a62', px + 6, py + 10, 4, 6); r('#9a6a4a', px + 9, py + 10, 1, 6);
  const pal = TREEP[SEA][pink ? 0 : 1];
  g.save(); g.translate(sw, sy * 0);
  ob(pal[0], pal[1], px, py + 1, 16, 12);
  r(pal[2], px + 3 + (w > 0.5 ? 1 : 0), py + 3, 5, 2); r(pal[2], px + 10 - (w < -0.4 ? 1 : 0), py + 6, 2, 2);
  r(pal[3], px + 4, py + 9, 4, 1); r(pal[3], px + 10, py + 10, 3, 1);
  if (SEA === 'winter') { r('#ffffff', px + 2, py + 1, 12, 2); r('#dcebf3', px + 1, py + 3, 3, 1); }
  g.restore();
}
/* 草叢：隨風左右搖 */
function coverBlades(px, py, tx, ty, t) {
  const h = hash(tx, ty, 21); if (h < 0.5) return;
  const gb = GRASSB[SEA], bx = px + 2 + ((h * 40 | 0) % 11), by = py + 5 + ((hash(tx, ty, 22) * 7) | 0);
  const w = windAt(t, px * 1.3 + ty * 6), o = Math.round(w * 2);
  r(gb[0], bx, by + 2, 1, 2); r(gb[0], bx + (o > 0 ? 1 : o < 0 ? -1 : 0), by + 1, 1, 1); r(gb[1], bx + o, by, 1, 1);
  if (h > 0.8) { r(gb[0], bx + 3, by + 2, 1, 2); r(gb[1], bx + 3 + o, by + 1, 1, 1); }
}
/* 飄動的花瓣／落葉（依季節換顏色）：被風吹著斜斜飄過畫面 */
const COVER_PETAL = { spring: ['#ffc2d4', '#ffffff', '#ffa8c4'], summer: ['#b8e88a', '#d8f5a0', '#fff6a8'], autumn: ['#ffab4a', '#e98a3a', '#ffd36b'], winter: ['#ffffff', '#e6f3fb', '#cfe6f3'] };
function coverPetals(t, cw, chh, GT) {
  const cols = COVER_PETAL[SEA] || COVER_PETAL.spring, n = cw < 300 ? 12 : 22, gust = Math.sin(t / 3700) * 0.5 + 0.5;
  for (let i = 0; i < n; i++) {
    const sp = 14 + hash(i, 1, 70) * 16 + gust * 14, fall = 5 + hash(i, 2, 70) * 7;
    const x0 = hash(i, 3, 70) * (cw + 80), y0 = hash(i, 4, 70) * (chh - GT);
    const x = ((x0 + t / 1000 * sp) % (cw + 40)) - 20;
    const y = GT - 6 + ((y0 + t / 1000 * fall) % (chh - GT + 12)) + Math.sin(t / 600 + i * 1.7) * 4;
    r(cols[i % 3], x | 0, y | 0, 2, 1); if (i % 3 === 0) r(cols[(i + 1) % 3], (x | 0) + 1, (y | 0) + 1, 1, 1);
  }
}
let coverRaf = 0, coverLast = 0, coverGreet = '';
function coverTick(now) {
  coverRaf = 0;
  if (authEl.hidden || document.hidden) return;
  if (now - coverLast >= 66) { coverLast = now; drawCover(now); }      // 約 15 格：像素風的節奏，也省電
  coverRaf = requestAnimationFrame(coverTick);
}
function coverStart() { if (!coverRaf && !coverReduce && !authEl.hidden && !document.hidden) coverRaf = requestAnimationFrame(coverTick); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) coverStart(); });
function drawCover(tNow) {
  if (!coverCv || authEl.hidden) return;
  const t = typeof tNow === 'number' ? tNow : performance.now();
  const vw = Math.max(320, window.innerWidth), vh = Math.max(320, window.innerHeight);
  const sc = vw < 700 ? 2 : 3, cw = Math.ceil(vw / sc), chh = Math.ceil(vh / sc), wide = vw >= 900 || (vw >= 780 && vw > vh);
  if (coverCv.width !== cw || coverCv.height !== chh) { coverCv.width = cw; coverCv.height = chh; }
  const c2 = coverCv.getContext('2d'); c2.imageSmoothingEnabled = false;
  const oldG = g, oldSea = SEA, GT = 36;
  g = c2;
  try {
    const wd = world(), dk = darkness(wd.min), lit = dk > 0.35;
    SEA = seasonAt(srvNow());
    const greet = dk >= 0.8 ? '晚安，小屋的燈還亮著' : wd.min < 720 ? '早安，今天也一起種田吧' : wd.min < 1020 ? '午安，農場正在等你回來' : '傍晚了，回來看看你的農場';
    if (greet !== coverGreet) { coverGreet = greet; $('au-greet').textContent = greet; }
    for (let i = 0; i < 4; i++) r(mixHex(CV_DAY[i], CV_NIGHT[i], dk), 0, i * 10, cw, i === 3 ? GT - 30 : 10);
    const sx = wide ? Math.round(cw * 0.46) : cw - 40, sy = 8;
    if (dk < 0.5) {
      g.globalAlpha = 0.45; rr('#fff3b0', sx - 4, sy - 4, 26, 26); g.globalAlpha = 1;
      ob('#ffd34d', '#f2b632', sx, sy, 18, 18); r('#ffe98a', sx + 4, sy + 4, 5, 3);
      const rp = Math.floor(t / 400) % 2; [[8, -6 - rp], [8, 20 + rp], [-6 - rp, 8], [20 + rp, 8]].forEach(a => r('#ffd34d', sx + a[0], sy + a[1], 2, 3));
      g.globalAlpha = 1 - dk * 2;
      [[0.2, 14, 26, 7, 5], [0.62, 8, 22, 6, 7], [0.85, 18, 24, 6, 4]].forEach((c, ci) => { const cx = ((c[0] * cw + t / 1000 * (c[4] + 2)) % (cw + 60)) - 30 | 0; rr('#ffffff', cx, c[1], c[2], c[3]); rr('#ffffff', cx + 6, c[1] - 3, c[2] - 12, c[3] - 1); });
      g.globalAlpha = 1;
    } else {
      g.globalAlpha = Math.min(1, dk * 1.2);
      rr('#fff3c4', sx, sy, 16, 16); r('#e8d9a6', sx + 9, sy + 4, 3, 3); r('#e8d9a6', sx + 4, sy + 10, 3, 2); r('#e8d9a6', sx + 10, sy + 10, 2, 2);
      for (let i = 0; i < 30; i++) { if (Math.sin(t / 500 + i * 2.3) < -0.75) continue; r('#ffffff', (hash(i, 1, 90) * cw) | 0, (hash(i, 2, 90) * (GT - 8)) | 0, 1, 1); }
      g.globalAlpha = 1;
    }
    for (let ty = 0; ty * T + GT < chh; ty++) for (let tx = 0; tx * T < cw; tx++) { drawGrass(tx * T, GT + ty * T, tx, ty); coverBlades(tx * T, GT + ty * T, tx, ty, t); }
    const CARD_W = 420, HOUSE_W = 87 * sc, GAP = 56, grp = HOUSE_W + GAP + CARD_W, gl = Math.max(16, (vw - grp) / 2);
    if (wide) authEl.style.setProperty('--auth-ml', Math.round(gl + HOUSE_W + GAP - 16) + 'px');
    const hx = wide ? Math.round((gl + HOUSE_W / 2) / sc) - 40 : Math.round(cw / 2) - 40, hy = GT + (wide ? 36 : 22);
    r('#ecd5b4', hx + 32, hy + 44, 16, chh); for (let y = hy + 50; y < chh; y += 9) { r('#d9b98a', hx + 34 + ((y * 7) % 9), y, 2, 1); }
    for (let tx = 0; tx * T < cw; tx++) coverTree(tx * T, GT, tx, 0, t);
    [2, 3, 5].forEach(ty => { coverTree(0, GT + ty * T, 0, ty, t); coverTree(Math.floor((cw - 1) / T) * T, GT + ty * T, Math.floor((cw - 1) / T), ty, t); });
    g.save(); g.translate(hx - 2 * T, hy - T); drawHouse(lit, t); g.restore();
    const sv = coverLoad();
    if (sv && sv.n) drawPlayer(hx + 32, hy + 60 + (Math.floor(t / 520) % 2 ? 1 : 0), 'down', false, 0, toChar(sv.n, sv.l));
    coverPetals(t, cw, chh, GT);
    if (dk < 0.5) { g.globalAlpha = 1 - dk * 2; [0, 1].forEach(bi => { const bx = ((bi * 0.5 * cw + t / 1000 * (22 + bi * 6)) % (cw + 80)) - 40 | 0, by = 20 + bi * 14 + Math.round(Math.sin(t / 900 + bi * 2) * 3), fl = Math.floor(t / 180 + bi) % 2; r('#5a4a5e', bx, by + fl, 2, 1); r('#5a4a5e', bx + 2, by + 1 - fl, 1, 1); r('#5a4a5e', bx + 3, by + fl, 2, 1); }); g.globalAlpha = 1; }
    if (dk > 0) {
      g.fillStyle = 'rgba(18,22,86,' + (0.5 * dk).toFixed(2) + ')'; g.fillRect(0, GT, cw, chh - GT);
      if (lit) [10, 58].forEach(wx => {
        g.globalAlpha = 0.24 + Math.sin(t / 700 + wx) * 0.05; rr('#ffd36b', hx + wx - 4, hy + 25, 20, 19); g.globalAlpha = Math.min(1, dk * 1.3);
        r('#ffe28a', hx + wx + 1, hy + 30, 10, 9); r('#ffffff', hx + wx + 5, hy + 30, 2, 9); r('#ffffff', hx + wx + 1, hy + 34, 10, 2); g.globalAlpha = 1;
      });
      g.globalAlpha = Math.min(1, dk * 1.2);
      for (let i = 0; i < 9; i++) { const fx = ((hash(i, 3, 91) * cw) + Math.sin(t / 1300 + i * 2) * 8) | 0, fy = GT + 30 + ((hash(i, 4, 91) * (chh - GT - 34)) | 0) + Math.round(Math.cos(t / 1100 + i) * 5); if (Math.sin(t / 420 + i * 1.9) > -0.5) r('#e8ff8a', fx, fy, 2, 2); }
      g.globalAlpha = 1;
    }
    const k = coverCv.clientWidth / cw;
    if (sv && sv.n) { coverNm.textContent = sv.n; coverNm.style.left = ((hx + 40) * k) + 'px'; coverNm.style.top = ((hy + 48) * k) + 'px'; coverNm.hidden = false; }
    else coverNm.hidden = true;
  } catch (e) { /* 封面畫不出來也沒關係，還是看得到登入框 */ }
  g = oldG; SEA = oldSea;
}
window.addEventListener('resize', drawCover);
setInterval(drawCover, 60000);
window.addEventListener('pagehide', coverSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) coverSave(); });
function showAuth() {
  coverSave();
  tutI = -1; tutEl.hidden = true;
  leaveLekcus(true); leaveVillage(true); leaveHouse(true); leaveStylist(true); leaveCave(true); leaveForest(true); leaveTown(true); leaveBarn(true); stopPresence(); closeFriends(); fr = { friends: [], incoming: [], outgoing: [], max: 50 }; house = null; ready = false; authOpen = true; closeMaker(); closeShop(); closeVMenu(); closeGM(); closeFShop(); closeDex(); closeBag();
  bootEl.hidden = true; authEl.hidden = false; me = null; refreshHud(); drawCover(); coverStart();
  closeBoard(); closeKitchen(); closeRanch(); closeMerchant(); closeDlg();
  closeQuests(); qs = { day: 0, c: {}, claimed: {} }; qBadge();
}
async function enter(u, uid) {
  if (typeof updCheck === 'function') updCheck(true);   // 登入時檢查有沒有新版本
  house = null; authUser = u; if (uid) myUid = uid; hotLoad(); tool = 0;
  authEl.hidden = true; setBoot('載入農場…');
  try {
    const d = await rpc('get_state');
    applyState(d);
    authOpen = false; ready = true; bootEl.hidden = true;
    pl.x = pl.sx = 4; pl.y = pl.sy = 4; pl.prog = 1; pl.face = 'down';
    refreshHud();
    if (!me) openMaker(true);
    else { toast('歡迎回來，' + me.name + '！', 2500); afterReady(); tutResume(); }
  } catch (err) {
    showAuth(); $('au-msg').textContent = errText(err);
  }
}
$('logout').addEventListener('click', async () => {
  try { await sb.auth.signOut(); } catch (e) { /* 略過 */ }
  plots = new Map(); inv = {}; showAuth();
});

/* ====== 背景音樂：完全由程式即時合成（沒有音檔、沒有版權問題） ======
   C 大調的 Cmaj7 – Am7 – Fmaj7 – G6 循環：柔軟的和弦墊底、低音輕輕點拍、
   音樂盒音色的五聲音階旋律隨機漫步。夜晚變稀疏柔和，廣場變活潑一點。 */
function createMusic(win) {
  const AC = win.AudioContext || win.webkitAudioContext;
  if (!AC) return null;
  const BPM = 66, BEAT = 60 / BPM, BAR = BEAT * 4;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const PROG = [
    { root: 48, pad: [60, 64, 67, 71] },   // Cmaj7
    { root: 45, pad: [57, 60, 64, 67] },   // Am7
    { root: 41, pad: [60, 64, 65, 69] },   // Fmaj7
    { root: 43, pad: [59, 62, 64, 67] }    // G6
  ];
  const POOL = [72, 74, 76, 79, 81, 84, 86, 88];   // C 五聲音階，兩個八度
  const st = { last: 3, run: 0 };

  function build(ctx) {
    const master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3200; tone.Q.value = 0.4;
    const dry = ctx.createGain(); dry.gain.value = 1;
    const send = ctx.createGain(); send.gain.value = 0.3;
    const dl = ctx.createDelay(1.5); dl.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2000;
    send.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(tone);
    dry.connect(tone); tone.connect(comp); comp.connect(master); master.connect(ctx.destination);
    return { ctx, master, tone, dry, send };
  }

  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }
  function padNote(b, t, m, dur, vol) {
    const c = b.ctx, g = c.createGain();
    env(g, t, 1.4, vol, Math.max(0.1, dur - 1.4), 2.2);
    [['triangle', -4], ['sine', 5]].forEach(([type, det]) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = hz(m); o.detune.value = det;
      o.connect(g); o.start(t); o.stop(t + dur + 2.4);
    });
    g.connect(b.dry); g.connect(b.send);
  }
  function bass(b, t, m, dur, vol) {
    const c = b.ctx, g = c.createGain(), o = c.createOscillator();
    o.type = 'sine'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(b.dry); o.start(t); o.stop(t + dur + 0.1);
  }
  function bell(b, t, m, vol, pan) {
    const c = b.ctx, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    [[1, 1], [2.01, 0.28], [3.0, 0.09]].forEach(([mul, amp]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = 'sine'; o.frequency.value = hz(m) * mul; og.gain.value = amp;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 2);
    });
    let out = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    out.connect(b.dry); out.connect(b.send);
  }

  /* 排一小節。mood.calm：0 白天 ~ 1 深夜；mood.lively：0 農場 / 1 廣場 */
  function scheduleBar(b, barIdx, t0, mood) {
    const calm = Math.min(1, Math.max(0, mood.calm || 0)), lively = mood.lively ? 1 : 0;
    const ch = PROG[Math.floor(barIdx / 2) % PROG.length];
    if (barIdx % 2 === 0) ch.pad.forEach((m, i) => padNote(b, t0 + i * 0.07, m, BAR * 2 + 0.6, 0.045 - calm * 0.008));
    bass(b, t0, ch.root, BEAT * 1.9, 0.11);
    bass(b, t0 + BEAT * 2, ch.root + (barIdx % 4 === 3 ? 7 : 0), BEAT * 1.7, 0.08);
    const pcs = ch.pad.map(m => m % 12);
    const prob = 0.36 * (1 - 0.6 * calm) + lively * 0.14;
    for (let i = 0; i < 8; i++) {
      if (Math.random() > prob || st.run >= 3) { st.run = 0; continue; }
      let idx = st.last + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
      idx = Math.min(POOL.length - 1, Math.max(0, idx));
      if (Math.random() < 0.55) {
        for (let d = 0; d < POOL.length; d++) {
          const j = idx + (d % 2 ? -1 : 1) * Math.ceil(d / 2);
          if (j >= 0 && j < POOL.length && pcs.includes(POOL[j] % 12)) { idx = j; break; }
        }
      }
      st.last = idx; st.run++;
      bell(b, t0 + i * BEAT / 2 + (Math.random() - 0.5) * 0.02, POOL[idx], (0.085 - calm * 0.025) * (0.8 + Math.random() * 0.4), (Math.random() - 0.5) * 0.7);
    }
    if (lively && barIdx % 4 === 0) {
      [0, 1, 2, 3].forEach(k => bell(b, t0 + BEAT * 0.25 * k + BEAT * 3, ch.pad[k] + 12, 0.05, k % 2 ? 0.3 : -0.3));
    }
  }

  /* ---- 即時播放 ---- */
  let ctx = null, bus = null, timer = 0, nextT = 0, bar = 0, on = true, vol = 0.5, started = false;
  const mood = { calm: 0, lively: 0 };
  const level = () => (on ? vol * vol * 0.9 : 0);
  function applyLevel() { if (bus) bus.master.gain.setTargetAtTime(level(), ctx.currentTime, 0.35); }
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.1;
    while (nextT < ctx.currentTime + 1.6) { scheduleBar(bus, bar, nextT, mood); nextT += BAR; bar++; }
    bus.tone.frequency.setTargetAtTime(3200 - mood.calm * 1700, ctx.currentTime, 1.5);
  }
  function start() {
    if (started || !AC) return;
    started = true;
    try {
      ctx = new AC(); bus = build(ctx);
      if (ctx.resume) ctx.resume();
      nextT = ctx.currentTime + 0.2;
      timer = setInterval(tick, 300);
      tick(); applyLevel();
    } catch (e) { started = false; }
  }
  return {
    start, build, scheduleBar,
    setOn(v) { on = !!v; if (on && !started) start(); else if (ctx && on && ctx.resume) ctx.resume(); applyLevel(); },
    setVolume(v) { vol = Math.min(1, Math.max(0, v)); applyLevel(); },
    setMood(calm, lively) { mood.calm = calm; mood.lively = lively; },
    hidden(h) { if (!ctx) return; if (h) ctx.suspend && ctx.suspend(); else if (on && ctx.resume) ctx.resume(); },
    get on() { return on; }
  };
}
