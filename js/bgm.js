'use strict';
/* 背景音樂 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 背景音樂 ---------- */
const Music = createMusic(window);
let musicOn = true, musicVol = 50;
try { const m = JSON.parse(localStorage.getItem('dewfarm_music') || 'null'); if (m) { musicOn = m.on !== false; musicVol = clamp(+m.vol || 0, 0, 100); } } catch (e) { /* 用預設值 */ }
/* ---- 場景音檔 BGM：農場、小村、廣場、塔羅屋各有自己的音檔（bgm 資料夾）；
        屋子沿用農場那首（從農場走進屋子不會斷掉重放）；其他地方（穀倉）或音檔讀不到時，改用程式合成的音樂。換場景時淡出舊的、淡入新的。 ---- */
const BGM_FILES = { farm: 'bgm/bgm-farm.mp3', town: 'bgm/bgm-town.mp3', plaza: 'bgm/bgm-plaza.mp3', tarot: 'bgm/bgm-tarot.mp3' };
const SCENE_BGM = { farm: 'farm', house: 'farm', forest: 'farm', cave: 'farm', town: 'town', plaza: 'plaza', tarot: 'tarot' };   // 場景 -> 用哪一首（沒列的場景用合成音樂）
function createSceneBgm(win, urls) {
  const AC = win.AudioContext || win.webkitAudioContext;
  if (!AC || !win.Audio) return null;
  let ctx = null, vol = 0.5, cur = null;
  const T = {}, dead = {};
  const LEVEL = 0.85;                       // 音檔本身偏大聲，留一點餘裕
  function make(name) {
    if (T[name]) return T[name];
    try {
      if (!ctx) ctx = new AC();
      const el = new Audio(); el.loop = true; el.preload = 'auto'; el.setAttribute('playsinline', ''); el.src = urls[name];
      const g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
      ctx.createMediaElementSource(el).connect(g);          // 走 Web Audio 才能在 iPhone 上調音量
      el.addEventListener('error', () => { dead[name] = true; if (cur === name) cur = null; });   // 讀不到：改由合成音樂接手
      return (T[name] = { el, g, off: 0 });
    } catch (e) { dead[name] = true; return null; }
  }
  const lv = () => vol * LEVEL;
  const fade = (t, to) => t.g.gain.setTargetAtTime(to, ctx.currentTime, 0.6);
  function play(t) {
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    const pr = t.el.play(); if (pr && pr.catch) pr.catch(() => { /* 還沒有手勢：下次點擊再試（nudge） */ });
  }
  return {
    has(name) { return !!urls[name] && !dead[name]; },
    set(name) {                              // name = 要放的那一首；null = 都不放
      if (name === cur) { if (cur) this.nudge(); return; }
      const prev = cur;
      if (prev && T[prev]) { const o = T[prev]; fade(o, 0); clearTimeout(o.off); o.off = setTimeout(() => { if (cur !== prev) o.el.pause(); }, 3500); }   // 淡出完才真的暫停，下次回來接著放
      cur = null;
      if (name && this.has(name)) { const t = make(name); if (t) { clearTimeout(t.off); cur = name; play(t); fade(t, lv()); } }
    },
    setVolume(v) { vol = Math.min(1, Math.max(0, v)); if (cur && T[cur]) fade(T[cur], lv()); },
    nudge() { if (cur && T[cur] && T[cur].el.paused) play(T[cur]); },
    hidden(h) { if (!cur || !T[cur]) return; if (h) T[cur].el.pause(); else play(T[cur]); }
  };
}
const Bgm = createSceneBgm(window, BGM_FILES);
let bgmGesture = false, bgmSig = '';
/* 決定現在該放哪一種：有音檔的場景 → 音檔；其他 → 程式合成。使用者關掉音樂就都不放。 */
function syncBgm() {
  if (!Music) return;
  const name = SCENE_BGM[scene], file = !!(Bgm && name && Bgm.has(name));
  const go = musicOn && !pnOpen && performance.now() - pnHeard >= 3000 && (bgmGesture || authOpen);   // 彈鋼琴時 BGM 自動停，離開再接著放
    // 登入畫面也放農場那首（瀏覽器擋自動播放時，第一次點擊會接著播）
  const sig = (go ? 1 : 0) + '|' + (file ? name : '') + '|' + musicVol;
  if (sig === bgmSig) return;                 // 沒變就不重複處理（這個函式每秒會被叫一次）
  bgmSig = sig;
  Music.setOn(go && !file);
  if (Bgm) { Bgm.setVolume(musicVol / 100); Bgm.set(go && file ? name : null); }
}
function syncMusicUI() {
  $('music').textContent = '音樂：' + (musicOn ? '開' : '關');
  $('music').setAttribute('aria-pressed', musicOn ? 'true' : 'false');
  $('vol').value = musicVol;
  try { localStorage.setItem('dewfarm_music', JSON.stringify({ on: musicOn, vol: musicVol })); } catch (e) { /* 略過 */ }
}
if (!Music) { $('music').hidden = true; $('vol').hidden = true; }
else {
  Music.setVolume(musicVol / 100); Music.setOn(false); syncMusicUI();
  const first = () => { window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); bgmGesture = true; syncBgm(); };
  window.addEventListener('pointerdown', first); window.addEventListener('keydown', first);
  /* 音檔第一次播放要在使用者手勢裡（尤其 iPhone）：之後每次點擊／觸控／按鍵都順手確認一次 */
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (Bgm) Bgm.nudge(); }, { passive: true }));
  $('music').addEventListener('click', () => { musicOn = !musicOn; syncBgm(); syncMusicUI(); });
  $('vol').addEventListener('input', () => { musicVol = +$('vol').value; Music.setVolume(musicVol / 100); if (musicVol > 0 && !musicOn) { musicOn = true; } syncBgm(); syncMusicUI(); });
  document.addEventListener('visibilitychange', () => { Music.hidden(document.hidden); if (Bgm) Bgm.hidden(document.hidden); });
}
