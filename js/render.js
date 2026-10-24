'use strict';
/* 房間繪製、更新與繪製 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 房間繪製 ---------- */
function drawRoom(now) {
  r('#5a4040', 0, 0, W * T, H * T);
  r('#7a5656', 3 * T, 2 * T, 14 * T, 11 * T);
  const ws = house ? house.style.wall : 0, fs = house ? house.style.floor : 0;
  for (let ty = RY - 2; ty < RY; ty++) for (let tx = RX; tx < RX + RW; tx++) drawWallTile(tx * T, ty * T, tx, ty, ws);
  r('#c98f62', RX * T, RY * T - 2, RW * T, 2); r('#e8b27a', RX * T, RY * T - 3, RW * T, 1);
  for (let ty = RY; ty < RY + RH; ty++) for (let tx = RX; tx < RX + RW; tx++) drawFloorTile(tx * T, ty * T, tx, ty, fs);
  r('rgba(90,60,40,.18)', RX * T, RY * T, RW * T, 2);
  ob('#ff8fa8', '#d4688a', 9 * T + 2, 12 * T + 3, 2 * T - 4, 9); r('#ffd1e0', 9 * T + 6, 12 * T + 6, 2 * T - 12, 3);
  if (!house) return;
  const draw1 = it => drawFurn(it, it.x * T + RX * T, it.y * T + RY * T, now);
  house.items.filter(it => (defOf(it.k) || {}).layer === 'flat').forEach(draw1);
  house.items.filter(it => (defOf(it.k) || {}).layer === 'wall').forEach(draw1);
}
function houseEnts(now) {
  if (!house) return [];
  return house.items.filter(it => (defOf(it.k) || {}).layer === 'floor').map(it => {
    const d = dimsOf(it.k, it.r | 0);
    return { y: RY + it.y + d.h - 1 + 0.01, draw: () => drawFurn(it, it.x * T + RX * T, it.y * T + RY * T, now) };
  });
}
function drawEditOverlay(now) {
  if (scene !== 'house' || !edit.on || !house) return;
  const box = (g_, col) => {
    const x = (RX + g_.x) * T, y = (RY + g_.y) * T, w = g_.w * T, h = g_.h * T;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 160);
    r(col, x, y, w, 1); r(col, x, y + h - 1, w, 1); r(col, x, y, 1, h); r(col, x + w - 1, y, 1, h);
    ctx.globalAlpha = 1;
  };
  r('rgba(255,255,255,.07)', RX * T, RY * T, RW * T, RH * T);
  if (!visiting) for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (tx >= houseW() || ty >= houseD()) r('rgba(40,30,20,.35)', (RX + tx) * T, (RY + ty) * T, T, T);
  const selIt = house.items.find(i => i.id === edit.sel);
  if (selIt) { const g_ = itemRect(selIt); if (g_) { if (edit.drag) r('rgba(60,40,30,.3)', (RX + g_.x) * T, (RY + g_.y) * T, g_.w * T, g_.h * T); else box(g_, '#ff5f8a'); } }
  if (edit.hold && edit.hover) {
    const d = dimsOf(edit.hold.k, edit.hold.r | 0);
    if (d) {
      const [ax, ay] = anchorFor(edit.hold.k, edit.hover[0], edit.hover[1], edit.hold.r);
      const okp = fitsLocal(edit.hold.k, ax, ay, edit.hold.fromId, edit.hold.r);
      ctx.globalAlpha = 0.6;
      drawFurn({ k: edit.hold.k, f: edit.hold.f, r: edit.hold.r | 0 }, (RX + ax) * T, (RY + ay) * T, now);
      ctx.globalAlpha = 1;
      r(okp ? 'rgba(120,255,160,.30)' : 'rgba(255,80,80,.40)', (RX + ax) * T, (RY + ay) * T, d.w * T, d.h * T);
    }
  }
}

/* ---------- 更新與繪製 ---------- */
let moodAcc = 0;
function update(dt) {
  const snowing = world().snow;
  rain.forEach(d => {
    if (snowing) { d.y += dt * 0.05; d.x += Math.sin(d.y / 9 + d.x) * dt * 0.012 - dt * 0.004; }
    else { d.y += dt * 0.26; d.x -= dt * 0.06; }
    if (d.y > H * T) { d.y = -4; d.x = Math.random() * (W * T + 20); }
    if (d.x < 0) d.x += W * T;
  });
  for (let i = fx.length - 1; i >= 0; i--) {
    const p = fx[i];
    p.l += dt; p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.05 * dt / 16;
    if (p.l > p.max) fx.splice(i, 1);
  }
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i];
    p.l += dt; p.y -= dt * 0.012;
    if (p.l > 1100) pops.splice(i, 1);
  }
  const lk = Math.min(1, dt / 110);
  remotes.forEach(rp => { rp.x += (rp.tx - rp.x) * lk; rp.y += (rp.ty - rp.y) * lk; });
  if (syncScene()) sendPos(dt);
  if (scene === 'barn') barnTick(dt);
  moodAcc += dt;
  if (moodAcc > 1000) { moodAcc = 0; if (Music) { Music.setMood(darkness(world().min), scene === 'plaza'); syncBgm(); } updateBuffChip(); updateCheer(); }
  fishTick();
  cookTick();
  if (paused()) { actQueued = false; autoPath = null; return; }
  if (anim && (pressed.length || pose || pl.prog < 1)) anim = null;   // 走動或坐下就中斷動作
  if (pose) {                                   // 坐著或躺著：家具被搬走、離開屋子或按方向鍵就起身
    const furn = !pose.bench && !pose.ground;             // 坐家具／躺床才需要檢查家具還在不在
    const pit = furn && scene === 'house' && house ? house.items.find(i => i.id === pose.id) : null;
    if (pose.ground ? !syncScene() : scene !== (pose.bench ? 'plaza' : 'house')) pose = null;
    else if (furn && (!pit || pit.x !== pose.ix || pit.y !== pose.iy)) standUp();
    else {
      pose.t += dt;
      if (pose.type === 'lie' && pose.t > 2400) { pose.t = 0; pop(pl.x, pl.y - 0.6, 'Zzz', '#cfe8f7'); }
      if (pressed.length) standUp();
    }
  }
  updateCritters(dt);
  if (pressed.length || (autoPath && (paused() || fishing))) autoPath = null;   // 手動操作（鍵盤、搖桿）一動，自動走路就取消
  let over = 0;
  if (pl.prog < 1) {
    pl.prog += dt / stepMs();
    if (pl.prog >= 1) { over = (pl.prog - 1) * stepMs(); pl.prog = 1; }   // 這格走完多出來的時間，留給下一格，不要丟掉，連續走路才不會一格一頓
  }
  if (pl.prog >= 1) {
    const d = pressed[pressed.length - 1];
    if (d) tryMove(d); else if (autoPath) pathStep();
    if (pl.prog === 0 && over > 0) pl.prog = Math.min(0.6, over / stepMs());
  }
  if (actQueued) { actQueued = false; act(); }
  updateClock(); updateTip();
}
