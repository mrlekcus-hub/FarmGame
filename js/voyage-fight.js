'use strict';
/* 出海團的「張力拉扯」小遊戲 —— 雷克斯農場。
   按住讓張力上升、放開下降；張力維持在綠色區間，進度條就會填滿。魚會突然猛拉（先有 0.45 秒的警告）。
   結果只用來給玩家看：伺服器用「咬鉤到拉起的實際時間」和最短拉扯時間（依難度）判定，作弊也釣不到比正常更快、更多的魚。 */
const VF = {
  1: { lo: .30, hi: .75, yank: .6, i0: 1.4, i1: 2.8, spd: .20 },
  2: { lo: .35, hi: .70, yank: .9, i0: .9, i1: 2.3, spd: .16 },
  3: { lo: .38, hi: .66, yank: 1.1, i0: .7, i1: 1.8, spd: .14 },
  4: { lo: .40, hi: .62, yank: 1.3, i0: .6, i1: 1.4, spd: .12 }
};
const VF_UP = .60, VF_DOWN = .38, VF_OUT = .06, VF_SPIKE = .30, VF_WARN = .45, VF_CAP = 60000;
let vfOn = false;
const vf = { p: null, t: 0, pr: 0, t0: 0, hook: 0, rnd: null, nextY: 0, warnAt: 0, held: false, btn: false, tog: false, el: 0 };
const vfEl = document.createElement('div'); vfEl.id = 'vf'; vfEl.hidden = true;
vfEl.innerHTML = '<canvas id="vf-cv" width="240" height="72"></canvas><button type="button" id="vf-hold" aria-label="按住收線">按住收線</button>';
document.querySelector('.stage').appendChild(vfEl);
const vfCv = vfEl.querySelector('#vf-cv'), vfC = vfCv.getContext('2d'), vfBtn = vfEl.querySelector('#vf-hold');
const mulb = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function vfStart(diff, seed, hook) {
  const p = VF[diff] || VF[1];
  Object.assign(vf, { p, t: .25, pr: .12, t0: performance.now(), hook, rnd: mulb(seed | 0 || 1), warnAt: 0, btn: false, tog: false, el: 0 });
  vf.nextY = vf.t0 + (p.i0 + vf.rnd() * (p.i1 - p.i0)) * 1000;
  vfOn = true; pressed.length = 0; vfEl.hidden = false;
  vfBtn.textContent = voyToggleReel ? '點一下 收線／放鬆' : '按住收線';
  vfDraw(performance.now());
}
function vfPress() {                                   // 動作鍵（鍵盤／畫面動作鈕）；切換模式才用
  if (!vfOn) return;
  if (voyToggleReel) vf.tog = !vf.tog;
}
vfBtn.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation();
  if (voyToggleReel) vf.tog = !vf.tog; else { vf.btn = true; try { vfBtn.setPointerCapture(e.pointerId); } catch (_) {} }
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => vfBtn.addEventListener(t, () => { if (!voyToggleReel) vf.btn = false; }));
vfEl.addEventListener('pointerdown', e => e.stopPropagation());
function vfHolding() { return voyToggleReel ? vf.tog : (vf.btn || actHeld); }

function vfTick(dt) {
  if (!vfOn) return;
  const p = vf.p, now = performance.now(), s = Math.min(dt, 100) / 1000;
  vf.el = now - vf.t0;
  vf.held = vfHolding();
  vf.t += (vf.held ? VF_UP : -VF_DOWN) * s;
  if (vf.warnAt) {
    if (now >= vf.warnAt) { vf.t += p.yank * VF_SPIKE; vf.warnAt = 0; vf.nextY = now + (p.i0 + vf.rnd() * (p.i1 - p.i0)) * 1000; chime([60], .06); }
  } else if (now >= vf.nextY) vf.warnAt = now + VF_WARN * 1000;
  vf.t = Math.max(0, vf.t);
  if (vf.t > 1) { vfEnd(false, 'snapped'); return; }
  const inZ = vf.t >= p.lo && vf.t <= p.hi;
  vf.pr += (inZ ? p.spd : -VF_OUT) * s;
  vf.pr = Math.max(0, vf.pr);
  if (vf.pr >= 1) { vfEnd(true); return; }
  if (vf.el > VF_CAP) { vfEnd(false, 'timeout'); return; }
  vfDraw(now);
}
function vfDraw(now) {
  const p = vf.p, c = vfC, W_ = 240;
  c.clearRect(0, 0, W_, 72);
  c.fillStyle = 'rgba(20,32,48,.82)'; c.fillRect(0, 0, W_, 72);
  c.fillStyle = '#ffffff22'; c.fillRect(8, 8, W_ - 16, 10);
  c.fillStyle = '#ffd36b'; c.fillRect(8, 8, Math.round((W_ - 16) * Math.min(1, vf.pr)), 10);
  c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.textBaseline = 'top'; c.fillText('進度', 8, 20);
  const bx = 8, bw = W_ - 16, by = 40, bh = 14;
  c.fillStyle = '#ffffff22'; c.fillRect(bx, by, bw, bh);
  const inZ = vf.t >= p.lo && vf.t <= p.hi;
  c.fillStyle = inZ ? '#5fd07a' : '#3a8f55'; c.fillRect(bx + bw * p.lo, by, bw * (p.hi - p.lo), bh);
  c.fillStyle = '#ff5f6e'; c.fillRect(bx + bw - 3, by, 3, bh);
  const nx = bx + bw * Math.min(1, vf.t);
  c.fillStyle = vf.t > .88 ? '#ff5f6e' : '#fff'; c.fillRect(Math.round(nx) - 1, by - 3, 3, bh + 6);
  if (vf.warnAt && Math.floor(now / 90) % 2 === 0) { c.fillStyle = '#ff5f6e'; c.font = 'bold 14px sans-serif'; c.fillText('！魚要猛拉了', 150, 20); }
  c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.fillText('張力', 8, 57);
  vfBtn.classList.toggle('on', vfHolding());
}
function vfEnd(ok, why) {
  const f = fishing, res = { hook: vf.hook, fight_ms: Math.round(performance.now() - vf.t0), ok: !!ok };
  vfOn = false; vfEl.hidden = true;
  if (!f || !f.boat) return;
  f.why = why || '';
  boatReel(f, res);
}
function vfClose() { vfOn = false; vfEl.hidden = true; }
function vfAbort() { if (!vfOn) return; vfClose(); if (fishing && fishing.boat) { fishing = null; netFish({ a: 0 }); } }
