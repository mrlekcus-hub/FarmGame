'use strict';
/* 雜貨攤 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 雜貨攤（等伺服器確認才更新） ---------- */
const shopEl = $('shop'), shopCard = $('shopcard');
let shopBusy = false;
let shopMode = 'store';
const shopCats = () => SHOP_CATS.filter(c => shopMode === 'work' ? (c[0] === 'yard' || c[0] === 'up') : (c[0] === 'seed' || c[0] === 'sell'));
function openShop(mode) { shopMode = mode === 'work' ? 'work' : 'store'; if (!shopCats().some(c => c[0] === shopCat)) { shopCat = shopMode === 'work' ? 'yard' : 'sell'; shopSel = ''; } shopOpen = true; pressed.length = 0; renderShop(); shopEl.hidden = false; shopCard.focus();
  if (shopMode === 'work' && !ycat.length) loadYard(); }
function closeShop() { shopOpen = false; shopEl.hidden = true; }
/* 賣出提示：今天已經賣了幾隻、這次賣會不會降價 */
function satNote(sd, n, price, val) {
  if (val >= n * price) return sd >= 5 ? '' : (sd ? ' · 今天已賣 ' + sd : '');
  return ' · 今天已賣 ' + sd + '，部分降價';
}
/* ---- 雜貨攤：左側分類＋底部數量面板 ---- */
let shopCat = 'sell', shopSel = '', shopView = null;
const shopQ = {};
const SHOP_CATS = [['seed', '🌱', '種子'], ['yard', '🏡', '庭院'], ['sell', '💰', '賣出'], ['up', '🔧', '升級']];
function shopItems(cat) {
  const out = [];
  if (cat === 'seed') KEYS.forEach(k => {
    const c = CROPS[k];
    out.push({ id: 's:' + k, a: 'buy', c: k, name: c.n + '種子', price: c.buy, dot: c.c, buy: 1,
      sub: fmtDur(growSec(k)) + '成熟 · 每個賣 ' + cropPrice(k) + ' G' + seasonTag(k) + ' · 持有 ' + have('s:' + k),
      lock: cropLocked(k) ? '農耕 Lv.' + CROP_NEED[k] + ' 解鎖' : '' });
  });
  else if (cat === 'sup') ['x:fert'].filter(k => itemMeta[k] && itemMeta[k].buy > 0).forEach(k => {
    const m = itemMeta[k];
    out.push({ id: k, a: 'buym', c: k, name: m.name, price: m.buy, misc: k, buy: 1, lock: '',
      sub: (k === 'a:hay' ? '餵動物用' : '裝備後對作物施肥，更容易出銀星金星') + ' · 持有 ' + have(k) });
  });
  else if (cat === 'yard') (ycat.length ? ycat : []).forEach(c => {
    const need = Math.max(c.need, featNeed.yard);
    out.push({ id: 'y:' + c.key, a: 'buyy', c: c.key, name: c.name, price: c.price, yard: c.key, buy: 1,
      sub: (c.walk ? '可以走上去' : '會擋路') + (c.light ? '，晚上會亮' : '') + ' · 持有 ' + have('y:' + c.key),
      lock: plv() < need ? '玩家 Lv.' + need + ' 解鎖' : '' });
  });
  else if (cat === 'sell') {
    ALLK.filter(k => have('c:' + k) > 0).forEach(k => {
      const c = CROPS[k], pr = cropPrice(k);
      out.push({ id: 'c:' + k, a: 'sell', c: k, name: c.n, price: pr, stock: have('c:' + k), dot: c.c, sub: '每個 ' + pr + ' G' + seasonTag(k) });
    });
    Object.keys(inv).filter(k => /^(q1|q2|a|g|m):/.test(k) && inv[k] > 0 && miscPrice(k) > 0 && k !== 'a:hay').sort().forEach(k => {
      out.push({ id: k, a: 'sellm', c: k, name: itemName(k), price: miscPrice(k), stock: inv[k], misc: k, sat: /^g:/.test(k) ? k : undefined, sub: '每個 ' + miscPrice(k) + ' G' });   // 採集物（g:）和魚、蟲一樣有每日收購飽和，要和 SQL sell_item 一致
    });
    fishCat.filter(f => have('fish:' + f.key) > 0).forEach(f => {
      out.push({ id: 'fish:' + f.key, a: 'sellfish', c: f.key, name: f.name, price: f.price, stock: have('fish:' + f.key), fish: f.key, sat: 'fish:' + f.key,
        sub: (RARITY[f.rarity] || ['', ''])[0] + ' · 每條 ' + f.price + ' G' });
    });
    bugCat.filter(b => have('bug:' + b.key) > 0).forEach(b => {
      out.push({ id: 'bug:' + b.key, a: 'sellbug', c: b.key, name: b.name, price: b.price, stock: have('bug:' + b.key), bug: b.key, sat: 'bug:' + b.key,
        sub: (RARITY[b.rarity] || ['', ''])[0] + ' · 每隻 ' + b.price + ' G' });
    });
    recipes.filter(rc => have('dish:' + rc.key) > 0).forEach(rc => {
      out.push({ id: 'dish:' + rc.key, a: 'selld', c: rc.key, name: rc.name, price: rc.price, stock: have('dish:' + rc.key), dot: DISHC[rc.key] || '#f3c77a', sub: '每份 ' + rc.price + ' G（不受收購飽和影響）' });
    });
  }
  return out;
}
const shopFull = it => !!it.buy && have(it.id) >= INV_CAP;   // 這種東西已經 999 個了
const shopMax = (it, coins) => it.buy ? Math.max(1, Math.min(it.a === 'buyy' ? 50 : 99, Math.floor(coins / Math.max(1, it.price)), INV_CAP - have(it.id))) : it.stock;   // buy_yard 後端一次最多 50，其他 99；再加上持有上限 999
const shopTotal = (it, q) => it.sat ? sellValue(soldOf(it.sat), q, it.price) : q * it.price;
const shopIcon = it => it.dot ? '<i class="dot" style="--c:' + it.dot + '"></i>' :
  '<canvas class="fico" width="16" height="16" ' + (it.fish ? 'data-fish="' + esc(it.fish) + '"' : it.bug ? 'data-bug="' + esc(it.bug) + '"' : it.yard ? 'data-yard="' + esc(it.yard) + '"' : 'data-misc="' + esc(it.misc) + '"') + '></canvas>';
function shopActLabel(v, q, tot) {
  const it = v.it;
  if (it.lock) return it.lock;
  if (shopFull(it)) return '已滿 ' + INV_CAP + ' 個';
  if (it.buy && tot > v.coins) return '金幣不夠';
  return (it.buy ? '買 ' : '賣 ') + q + ' 個 · ' + tot + ' G';
}
function renderShop() {
  const coins = me ? me.coins : 0;
  const dis = shopBusy ? ' disabled' : '';
  const rod = rods.find(x => x.lv === (me ? me.rod : 1)) || { name: '釣竿', lv: 1 }, nx = rods.find(x => x.lv === (me ? me.rod : 1) + 1);
  const rodRow = '<div class="row"><div class="meta"><b>' + esc(rod.name) + '（Lv.' + rod.lv + '）</b><small>' +
    (nx ? '升級：' + esc(nx.name) + '，魚更快上鉤、拉竿時間更長、稀有魚更多' : '已經是最高級的釣竿了') + '</small></div>' +
    (nx ? '<button type="button" class="btn" data-a="rod"' + (shopBusy || coins < nx.cost || rodLocked(nx.lv) ? ' disabled' : '') + '>' + (rodLocked(nx.lv) ? '釣魚 Lv.' + ROD_NEED[nx.lv] + ' 解鎖' : nx.cost + ' G') + '</button>' : '') + '</div>';
  const toolRows = ['hoe', 'can'].map(t => {
    const lvn = toolLv[t] | 0 || 1, nm = t === 'hoe' ? '鋤頭' : '水壺', cst = toolCost[t + (lvn + 1)];
    const mats = cst ? Object.keys(cst.items || {}).map(k => esc(itemName(k)) + ' ×' + cst.items[k] + '（有 ' + have(k) + '）').join('、') : '';
    const okMats = cst && Object.keys(cst.items || {}).every(k => have(k) >= cst.items[k]);
    const locked = cst && plv() < cst.need;
    return '<div class="row"><div class="meta"><b>' + nm + '（Lv.' + lvn + '）</b><small>一次處理 ' + toolN(lvn) + ' 格' +
      (cst ? '。升級後 ' + toolN(lvn + 1) + ' 格：' + cst.coins + ' G ＋ ' + mats : '（已是最高等級）') + '</small></div>' +
      (cst ? '<button type="button" class="btn" data-a="tool" data-c="' + t + '"' + (shopBusy || locked || coins < cst.coins || !okMats ? ' disabled' : '') + '>' + (locked ? '玩家 Lv.' + cst.need + ' 解鎖' : cst.coins + ' G') + '</button>' : '') + '</div>';
  }).join('');
  const list = shopItems(shopCat);
  if (!list.some(x => x.id === shopSel)) { const f = list.find(x => !x.lock) || list[0]; shopSel = f ? f.id : ''; }
  const cur = list.find(x => x.id === shopSel) || null;
  if (cur) { const mx = shopMax(cur, coins); shopQ[cur.id] = Math.max(1, Math.min(mx, shopQ[cur.id] | 0 || 1)); shopView = { it: cur, max: mx, coins }; } else shopView = null;
  let sellKinds = 0, grand = 0;
  { const sl = shopCat === 'sell' ? list : shopItems('sell'); sellKinds = sl.length; sl.forEach(it => { if (it.a === 'sell' || it.a === 'sellfish' || it.a === 'sellbug') grand += shopTotal(it, it.stock); }); }   // 「全部賣出」（SQL sell_all）只賣作物、魚、蟲，金額也只算這三種
  const rail = shopCats().map(c => '<button type="button" class="shri" data-cat="' + c[0] + '" aria-pressed="' + (c[0] === shopCat) + '"><b>' + c[1] + '</b>' + c[2] + (c[0] === 'sell' && sellKinds ? '<span class="shn">' + sellKinds + '</span>' : '') + '</button>').join('');
  let main = '';
  if (shopCat === 'up') main = '<h3>釣竿</h3>' + rodRow + '<h3>鋤頭與水壺</h3>' + toolRows;
  else {
    if (shopCat === 'sell') main += list.length ? '<div class="shbar"><span>背包可賣 ' + list.length + ' 種 · 全部賣出（作物、魚、蟲）共 ' + grand + ' G</span><button type="button" class="btn small" data-a="sellall"' + dis + '>全部賣出</button></div>' : '<p class="empty">背包裡沒有可以賣的東西。收成作物、釣魚、抓蟲蝶之後再來。</p>';
    main += list.map(it => '<div class="row shr' + (it.id === shopSel ? ' sel' : '') + (it.lock ? ' lk' : '') + '" data-sel="' + esc(it.id) + '">' + shopIcon(it) +
      '<div class="meta"><b>' + esc(it.name) + (it.stock ? ' ×' + it.stock : '') + '</b><small>' + (it.lock ? esc(it.lock) : esc(it.sub)) + '</small></div><b class="shp">' + (it.buy ? it.price + ' G' : '') + '</b></div>').join('');
    if (shopCat !== 'sell' && list.length) main += '<small class="empty">每種東西最多持有 ' + INV_CAP + ' 個。</small>';
    if (shopCat === 'sell' && list.some(x => x.sat)) main += '<small class="empty">收購飽和：每種魚、蟲、採集物每天前 5 個原價，第 6～10 個 6 折，之後 3 折（凌晨 0 點重置）。</small>';
  }
  let sheet = '';
  if (shopCat !== 'up' && cur) {
    const q = shopQ[cur.id], mx = shopView.max, tot = shopTotal(cur, q);
    const chips = [1, 10, 50].map(n => '<button type="button" class="shch" data-sq="+' + n + '">+' + n + '</button>').concat(['<button type="button" class="shch" data-sq="=' + mx + '">' + (cur.buy ? '最大 ' : '全賣 ') + mx + '</button>']).join('');
    sheet = '<div class="shsheet"><div class="shsh-h">' + shopIcon(cur) + '<b>' + esc(cur.name) + '</b><small>' + (cur.buy ? '每個 ' + cur.price + ' G · 持有 ' + have(cur.id) + ' / ' + INV_CAP + ' · 這次最多 ' + mx : '有 ' + cur.stock + ' 個') + '</small></div>' +
      '<div class="shsh-row"><div class="shsh-q"><button type="button" class="shsb" data-sq="-1">−</button><input type="number" id="shin" min="1" max="' + mx + '" value="' + q + '" inputmode="numeric" aria-label="數量"><button type="button" class="shsb" data-sq="+1">＋</button></div>' +
      '<button type="button" class="btn" id="shgo" data-a="' + cur.a + '" data-c="' + esc(cur.c) + '" data-n="' + q + '"' + (shopBusy || cur.lock || shopFull(cur) || (cur.buy && tot > coins) ? ' disabled' : '') + '>' + shopActLabel(shopView, q, tot) + '</button></div>' +
      '<div class="shsh-c">' + chips + '</div></div>';
  }
  shopCard.innerHTML = '<div class="shop-h"><h2>' + (shopMode === 'work' ? '園藝工坊' : '雜貨攤') + '</h2><span class="chip gold">' + coins + ' G</span></div>' +
    '<div class="shsplit"><div class="shrail">' + rail + '</div><div class="shmain">' + main + '</div></div>' + sheet +
    '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
  { const sr = shopCard.querySelector('.shr.sel'); if (sr && sr.scrollIntoView) sr.scrollIntoView({ block: 'nearest' }); }   // 選中的商品留在小抽屜上方看得到
  shopCard.querySelectorAll('canvas[data-fish]').forEach(cv => drawFish(cv.getContext('2d'), cv.dataset.fish, false));
  shopCard.querySelectorAll('canvas[data-bug]').forEach(cv => drawBug(cv.getContext('2d'), cv.dataset.bug, false));
  shopCard.querySelectorAll('canvas[data-yard]').forEach(cv => yardIcon(cv.getContext('2d'), cv.dataset.yard));
  shopCard.querySelectorAll('canvas[data-misc]').forEach(cv => (/^q/.test(cv.dataset.misc) ? qcropIcon : miscIcon)(cv.getContext('2d'), cv.dataset.misc));
}
/* 數量面板：不重畫整個畫面，只更新數字，輸入時才不會掉游標 */
function shopSetQty(v, fromInput) {
  if (!shopView) return;
  const it = shopView.it, mx = shopView.max;
  let q = Math.round(+v); if (!(q >= 1)) q = 1; q = Math.min(mx, q);
  shopQ[it.id] = q;
  const tot = shopTotal(it, q), go = $('shgo');
  const rg = $('shrg'), inp = $('shin'), tt = $('shtot');
  if (rg) rg.value = q;
  if (inp && !fromInput) inp.value = q;
  if (tt) tt.textContent = '合計 ' + tot + ' G';
  if (go) { go.dataset.n = q; go.textContent = shopActLabel(shopView, q, tot); go.disabled = !!(shopBusy || it.lock || shopFull(it) || (it.buy && tot > shopView.coins)); }
}
shopCard.addEventListener('click', e => {
  const c = e.target.closest('[data-cat]'); if (c) { shopCat = c.dataset.cat; shopSel = ''; renderShop(); return; }
  const s = e.target.closest('[data-sel]'); if (s) { shopSel = s.dataset.sel; renderShop(); return; }
  const q = e.target.closest('[data-sq]');
  if (q && shopView) {
    const d = q.dataset.sq, cur = shopQ[shopView.it.id] | 0 || 1;
    shopSetQty(d === '-1' ? cur - 1 : d[0] === '+' ? cur + (+d.slice(1) || 0) : +d.slice(1));   // +1 / +10 / +50 每按一次就加；= 是直接設成最大
  }
});
shopCard.addEventListener('input', e => {
  if (e.target.id === 'shrg') shopSetQty(e.target.value);
  else if (e.target.id === 'shin' && e.target.value !== '') shopSetQty(e.target.value, true);
});
shopCard.addEventListener('change', e => { if (e.target.id === 'shin') shopSetQty(e.target.value); });
shopCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, k = b.dataset.c;
  if (a === 'close') { closeShop(); return; }
  const buyN = a === 'buy' && CROPS[k] ? (+b.dataset.n || 1) : 1;
  shopBusy = true; renderShop();
  try {
    const r = await enqueue(async () => {
      if (a === 'buy') return rpc('buy_seed', { p_crop: k, p_qty: buyN });
      if (a === 'sell') return rpc('sell_crop', b.dataset.n ? { p_crop: k, p_qty: +b.dataset.n } : { p_crop: k });
      if (a === 'sellfish') return rpc('sell_fish', b.dataset.n ? { p_fish: k, p_qty: +b.dataset.n } : { p_fish: k });
      if (a === 'sellbug') return rpc('sell_bug', b.dataset.n ? { p_bug: k, p_qty: +b.dataset.n } : { p_bug: k });
      if (a === 'rod') return rpc('rod_upgrade');
      if (a === 'selld') return rpc('sell_dish', b.dataset.n ? { p_key: k, p_qty: +b.dataset.n } : { p_key: k });
      if (a === 'tool') return rpc('tool_upgrade', { p_tool: k });
      if (a === 'buyy') return rpc('buy_yard', { p_key: k, p_qty: +b.dataset.n || 1 });
      if (a === 'buym') return rpc('buy_misc', { p_item: k, p_qty: +b.dataset.n || 1 });
      if (a === 'sellm') return rpc('sell_item', b.dataset.n ? { p_item: k, p_qty: +b.dataset.n } : { p_item: k });
      return rpc('sell_all');
    });
    if (r.inv) Object.assign(inv, r.inv);
    if (r.sold) { if (r.sell_day !== soldDay) { soldToday = {}; soldDay = r.sell_day | 0; } Object.assign(soldToday, r.sold); }
    if (typeof r.coins === 'number') me.coins = r.coins;
    if (typeof r.rod === 'number') { me.rod = r.rod; const rd = rods.find(x => x.lv === r.rod); toast('升級成 ' + (rd ? rd.name : '新釣竿') + '！'); }
    if (r.tool) { toolLv[r.tool] = r.lv | 0; toast('升級成 ' + (r.tool === 'hoe' ? '鋤頭' : '水壺') + ' Lv.' + r.lv + '，一次處理 ' + toolN(r.lv) + ' 格！'); }
    if (r.earned) toast('賣出得到 ' + r.earned + ' G');
    if (a === 'buy' && CROPS[k]) toast('買了 ' + buyN + ' 個' + CROPS[k].n + '種子');
    if (a === 'buyy') toast('買了 ' + (+b.dataset.n || 1) + ' 個' + itemName('y:' + k) + '，裝備「庭院佈置」工具來擺放');
    if (a === 'buym') toast('買了 ' + (+b.dataset.n || 1) + ' 個' + itemName(k));
  } catch (err) { toast(errText(err)); await resync(); }
  shopBusy = false;
  if (shopOpen) renderShop();
  refreshHud();
});




/* 功能要玩家幾級才解鎖；還沒到就顯示提示並回傳 true（lx, ly 有給就在那格冒字） */
function featLocked(k, lx, ly) {
  if (plv() >= featNeed[k]) return false;
  const msg = FEAT_N[k] + '要玩家 Lv.' + featNeed[k] + ' 才解鎖（每日任務和布告欄每週委託都能累積玩家經驗）';
  if (lx != null) pop(lx, ly, FEAT_N[k] + ' Lv.' + featNeed[k] + ' 解鎖', '#ffb3a8');
  toast(msg); return true;
}
