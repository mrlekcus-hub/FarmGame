'use strict';
/* 農場天空 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 農場天空：寬景天空、遠山、日月、雲、流星（只在農場畫，畫在地圖上方 4 格） ---------- */
const SKY = 4;   // 天空高度（格）；農場的天空畫在 y = -SKY*T ~ 0
const skyTop = () => scene === 'farm' ? SKY * T : 0;
const SKY_KEYS = [   // [分鐘, 天頂色, 地平線色]
  [0,    [14, 10, 36],   [42, 31, 90]],
  [300,  [14, 10, 36],   [42, 31, 90]],
  [360,  [92, 74, 138],  [240, 165, 140]],
  [450,  [110, 195, 242],[191, 232, 255]],
  [960,  [110, 195, 242],[191, 232, 255]],
  [1050, [106, 90, 168], [255, 154, 122]],
  [1140, [34, 24, 72],   [90, 60, 120]],
  [1290, [14, 10, 36],   [42, 31, 90]],
  [1440, [14, 10, 36],   [42, 31, 90]]
];
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function skyColors(m) {
  for (let i = 1; i < SKY_KEYS.length; i++) {
    if (m <= SKY_KEYS[i][0]) {
      const a = SKY_KEYS[i - 1], b = SKY_KEYS[i], t = (m - a[0]) / (b[0] - a[0] || 1);
      return [mixC(a[1], b[1], t), mixC(a[2], b[2], t)];
    }
  }
  return [SKY_KEYS[0][1], SKY_KEYS[0][2]];
}
function skyDisc(cx, cy, rad, col) {
  for (let dy = -rad; dy <= rad; dy++) { const dx = Math.floor(Math.sqrt(rad * rad - dy * dy + 0.5)); r(col, cx - dx, cy + dy, 2 * dx + 1, 1); }
}
function skyCloud(x, y, n, col, a) {   // 像素雲：三層疊起來
  ctx.globalAlpha = a;
  r(col, x + 3, y, 8 + n * 2, 3); r(col, x, y + 2, 14 + n * 3, 3); r(col, x + 2, y + 4, 10 + n * 3, 2);
  ctx.globalAlpha = 1;
}
/* 夜晚窗戶光暈（方案 A）：窗玻璃本身在 dark > 0.15 時已經變黃，這裡只補窗外一圈淡光，傍晚時慢慢亮起來 */
function winGlow(x, y, w, h, a) {
  r('rgba(255,217,138,' + (0.14 * a).toFixed(3) + ')', x - 4, y - 4, w + 8, h + 8);
  r('rgba(255,217,138,' + (0.28 * a).toFixed(3) + ')', x - 2, y - 2, w + 4, h + 4);
}
function nightGlows(dark) {
  const a = clamp((dark - 0.15) / 0.35, 0, 1);
  if (scene === 'farm') { [10, 58].forEach(wx => winGlow(2 * T + wx + 1, T + 30, 10, 9, a)); return; }
  const list = scene === 'town' ? TOWN_BLD : scene === 'forest' ? FOREST_BLD : null;
  if (!list) return;
  list.forEach(b => {
    if (b.t === 'furn' || b.t === 'mine') return;   // 這兩種外觀沒有一般窗戶
    const ox = b.x * T, oy = b.y * T, wd = b.w * T, wy = oy + ((b.h * T) >> 1) + 4;
    winGlow(ox + 8, wy, 9, 8, a); winGlow(ox + wd - 17, wy, 9, 8, a);
  });
}
function drawSky(now, w, dark) {
  const X0 = -300, WD = W * T + 600, top = -SKY * T, m = w.min, ms = srvNow();
  const [cTop, cBot] = skyColors(m), nb = 8, bh = SKY * T / nb;
  for (let i = 0; i < nb; i++) r(rgbS(mixC(cTop, cBot, i / (nb - 1))), X0, top + i * bh, WD, bh + 1);
  const wet = w.wet;

  /* 星星：晚上才出，雨雪天看不到 */
  if (dark > 0.15 && !wet) {
    for (let i = 0; i < 70; i++) {
      const sx = -120 + Math.floor(hash(i, 3, 91) * (W * T + 240)), sy = top + 2 + Math.floor(hash(i, 5, 92) * (SKY * T - 14));
      const tw = 0.55 + 0.45 * Math.sin(now / (500 + hash(i, 7, 93) * 900) + i);
      ctx.globalAlpha = clamp(dark * tw, 0, 1);
      r('#fff6d8', sx, sy, hash(i, 9, 94) > 0.85 ? 2 : 1, hash(i, 9, 94) > 0.85 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }

  /* 流星：夜深時每 12 秒有機會劃過一次 */
  if (dark > 0.6 && !wet) {
    const win = Math.floor(now / 12000), ph = (now % 12000) / 900;
    if (ph < 1 && hash(win, 1, 95) < 0.7) {
      const sx0 = 20 + hash(win, 2, 96) * (W * T - 120), sy0 = top + 4 + hash(win, 3, 97) * 16;
      for (let k = 0; k < 7; k++) {
        const q = Math.max(0, ph - k * 0.03);
        ctx.globalAlpha = (1 - k / 7) * (1 - ph * 0.5);
        r(k === 0 ? '#ffffff' : '#cfd8ff', Math.round(sx0 + q * 70), Math.round(sy0 + q * 34), k === 0 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* 太陽：5:30 升起、18:30 落下，沿弧線走 */
  const sp = (m - 330) / 780;
  if (sp > -0.04 && sp < 1.04) {
    const q = clamp(sp, 0, 1), sx = Math.round(18 + q * (W * T - 36)), sy = Math.round(-12 - Math.sin(Math.PI * q) * (SKY * T - 20));
    const low = 1 - Math.sin(Math.PI * q), col = mixC([255, 216, 74], [255, 140, 70], clamp(low * 1.4 - 0.2, 0, 1));
    ctx.globalAlpha = wet ? 0.35 : 1;
    skyDisc(sx, sy, 10, rgbS(col, 0.18)); skyDisc(sx, sy, 8, rgbS(col, 0.28));
    skyDisc(sx, sy, 6, rgbS(col)); skyDisc(sx, sy, 4, '#fff3b0');
    const ray = 9 + Math.round(Math.sin(now / 400) * 1);
    [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(d => r(rgbS(col), sx + d[0] * ray - 1, sy + d[1] * ray - 1, 2, 2));
    ctx.globalAlpha = 1;
  }

  /* 月亮：18:00 升起、隔天 6:30 落下，有月相（30 天一輪） */
  const mp = (((m - 1080) % 1440) + 1440) % 1440 / 750;
  if (mp < 1.04 || mp > 1.96) {
    const q = clamp(mp > 1.5 ? 0 : mp, 0, 1), mx = Math.round(18 + q * (W * T - 36)), my = Math.round(-8 - Math.sin(Math.PI * q) * (SKY * T - 20)), rad = 7;
    const phase = (Math.floor(ms / 86400000) % 30) / 30, f = Math.max(0.1, (1 - Math.cos(2 * Math.PI * phase)) / 2), off = (phase < 0.5 ? -1 : 1) * f * 2 * rad;
    ctx.globalAlpha = wet ? 0.3 : 1;
    skyDisc(mx, my, 11, 'rgba(240,235,190,.10)'); skyDisc(mx, my, 9, 'rgba(240,235,190,.16)');
    for (let dy = -rad; dy <= rad; dy++) {
      const dx = Math.floor(Math.sqrt(rad * rad - dy * dy + 0.5)), sdx = Math.floor(Math.sqrt(rad * rad - dy * dy + 0.5));
      const a0 = mx - dx, a1 = mx + dx, b0 = mx + off - sdx, b1 = mx + off + sdx;
      if (f < 0.03) { r('rgba(120,115,150,.35)', a0, my + dy, a1 - a0 + 1, 1); continue; }
      const l1 = Math.min(a1, b0 - 1), l0 = a0, r0 = Math.max(a0, b1 + 1), r1 = a1;
      if (f > 0.97) { r('#f6efc0', a0, my + dy, a1 - a0 + 1, 1); continue; }
      if (l1 >= l0) r('#f6efc0', l0, my + dy, l1 - l0 + 1, 1);
      if (r1 >= r0) r('#f6efc0', r0, my + dy, r1 - r0 + 1, 1);
    }
    if (f > 0.6) { r('#d8cf9a', mx - 3, my - 2, 2, 2); r('#d8cf9a', mx + 1, my + 1, 3, 2); r('#d8cf9a', mx - 2, my + 3, 2, 1); }
    ctx.globalAlpha = 1;
  }

  /* 雲：慢慢飄；雨雪天變多變灰 */
  const nc = wet ? 10 : 7, cc = wet ? mixC([170, 178, 192], [84, 86, 118], dark) : mixC([255, 255, 255], [150, 140, 200], dark);
  for (let i = 0; i < nc; i++) {
    const sp2 = 1.5 + hash(i, 2, 81) * 3, span = W * T + 160;
    const cx = (((hash(i, 1, 80) * span + now / 1000 * sp2) % span) + span) % span - 120;
    skyCloud(Math.round(cx), Math.round(top + 6 + hash(i, 3, 82) * (SKY * T - 30)), (i % 3), rgbS(cc), (wet ? 0.8 : 0.9) - dark * 0.45);
  }

  /* 遠山兩層：天色變化時跟著換色；冬天或高峰有雪頂 */
  const warm = Math.max(0, 1 - Math.abs(m - 1110) / 90, 1 - Math.abs(m - 380) / 70) * 0.45;
  const farC = mixC(mixC([150, 185, 220], [40, 34, 84], dark), [214, 140, 150], warm);
  const nearC = mixC(mixC([108, 160, 172], [28, 24, 60], dark), [190, 110, 120], warm * 0.8);
  for (let x = X0; x < X0 + WD; x += 2) {
    const hf = 16 + Math.round(9 * Math.abs(Math.sin(x * 0.037 + 1)) + 6 * Math.sin(x * 0.11 + 2));
    r(rgbS(farC), x, -hf, 2, hf + 1);
    if ((hf > 25 || SEA === 'winter') && hf > 21) r('rgba(255,255,255,' + (0.85 - dark * 0.4).toFixed(2) + ')', x, -hf, 2, 2);
  }
  for (let x = X0; x < X0 + WD; x += 2) {
    const hn = 6 + Math.round(5 * Math.abs(Math.sin(x * 0.06 + 4)) + 3 * Math.sin(x * 0.17));
    r(rgbS(nearC), x, -hn, 2, hn + 1);
  }
}
/* 電腦版：農場的畫布多 4 格高放天空；手機沉浸模式靠鏡頭往上看 */
function syncCanvasRows() {
  if (imm) { if (cv.style.aspectRatio) cv.style.aspectRatio = ''; return; }
  const rows = BH + (scene === 'farm' ? SKY : 0);
  if (cv.width !== BW * T * S || cv.height !== rows * T * S) { cv.width = BW * T * S; cv.height = rows * T * S; }
  const ar = rows === BH ? '' : BW + ' / ' + rows;
  if (cv.style.aspectRatio !== ar) cv.style.aspectRatio = ar;
}

/* 點地面走過去：目標格的四個角閃動，路上的小白點 */
function drawTapMark(now) {
  const a = autoPath;
  if (!a || a.scene !== scene) return;
  const px = a.tx * T, py = a.ty * T, o = Math.floor(now / 260) % 2, c = a.act ? '#ffd23f' : '#ff7a9b', e = T - 4;   // 金黃色＝到了會自動動作
  [[0, 0, 1, 1], [e, 0, -1, 1], [0, e, 1, -1], [e, e, -1, -1]].forEach(([ox, oy, sx, sy]) => {
    const x = px + 2 + ox + o * sx, y = py + 2 + oy + o * sy;
    r(c, sx > 0 ? x : x - 3, y, 4, 1); r(c, x, sy > 0 ? y : y - 3, 1, 4);
  });
  ctx.globalAlpha = 0.7;
  a.tiles.slice(a.i, -1).forEach(([x, y]) => r('#ffffff', x * T + 7, y * T + 7, 2, 2));
  ctx.globalAlpha = 1;
}
function draw(now) {
  g = ctx;
  syncCanvasRows();
  SEA = seasonAt(srvNow());
  {
    const s = imm ? view.s : S, vw = cv.width / s, vh = cv.height / s, e0 = pl.prog;
    const cx = (pl.sx + (pl.x - pl.sx) * e0) * T + 8, cy = (pl.sy + (pl.y - pl.sy) * e0) * T + 8;
    const sk = skyTop();
    const tx = vw >= W * T ? (W * T - vw) / 2 : clamp(cx - vw / 2, 0, W * T - vw);
    const ty = vh >= H * T + sk ? (H * T - sk - vh) / 2 : clamp(cy - vh / 2, -sk, H * T - vh);
    if (view.snap || view.scene !== scene) { view.x = tx; view.y = ty; view.snap = false; view.scene = scene; }
    else {   // 鏡頭追角色：用經過的時間算，不管 30 還是 60 幀，追的速度都一樣
      const fk = 1 - Math.pow(0.8, clamp((now - (view.t || now)) / 16.667, 0.25, 4));
      view.x += (tx - view.x) * fk; view.y += (ty - view.y) * fk;
    }
    view.t = now;
    if (imm) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#6fbf73'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(s, 0, 0, s, -Math.round(view.x * s), -Math.round(view.y * s));
  }
  ctx.imageSmoothingEnabled = false;
  const w = world(), dark = darkness(w.min);
  if (scene === 'farm') drawSky(now, w, dark);
  if (scene === 'house') drawRoom(now);
  else if (scene === 'barn') drawBarnRoom(now);
  else if (scene === 'stylist') drawStylistRoom(now);
  else if (scene === 'cave') drawCaveRoom(now);
  else if (scene === 'tarot') drawTarotRoom(now);
  else {
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const k = K[ty][tx], px = tx * T, py = ty * T;
    if (k === WA) drawWater(px, py, tx, ty, now);
    else if (k === P) drawPath(px, py, tx, ty);
    else if (k === TR) drawTree(px, py, tx, ty);
    else if (k === GT || k === FG || k === TG || k === FW || k === FE) { drawPath(px, py, tx, ty); drawGate(px, py, now); }
    else if (k === FR) drawRim(px, py, tx, ty);
    else {
      drawGrass(px, py, tx, ty);
      if (k === BN) drawBench(px, py);
      else if (k === BD) drawBoard(px, py);
      else if (k === NP) drawNpc(px, py, (npcAt(tx, ty) || NPCS[0]).k, now);
      else if (k === RK) drawRock(px, py, ROCKS.findIndex(q => q[0] === tx && q[1] === ty));
      else if (k === WL) drawWell(px, py, now);
      else if (k === G && scene === 'town' && tx === MXT && ty === MYT && merchantHere()) drawStall(px, py, now);
      else if (k === G && scene === 'town' && tx === MXT + 1 && ty === MYT && merchantHere()) miloArt(px, py, Math.floor(now / 600) % 2);   // 米羅站在攤位右邊
      else if (k === G && scene === 'farm' && yardMap.has(pk(tx, ty))) yardArt(px, py, yardMap.get(pk(tx, ty)), now, dark > 0.35);
      else if (k === G && scene === 'farm') {
        const p = plots.get(pk(tx, ty));
        if (p) {
          drawSoil(px, py, isWet(p) || w.wet);
          if (p.fert) { r(p.fert === 2 ? '#f0c040' : '#8c6a44', px + 2, py + 13, 2, 1); r(p.fert === 2 ? '#f0c040' : '#8c6a44', px + 12, py + 12, 2, 1); r(p.fert === 2 ? '#f0c040' : '#8c6a44', px + 7, py + 14, 2, 1); }
          if (p.crop) drawCrop(px, py, { t: p.crop, p: progress(p) }, now);
        } else if (farmable(tx, ty)) r('rgba(255,255,255,.07)', px, py, T, T);
      }
    }
  }
  if (scene === 'farm') { drawHouse(dark > 0.15, now); drawShop(dark > 0.15, now); drawBarn(now); }
  else if (scene === 'town') TOWN_BLD.forEach(b => drawBldg(b, now, dark > 0.15));
  else if (scene === 'forest') FOREST_BLD.forEach(b => drawBldg(b, now, dark > 0.15));
  else {
    drawTarotStall(now);
    if (scene === 'plaza') drawSnakeBoard(now);
    if (scene === 'plaza') drawPlazaLamps(now);   // 廣場路燈（js/plaza-light.js）
    if (scene === 'plaza') drawHalloween(now);   // 萬聖節佈置（只在活動日期內）
    for (let i = 0; i < 5; i++) {
      const a = now / 520 + i * 1.3, yy = 7 * T + 2 - Math.abs(Math.sin(a)) * 9;
      r('#bfe6ff', 10 * T + 4 + i * 2 + ((i % 2) ? 1 : 0), Math.round(yy), 1, 2);
    }
  }
  }

  const e = pl.prog;
  const rx = pl.sx + (pl.x - pl.sx) * e, ry = pl.sy + (pl.y - pl.sy) * e;
  const ents = [];
  if (ready) {
    const ch = myChar();
    const pit = pose && scene === 'house' && house ? house.items.find(i => i.id === pose.id) : null;
    if (pit) {
      ents.push({ y: pose.sort, draw: () => {
        const px = Math.round(pl.x * T), py = Math.round(pl.y * T);
        if (pose.type === 'lie') {
          drawLying(pit, ch, pose.slot);
          { const q = bedTag(pit, pose.slot); nameTag(ch.name, q[0], q[1], '#ffffff'); }
        } else {
          drawSeated(px, py, pit, ch);
          nameTag(ch.name, px + 8, py - (pit.k === 'shower' ? 19 : pit.k === 'scale' ? 29 : 7), '#ffffff');
        }
      } });
    } else if (pose && ((pose.bench && scene === 'plaza') || (pose.ground && syncScene()))) {
      ents.push({ y: ry, draw: () => {
        (pose.ground ? drawGroundSeated : drawBenchSeated)(Math.round(pl.x * T), Math.round(pl.y * T), ch);
        nameTag(ch.name, Math.round(pl.x * T) + 8, Math.round(pl.y * T) - 7, '#ffffff');
      } });
    } else ents.push({ y: ry, draw: () => {
      drawPlayerFx(Math.round(rx * T), Math.round(ry * T), pl.face, pl.prog < 1, (Math.floor(pl.prog * 2) + pl.step) % 2, ch, pl.prog < 1 ? null : animFx(anim, now));
      nameTag(ch.name, Math.round(rx * T) + 8, Math.round(ry * T) - 5, '#ffffff');
    } });
  }
  if (scene === 'house') houseEnts(now).forEach(en => ents.push(en));
  if (scene === 'barn') barnEnts(now, ents);
  if (scene === 'tarot') lekcusEnts(now, ents);
  if (scene === 'farm') { updateForage(); fgList.forEach(f => {
    if (forTaken.has(f.slot + ':' + f.i) || yardMap.has(pk(f.x, f.y))) return;
    ents.push({ y: f.y + 0.5, draw: () => { miscArt(f.x * T, f.y * T + Math.round(Math.sin(now / 500 + f.i) * 0.6), f.key); } });
  }); }
  if (scene === 'farm' || scene === 'forest') critters.forEach(c => {
    const fr = Math.floor(now / (c.fly ? 130 : 260) + c.ph) % 2, bob = c.fly ? Math.round(5 + Math.sin(now / 300 + c.ph) * 2) : 0;
    ents.push({ y: c.y + (c.fly ? 1.2 : 0), draw: () => {
      const px = Math.round(c.x * T) - 8, py = Math.round(c.y * T) - 12;
      if (c.fly) r('rgba(40,70,30,.22)', px + 5, py + 13, 6, 2);
      bugPix(c.key, fr, px, py - bob, false);
    } });
  });
  if (syncScene()) remotes.forEach(rp => hereRp(rp) && ents.push({ y: (() => {
    /* 別人坐椅子／躺床：排序要跟自己一樣放在家具前面，不然會被家具蓋住看不清楚 */
    const f0 = rp.fs && Math.abs(rp.tx - rp.x) + Math.abs(rp.ty - rp.y) <= 0.05 ? seatItemAt(rp.tx, rp.ty, rp.fs) : null;
    return f0 ? RY + f0.y + dimsOf(f0.k, 0).h - 1 + 0.02 : rp.y;
  })(), draw: () => {
    const mv = Math.abs(rp.tx - rp.x) + Math.abs(rp.ty - rp.y) > 0.05;
    const px = Math.round(rp.x * T), py = Math.round(rp.y * T);
    const seated = rp.sit && !mv, gs = rp.gsit && !mv;
    const fit = rp.fs && !mv ? seatItemAt(rp.tx, rp.ty, rp.fs) : null;
    if (fit) {
      if (rp.fs === 4) { const sl = bedSlotAt(fit, rp.tx, rp.ty); drawLying(fit, rp.char, sl); const q = bedTag(fit, sl); nameTag(rp.name, q[0], q[1], '#fff3b0'); }
      else { drawSeated(px, py, fit, rp.char, Math.round(rp.x) - (RX + fit.x)); nameTag(rp.name, px + 8, py - (fit.k === 'shower' ? 19 : fit.k === 'scale' ? 29 : 7), '#fff3b0'); }
      return;
    }
    if (seated) drawBenchSeated(px, py, rp.char);
    else if (gs) drawGroundSeated(px, py, rp.char);
    else {
      if (mv) rp.anim = null;
      drawPlayerFx(px, py, FACES[rp.f], mv, Math.floor(now / 140) % 2, rp.char, mv ? null : animFx(rp.anim, now));
    }
    if (rp.fish && !mv) drawRod(px, py, FACES[rp.f], rp.fish, now);
    nameTag(rp.name, px + 8, py - (seated ? 7 : 5), '#fff3b0');
  } }));
  ents.sort((a, b) => a.y - b.y).forEach(en => en.draw());
  if (scene === 'town' || scene === 'forest') NPCS.forEach(q => (q.sc || 'town') === scene && drawNpcMark(q.x * T, q.y * T, q.k, now));   // 任務「！」畫在最上層，不被房子遮住
  if (ready && me) snDrawMarks(now, rx, ry);   // 蛇梯棋：玩家頭上骰子、觀戰者頭上眼睛
  if (ready && myEmo) emoteBubble(myEmo, Math.round(rx * T) + 13, Math.round(ry * T) - 6, now);
  if (syncScene()) remotes.forEach(rp => { if (rp.emo && hereRp(rp)) emoteBubble(rp.emo, Math.round(rp.x * T) + 13, Math.round(rp.y * T) - 6, now); });
  if (!syncScene() && myShow) showCard(myShow, Math.round(rx * T) + 8, Math.round(ry * T) - 11, now);
  if (syncScene()) {
    if (myTyping) typingBubble(Math.round(rx * T) + 8, Math.round(ry * T) - 11, now);
    else if (myBubble) bubble(myBubble, Math.round(rx * T) + 8, Math.round(ry * T) - 11, now);
    if (myShow) showCard(myShow, Math.round(rx * T) + 8, Math.round(ry * T) - (myTyping || (myBubble && now - myBubble.at < 6000) ? 23 : 11), now);
    remotes.forEach(rp => {
      if (!hereRp(rp)) return;
      const tp = typingOn(rp);
      if (tp) typingBubble(Math.round(rp.x * T) + 8, Math.round(rp.y * T) - 11, now);
      else if (rp.bubble) bubble(rp.bubble, Math.round(rp.x * T) + 8, Math.round(rp.y * T) - 11, now);
      if (rp.show) showCard(rp.show, Math.round(rp.x * T) + 8, Math.round(rp.y * T) - (tp || (rp.bubble && now - rp.bubble.at < 6000) ? 23 : 11), now);
    });
  }

  drawTapMark(now);
  drawFishing(now);
  drawCooking(now);
  drawCookWatch(now);
  drawEditOverlay(now);
  fx.forEach(p => {
    ctx.globalAlpha = clamp(1 - p.l / p.max, 0, 1);
    r(p.c, p.x | 0, p.y | 0, 2, 2);
  });
  ctx.globalAlpha = 1;

  const indoors = scene === 'house' || scene === 'barn' || scene === 'tarot' || scene === 'stylist' || scene === 'cave';
  const warm = indoors ? 0 : Math.max(0, 1 - Math.abs(w.min - 1110) / 100) * 0.2;
  if (!indoors && SEA === 'autumn') r('rgba(255,170,70,.06)', 0, 0, W * T, H * T);
  else if (!indoors && SEA === 'winter') r('rgba(215,232,255,.07)', 0, 0, W * T, H * T);
  if (warm > 0) r('rgba(255,150,130,' + warm.toFixed(3) + ')', 0, 0, W * T, H * T);
  if (dark > 0 && !indoors) r('rgba(70,50,130,' + (dark * 0.45).toFixed(3) + ')', 0, 0, W * T, H * T);
  if (scene === 'house') drawHouseLight(now, w, dark);   // 室內夜色與檯燈、壁爐的光暈（js/furniture-fx.js）
  if (!indoors && dark > 0.15) nightGlows(dark);   // 夜晚窗戶光暈：畫在夜色濾鏡之後才不會被壓暗
  if (scene === 'plaza') drawPlazaLight(now, w, dark);
  if (ready && me) drawHwBuffFx(now, dark, rx, ry, indoors);   // 萬聖節 buff：夜行的鬼火、提燈的暖光   // 廣場早晚光影（方案 B）：霧、斜光、路燈與南瓜燈光暈、蝙蝠、螢火蟲
  if (w.wet && !indoors) {
    if (w.snow) {
      r('rgba(225,238,255,.16)', 0, 0, W * T, H * T);
      rain.forEach((d, i) => { const s = i % 3 === 0 ? 2 : 1; r('rgba(255,255,255,.95)', d.x | 0, d.y | 0, s, s); });
    } else {
      r('rgba(90,110,150,.14)', 0, 0, W * T, H * T);
      rain.forEach(d => r('rgba(235,245,255,.85)', d.x | 0, d.y | 0, 1, 3));
    }
  }

  if (scene === 'farm' || scene === 'forest') {
    critters.forEach(c => {
      if (c.key !== 'firefly' || dark < 0.2) return;
      const gx = Math.round(c.x * T) - 12, gy = Math.round(c.y * T) - 12 - Math.round(5 + Math.sin(now / 300 + c.ph) * 2), pu = 0.5 + 0.5 * Math.sin(now / 350 + c.ph);
      r('rgba(255,242,122,' + (0.10 + 0.12 * pu).toFixed(3) + ')', gx - 4, gy - 4, 10, 10);
      r('rgba(255,242,122,' + (0.25 + 0.3 * pu).toFixed(3) + ')', gx - 2, gy - 2, 6, 6);
    });
    if (netSwing) {
      const a = (performance.now() - netSwing.t0) / 260;
      if (a >= 1) netSwing = null;
      else {
        const cx = netSwing.x * T + 8, cy = netSwing.y * T + 8, rad = 7 + a * 3;
        ctx.globalAlpha = 1 - a;
        for (let i = 0; i < 10; i++) { const ang = -Math.PI * 0.9 + a * Math.PI * 1.8 + i * 0.12; r('#ffffff', Math.round(cx + Math.cos(ang) * rad), Math.round(cy + Math.sin(ang) * rad), 2, 2); }
        ctx.globalAlpha = 1;
      }
    }
  }

  const [fx_, fy_] = facing();
  if (fx_ >= 0 && fy_ >= 0 && fx_ < W && fy_ < H && !paused() && !pose) {
    ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now / 160);
    const bx = fx_ * T, by = fy_ * T, c = '#ff5f8a';
    r(c, bx, by, 3, 1); r(c, bx, by, 1, 3);
    r(c, bx + T - 3, by, 3, 1); r(c, bx + T - 1, by, 1, 3);
    r(c, bx, by + T - 1, 3, 1); r(c, bx, by + T - 3, 1, 3);
    r(c, bx + T - 3, by + T - 1, 3, 1); r(c, bx + T - 1, by + T - 3, 1, 3);
    ctx.globalAlpha = 1;
  }


  ctx.font = '800 7px "Chiron GoRound TC", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  pops.forEach(p => {
    ctx.globalAlpha = clamp(1.6 - p.l / 700, 0, 1);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(122,74,74,.95)';
    ctx.strokeText(p.txt, p.x, p.y);
    ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, p.y);
  });
  ctx.globalAlpha = 1;
}
