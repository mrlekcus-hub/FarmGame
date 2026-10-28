'use strict';
/* 房間繪製、更新與繪製 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 房間繪製 ---------- */
function drawRoom(now) {
  r('#5a4040', 0, 0, W * T, H * T);
  r('#7a5656', (RX - 1) * T, (RY - 3) * T, (RW + 2) * T, (RH + 4) * T);
  const ws = house ? house.style.wall : 0, fs = house ? house.style.floor : 0;
  for (let ty = RY - 2; ty < RY; ty++) for (let tx = RX; tx < RX + RW; tx++) drawWallTile(tx * T, ty * T, tx, ty, ws);
  drawWallpaperPaint();
  r('#c98f62', RX * T, RY * T - 2, RW * T, 2); r('#e8b27a', RX * T, RY * T - 3, RW * T, 1);
  for (let ty = RY; ty < RY + RH; ty++) for (let tx = RX; tx < RX + RW; tx++) drawFloorTile(tx * T, ty * T, tx, ty, fs);
  drawFloorPaint();
  r('rgba(90,60,40,.18)', RX * T, RY * T, RW * T, 2);
  ob('#ff8fa8', '#d4688a', (RX + DX) * T + 2, (RY + RH) * T + 3, 2 * T - 4, 9); r('#ffd1e0', (RX + DX) * T + 6, (RY + RH) * T + 6, 2 * T - 12, 3);
  if (!house) return;
  drawDoorFrames();
  if (edit.door && edit.on && !visiting) { for (let x = 0; x <= RW - 2; x++) if (x !== DX && doorSpotOk(x)) r('rgba(255,143,168,.28)', (RX + x) * T, (RY + RH) * T + 2, T, 12); }
  const draw1 = it => drawFurn(it, it.x * T + RX * T, it.y * T + RY * T, now);
  house.items.filter(it => (defOf(it.k) || {}).layer === 'flat').forEach(draw1);
  house.items.filter(it => (defOf(it.k) || {}).layer === 'wall').forEach(draw1);
}
/* 隔間牆：照四周有沒有牆自動接起來（橫段、直段、轉角、T 字、十字）。每格由「頂面」和「正面」組成：
   頂面粗 6 格像素、正面高 5，只有南邊沒有牆的地方才看得到正面。花紋用家具店的牆面花紋（c.i = 0~4）。 */
const PW = { x0: 5, w: 6, th: 6, fh: 5 };
function pwTops(c) {
  const o = [[PW.x0, 0, PW.w, PW.th]];
  if (c.s) o.push([PW.x0, PW.th, PW.w, 16 - PW.th]);
  if (c.w) o.push([0, 0, PW.x0, PW.th]);
  if (c.e) o.push([PW.x0 + PW.w, 0, 16 - PW.x0 - PW.w, PW.th]);
  return o;
}
function pwFaces(c) {
  const o = [];
  if (!c.s) o.push([PW.x0, PW.th, PW.w, PW.fh]);
  if (c.w) o.push([0, PW.th, PW.x0, PW.fh]);
  if (c.e) o.push([PW.x0 + PW.w, PW.th, 16 - PW.x0 - PW.w, PW.fh]);
  return o;
}
function pwFace(px, py, c, rc, base) {
  g.save(); g.beginPath(); g.rect(px + rc[0], py + rc[1], rc[2], rc[3]); g.clip();
  drawWallTile(px, py, RX + c.x, RY + c.y, c.i);
  g.restore();
  r(shadeHex(base, -0.38), px + rc[0], py + rc[1] + rc[3] - 1, rc[2], 1);
  r('rgba(60,40,30,.16)', px + rc[0], py + rc[1], rc[2], 1);
}
function drawPartWall(px, py, c) {
  if (c.x === 0 || c.x === RW - 1) c = { ...c, w: c.w || c.x === 0, e: c.e || c.x === RW - 1 };   // 牆貼著房間左右邊界時，延伸到邊緣把縫封起來
  const atTop = c.y === 0 && !!c.s && !c.w && !c.e, atBot = c.y === RH - 1 && !!c.n && !c.w && !c.e;   // 只處理「垂直牆」的上下端；橫牆不動
  if (atBot) c = { ...c, s: true };                  // 牆貼著房間下緣時，一路延伸到邊緣（不然牆停在 11 格像素，下面留一段缺口）
  const base = iconRowColor.wall[c.i] || iconRowColor.wall[0], top = shadeHex(base, 0.4), hi = shadeHex(base, 0.7), lo = shadeHex(base, -0.14);
  if (atTop) r(top, px + PW.x0, py - 3, PW.w, 3);   // 牆貼著後牆時，往上蓋過踢腳線接到後牆，不要浮在半空
  pwFaces(c).forEach(rc => pwFace(px, py, c, rc, base));
  // 牆端（沒有往南、也沒有往左右接）的正面：左右不畫深色邊線，不然會變成一個框起來的空洞；改成很淡的側邊陰影
  if (!c.s && !c.w) r(shadeHex(base, -0.08), px + PW.x0, py + PW.th, 1, PW.fh - 1);
  if (!c.s && !c.e) r(shadeHex(base, -0.08), px + PW.x0 + PW.w - 1, py + PW.th, 1, PW.fh - 1);
  pwTops(c).forEach(rc => { r(top, px + rc[0], py + rc[1], rc[2], rc[3]); });
  // 頂面的亮邊與暗邊
  // 牆是連續的地方不畫接縫：北邊有牆就不畫主頂面的亮邊，南邊有牆就不畫延伸段的亮邊和主頂面的暗邊（不然垂直牆每一格都會多出一條橫線，像裂縫／空洞）
  pwTops(c).forEach((rc, i) => { if (i === 0 && (c.n || atTop)) return; if (i === 1 && c.s) return; r(hi, px + rc[0], py + rc[1], rc[2], 1); });
  if (!c.s) r(lo, px + PW.x0, py + PW.th - 1, PW.w, 1);
  if (c.w) r(lo, px, py + PW.th - 1, PW.x0, 1);
  if (c.e) r(lo, px + PW.x0 + PW.w, py + PW.th - 1, 16 - PW.x0 - PW.w, 1);
}
/* 門：連在一起的門會合併成一個大門口（只有兩端有門柱、中間是一整條橫樑）。門框一律是木頭色，讓門口和旁邊的牆分得出來。
   橫牆上的門（上下走過）：兩端門柱在地面、橫樑排在玩家之後，橫樑下掛一排小布簾，地上鋪一條踏墊；
   直牆上的門（左右走過）：南北兩端各一根門柱（柱頂有帽），中間鋪踏墊。 */
const DOOR_WOOD = { base: '#b5834f', hi: '#d9a86c', dark: '#7d5430', deep: '#5a3a20' };
function drawDoorFrames() {
  if (!house || !house.wl) return;
  const D = DOOR_WOOD;
  house.wl.forEach(c => {
    if (!c.door) return;
    const px = (RX + c.x) * T, py = (RY + c.y) * T, cloth = iconRowColor.wall[c.i] || iconRowColor.wall[0];
    if (c.dk) { if (c.hz) doorHzGround(px, py, c); else doorVertGround(px, py, c); return; }   // 另外購買的門款（doors.js）
    const mat = shadeHex(cloth, -0.08), matEdge = shadeHex(cloth, -0.35);
    if (c.hz) {
      const l = !c.dw, rt = !c.de, mx = l ? 4 : 0, mw = T - mx - (rt ? 4 : 0);
      r('rgba(60,40,30,.12)', px, py + 5, T, 11);                                   // 門內的淡淡陰影
      r(mat, px + mx, py + 12, mw, 3); r(matEdge, px + mx, py + 15, mw, 1);         // 踏墊
      for (let i = mx + 1; i < mx + mw; i += 4) r(shadeHex(cloth, 0.35), px + i, py + 13, 2, 1);
      const post = x => { r(D.base, px + x, py + 3, 4, 12); r(D.hi, px + x, py + 3, 1, 12); r(D.dark, px + x + 3, py + 3, 1, 12); r(D.deep, px + x - 0, py + 14, 4, 2); r(D.dark, px + x, py + 3, 4, 1); };
      if (l) post(0);
      if (rt) post(12);
    } else {
      const nE = !c.dn, sE = !c.ds;
      r('rgba(60,40,30,.12)', px, py, T, T);
      r(mat, px + 6, py, 4, T); r(matEdge, px + 5, py, 1, T); r(matEdge, px + 10, py, 1, T);
      for (let i = 1; i < T; i += 4) r(shadeHex(cloth, 0.35), px + 7, py + i, 2, 1);
      const pil = y => { r(D.base, px + 3, py + y + 3, 10, 6); r(D.dark, px + 3, py + y + 8, 10, 1); r(D.deep, px + 3, py + y + 9, 10, 1); r(D.hi, px + 3, py + y + 3, 10, 1); r(D.hi, px + 3, py + y + 3, 1, 6); r(D.hi, px + 2, py + y + 1, 12, 2); r(D.dark, px + 2, py + y + 2, 12, 1); };
      if (nE) pil(0);
      if (sE) pil(6);
    }
  });
}
function drawDoorLintel(px, py, c) {
  if (c.dk) { doorHzLintel(px, py, c); return; }
  const D = DOOR_WOOD, cloth = iconRowColor.wall[c.i] || iconRowColor.wall[0], trim = shadeHex(cloth, -0.25);
  r(D.hi, px, py, T, 3); r('#f0c890', px, py, T, 1);                              // 橫樑頂面
  r(D.base, px, py + 3, T, 3); r(D.dark, px, py + 6, T, 1);                       // 橫樑正面
  for (let i = 0; i < T; i += 4) { r(shadeHex(cloth, 0.1), px + i, py + 7, 4, 2); r(trim, px + i, py + 9, 4, 1); r(shadeHex(cloth, 0.1), px + i + 1, py + 9, 2, 1); }   // 一排小布簾
  if (!c.dw) { r(D.dark, px, py, 1, 7); }
  if (!c.de) { r(D.dark, px + T - 1, py, 1, 7); }
}
/* 地板與牆紙的逐格花紋：每一格自己選一款花紋（編號見 house.js），沒塗的格子顯示原本的全屋樣式；沒買過的花紋伺服器不會讓你畫上去 */
function drawFloorPaint() {
  if (!house || !house.paint) return;
  const s = house.paint.floor;
  for (let ly = 0; ly < RH; ly++) for (let lx = 0; lx < RW; lx++) { const c = s.charCodeAt(ly * 32 + lx) - 97; if (c >= 5 && c < PAT_N) drawFloorTile((RX + lx) * T, (RY + ly) * T, RX + lx, RY + ly, c - 5); }
}
function drawWallpaperPaint() {
  if (!house || !house.paint) return;
  const s = house.paint.wallpaper;
  for (let j = 0; j < 2; j++) for (let lx = 0; lx < RW; lx++) { const c = s.charCodeAt(j * 32 + lx) - 97; if (c >= 0 && c < 5) drawWallTile((RX + lx) * T, (RY - 2 + j) * T, RX + lx, RY - 2 + j, c); }
}
function houseEnts(now) {
  if (!house) return [];
  const out = house.items.filter(it => (defOf(it.k) || {}).layer === 'floor').map(it => {
    const d = dimsOf(it.k, it.r | 0);
    return { y: RY + it.y + d.h - 1 + 0.01, draw: () => drawFurn(it, it.x * T + RX * T, it.y * T + RY * T, now) };
  });
  (house.wl || []).forEach(c => {
    const px = (RX + c.x) * T, py = (RY + c.y) * T;
    if (c.door) { if (c.hz) out.push({ y: RY + c.y + 0.5, draw: () => drawDoorLintel(px, py, c) }); }
    else out.push({ y: RY + c.y + 0.01, draw: () => drawPartWall(px, py, c) });
  });
  return out;
}
function drawEditOverlay(now) {
  if (scene !== 'house' || !edit.on || !house) return;
  if (paintOn()) { drawPaintOverlay(); return; }
  const box = (g_, col) => {
    const x = (RX + g_.x) * T, y = (RY + g_.y) * T, w = g_.w * T, h = g_.h * T;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 160);
    r(col, x, y, w, 1); r(col, x, y + h - 1, w, 1); r(col, x, y, 1, h); r(col, x + w - 1, y, 1, h);
    ctx.globalAlpha = 1;
  };
  r('rgba(255,255,255,.07)', RX * T, RY * T, RW * T, RH * T);
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
