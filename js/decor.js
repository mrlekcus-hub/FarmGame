'use strict';
/* 布置與魚缸、標本架 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 布置 ---------- */
const sellPrice = k => Math.floor(((defOf(k) || {}).price || 0) / 2);
/* ---------- 魚缸／標本架：換展示品 ---------- */
const dsEl = $('dsm'), dsCard = $('dscard');
let dsId = null;
function openDisplay(id) {
  const it = house && house.items.find(i => i.id === id);
  if (!it || !DISP[it.k] || visiting || paused()) return;
  if (typeof id !== 'number' || !isFinite(id)) { toast('家具還在存檔，等一下再試', 1800); return; }
  dsId = id; dsOpen = true; pressed.length = 0; renderDisplay(); dsEl.hidden = false; dsCard.focus();
}
function closeDisplay() { dtTv = false; dsOpen = false; dsEl.hidden = true; dsId = null; $('dtm').hidden = true; dtId = null; renderHousePanel(); }
function renderDisplay() {
  const it = house && house.items.find(i => i.id === dsId), dd = it && DISP[it.k];
  if (!dd) { closeDisplay(); return; }
  const isFish = dd.kind === 'fish', cat = isFish ? fishCat : bugCat, log = isFish ? fishLog : bugLog;
  const mine = cat.filter(f => (log[f.key] | 0) > 0), arr = house.disp[dsId] || [];
  let rows = '';
  for (let s = 0; s < dd.n; s++) {
    const cur = arr[s] && arr[s].k;
    rows += '<div class="row"><canvas class="fico" width="16" height="16" data-ds="' + (cur ? esc(cur) : '') + '"></canvas><div class="meta"><b>第 ' + (s + 1) + ' 格</b></div>' +
      '<select class="sel" data-s="' + s + '" aria-label="第 ' + (s + 1) + ' 格"><option value="">（空）</option>' +
      mine.map(f => '<option value="' + esc(f.key) + '"' + (f.key === cur ? ' selected' : '') + '>' + esc(f.name) + '</option>').join('') + '</select></div>';
  }
  dsCard.innerHTML = '<div class="shop-h"><h2>' + esc((defOf(it.k) || {}).name || '') + '</h2></div>' +
    '<p class="empty">' + (isFish ? '放進你釣到過的魚。' : '放進你抓到過的蟲蝶。') + '展示品不會扣背包裡的數量，也不能拿去賣；好友來拜訪時也看得到。家具收回或賣出時，展示品會一起清掉。</p>' +
    (mine.length ? '' : '<p class="empty">你還沒有' + (isFish ? '釣到過魚' : '抓到過蟲蝶') + '，先去收集吧。</p>') + rows +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  dsCard.querySelectorAll('canvas[data-ds]').forEach(cv => {
    const k = cv.dataset.ds, c2d = cv.getContext('2d');
    if (!k) c2d.clearRect(0, 0, 16, 16); else if (isFish) drawFish(c2d, k, false); else drawBug(c2d, k, false);
  });
}
function setDisplay(id, slot, key) {
  const it = house.items.find(i => i.id === id), dd = it && DISP[it.k];
  if (!dd || slot < 0 || slot >= dd.n) return;
  const arr = house.disp[id] || (house.disp[id] = []);
  arr[slot] = key ? { t: dd.kind, k: key } : null;
  enqueue(() => rpc('house_display_set', { p_id: id, p_slot: slot, p_key: key || null })).catch(e => { toast(errText(e)); reloadHouse(); });
}
dsCard.addEventListener('change', e => {
  const sel = e.target.closest && e.target.closest('select[data-s]');
  if (!sel || dsId == null) return;
  setDisplay(dsId, +sel.dataset.s, sel.value);
  renderDisplay();
});
dsCard.addEventListener('click', e => { if (e.target.closest('button[data-a=close]')) closeDisplay(); });
dsEl.addEventListener('click', e => { if (e.target === dsEl) closeDisplay(); });

/* ---------- 家具面板：圖卡、分類、搜尋；手機版選好家具後抽屜收成底部小條 ---------- */
const furnUi = { cat: 'all', q: '', sig: '' };
const FCATS = [['all', '全部'], ['sleep', '睡覺'], ['living', '客廳'], ['bath', '浴室'], ['kitchen', '廚房'], ['wall', '牆面'], ['rug', '地毯'], ['deco', '擺飾']];
/* 伺服器目錄沒有分類欄位，這裡用 key 名稱和 layer 分；認不得的一律歸「擺飾」 */
function furnCat(c) {
  const k = c.key;
  if (c.layer === 'wall') return 'wall';
  if (c.layer === 'flat') return 'rug';
  if (/^(bed|dbed)(_|$)|^wardrobe/.test(k)) return 'sleep';
  if (/toilet|bath|tub|sink|shower|basin/.test(k) || (typeof BATH_FURN !== 'undefined' && BATH_FURN[k]) || (typeof TOILET_FURN !== 'undefined' && TOILET_FURN[k])) return 'bath';
  if (/^(kitchen|fridge|stove|counter|oven)/.test(k)) return 'kitchen';
  if (/^(sofa|table|chair|shelf|tv|piano|cat|fireplace|lamp|dtable|armchair)/.test(k)) return 'living';
  return 'deco';
}
function paintFurnIcon(cv, key) {
  const d = defOf(key) || {};
  cv.width = Math.min(8, Math.max(1, d.w | 0 || 2)) * 16; cv.height = Math.min(8, Math.max(1, d.h | 0 || 2)) * 16;
  try { furnIcon(cv, key); } catch (e) { /* 略過 */ }
}
function renderFurnGrid(pt_) {
  $('h-find').hidden = pt_;
  if (pt_) { furnUi.sig = ''; return; }
  const hold = edit.hold, held = hold && !hold.fromId ? hold.k : '';
  const all = house.list.filter(c => ['floor', 'flat', 'wall'].includes(c.layer) && have('f:' + c.key) > 0);
  const total = all.reduce((n, c) => n + have('f:' + c.key), 0);
  const cnt = {}; all.forEach(c => { const t = furnCat(c); cnt[t] = (cnt[t] || 0) + 1; });
  if (furnUi.cat !== 'all' && !cnt[furnUi.cat]) furnUi.cat = 'all';
  const shown = all.filter(c => (furnUi.cat === 'all' || furnCat(c) === furnUi.cat) && (!furnUi.q || String(c.name).toLowerCase().includes(furnUi.q)));
  const sig = furnUi.cat + '|' + furnUi.q + '|' + held + '|' + all.map(c => c.key + ':' + have('f:' + c.key)).join(',');
  const t0 = $('h-tabs').querySelector('[data-tab=furn]');
  if (t0) t0.textContent = '家具 ' + total;
  if (sig === furnUi.sig) return;   // 沒變就不重畫，捲動位置才不會跳回去
  furnUi.sig = sig;
  $('h-cats').innerHTML = FCATS.filter(([k]) => k === 'all' || cnt[k]).map(([k, n]) => '<button type="button" class="chipbtn" data-c="' + k + '" aria-pressed="' + (furnUi.cat === k) + '">' + n + '</button>').join('');
  const box = $('h-inv');
  if (!all.length) { box.innerHTML = '<span class="empty">背包裡沒有家具，去小村右上角的家具店買吧。</span>'; return; }
  if (!shown.length) { box.innerHTML = '<span class="empty">這個分類（或搜尋）沒有家具。</span>'; return; }
  box.innerHTML = shown.map(c => '<button type="button" class="fcard" data-f="' + esc(c.key) + '" aria-pressed="' + (held === c.key) + '" title="' + c.w + '×' + c.h + ' 格"><canvas data-fi="' + esc(c.key) + '"></canvas><b>' + esc(c.name) + '</b><i class="fq">×' + have('f:' + c.key) + '</i></button>').join('');
  box.querySelectorAll('canvas[data-fi]').forEach(cv => paintFurnIcon(cv, cv.dataset.fi));
}
/* 手機：選好家具後，底部小條放翻轉／旋轉／取消／換一件；每個影格呼叫一次，只在變動時改 DOM */
const hsEl = $('hstrip');
let hsKey = '';
function stripSync() {
  const inHouse = scene === 'house' && !!house && !visiting && edit.on && edit.tab === 'furn';
  const hold = edit.hold, show = !!(imm && inHouse && hold && !hold.fromId);
  const he = !!(imm && inHouse), bc = document.body.classList;
  if (he !== bc.contains('hedit')) bc.toggle('hedit', he);
  if (show !== bc.contains('hs-on')) bc.toggle('hs-on', show);
  if (!show) { if (!hsEl.hidden) { hsEl.hidden = true; hsKey = ''; } return; }
  const left = have('f:' + hold.k), key = hold.k + '|' + left;
  if (key !== hsKey) {
    hsKey = key;
    const nm = esc((defOf(hold.k) || {}).name || '');
    hsEl.innerHTML = '<canvas class="hs-ic"></canvas><div class="hs-t"><b>' + nm + '</b><small>點房間放下 · ×' + left + '</small></div>' +
      '<button type="button" data-s="flip-hold">翻轉</button><button type="button" data-s="rot-hold">旋轉</button><button type="button" data-s="cancel" aria-label="取消">✕</button><button type="button" class="hs-swap" data-s="swap">▲ 換一件</button>';
    paintFurnIcon(hsEl.querySelector('canvas'), hold.k);
  }
  hsEl.hidden = false;
}
hsEl.addEventListener('pointerdown', e => e.stopPropagation());
hsEl.addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (b) selAct(b.dataset.s); });

function renderHousePanel() {
  if (!house) return;
  const vis = !!visiting;
  $('h-title').textContent = vis ? visiting.name + ' 的家' : '我的家';
  $('h-quick').hidden = vis;
  if (vis) {
    $('h-edit-box').hidden = true; $('h-sel').hidden = true;
    $('h-hint').textContent = '走到門口按動作鍵離開；面向魚缸、標本架可以看展示品';
    return;
  }
  const hold = edit.hold, selIt = house.items.find(i => i.id === edit.sel);
  $('h-edit').textContent = '布置模式：' + (edit.on ? '開' : '關');
  $('h-edit').setAttribute('aria-pressed', edit.on ? 'true' : 'false');
  $('h-edit-box').hidden = !edit.on;
  const pt_ = edit.on && edit.tab === 'paint';
  $('h-inv').hidden = pt_;
  $('h-hint').textContent = !edit.on ? '走到門口按動作鍵回農場' : hold ? '點房間的格子放下 ' + (defOf(hold.k) || {}).name : '點家具選取，按住可以直接拖著移動，按鈕會浮在家具上方；從背包選家具來擺';
  if (pt_) $('h-hint').textContent = '選顏色，在房間格子上點一下或拖曳來上色；有鎖頭的顏色可以先試色，鬆手時再決定要不要買';
  renderFurnGrid(pt_);
  const sb_ = $('h-sel');
  if (selIt) {
    sb_.hidden = true; sb_.innerHTML = '';   // 選到的家具，按鈕改放在家具上方的浮動條（#hbar）
  } else if (hold && hold.fromId) {
    sb_.hidden = true; sb_.innerHTML = '';   // 拖曳中不顯示面板
  } else if (hold) {
    sb_.hidden = false;
    sb_.innerHTML = '<span class="v-count">' + esc((defOf(hold.k) || {}).name || '') + '</span><button type="button" class="btn small" data-s="flip-hold">翻轉</button><button type="button" class="btn small" data-s="rot-hold">旋轉</button><button type="button" class="btn small ghost" data-s="sell-bag">賣出1個 +' + sellPrice(hold.k) + 'G</button><button type="button" class="btn small ghost" data-s="cancel">取消</button>';
  } else { sb_.hidden = true; sb_.innerHTML = ''; }
  renderPaintPanel();
}
$('h-edit').addEventListener('click', () => {
  edit.on = !edit.on; edit.hold = null; edit.sel = null;
  $('game').classList.toggle('editing', edit.on); renderHousePanel();
});
$('h-inv').addEventListener('click', e => {
  const b = e.target.closest('button[data-f]');
  if (!b) return;
  const k = b.dataset.f;
  edit.sel = null;
  edit.hold = (edit.hold && !edit.hold.fromId && edit.hold.k === k) ? null : { k };
  if (edit.hold && imm) setSide(false);   // 手機：選好家具就收起抽屜，房間整個露出來
  renderHousePanel();
});
$('h-cats').addEventListener('click', e => {
  const b = e.target.closest('button[data-c]');
  if (!b) return;
  furnUi.cat = b.dataset.c; renderHousePanel();
});
$('h-q').addEventListener('input', e => { furnUi.q = e.target.value.trim().toLowerCase(); renderHousePanel(); });
$('h-sel').addEventListener('click', e => {
  const b = e.target.closest('button[data-s]');
  if (b) selAct(b.dataset.s);
});
function selAct(a) {
  const it = house.items.find(i => i.id === edit.sel);
  if (a === 'swap') { setSide(true); return; }
  if (a === 'cancel') { edit.sel = null; edit.hold = null; }
  else if (a === 'move' && it) { edit.hold = { k: it.k, fromId: it.id, f: it.f, r: it.r | 0 }; edit.sel = null; }
  else if (a === 'pick' && it) { doPickup(it); edit.sel = null; }
  else if (a === 'flip' && it) doFlip(it);
  else if (a === 'rot' && it) doRotate(it);
  else if (a === 'rot-hold' && edit.hold) edit.hold.r = ((edit.hold.r | 0) + 1) & 3;
  else if (a === 'disp' && it) openDisplay(it.id);
  else if (a === 'flip-hold' && edit.hold) edit.hold.f = !edit.hold.f;
  else if (a === 'sell' && it) { doSell(it); edit.sel = null; }
  else if (a === 'sell-bag' && edit.hold && !edit.hold.fromId) { doSellBag(edit.hold.k); if (have('f:' + edit.hold.k) <= 0) edit.hold = null; }
  renderHousePanel(); refreshHud();
}
function doPlace(k, x, y, f, rot) {
  inv['f:' + k] = have('f:' + k) - 1;
  const it = { id: 't' + (++tmpSeq), k, x, y, f: !!f, r: (rot | 0) & 3 };
  house.items.push(it);
  enqueue(async () => {
    const r_ = await rpc('house_place', { p_item: k, p_x: x, p_y: y, p_rot: it.r });
    it.id = +r_.item.id; Object.assign(inv, r_.inv);
    if (it.f) await rpc('house_flip', { p_id: it.id });
  }).catch(e => { toast(errText(e)); reloadHouse(); });
}
function doMove(it, x, y, f, rot) {
  it.x = x; it.y = y; if (rot != null) it.r = (rot | 0) & 3;
  const flipIt = f != null && f !== it.f; it.f = f != null ? f : it.f;
  enqueue(async () => { await rpc('house_move', { p_id: it.id, p_x: x, p_y: y, p_rot: it.r | 0 }); if (flipIt) await rpc('house_flip', { p_id: it.id }); }).catch(e => { toast(errText(e)); reloadHouse(); });
}
/* 旋轉 90 度；原位置放不下時，會試著往房間內側推一點 */
function doRotate(it) {
  const nr = ((it.r | 0) + 1) & 3, d = dimsOf(it.k, nr);
  const [ax, ay] = anchorFor(it.k, it.x, it.y, nr);
  if (!d || !fitsLocal(it.k, ax, ay, it.id, nr)) { toast('這裡轉不過去，旁邊的空間不夠', 1800); return; }
  it.x = ax; it.y = ay; it.r = nr;
  enqueue(async () => { await rpc('house_move', { p_id: it.id, p_x: ax, p_y: ay, p_rot: nr }); }).catch(e => { toast(errText(e)); reloadHouse(); });
}
function doFlip(it) {
  it.f = !it.f;
  enqueue(async () => { await rpc('house_flip', { p_id: it.id }); }).catch(e => { toast(errText(e)); reloadHouse(); });
}
function doSell(it) {
  house.items = house.items.filter(i => i !== it);
  if (me) me.coins += sellPrice(it.k);
  enqueue(async () => { const r_ = await rpc('house_sell', { p_id: it.id }); if (me) me.coins = +r_.coins; refreshHud(); }).catch(e => { toast(errText(e)); reloadHouse(); });
  toast('賣出 ' + ((defOf(it.k) || {}).name || '') + ' +' + sellPrice(it.k) + 'G', 1500);
}
function doSellBag(k) {
  inv['f:' + k] = have('f:' + k) - 1;
  if (me) me.coins += sellPrice(k);
  enqueue(async () => { const r_ = await rpc('house_sell_bag', { p_item: k }); if (me) me.coins = +r_.coins; Object.assign(inv, r_.inv); refreshHud(); }).catch(e => { toast(errText(e)); reloadHouse(); });
  toast('賣出 ' + ((defOf(k) || {}).name || '') + ' +' + sellPrice(k) + 'G', 1500);
}
function doPickup(it) {
  house.items = house.items.filter(i => i !== it);
  inv['f:' + it.k] = have('f:' + it.k) + 1;
  enqueue(async () => { const r_ = await rpc('house_pickup', { p_id: it.id }); Object.assign(inv, r_.inv); }).catch(e => { toast(errText(e)); reloadHouse(); });
}
function anchorFor(k, lx, ly, rot) {
  const d = dimsOf(k, rot | 0);
  const ax = clamp(lx, 0, RW - d.w);
  const ay = d.layer === 'wall' ? clamp(ly, -2, -d.h) : clamp(ly, 0, RH - d.h);
  return [ax, ay];
}
function tileFromEvent(ev) {
  const rc = $('game').getBoundingClientRect();
  const k = cv.width / rc.width, s = imm ? view.s : S;
  return [Math.floor(((ev.clientX - rc.left) * k + Math.round(view.x * s)) / s / T), Math.floor(((ev.clientY - rc.top) * k + Math.round(view.y * s)) / s / T)];
}
function houseTap(tx, ty) {
  if (scene !== 'house' || !edit.on || !house) return;
  const lx = tx - RX, ly = ty - RY;
  if (lx < 0 || lx >= RW || ly < -2 || ly >= RH) { edit.sel = null; renderHousePanel(); return; }
  if (edit.hold) {
    const [ax, ay] = anchorFor(edit.hold.k, lx, ly, edit.hold.r);
    const ign = edit.hold.fromId;
    if (!fitsLocal(edit.hold.k, ax, ay, ign, edit.hold.r)) { toast('這裡放不下', 1200); return; }
    if (ign != null) { const it = house.items.find(i => i.id === ign); if (it) doMove(it, ax, ay, edit.hold.f, edit.hold.r); edit.hold = null; }
    else { doPlace(edit.hold.k, ax, ay, edit.hold.f, edit.hold.r); if (have('f:' + edit.hold.k) <= 0) edit.hold = null; }
    renderHousePanel(); refreshHud(); return;
  }
  const it = itemAtLocal(lx, ly);
  edit.sel = it ? it.id : null;
  renderHousePanel();
}
/* 佈置模式：按住家具直接拖著移動；選到家具後，旋轉／翻轉／收回／賣出的按鈕浮在家具上方（#hbar） */
edit.drag = false; edit.drag0 = null;
const DRAG_PX = 8;
function houseDragEnd(cancel) {
  const d0 = edit.drag0;
  if (!d0) return;
  edit.drag0 = null;
  try { $('game').releasePointerCapture(d0.pid); } catch (e) { /* 略過 */ }
  if (!edit.drag) return;
  const it = house && house.items.find(i => i.id === d0.id), hold = edit.hold;
  edit.drag = false; edit.hold = null;
  if (it && hold && !cancel && edit.hover) {
    const [ax, ay] = anchorFor(hold.k, edit.hover[0], edit.hover[1], hold.r);
    if (fitsLocal(hold.k, ax, ay, it.id, hold.r)) { if (ax !== it.x || ay !== it.y) doMove(it, ax, ay, hold.f, hold.r); }
    else toast('這裡放不下，放回原位', 1300);
  }
  edit.hover = null; renderHousePanel();
}
$('game').addEventListener('pointerdown', ev => {
  if (ev.sideTap) return;   // 這一下是用來收抽屜的（input.js），不要同時放家具或選家具
  if (paintOn()) { paintDown(ev); return; }   // 油漆分頁：交給 paint.js
  const [tx, ty] = tileFromEvent(ev);
  if (scene === 'house' && edit.on && house && !visiting && !edit.hold) {
    const lx = tx - RX, ly = ty - RY, it = lx >= 0 && lx < RW && ly >= -2 && ly < RH ? itemAtLocal(lx, ly) : null;
    if (it) {
      edit.sel = it.id;
      edit.drag0 = { id: it.id, pid: ev.pointerId, x0: ev.clientX, y0: ev.clientY, ox: lx - it.x, oy: ly - it.y };
      try { $('game').setPointerCapture(ev.pointerId); } catch (e) { /* 略過 */ }
      renderHousePanel(); return;
    }
  }
  houseTap(tx, ty);
});
$('game').addEventListener('pointermove', ev => {
  if (scene !== 'house' || !edit.on) return;
  const d0 = edit.drag0;
  if (d0 && d0.pid === ev.pointerId) {
    if (!edit.drag) {
      if (Math.hypot(ev.clientX - d0.x0, ev.clientY - d0.y0) < DRAG_PX) return;
      const it = house.items.find(i => i.id === d0.id);
      if (!it) { edit.drag0 = null; return; }
      edit.drag = true; edit.hold = { k: it.k, fromId: it.id, f: it.f, r: it.r | 0 }; renderHousePanel();
    }
    const [tx, ty] = tileFromEvent(ev);
    edit.hover = [tx - RX - d0.ox, ty - RY - d0.oy];
    return;
  }
  if (edit.hold) { const [tx, ty] = tileFromEvent(ev); edit.hover = [tx - RX, ty - RY]; }
});
$('game').addEventListener('pointerup', ev => { if (edit.drag0 && edit.drag0.pid === ev.pointerId) houseDragEnd(false); });
$('game').addEventListener('pointercancel', ev => { if (edit.drag0 && edit.drag0.pid === ev.pointerId) houseDragEnd(true); });
$('game').addEventListener('pointerleave', () => { if (!edit.drag) edit.hover = null; });

const hbarEl = $('hbar');
let hbarKey = '', hbarSell = 0, hbarSellT = 0;
hbarEl.addEventListener('pointerdown', e => e.stopPropagation());
hbarEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-b]');
  const it = house && house.items.find(i => i.id === edit.sel);
  if (!b || !it) return;
  const a = b.dataset.b;
  if (a === 'rot') doRotate(it);
  else if (a === 'flip') doFlip(it);
  else if (a === 'disp') openDisplay(it.id);
  else if (a === 'pick') { doPickup(it); edit.sel = null; }
  else if (a === 'sell') {
    if (hbarSell !== it.id) { hbarSell = it.id; clearTimeout(hbarSellT); hbarSellT = setTimeout(() => { hbarSell = 0; }, 2500); return; }   // 賣出要按兩下，避免誤觸
    clearTimeout(hbarSellT); hbarSell = 0; doSell(it); edit.sel = null;
  }
  renderHousePanel(); refreshHud();
});
function houseBarSync() {
  stripSync();
  if (!edit.hold && edit.drag) edit.drag = false;
  if (!edit.on) edit.drag0 = null;
  const selIt = house && edit.on && scene === 'house' && !visiting && !edit.hold && !paused() ? house.items.find(i => i.id === edit.sel) : null;
  const g_ = selIt && itemRect(selIt);
  if (!g_) { if (!hbarEl.hidden) { hbarEl.hidden = true; hbarKey = ''; } return; }
  const armed = hbarSell === selIt.id, key = selIt.id + '|' + selIt.k + '|' + (DISP[selIt.k] ? 1 : 0) + '|' + (armed ? 1 : 0);
  if (key !== hbarKey) {
    hbarKey = key;
    const btn = (b, ic, t, cls) => '<button type="button" data-b="' + b + '"' + (cls ? ' class="' + cls + '"' : '') + ' aria-label="' + t + '"><i aria-hidden="true">' + ic + '</i><span>' + t + '</span></button>';
    hbarEl.innerHTML = btn('rot', '↻', '旋轉') + btn('flip', '⇋', '翻轉') + (DISP[selIt.k] ? btn('disp', '✨', '展示品') : '') +
      '<b class="sep"></b>' + btn('pick', '🎒', '收回') + btn('sell', '💰', armed ? '再按一次 +' + sellPrice(selIt.k) : '賣出', armed ? 'danger armed' : 'danger');
  }
  hbarEl.hidden = false;
  const rc = cv.getBoundingClientRect(), st = stageEl.getBoundingClientRect();
  if (!rc.width) return;
  const k = cv.width / rc.width, s_ = imm ? view.s : S;
  const ox = rc.left - st.left - stageEl.clientLeft, oy = rc.top - st.top - stageEl.clientTop;
  const X0 = (RX + g_.x) * T, Y0 = (RY + g_.y) * T, X1 = X0 + g_.w * T, Y1 = Y0 + g_.h * T;
  const px = wx => (wx * s_ - Math.round(view.x * s_)) / k + ox, py = wy => (wy * s_ - Math.round(view.y * s_)) / k + oy;
  const cx = (px(X0) + px(X1)) / 2, top = py(Y0), bot = py(Y1);
  const bw = hbarEl.offsetWidth, bh = hbarEl.offsetHeight, sw = stageEl.clientWidth, sh = stageEl.clientHeight;
  const left = clamp(cx - bw / 2, 4, Math.max(4, sw - bw - 4));
  let ty_ = top - bh - 12, below = false;
  if (ty_ < 4) { ty_ = bot + 12; below = true; }
  if (ty_ + bh > sh - 4) { ty_ = clamp(top - bh - 12, 4, Math.max(4, sh - bh - 4)); below = false; }   // 上下都放不下就夾在畫面裡
  hbarEl.style.left = Math.round(left) + 'px'; hbarEl.style.top = Math.round(ty_) + 'px';
  hbarEl.style.setProperty('--ax', Math.round(clamp(cx - left, 16, Math.max(16, bw - 16))) + 'px');
  hbarEl.classList.toggle('below', below);
}
