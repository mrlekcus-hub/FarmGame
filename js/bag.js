'use strict';
/* 背包 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 背包 ---------- */
const bagEl = $('bagm'), bagCard = $('bagcard');
let bagSel = null;
function cropIcon(c2d, k) {
  g = c2d; g.clearRect(0, 0, 16, 16);
  const col = (CROPS[k] || {}).c || '#ff8fa8';
  ob(col, 'rgba(90,60,60,.55)', 3, 4, 10, 10);
  r('rgba(255,255,255,.55)', 5, 6, 2, 2);
  r('#5fbf6a', 7, 1, 2, 4); r('#8fe09a', 9, 2, 3, 1);
  g = ctx;
}
function furnIcon(cv, key) {
  const d = defOf(key);
  const c2d = cv.getContext('2d');
  g = c2d; g.clearRect(0, 0, cv.width, cv.height);
  if (d && d.layer === 'wall_style') drawWallTile(0, 0, 0, 0, +key.split('_')[1]);
  else if (d && d.layer === 'floor_style') drawFloorTile(0, 0, 0, 0, +key.split('_')[1]);
  else if (FURN[key]) FURN[key](0, 0, 0);
  g = ctx;
}
function bagGroups() {
  const out = [];
  const tools = [0, 1, 5, 6, 10, 12].map(i => ({ t: 'tool', k: String(i), name: TOOLS[i].n, n: null }));
  const seeds = ALLK.filter(k => !CROPS[k].hy || have('s:' + k) > 0).map(k => ({ t: 'seed', k, name: CROPS[k].n + '種子', n: have('s:' + k) }));
  const crops = ALLK.filter(k => have('c:' + k) > 0).map(k => ({ t: 'crop', k, name: CROPS[k].n, n: have('c:' + k) }));
  const qcrops = [];
  ALLK.forEach(k => ['q2', 'q1'].forEach(q => { if (have(q + ':' + k) > 0) qcrops.push({ t: 'qcrop', k: q + ':' + k, name: itemName(q + ':' + k), n: have(q + ':' + k) }); }));
  const miscs = Object.keys(inv).filter(k => /^(a|g|m|x):/.test(k) && inv[k] > 0 && itemMeta[k]).sort().map(k => ({ t: 'misc', k, name: itemMeta[k].name, n: inv[k] }));
  const fish = fishCat.filter(f => have('fish:' + f.key) > 0).map(f => ({ t: 'fish', k: f.key, name: f.name, n: have('fish:' + f.key), f }));
  const bugs = bugCat.filter(b => have('bug:' + b.key) > 0).map(b => ({ t: 'bug', k: b.key, name: b.name, n: have('bug:' + b.key), f: b }));
  const dishes = recipes.filter(rc => have('dish:' + rc.key) > 0).map(rc => ({ t: 'dish', k: rc.key, name: rc.name, n: have('dish:' + rc.key), rc }));
  const furn = Object.keys(inv).filter(k => k.startsWith('f:') && inv[k] > 0 && defOf(k.slice(2))).map(k => {
    const d = defOf(k.slice(2));
    return { t: 'furn', k: k.slice(2), name: d.name, n: inv[k], d };
  });
  out.push(['工具', tools]);
  out.push(['種子', seeds]);
  if (crops.length || qcrops.length) out.push(['作物', crops.concat(qcrops)]);
  const yards = Object.keys(inv).filter(k => /^y:/.test(k) && inv[k] > 0).sort().map(k => ({ t: 'yard', k: k.slice(2), name: itemName(k), n: inv[k] }));
  if (miscs.length) out.push(['畜產、採集與礦物', miscs]);
  if (fish.length) out.push(['魚', fish]);
  if (bugs.length) out.push(['蟲與蝴蝶', bugs]);
  if (dishes.length) out.push(['料理', dishes]);
  if (furn.length) out.push(['家具與裝飾', furn]);
  if (yards.length) out.push(['庭院裝飾', yards]);
  return out;
}
/* 物品在 TOOLS 目錄裡的編號（只有工具和種子能放進快捷列） */
const catIdx = it => it.t === 'tool' ? +it.k : it.t === 'seed' ? TOOLS.findIndex(x => x.crop === it.k) : (it.t === 'misc' && /^x:/.test(it.k)) ? TOOLS.findIndex(x => x.id === 'fert') : -1;
function equipRow(it) {
  return catIdx(it) >= 0 ? '<small class="empty">要放進快捷列：點上方快捷列的格子。</small>' : '';
}
function bagDetail(it) {
  if (!it) return '<p class="empty">點一個工具或種子，再點上方快捷列的格子放進去。點其他物品看說明。</p>';
  const a = [];
  let info = '';
  if (it.t === 'tool') {
    info = { hoe: '翻土、把空田翻回草地。', can: '替作物澆水（晴天用；下雨下雪時免澆）。', rod: '面向池塘按動作鍵釣魚。', yard: '裝備後面向農場的空草地按動作鍵，擺上背包裡的庭院裝飾；面向已擺的裝飾再按一次就收回。想擺哪一種，到背包點那個裝飾選擇。', pick: '面向農場的礦石按動作鍵敲開，掉石頭、銅礦，偶爾有水晶。每顆礦石每 2 小時恢復一次。', net: '面向草地上的蟲或蝴蝶，按動作鍵揮網。蟲蝶會隨時段和天氣不同。' }[TOOLS[+it.k].id] || '';
    a.push(equipRow(it));
    const tid = TOOLS[+it.k].id;
    if (tid === 'hoe' || tid === 'can') info += ' 目前 Lv.' + toolLv[tid] + '：一次處理 ' + toolN(toolLv[tid]) + ' 格（面向的方向排成一直線）。到小村的村長家（園藝工坊）可以升級。';
  } else if (it.t === 'seed') {
    info = fmtDur(growSec(it.k)) + '成熟（晴天要澆水，雨雪天免澆），收成後每個賣 ' + cropPrice(it.k) + ' G' + seasonTag(it.k) + '。';
    a.push(equipRow(it));
  } else if (it.t === 'yard') {
    info = '裝備「庭院佈置」工具後，面向農場空草地按動作鍵擺放。' + ((ycat.find(q => q.key === it.k) || {}).walk ? '可以走上去。' : '會擋住路。') + (yardSel === it.k ? '（目前選用這個）' : '');
    a.push('<button type="button" class="btn small" data-b="ysel">擺放時用這個</button>');
  } else if (it.t === 'qcrop') info = '品質好的作物，賣價比普通的高（銀星 +25%、金星 +50%）。到雜貨攤賣，也可以做料理、交委託。每個 ' + miscPrice(it.k) + ' G。';
  else if (it.t === 'misc') {
    const m = itemMeta[it.k] || {};
    info = it.k === 'a:hay' ? '拿去穀倉餵動物，每隻餓著的動物吃 1 把。' : /^x:/.test(it.k) ? '裝備後面向有作物的田地按動作鍵，這一輪收成更容易出現銀星和金星（每格一次）。' : (m.price ? '到雜貨攤賣，每個 ' + m.price + ' G。也能做料理、交委託。' : '');
    if (/^x:/.test(it.k)) a.push(equipRow(it));
  } else if (it.t === 'crop') info = '到雜貨攤可以賣掉，每個 ' + cropPrice(it.k) + ' G' + seasonTag(it.k) + '。也能拿去做料理或交委託。';
  else if (it.t === 'fish') {
    const rc = RARITY[it.f.rarity] || ['', ''];
    info = rc[0] + ' · 到雜貨攤賣，每條 ' + it.f.price + ' G。';
    const can = canShowHere() && (fishLog[it.k] | 0) > 0;
    a.push('<button type="button" class="btn small"' + (can ? '' : ' disabled') + ' data-b="show">' + (syncScene() && net && net.ok ? '展示給大家看' : '展示') + '</button>' + (can ? '' : '<small class="empty">（還沒抓到過）</small>'));
  } else if (it.t === 'bug') {
    const rc = RARITY[it.f.rarity] || ['', ''];
    info = rc[0] + ' · 到雜貨攤賣，每隻 ' + it.f.price + ' G。';
    const can = canShowHere() && (bugLog[it.k] | 0) > 0;
    a.push('<button type="button" class="btn small"' + (can ? '' : ' disabled') + ' data-b="show">' + (syncScene() && net && net.ok ? '展示給大家看' : '展示') + '</button>' + (can ? '' : '<small class="empty">（還沒抓到過）</small>'));
  } else if (it.t === 'dish') {
    info = it.rc.descr + ' 每份賣 ' + it.rc.price + ' G；到家裡的廚房灶台可以吃，也能交委託。';
  } else if (it.t === 'furn') {
    const st = it.d.layer === 'wall_style' || it.d.layer === 'floor_style';
    info = st ? '已購買的款式，在家裡的「牆面地板」可以隨時換上。' : '回家進入「布置模式」就能擺放。不要的話，在布置模式可以賣掉，得 ' + Math.floor(it.d.price / 2) + ' G。';
  }
  return '<p><b>' + esc(it.name) + '</b>' + (it.n == null ? '' : '　×' + it.n) + '</p><p>' + info + '</p>' + (a.length ? '<div class="v-quick">' + a.join('') + '</div>' : '');
}
function renderBag() {
  const groups = bagGroups();
  const all = groups.flatMap(x => x[1]);
  if (bagSel && !all.some(i => i.t === bagSel.t && i.k === bagSel.k)) bagSel = null;
  const sel = bagSel ? all.find(i => i.t === bagSel.t && i.k === bagSel.k) : null;
  const selIdx = sel ? catIdx(sel) : -1;
  const hint = selIdx >= 0
    ? '<p class="hbtip on">已選「' + esc(TOOLS[selIdx].n) + '」：點下面哪一格，就放進那一格。放到有東西的格子會互換，再點一次放著它的那一格就取下。</p>'
    : '<p class="hbtip">換快捷列的方法：先點下面的工具或種子，再點這排的格子放進去。</p>';
  const hb = '<h3>快捷列（遊戲畫面下方 1～6 號格）</h3><div class="hbpages">' + [0, 1, 2].map(p =>
    '<button type="button" class="chipbtn" data-b="hpage" data-p="' + p + '" aria-pressed="' + (hotPage === p ? 'true' : 'false') + '">第 ' + (p + 1) + ' 組</button>').join('') + '</div>' + hint + '<div class="hbrow">' + hot.map((h, i) =>
    '<button type="button" class="hbs' + (tool === i ? ' on' : '') + (selIdx >= 0 && h === selIdx ? ' has' : '') + '" data-b="hslot" data-s="' + i + '" aria-label="' + (i + 1) + ' 號格：' + esc((TOOLS[h] || { n: '空' }).n) + '"><i>' + (i + 1) + '</i><canvas width="16" height="16" data-hb="' + i + '"></canvas></button>').join('') + '</div>';
  bagCard.innerHTML = '<div class="shop-h"><h2>背包</h2><span class="chip gold">' + (me ? me.coins : 0) + ' G</span></div>' + hb +
    (groups.length ? groups.map(([title, items]) => '<h3>' + title + '</h3><div class="bagg">' + items.map(i =>
      '<button type="button" class="bagc" data-t="' + i.t + '" data-k="' + esc(i.k) + '" aria-pressed="' + (sel && sel.t === i.t && sel.k === i.k ? 'true' : 'false') + '">' +
      '<canvas width="' + (i.t === 'furn' ? 16 * i.d.w : 16) + '" height="' + (i.t === 'furn' ? 16 * i.d.h : 16) + '" data-ic="' + i.t + ':' + esc(i.k) + '"></canvas><b>' + esc(i.name) + '</b><small>' + (i.n == null ? '工具' : '×' + i.n) + '</small>' + (i.t === 'seed' ? '<small class="grow">⏱ ' + fmtDur(growSec(i.k)) + '成熟</small>' : '') + '</button>').join('') + '</div>').join('')
      : '<p class="empty">背包空空的。翻土、種田、釣魚，或到家具店逛逛吧。</p>') +
    '<div class="bagdetail">' + bagDetail(sel) + '</div>' +
    '<button type="button" class="btn ghost wide" data-b="close">關閉</button>';
  bagCard.querySelectorAll('canvas[data-ic]').forEach(cv => {
    const ci = cv.dataset.ic.indexOf(':'), ty = cv.dataset.ic.slice(0, ci), k = cv.dataset.ic.slice(ci + 1);
    if (ty === 'seed') drawIcon(cv.getContext('2d'), TOOLS.findIndex(x => x.crop === k));
    else if (ty === 'tool') drawIcon(cv.getContext('2d'), +k);
    else if (ty === 'crop') cropIcon(cv.getContext('2d'), k);
    else if (ty === 'qcrop') qcropIcon(cv.getContext('2d'), k);
    else if (ty === 'misc') miscIcon(cv.getContext('2d'), k);
    else if (ty === 'yard') yardIcon(cv.getContext('2d'), k);
    else if (ty === 'fish') drawFish(cv.getContext('2d'), k, false);
    else if (ty === 'bug') drawBug(cv.getContext('2d'), k, false);
    else if (ty === 'dish') dishIcon(cv.getContext('2d'), k);
    else furnIcon(cv, k);
  });
  bagCard.querySelectorAll('canvas[data-hb]').forEach(cv => {
    const c2d = cv.getContext('2d'), h = hot[+cv.dataset.hb];
    if (TOOLS[h]) drawIcon(c2d, h); else c2d.clearRect(0, 0, 16, 16);
  });
}
async function openBag() {
  if (!ready || authOpen || paused()) return;
  if (!house) { try { await loadHouse(); } catch (e) { /* 沒載入也能開背包 */ } }
  bagSel = null; bagOpen = true; pressed.length = 0;
  renderBag(); bagEl.hidden = false; bagCard.focus();
}
function closeBag() { bagOpen = false; bagEl.hidden = true; }
bagCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-b],button[data-t]');
  if (!b) return;
  const d = b.dataset;
  if (d.b === 'close') { closeBag(); return; }
  if (d.b === 'ysel' && bagSel && bagSel.t === 'yard') { yardSel = bagSel.k; toast('擺放時會用「' + itemName('y:' + yardSel) + '」'); renderBag(); return; }
  if (d.b === 'hpage') { setHotPage(+d.p, true); renderBag(); return; }
  if (d.b === 'hslot') {
    const idx = bagSel ? catIdx(bagSel) : -1;
    if (idx >= 0) { setSlot(+d.s, idx); renderBag(); } else toast('先點下面的工具或種子，再點這一格', 1600);
    return;
  }
  if (d.b === 'show' && bagSel && (bagSel.t === 'fish' || bagSel.t === 'bug')) { showItem(bagSel.t, bagSel.k); closeBag(); return; }
  if (d.t) { bagSel = { t: d.t, k: d.k }; renderBag(); const bd = bagCard.querySelector('.bagdetail'); if (bd) bd.scrollIntoView({ block: 'nearest' }); }
});
bagEl.addEventListener('click', e => { if (e.target === bagEl) closeBag(); });
$('bagbtn').addEventListener('click', () => openBag());
