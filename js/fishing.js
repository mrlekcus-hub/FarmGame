'use strict';
/* 釣魚與抓蟲 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 釣魚（魚種、咬鉤時間都由伺服器決定，拉竿也由伺服器判定） ---------- */
const catchEl = $('catch'), catchCv = $('catch-cv'), catchT = $('catch-t'), catchS = $('catch-s');
let fishing = null, fishSeq = 0, fishCool = 0, catchTimer = 0, catchShown = false;
$('catch-show').addEventListener('click', () => { showItem(catchKind, catchKey); hideCatch(); });
function hideCatch() { catchShown = false; catchEl.hidden = true; clearTimeout(catchTimer); }
let catchKey = '', catchKind = 'fish';
function showCatch(f, first, isBug) {
  catchKey = f.key; catchKind = isBug ? 'bug' : 'fish';
  if (isBug) drawBug(catchCv.getContext('2d'), f.key, false); else drawFish(catchCv.getContext('2d'), f.key, false);
  const rc = RARITY[f.rarity] || ['', '#888'];
  catchT.textContent = f.name;
  catchS.textContent = rc[0] + ' · ' + f.price + ' G' + (first ? ' · 新發現！' : '');
  catchEl.style.setProperty('--rc', rc[1]);
  const canShow = true;
  $('catch-show').hidden = !canShow;
  catchShown = true; catchEl.hidden = false; clearTimeout(catchTimer); catchTimer = setTimeout(hideCatch, canShow ? 6000 : 3200);
}

/* ---------- 抓蟲與蝴蝶（農場草地上會有蟲蝶飛、爬；打中之後抓到哪一種由伺服器依時段和天氣決定） ---------- */
const critters = [];
let critSlot = -1, netCool = 0, netSwing = null;
const SLOT_MS = 300000, SLOT_N = 3;      // 要和 SQL 的 _slot_bug / bug_catch 一致：每 5 分鐘一輪，每輪 3 隻
const phaseOf = m => m >= 300 && m < 480 ? 'dawn' : m >= 480 && m < 1020 ? 'day' : m >= 1020 && m < 1200 ? 'dusk' : 'night';
/* 第 sl 輪第 i 隻是哪一種（和 SQL 的 _slot_bug 完全相同，所有玩家看到的一樣） */
const sceneKey = () => scene === 'forest' ? 'forest' : 'farm';   // 傳給伺服器的場景（只有森林和農場能抓蟲釣魚）
function slotBug(sl, i, sc) {
  const t0 = sl * SLOT_MS, min = (((t0 + 8 * 3600000) % 86400000) + 86400000) % 86400000 / 60000;
  const ph = phaseOf(min), rain = precipHour(Math.floor(t0 / 3600000)), sea = seasonAt(t0);
  const kd = hash(sl, i, 1) < 0.5 ? 'butterfly' : 'bug';
  const list = bugCat.filter(b => b.kind === kd && (!b.zone || b.zone === 'any' || b.zone === sc) && (b.phase === 'any' || b.phase === ph) && (b.weather === 'any' || (b.weather === 'rain') === rain) && inSeason(b.seasons, sea))
    .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const tot = list.reduce((s, b) => s + b.weight, 0), rr_ = hash(sl, i, 2) * tot;
  let cs = 0;
  for (const b of list) { cs += b.weight; if (cs >= rr_) return b; }
  return list[list.length - 1] || null;
}
function grassTile(x, y) { return x >= 1 && y >= 1 && x < W - 1 && y < H - 1 && kind[y][x] === G; }
const critGrass = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 && K[y][x] === G;   // 抓蟲用：看目前場景的草地（農場、森林）
function spawnSlot(sl) {
  critters.length = 0;
  const cnt = scene === 'forest' ? SLOT_N + FOREST_XTRA : SLOT_N;
  for (let i = 0; i < cnt; i++) {
    if (bugTaken.has(sl + ':' + i)) continue;
    const b = slotBug(sl, i, sceneKey()); if (!b) continue;
    const fly = isFlyer(b.key);
    let x = 1 + Math.floor(hash(sl, i, 3) * (W - 2)), y = 1 + Math.floor(hash(sl, i, 4) * (H - 2));
    for (let n = 0; n < W * H && !fly && !critGrass(x, y); n++) { x++; if (x >= W - 1) { x = 1; y = y >= H - 2 ? 1 : y + 1; } }
    critters.push({ key: b.key, kind: b.kind, fly, slot: sl, i, x: x + 0.5, y: y + 0.5, tx: x + 0.5, ty: y + 0.5, wait: Math.random() * 1500, ph: Math.random() * 6 });
  }
}
function updateCritters(dt) {
  if (scene !== 'farm' && scene !== 'forest') { critters.length = 0; critSlot = -1; return; }
  const sl = Math.floor(srvNow() / SLOT_MS);
  if (bugCat.length && sl !== critSlot) { critSlot = sl; spawnSlot(sl); }
  for (let i = critters.length - 1; i >= 0; i--) {
    const c = critters[i];
    if (bugTaken.has(c.slot + ':' + c.i)) { critters.splice(i, 1); continue; }
    const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
    if (d < 0.06) {
      c.wait -= dt;
      if (c.wait <= 0) {
        const rg = c.fly ? 3 : 1.5;
        for (let n = 0; n < 8; n++) {
          const nx = c.x + (Math.random() * 2 - 1) * rg, ny = c.y + (Math.random() * 2 - 1) * rg;
          if (c.fly ? (nx > 1 && ny > 1 && nx < W - 1 && ny < H - 1) : critGrass(Math.floor(nx), Math.floor(ny))) { c.tx = nx; c.ty = ny; break; }
        }
        c.wait = c.fly ? 200 + Math.random() * 900 : 800 + Math.random() * 2500;
      }
    } else {
      const sp = (c.fly ? 0.0024 : 0.0009) * dt, st = Math.min(sp, d);
      c.x += dx / d * st; c.y += dy / d * st;
    }
  }
}
function swingNet(x, y) {
  if ((scene !== 'farm' && scene !== 'forest') || Date.now() < netCool) return;
  netCool = Date.now() + 450; netSwing = { x, y, t0: performance.now() };
  let best = null, bd = buffOn('bug') ? 2.1 : 1.25;
  critters.forEach(c => { const d = Math.hypot(c.x - (x + 0.5), c.y - (y + 0.5)); if (d < bd) { bd = d; best = c; } });
  if (!best) { pop(x, y, '揮空了', '#ffffff'); return; }
  const bg = bugCat.find(q => q.key === best.key);
  if (bg && bugLocked(bg)) { pop(x, y, '捕蟲 Lv.' + bugNeed(bg) + ' 才抓得到', '#ffb3a8'); return; }
  critters.splice(critters.indexOf(best), 1);
  const sl = best.slot, bi = best.i;
  bugTaken.add(sl + ':' + bi);
  burst(x, y, 8, ['#ffffff', '#fff6a8'], -1.2, 8);
  enqueue(() => rpc('bug_catch', { p_slot: sl, p_i: bi, p_scene: sceneKey() })).then(r => {
    if (r.inv) Object.assign(inv, r.inv);
    if (r.result !== 'caught') { toast('這隻溜走了'); return; }
    bugLog[r.bug.key] = r.n;
    showCatch(r.bug, r.first, true);
    qAdd('bug'); refreshHud(); loadLevelSoon();
  }).catch(e => toast(errText(e)));
}
function startFish(x, y) {
  if (Date.now() < fishCool) return;
  const id = ++fishSeq;
  fishing = { id, x, y, scene, phase: 'cast', t0: Date.now(), bite: 0, win: 1600 };
  rpc('fish_cast', { p_scene: sceneKey() }).then(r => {
    if (!fishing || fishing.id !== id) return;
    fishing.phase = 'wait'; fishing.bite = +r.bite_ms; fishing.win = +r.window_ms;
    netFish({ a: 1, x, y });
  }).catch(e => { if (fishing && fishing.id === id) fishing = null; toast(errText(e)); });
}
function fishCancel() {
  if (!fishing) return;
  const ph = fishing.phase; fishing = null; fishCool = Date.now() + 500;
  netFish({ a: 0 });
  if (ph === 'wait' || ph === 'bite') rpc('fish_cancel').catch(() => {});
}
async function fishReel(f) {
  f.phase = 'reel';
  try {
    const r = await rpc('fish_reel');
    if (!fishing || fishing.id !== f.id) return;
    fishing = null; fishCool = Date.now() + 700; netFish({ a: 0 });
    if (r.result === 'caught') {
      Object.assign(inv, r.inv); fishLog[r.fish.key] = +r.n || 1;
      splash(f.x, f.y); sparkle(f.x, f.y, (RARITY[r.fish.rarity] || [0, '#8fd3ff'])[1]);
      showCatch(r.fish, !!r.first); qAdd('fish'); refreshHud(); loadLevelSoon();
      const prevBest = (fishRec[r.fish.key] || {}).best | 0;
      rpc('fish_rec').then(m => {
        fishRec = {}; Object.keys(m || {}).forEach(k => { fishRec[k] = m[k]; });
        const e = fishRec[r.fish.key];
        if (e && e.last) toast(r.fish.name + ' 體長 ' + e.last + ' cm' + (e.last > prevBest ? (prevBest ? '（個人新紀錄！）' : '（第一次記錄）') : '（最大 ' + e.best + ' cm）'));
        if (dexOpen) renderDex();
      }).catch(() => {});
    } else if (r.result === 'early') toast('太早拉竿了，魚被嚇跑了');
    else if (r.result === 'late') toast('慢了一步，魚跑掉了…');
  } catch (e) { if (fishing && fishing.id === f.id) { fishing = null; fishCool = Date.now() + 700; } toast(errText(e)); }
}
function fishAct() {
  const f = fishing;
  if (f.phase === 'cast' || f.phase === 'reel') return;
  fishReel(f);
}
function fishTick() {
  if (!fishing) return;
  if (fishing.scene !== scene || paused() || pressed.length) { fishCancel(); return; }
  if (fishing.phase === 'wait' && srvNow() >= fishing.bite) {
    fishing.phase = 'bite'; splash(fishing.x, fishing.y); netFish({ a: 1, x: fishing.x, y: fishing.y, b: 1 });
    if (navigator.vibrate) try { navigator.vibrate([30, 40, 30]); } catch (_) {}
  } else if (fishing.phase === 'bite' && srvNow() > fishing.bite + fishing.win) {
    toast('魚跑掉了…下次要快一點'); fishCancel();
  }
}
function drawRod(px, py, face, f, now) {
  const [dx, dy] = DIRS[face];
  const bx0 = px + 8 + dx * 7, by0 = py + 9 + dy * 4;
  const tx = px + 8 + dx * 13, ty = py + 9 + dy * 9 - 7;
  for (let k = 0; k < 10; k++) { const u = k / 9; r(k < 3 ? '#8c5b3c' : '#c08a62', Math.round(bx0 + (tx - bx0) * u), Math.round(by0 + (ty - by0) * u), 1, 1); }
  let bx = f.x * T + 8, by = f.y * T + 8;
  const t = now / 1000;
  if (f.phase === 'cast' || f.phase === 'reel') {
    const u = clamp((Date.now() - f.t0) / 380, 0, 1);
    bx = tx + (bx - tx) * u; by = ty + (by - ty) * u - Math.sin(u * Math.PI) * 14;
  } else if (f.phase === 'bite') { bx += Math.sin(now / 45) * 1.2; by += Math.abs(Math.sin(now / 80)) * 3; }
  else { by += Math.sin(t * 2.4) * 0.9; }
  const n = 12;
  for (let k = 1; k < n; k++) {
    const u = k / n, sag = Math.sin(u * Math.PI) * (f.phase === 'bite' ? 1 : 3);
    r('rgba(255,255,255,.85)', Math.round(tx + (bx - tx) * u), Math.round(ty + (by - ty) * u + sag), 1, 1);
  }
  if (f.phase === 'wait' || f.phase === 'bite') {
    const rad = (f.phase === 'bite' ? now / 90 : now / 420) % 1;
    ctx.globalAlpha = (1 - rad) * 0.7;
    const rw = 3 + rad * 7;
    r('#ffffff', Math.round(f.x * T + 8 - rw), Math.round(by + 1), 1, 1); r('#ffffff', Math.round(f.x * T + 8 + rw), Math.round(by + 1), 1, 1);
    r('#ffffff', Math.round(f.x * T + 8 - rw / 2), Math.round(by + 2 + rad), Math.round(rw), 1);
    ctx.globalAlpha = 1;
  }
  r('#ffffff', Math.round(bx) - 1, Math.round(by) - 1, 3, 3); r('#ff6b6b', Math.round(bx) - 1, Math.round(by) - 2, 3, 2);
  if (f.phase === 'bite' && Math.floor(now / 110) % 2 === 0) {
    ob('#ff5f6e', '#c03a4a', px + 4, py - 17, 8, 11);
    r('#ffffff', px + 7, py - 15, 2, 5); r('#ffffff', px + 7, py - 9, 2, 2);
  }
}
function drawFishing(now) {
  const f = fishing;
  if (!f || f.scene !== scene) return;
  drawRod(Math.round(pl.x * T), Math.round(pl.y * T), pl.face, f, now);
}

/* 魚的小圖（快取）與展示卡 */
const fishSprites = {};
function showSprite(kind, key) {
  const id = kind + ':' + key;
  if (!fishSprites[id]) {
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
    if (kind === 'bug') drawBug(cv.getContext('2d'), key, false); else drawFish(cv.getContext('2d'), key, false);
    fishSprites[id] = cv;
  }
  return fishSprites[id];
}
function showCard(s, cx, cy, now) {
  const age = now - s.at, dur = s.dur || 7000;
  if (age > dur) return;
  ctx.font = '800 5px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  const label = s.name;
  const w = Math.max(30, Math.ceil(ctx.measureText(label).width) + 8), h = 29;
  const x = Math.round(cx - w / 2), y = cy - h;
  ctx.globalAlpha = clamp((dur - age) / 700, 0, 1);
  const bob = Math.round(Math.sin(now / 260) * 1);
  ob('#fffaf0', s.col, x, y + bob, w, h);
  r(s.col, cx - 1, y + h + bob, 3, 1); r('#fffaf0', cx, y + h - 1 + bob, 1, 1);
  ctx.drawImage(showSprite(s.kind || 'fish', s.k), cx - 8, y + 2 + bob);
  ctx.fillStyle = INK; ctx.fillText(label, cx, y + 25 + bob);
  ctx.globalAlpha = 1;
}
