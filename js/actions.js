'use strict';
/* 動作 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 動作 ---------- */
/* 從面向的那一格開始，沿著面向方向排成一直線的 n 格（鋤頭、水壺升級後一次處理多格） */
function lineTiles(x, y, n) {
  const d = DIRS[pl.face], out = [];
  for (let i = 0; i < n; i++) { const tx = x + d[0] * i, ty = y + d[1] * i; if (tx >= 0 && ty >= 0 && tx < W && ty < H) out.push([tx, ty]); }
  return out;
}
/* 鋤一格：mode = 'till' 只翻還沒翻的草地、'untill' 只把空田翻回草地（多格時由第一格決定，不會一排裡翻來翻去） */
function hoeOne(x, y, mode, loud) {
  if (K[y][x] !== G) return false;
  const key = pk(x, y), p = plots.get(key);
  if (mode === 'till' && !p) {
    if (!farmable(x, y)) { if (loud) pop(x, y, '這裡不能耕種', '#ffb3a8'); return false; }
    if (plots.size >= plotCap()) { if (loud) pop(x, y, '田地到上限了（玩家升級會增加）', '#ffb3a8'); return false; }
    plots.set(key, { crop: null, grown: 0, tick: srvNow(), wet: null }); dust(x, y);
    act2('till', { p_x: x, p_y: y }); tutEvent('till'); return true;
  }
  if (mode === 'untill' && p && !p.crop) { plots.delete(key); dust(x, y); act2('untill', { p_x: x, p_y: y }); return true; }
  return false;
}
function canOne(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const p = plots.get(pk(x, y));
  if (!p || isWet(p)) return false;
  settleLocal(p); p.wet = srvNow() + cfg.wet_s * 1000; drops(x, y);
  act2('water', { p_x: x, p_y: y }); tutEvent('water'); qAdd('water'); return true;
}
function act() {
  if (fpOpen()) { closeFriendPop(); return; }   // 互動浮窗開著時再按動作鍵＝收起來
  if (pose) { standUp(); return; }
  if (cooking) { cookAct(); return; }
  const [x, y] = facing();
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (scene === 'plaza') {
    const k2 = K[y][x], rp = remoteAt(x, y);
    if (catchShown) { hideCatch(); return; }
    if (fishing) { fishAct(); return; }
    if (hwTouch(x, y)) return;   // 萬聖節：糖果攤、魔女鍋
    if (k2 === GT) leaveVillage();
    else if (k2 === WA && curTool().id === 'rod') startFish(x, y);
    else if (k2 === WA) pop(x, y, '這是池塘（換成釣竿就能釣魚）', '#cfe8f7');
    else if (k2 === BN) takeBench(x, y);
    else if (k2 === SB) openSnakes();
    else if (rp) openFriendPop(rp);
    else if (k2 === TS) enterLekcus();
    return;
  }
  if (scene === 'house') {
    if (K[y][x] === GT) { leaveHouse(); return; }
    const rpH = remoteAt(x, y);
    if (rpH) { openFriendPop(rpH); return; }
    const lx = x - RX, ly = y - RY, hit = house && lx >= 0 && lx < RW && ly >= -2 && ly < RH ? itemAtLocal(lx, ly) : null;
    if (hit && hit.k === 'dtable') openDishTable(hit);
    else if (hit && hit.k === 'tv' && !edit.on) openTv(hit);
    else if (hit && DISP[hit.k]) { if (visiting) visitShowList(hit); else openDisplay(hit.id); }
    else if (hit && hit.k === 'kitchen' && !edit.on) { ckAnchor = { id: hit.id, fx: x, fy: y, at: visiting ? visiting.uid : null }; openKitchen(); }
    else if (hit && STYLER[hit.k] && !edit.on && !visiting) openMaker(false);
    else if (hit && hit.k === 'piano' && !edit.on) openPiano();
    else if (hit && SEAT[hit.k] && !edit.on) takeSeat(hit, x, y);
    else if (hit) pop(x, y, (defOf(hit.k) || {}).name || '', '#fff3b0');
    return;
  }
  if (scene === 'tarot') { const rpT = remoteAt(x, y); if (rpT) { openFriendPop(rpT); return; } lekcusRoomAct(x, y); return; }
  if (scene === 'town') { townAct(x, y); return; }
  if (scene === 'forest') { forestAct(x, y); return; }
  if (scene === 'cave') { caveAct(x, y); return; }
  if (scene === 'barn') { barnAct(x, y); return; }
  if (scene === 'stylist') { stylistAct(x, y); return; }
  const k = K[y][x], key = pk(x, y), p = plots.get(key), t = curTool();
  if (k === GT) { openVMenu(); return; }
  if (k === DR) { enterHouse(); return; }
  if (k === SH) { openShop(); tutEvent('shop'); return; }
  if (k === BD) { openBoard(); return; }
  if (k === TG) { if (!featLocked('town', x, y)) enterTown(); return; }
  if (k === BR) { enterBarn(); return; }
  if (k === RK) { mineRock(x, y); return; }
  const fgi = yardMap.has(pk(x, y)) ? -1 : fgList.findIndex(f => f.x === x && f.y === y && !forTaken.has(f.slot + ':' + f.i));
  if (fgi >= 0 && !catchShown && !fishing) { takeForage(fgList[fgi]); return; }
  if (catchShown) { hideCatch(); return; }
  if (fishing) { fishAct(); return; }
  if (k === WA) {
    if (t.id === 'rod') { startFish(x, y); return; }
    pop(x, y, t.id === 'can' ? '水壺永遠是滿的' : '這是池塘', '#cfe8f7'); if (t.id === 'can') splash(x, y); return;
  }
  if (k !== G) { if (t.id === 'net') swingNet(x, y); return; }
  if (t.id === 'net' && !ripeNow(p)) { swingNet(x, y); return; }
  if (ripeNow(p)) {
    const c = p.crop;
    p.crop = null; p.grown = 0; p.tick = srvNow(); p.fert = 0;
    sparkle(x, y, CROPS[c].c);
    act2('harvest', { p_x: x, p_y: y }, r => {
      const q = r ? r.q | 0 : 0;
      pop(x, y, '+1 ' + (q === 2 ? '金星' : q === 1 ? '銀星' : '') + CROPS[c].n, q === 2 ? '#ffe27a' : q === 1 ? '#e6f0ff' : '#fff3b0');
      if (r && r.drop && CROPS[r.drop]) { toast('相鄰的作物雜交了！得到「' + CROPS[r.drop].n + '」種子'); sparkle(x, y, CROPS[r.drop].c); }
    }, e => {
      if (e && /not_ready/.test(String(e.message || e.code || e))) { noPrecip = true; return true; }   // 悄悄以伺服器為準，不再顯示矛盾的提示
    }); qAdd('harvest'); refreshHud(); return;
  }
  if (t.id === 'none') { pop(x, y, '這格是空的，到背包裝備物品', '#ffffff'); return; }
  if (t.id === 'rod') { pop(x, y, '面向池塘才能釣魚', '#cfe8f7'); return; }
  if (t.id === 'net') { swingNet(x, y); return; }
  if (t.id === 'pick') { pop(x, y, '面向礦石才敲得動', '#ffffff'); return; }
  if (t.id === 'yard') { yardAct(x, y); return; }
  if (t.id === 'fert') { fertAct(x, y, p); return; }
  if (t.id === 'hoe') {
    if (p && p.crop) pop(x, y, '還沒長好', '#ffffff');
    else {
      const mode = p ? 'untill' : 'till';
      lineTiles(x, y, toolN(toolLv.hoe)).forEach(([tx, ty], i) => hoeOne(tx, ty, mode, i === 0));
    }
  } else if (t.id === 'can') {
    if (!p) pop(x, y, '先用鋤頭翻土', '#ffffff');
    else if (world().wet) { pop(x, y, world().snow ? '下雪天不用澆水' : '下雨天不用澆水', '#cfe8f7'); tutEvent('water'); }
    else if (isWet(p)) pop(x, y, '土還是濕的', '#cfe8f7');
    else lineTiles(x, y, toolN(toolLv.can)).forEach(([tx, ty]) => canOne(tx, ty));
  } else {
    const kk = t.crop;
    if (!p) pop(x, y, '先用鋤頭翻土', '#ffffff');
    else if (p.crop) pop(x, y, '這裡已經有作物', '#ffffff');
    else if (cropLocked(kk)) pop(x, y, CROPS[kk].n + '需要農耕 Lv.' + CROP_NEED[kk], '#ffb3a8');
    else if (have('s:' + kk) <= 0) pop(x, y, '沒有種子了，去雜貨攤買', '#ffb3a8');
    else {
      inv['s:' + kk] = have('s:' + kk) - 1;
      p.crop = kk; p.grown = 0; p.tick = srvNow(); p.fert = 0;
      dust(x, y); pop(x, y, '種下' + CROPS[kk].n, '#c9f0a8');
      act2('plant', { p_x: x, p_y: y, p_crop: kk }); tutEvent('plant'); qAdd('plant'); loadLevelSoon();
    }
  }
  refreshHud();
}
