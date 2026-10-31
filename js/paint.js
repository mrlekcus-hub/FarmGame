'use strict';
/* 逐格花紋：地板、牆紙、隔間牆與門的畫法、花紋選擇面板 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 花紋就是家具店賣的牆面（wall_0~4）和地板（floor_0~4），編號 N 見 house.js：0~4 牆面花紋、5~9 地板花紋。第 0 款免費，其餘買一次就永久擁有。
   門另外賣（door_0~4，款式與畫法見 doors.js），不再用牆面花紋；畫門時選的是門款式（paint.door）。 */
edit.tab = 'furn';
const PAT_RANGE = { floor: [5, 10], wallpaper: [0, 5], wall: [0, 5] };
const paint = { layer: 'floor', kind: 'wall', col: 5, door: 0, tool: 'pen', drag: null, hover: null, pend: 0 };   // door：選中的門款式（0~4，見 doors.js）
const paintOn = () => scene === 'house' && edit.on && !visiting && edit.tab === 'paint' && !!house;
const paintDoor = () => paint.layer === 'wall' && paint.kind === 'door';
const paintOwned = n => patStyle(n) === 0 || have('f:' + patKey(n)) > 0;
const paintPrice = n => { const c = house && house.cat[patKey(n)]; return c ? c.price | 0 : 0; };
const paintGet = w => w === 'floor' ? house.paint.floor : w === 'wallpaper' ? house.paint.wallpaper : house.walls;
function paintSet(w, s) {
  if (!house || typeof s !== 'string') return;
  if (w === 'floor') house.paint.floor = s; else if (w === 'wallpaper') house.paint.wallpaper = s;
  else { house.walls = s; house.wl = wallList(s); }
}

/* 把拖曳的起點、終點整理成這次要做的事（格子清單、要呼叫的 RPC、本機能不能放） */
function paintBuild(a, b) {
  const L = paint.layer, tl = paint.tool, erase = tl === 'erase', recolor = tl === 'recolor' && L === 'wall';
  let x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
  if (tl === 'pen') { x0 = x1 = b.x; y0 = y1 = b.y; }
  else if (L === 'wall' && !recolor) { if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) y1 = y0; else x1 = x0; }   // 牆和門：貼齊成一條直線
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
  const cells = [];
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) cells.push([x, y]);
  const key = erase ? null : (paintDoor() ? DOORS[paint.door].key : 'paint_' + paint.col);
  const box = { p_x1: xa, p_y1: ya, p_x2: xb, p_y2: yb };
  let rpcName, args, which;
  if (L === 'wall') {
    which = 'walls';
    if (recolor) { rpcName = 'house_wall_recolor'; args = { ...box, p_kind: paint.kind, p_key: key }; }   // 換花紋／換款式：只動牆或只動門，看 p_kind
    else { rpcName = 'house_wall_line'; args = { ...box, p_kind: paint.kind, p_key: key }; }
  } else { which = L; rpcName = 'house_paint_rect'; args = { p_kind: L, ...box, p_key: key }; }
  let ok = true;
  if (L === 'wall' && !erase && !recolor) {
    ok = !cells.some(([x, y]) => (paint.kind === 'wall' && x === DX + 1 && y === RH - 1) ||
      house.items.some(it => { const g = itemRect(it); return g && g.layer === 'floor' && x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h; }));
  }
  return { cells, which, rpc: rpcName, args, erase, recolor, ok };
}
function paintApply(op) {
  const arr = paintGet(op.which).split(''), col = paint.col, lo = String.fromCharCode(97 + col), up = String.fromCharCode(65 + doorLetterIdx(paint.door)), dr = paintDoor();
  op.cells.forEach(([x, y]) => {
    const i = y * 32 + x;
    if (op.erase) arr[i] = '.';
    else if (op.recolor) { const c = arr[i].charCodeAt(0); if (dr) { if (c >= 65 && c <= 80) arr[i] = up; } else if (c >= 97 && c <= 112) arr[i] = lo; }   // 牆和門各換各的
    else arr[i] = op.which === 'walls' && dr ? up : lo;
  });
  return arr.join('');
}
async function paintCommit(op) {
  if (!op.ok) { toast('這裡不能畫牆（有家具或是出生點）', 1600); return; }
  const before = paintGet(op.which), col = paint.col, dr = paintDoor(), dk = paint.door;
  if (op.recolor && !op.cells.some(([x, y]) => { const c = before.charCodeAt(y * 32 + x); return dr ? (c >= 65 && c <= 80) : (c >= 97 && c <= 112); })) { toast(dr ? '這裡沒有門可以換款式' : '這裡沒有牆可以換花紋', 1400); return; }
  paintSet(op.which, paintApply(op));          // 先樂觀更新畫面
  const own = dr ? doorOwned(dk) : paintOwned(col);
  if (!op.erase && !own) {                     // 試畫：還沒買的花紋或門款，鬆手時才問要不要買
    const pr = dr ? doorPrice(dk) : paintPrice(col), nm = dr ? DOORS[dk].name : PAT_NAMES[col], bk = dr ? DOORS[dk].key : patKey(col);
    if (!window.confirm('「' + nm + '」還沒買，要花 ' + pr + ' 金幣買下嗎？\n買一次之後可以無限格使用' + (!dr && patKind(col) === 'wall' ? '（牆紙和隔間牆都能用）' : '') + (dr ? '。' : '，也能在家具店套用整間。'))) { paintSet(op.which, before); return; }
    if (me.coins < pr) { toast('金幣不夠', 1600); paintSet(op.which, before); return; }
    try { const r_ = await enqueue(() => rpc(dr ? 'buy_door' : 'buy_pattern', { p_key: bk })); Object.assign(inv, r_.inv); me.coins = +r_.coins; refreshHud(); renderHousePanel(); }
    catch (e) { toast(errText(e)); paintSet(op.which, before); return; }
  }
  paint.pend++;
  enqueue(async () => {
    const r_ = await rpc(op.rpc, op.args);
    paint.pend--;
    if (paint.pend === 0) paintSet(op.which, op.which === 'walls' ? r_.walls : r_.cells);   // 還有操作排隊時先不覆蓋，避免畫面閃回舊的
  }).catch(e => { paint.pend = Math.max(0, paint.pend - 1); toast(errText(e)); reloadHouse(); });   // 失敗就還原成伺服器的樣子
}

/* 一鍵清空：把目前這一層（地板／牆紙／隔間牆／門）全部擦掉，按下去會先再確認一次。
   地板、牆紙一次用整片矩形擦；牆和門伺服器只收直線，所以一列一列擦（用伺服器回傳的結果檢查還剩哪一列）。 */
async function paintClearAll() {
  if (!house || paint.pend > 0) return;
  const L = paint.layer, dr = paintDoor(), key = L === 'wall' ? 'walls' : L;
  const mine = c => L === 'wall' ? (dr ? c >= 65 && c <= 80 : c >= 97 && c <= 112) : c !== 46;   // 46 = '.'（空格）
  const before = paintGet(key), nm = L === 'floor' ? '地板' : L === 'wallpaper' ? '牆紙' : dr ? '門' : '隔間牆';
  let cnt = 0; for (let i = 0; i < before.length; i++) if (mine(before.charCodeAt(i))) cnt++;
  if (!cnt) { toast('沒有' + nm + '可以清空', 1400); return; }
  if (!window.confirm('要清空所有「' + nm + '」嗎？\n目前有 ' + cnt + ' 格，全部會被擦掉，這個動作不能復原。')) return;
  const kind = paint.kind;
  paintSet(key, before.split('').map(ch => mine(ch.charCodeAt(0)) ? '.' : ch).join(''));   // 先樂觀更新畫面
  paint.pend++;
  enqueue(async () => {
    let r_;
    if (L === 'wall') {
      let s = before;
      for (let n = 0; n < RH + 2; n++) {
        let at = -1; for (let i = 0; i < s.length; i++) if (mine(s.charCodeAt(i))) { at = i; break; }
        if (at < 0) break;
        const y = at >> 5;
        r_ = await rpc('house_wall_line', { p_x1: 0, p_y1: y, p_x2: RW - 1, p_y2: y, p_kind: kind, p_key: null });
        if (r_.walls === s) break;   // 伺服器沒有變：不要一直重試
        s = r_.walls;
      }
      if (!r_) r_ = { walls: s };
    } else r_ = await rpc('house_paint_rect', { p_kind: L, p_x1: 0, p_y1: 0, p_x2: RW - 1, p_y2: L === 'wallpaper' ? 1 : RH - 1, p_key: null });
    paint.pend--;
    if (paint.pend === 0) paintSet(key, L === 'wall' ? r_.walls : r_.cells);
    toast('已清空' + nm, 1600);
  }).catch(e => { paint.pend = Math.max(0, paint.pend - 1); toast(errText(e)); reloadHouse(); });
}

/* ---------- 指標操作 ---------- */
function paintCell(ev, clampIt) {
  const [tx, ty] = tileFromEvent(ev), lx = tx - RX, ly = ty - RY, wp = paint.layer === 'wallpaper';
  const y0 = wp ? -2 : 0, y1 = wp ? -1 : RH - 1;
  if (!clampIt && (lx < 0 || lx >= RW || ly < y0 || ly > y1)) return null;
  return { x: clamp(lx, 0, RW - 1), y: clamp(ly, y0, y1) + (wp ? 2 : 0) };   // 牆紙的列：0 為最上列
}
function paintDown(ev) {
  const c = paintCell(ev, false);
  if (!c) return;
  paint.drag = { pid: ev.pointerId, a: c, cur: c }; paint.hover = c;
  try { $('game').setPointerCapture(ev.pointerId); } catch (e) { /* 略過 */ }
}
$('game').addEventListener('pointermove', ev => {
  if (!paintOn()) return;
  const d = paint.drag;
  if (d && d.pid === ev.pointerId) { const c = paintCell(ev, true); d.cur = c; paint.hover = c; }
  else paint.hover = paintCell(ev, false);
});
$('game').addEventListener('pointerup', ev => {
  const d = paint.drag;
  if (!d || d.pid !== ev.pointerId) return;
  paint.drag = null;
  if (paintOn()) paintCommit(paintBuild(d.a, d.cur));
});
$('game').addEventListener('pointercancel', ev => { if (paint.drag && paint.drag.pid === ev.pointerId) paint.drag = null; });
$('game').addEventListener('pointerleave', () => { if (!paint.drag) paint.hover = null; });

/* ---------- 編輯畫面疊圖：格線、預覽 ---------- */
function drawPaintOverlay() {
  const wp = paint.layer === 'wallpaper', rows = wp ? 2 : RH, gx = RX * T, gy = (wp ? RY - 2 : RY) * T;
  r('rgba(255,255,255,.07)', gx, gy, RW * T, rows * T);
  for (let i = 0; i <= RW; i++) r('rgba(255,255,255,.18)', gx + i * T, gy, 1, rows * T);
  for (let j = 0; j <= rows; j++) r('rgba(255,255,255,.18)', gx, gy + j * T, RW * T, 1);
  let op = null;
  if (paint.drag) op = paintBuild(paint.drag.a, paint.drag.cur);
  else if (paint.hover) op = paintBuild(paint.hover, paint.hover);
  if (!op) return;
  op.cells.forEach(([x, y]) => {
    const px = (RX + x) * T, py = gy + y * T;
    if (!op.erase && !op.recolor) {
      g.globalAlpha = 0.8;
      if (paint.layer === 'floor') drawFloorTile(px, py, RX + x, RY + y, patStyle(paint.col));
      else if (!paintDoor()) drawWallTile(px, py, RX + x, wp ? RY - 2 + y : RY + y, patStyle(paint.col));
      g.globalAlpha = 1;
    }
    r(op.ok ? 'rgba(120,255,160,.30)' : 'rgba(255,80,80,.40)', px, py, T, T);
  });
}

/* ---------- 面板 ---------- */
function renderPaintPanel() {
  const tabs = $('h-tabs'), box = $('h-paint');
  if (!tabs || !box) return;
  const pt = edit.tab === 'paint';
  tabs.innerHTML = [['furn', '家具'], ['paint', '花紋']].map(([k, n]) => '<button type="button" class="chipbtn" data-tab="' + k + '" aria-pressed="' + (edit.tab === k ? 'true' : 'false') + '">' + n + '</button>').join('');
  box.hidden = !pt;
  if (!pt || !house) return;
  const rg = PAT_RANGE[paint.layer];
  if (paint.col < rg[0] || paint.col >= rg[1]) paint.col = rg[0];
  if (paint.tool === 'recolor' && paint.layer !== 'wall') paint.tool = 'pen';
  const chips = (attr, cur, list) => list.map(([k, n]) => '<button type="button" class="chipbtn" data-' + attr + '="' + k + '" aria-pressed="' + (cur === k ? 'true' : 'false') + '">' + n + '</button>').join('');
  const tools = [['pen', '單格'], ['drag', paint.layer === 'wall' ? '拉直線' : '拉矩形'], ['erase', '橡皮擦']];
  if (paint.layer === 'wall') tools.push(['recolor', paint.kind === 'door' ? '換款式' : '換花紋']);
  let h = '<div class="prow">' + chips('layer', paint.layer, [['floor', '地板'], ['wallpaper', '牆紙'], ['wall', '隔間牆']]) + '</div>';
  if (paint.layer === 'wall') h += '<div class="prow">' + chips('kind', paint.kind, [['wall', '牆'], ['door', '門']]) + '</div>';
  h += '<div class="prow">' + chips('tool', paint.tool, tools) + '</div>';
  if (paint.tool === 'erase') h += '<div class="prow"><button type="button" class="chipbtn" data-clear="1">🧹 一鍵清空' + (paint.layer === 'floor' ? '地板' : paint.layer === 'wallpaper' ? '牆紙' : paintDoor() ? '門' : '隔間牆') + '</button></div>';
  h += '<div class="pgrid pat">';
  if (paintDoor()) {
    DOORS.forEach((d, k) => {
      const own = doorOwned(k);
      h += '<button type="button" data-door="' + k + '" aria-pressed="' + (paint.door === k ? 'true' : 'false') + '" aria-label="' + d.name + (own ? '' : '，還沒買') + '"><canvas width="16" height="16" data-dk="' + k + '"></canvas>' +
        d.name + '<small>' + (own ? (k === 0 ? '初始' : '已擁有') : '🔒 ' + doorPrice(k) + 'G') + '</small></button>';
    });
    box.innerHTML = h + '</div>';
    box.querySelectorAll('canvas[data-dk]').forEach(cv => { try { const c2d = cv.getContext('2d'); g = c2d; c2d.clearRect(0, 0, 16, 16); doorIcon(+cv.dataset.dk); } catch (e) { /* 略過 */ } finally { g = ctx; } });
    return;
  }
  for (let n = rg[0]; n < rg[1]; n++) {
    const own = paintOwned(n);
    h += '<button type="button" data-col="' + n + '" aria-pressed="' + (paint.col === n ? 'true' : 'false') + '" aria-label="' + PAT_NAMES[n] + (own ? '' : '，還沒買') + '"><canvas width="16" height="16" data-pk="' + patKey(n) + '"></canvas>' +
      PAT_NAMES[n] + '<small>' + (own ? (patStyle(n) === 0 ? '初始' : '已擁有') : '🔒 ' + paintPrice(n) + 'G') + '</small></button>';
  }
  box.innerHTML = h + '</div>';
  box.querySelectorAll('canvas[data-pk]').forEach(cv => { try { furnIcon(cv, cv.dataset.pk); } catch (e) { /* 略過 */ } });
}
$('h-tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  edit.tab = b.dataset.tab; edit.hold = null; edit.sel = null; paint.drag = null;
  renderHousePanel();
});
$('h-paint').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.clear) { paintClearAll(); return; }
  if (d.layer) { paint.layer = d.layer; const rg = PAT_RANGE[d.layer]; if (paint.col < rg[0] || paint.col >= rg[1]) paint.col = rg[0]; }
  else if (d.kind) paint.kind = d.kind;
  else if (d.tool) paint.tool = d.tool;
  else if (d.door != null) {
    paint.door = +d.door;
    if (!doorOwned(paint.door)) toast('「' + DOORS[paint.door].name + '」還沒買，可以先在房間上試畫，鬆手時再決定要不要買', 3000);
  }
  else if (d.col != null) {
    paint.col = +d.col;
    if (!paintOwned(paint.col)) toast('「' + PAT_NAMES[paint.col] + '」還沒買，可以先在房間上試畫，鬆手時再決定要不要買', 3000);
  }
  renderPaintPanel();
});
