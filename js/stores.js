'use strict';
/* 家具店、造型店、店裡的房間 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 家具店 ---------- */
const fsEl = $('fshop'), fsCard = $('fshopcard');
function renderFShop() {
  const tab = (k, n) => '<button type="button" class="cb" data-a="tab" data-c="' + k + '" aria-pressed="' + (fTab === k) + '">' + n + '</button>';
  const kd = fTab, names = kd === 'wall' ? WALL_NAMES : FLOOR_NAMES, cur = house.style[kd];
  const rows = names.map((n, i) => {
    const owned = i === 0 || have('f:' + kd + '_' + i) > 0;
    return '<div class="row"><i class="swatch" style="background:' + iconRowColor[kd][i] + '"></i><div class="meta"><b>' + n + '</b><small>' + (cur === i ? '目前使用中' : owned ? '已擁有' : '到小村的家具店購買') + '</small></div>' +
      (cur === i || !owned ? '' : '<button type="button" class="btn small" data-a="style" data-c="' + i + '"' + (fsBusy ? ' disabled' : '') + '>套用</button>') + '</div>';
  }).join('');
  fsCard.innerHTML = '<div class="shop-h"><h2>牆面地板</h2></div>' +
    '<div class="tabs2">' + tab('wall', '牆面') + tab('floor', '地板') + '</div>' + rows +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
}
let fsBusy = false;
function openFShop() { if (!house) return; fOpen = true; pressed.length = 0; renderFShop(); fsEl.hidden = false; fsCard.focus(); }
function closeFShop() { fOpen = false; fsEl.hidden = true; renderHousePanel(); }
$('h-shop').addEventListener('click', openFShop);
fsCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, c = b.dataset.c;
  if (a === 'close') { closeFShop(); return; }
  if (a === 'tab') { fTab = c; renderFShop(); return; }
  fsBusy = true; renderFShop();
  try {
    const r_ = await enqueue(() => rpc('house_style', { p_kind: fTab, p_idx: +c }));
    if (r_.inv) Object.assign(inv, r_.inv);
    if (typeof r_.coins === 'number') me.coins = r_.coins;
    if (r_.style) house.style = r_.style;
  } catch (err) { toast(errText(err)); await resync(); }
  fsBusy = false;
  if (fOpen) renderFShop();
  refreshHud();
});


/* ---------- 造型店：裁縫鋪與造型店（髮型、帽子、眼鏡；可以走進去，和店員說話才開始選） ---------- */
/* 擁有紀錄放在背包：hs:編號 = 髮型；服裝是 fc:款式:顏色（每個顏色單獨買，每天隨機上架 6 件，價格在後端 look_items）。髮型 hs:編號、帽子 ht:編號、眼鏡 gl:編號（買過 = 1）。價格要和後端 buy_look 一致 */
const SHOP_STY = {
  hair: { title: '造型店', clerk: '阿剪師傅', ck: 'jian', k: 'style', look: '看看今天的新造型',
    hello: ['歡迎光臨造型店，今天想換什麼新造型？', '來，坐。髮型、帽子、眼鏡，都幫你搭搭看。'],
    chat: ['頭髮就像田裡的作物，要細心照顧才會好看。', '帽子和眼鏡每天進的款式都不一樣，每個人看到的也不同喔。', '換個造型，連心情都會跟著換。'] },
  fit:  { title: '裁縫鋪', clerk: '桃子姊姊', ck: 'tao', k: 'fits', names: FITS, look: '看看今天的新衣服',
    hello: ['歡迎光臨！新做的衣服都掛在牆上喔。', '來啦，想要哪一件？我幫你量一量。'],
    chat: ['桂花婆婆教過我縫紉，她的針腳可是整個村子最細的。', '晚宴長裙我熬了三個晚上才縫好。', '衣服穿得開心，種田也會更有力氣。'] },
  furn: { title: '家具店', clerk: '阿杉師傅', ck: 'mu', look: '看看今天的家具',
    hello: ['歡迎光臨！今天剛進了一批新的家具。', '來看看吧，每天上架的東西都不一樣喔。'],
    chat: ['這些家具都是我一件一件親手做的。', '今天沒有你要的？明天再來，說不定就有了。', '家布置得舒服，種田的心情也會好。'] }
};
const styOwned = (k, i) => k === 'fits' ? (i < FREE_N[k] || fitAny(i)) : lookOwned(k, i);
/* 造型店的三種商品：髮型、帽子、眼鏡。常駐款一直都有，每天另外隨機上架 3 款（每個玩家不同，GMT+8 0 點換新） */
const LOOK_KIND = { style: { n: '髮型', ic: '💇' }, hat: { n: '帽子', ic: '🎩' }, glass: { n: '眼鏡', ic: '👓' } };
const LOOK_NAMES = { style: STYLES, hat: HATS, glass: GLASSES };
const LOOK_PREFIX = { style: 'hs:', hat: 'ht:', glass: 'gl:' };
const LOOK_FIXED = { style: [], hat: [], glass: [] };   // 不再有常駐款：三種都是每天隨機 6 款
const LOOK_POOL = { style: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], hat: [4, 5, 6, 7, 8, 9, 10, 11], glass: [1, 2, 3, 4, 5, 6, 7] };
const LOOK_PRICE = {
  style: { 11: 300, 12: 450, 13: 400, 14: 350, 15: 450, 16: 400, 17: 350, 18: 400, 19: 450, 20: 400, 21: 350 },
  hat: { 4: 250, 5: 250, 6: 300, 7: 350, 8: 400, 9: 500, 10: 300, 11: 300 },
  glass: { 1: 200, 2: 200, 3: 250, 4: 300, 5: 300, 6: 350, 7: 300 }
};
const LOOK_DAILY_N = 6;
/* 每款商品的顏色：髮型用 look.hair（HAIRS）、帽子用 look.hatc（HATCOL）、眼鏡用 look.glassc（GLASSCOL，1～7；0 是原色，不會被抽到） */
const LOOK_COLKEY = { style: 'hair', hat: 'hatc', glass: 'glassc' };
const LOOK_COLS = { style: HAIRS, hat: HATCOL, glass: GLASSCOL };
const LOOK_COLPOOL = { style: HAIRS.map((_, i) => i), hat: HATCOL.map((_, i) => i), glass: GLASSCOL.map((_, i) => i).filter(i => i > 0) };
/* 擁有紀錄：每個顏色單獨買，key 是 hs:款式:顏色（ht:、gl: 同理）。舊版沒有顏色的 hs:款式 視為「全部顏色都有」，以前買過的不吃虧 */
const lookHave = (k, i, c) => i < FREE_N[k] || have(LOOK_PREFIX[k] + i) > 0 || have(LOOK_PREFIX[k] + i + ':' + c) > 0;
const lookOwned = (k, i) => {
  if (i < FREE_N[k] || have(LOOK_PREFIX[k] + i) > 0) return true;
  return LOOK_COLS[k].some((_, c) => have(LOOK_PREFIX[k] + i + ':' + c) > 0);
};
/* 這個款式我可以穿的顏色（免費款、舊版買過的＝全部；新版買的＝只有買過的顏色） */
const lookCols = (k, i) => LOOK_COLS[k].map((_, c) => c).filter(c => lookHave(k, i, c));
let lookToday = null, ssTab = 'style';
/* 後端 look_daily 還沒更新時的後備：用「帳號＋日期」做種子，同一天同一個人永遠抽到一樣的 6 款＋顏色 */
function lookPickLocal(day) {
  let s = 0; for (const ch of String(me && me.username || '')) s = (Math.imul(s, 31) + ch.codePointAt(0)) | 0;
  const out = { day };
  Object.keys(LOOK_POOL).forEach((k, ki) => {
    const cp = LOOK_COLPOOL[k];
    out[k] = LOOK_POOL[k].map((v, j) => ({ v, o: hash(day, j, s + ki * 7919) })).sort((p, q) => p.o - q.o).slice(0, LOOK_DAILY_N)
      .map(p => ({ i: p.v, c: cp[Math.floor(hash(day, p.v + 50, s + ki * 104729) * cp.length) % cp.length] }));
  });
  return out;
}
/* 後端 look_daily 如果已經改成回傳 [{i, c}]（每種 6 款）就用後端的，否則用本機後備 */
const lookDailyOk = d => d && ['style', 'hat', 'glass'].every(k => Array.isArray(d[k]) && d[k].length && d[k].every(x => x && Number.isInteger(x.i) && Number.isInteger(x.c)));
async function loadLookToday() {
  const day = sellDayNow();
  if (lookToday && lookToday.day === day) return;
  try {
    const d = await enqueue(() => rpc('look_daily'));
    if (lookDailyOk(d)) { lookToday = { day: d.day != null ? d.day : day, style: d.style, hat: d.hat, glass: d.glass }; return; }
  } catch (e) { /* 後端還沒更新：用本機後備 */ }
  lookToday = lookPickLocal(day);
}
function renderStyleShop(head, cur, coins, S) {
  const tabs = Object.keys(LOOK_KIND).map(k => '<button type="button" class="cb" data-a="stab" data-c="' + k + '" aria-pressed="' + (ssTab === k) + '">' + LOOK_KIND[k].ic + ' ' + LOOK_KIND[k].n + '</button>').join('');
  const k = ssTab, ck = LOOK_COLKEY[k], today = lookToday ? lookToday[k] : [];
  const rows = today.map(({ i, c }) => {
    const own = lookHave(k, i, c), now = cur[k] === i && cur[ck] === c, pr = LOOK_PRICE[k][i] || 0;
    return '<div class="row"><canvas width="16" height="22" data-k="' + k + '" data-i="' + i + '" data-c="' + c + '" style="width:48px;height:66px;image-rendering:pixelated;flex:none"></canvas>' +
      '<div class="meta"><b>' + esc(LOOK_NAMES[k][i]) + ' <span class="sw" style="--c:' + LOOK_COLS[k][c] + ';display:inline-block;width:14px;height:14px;vertical-align:-2px;opacity:1;cursor:default;pointer-events:none" aria-label="今日顏色"></span></b><small>今日新品 · ' + (now ? '目前穿著' : own ? '已擁有' : pr + ' G') + '</small></div>' +
      (now ? '' : '<button type="button" class="btn small" data-a="' + (own ? 'wear' : 'buy') + '" data-k="' + k + '" data-i="' + i + '" data-c="' + c + '"' + (syBusy || (!own && coins < pr) ? ' disabled' : '') + '>' + (own ? '穿上' : '買並穿上') + '</button>') + '</div>';
  }).join('');
  syCard.innerHTML = head + '<div class="tabs2">' + tabs + '</div>' +
    '<p style="margin:6px 0;font-size:12px;opacity:.7">每天隨機上架 ' + LOOK_DAILY_N + ' 款，顏色也是隨機的，每個人看到的不一樣，GMT+8 0 點換新。買過的款式與顏色可以隨時在衣櫥裡換。</p>' + rows +
    '<button type="button" class="btn ghost wide" data-a="talk">回去跟' + S.clerk + '說話</button><button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  syCard.querySelectorAll('canvas[data-i]').forEach(cv => {
    const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 16, 22); g = c2;
    try { drawPlayer(0, 6, 'down', false, 0, { ...cur, [cv.dataset.k]: +cv.dataset.i, [LOOK_COLKEY[cv.dataset.k]]: +cv.dataset.c }); } catch (e) { /* 略過 */ }
    g = ctx;
  });
}
const syEl = $('sym'), syCard = $('sycard');
let syKind = 'fit', syBusy = false, syStage = 'talk', syLine = '', styRoom = 'fit';
const pickOf = a => a[Math.floor(Math.random() * a.length)];
function renderSty() {
  const S = SHOP_STY[syKind], coins = me ? me.coins : 0, cur = myChar();
  const head = '<div class="shop-h"><h2>' + S.title + '</h2><span class="chip gold">' + coins + ' G</span></div>';
  if (syStage === 'talk') {
    syCard.innerHTML = head +
      '<div class="row"><canvas width="16" height="16" data-clerk="1" style="width:64px;height:64px;image-rendering:pixelated;flex:none"></canvas><div class="meta"><b>' + S.clerk + '</b><small style="font-size:14px;line-height:1.5;white-space:normal">' + syLine + '</small></div></div>' +
      '<button type="button" class="btn wide" data-a="list">' + S.look + '</button>' +
      '<button type="button" class="btn ghost wide" data-a="chat">聊聊</button>' +
      '<button type="button" class="btn ghost wide" data-a="close">沒事了，謝謝</button>';
    const c2 = syCard.querySelector('canvas[data-clerk]').getContext('2d'); c2.clearRect(0, 0, 16, 16); g = c2;
    try { npcArt(0, 0, S.ck, 0); } catch (e) { /* 略過 */ }
    g = ctx;
    return;
  }
  if (syKind === 'fit') { renderFitShop(head, cur, coins); return; }
  if (syKind === 'furn') { renderFurnShop(head, coins); return; }
  renderStyleShop(head, cur, coins, S);
}
let fitToday = null; const fitSel = {};
/* 每個玩家每天各自的 6 件，每件只有一種顏色：由後端 fit_daily 決定（item.c）。
   同一天第一次看到的顏色會記住，買下後畫面不會跳成別的顏色 */
const fitDayPick = {};
async function loadFitToday() {
  try {
    fitToday = await enqueue(() => rpc('fit_daily'));
    fitToday.items.forEach(({ i, c }) => {
      const k = fitToday.day + ':' + i;
      if (fitDayPick[k] == null) fitDayPick[k] = Number.isInteger(c) ? c : 0;
      fitSel[i] = fitDayPick[k];
    });
  } catch (e) { fitToday = null; toast(errText(e)); }
}
function renderFitShop(head, cur, coins) {
  const S = SHOP_STY.fit, NC = OUTFITS.length;
  const tail = '<button type="button" class="btn ghost wide" data-a="talk">回去跟' + S.clerk + '說話</button><button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  if (!fitToday) { syCard.innerHTML = head + '<div class="row"><div class="meta"><small>今天的衣服載入失敗了，回去再按一次「' + S.look + '」</small></div></div>' + tail; return; }
  const firstOwn = i => { for (let c = 0; c < NC; c++) if (fcHave(i, c)) return c; return 0; };
  const rows = fitToday.items.map(({ i, p }) => {
    let n = 0; for (let c = 0; c < NC; c++) if (fcHave(i, c)) n++;
    const sel = fitSel[i] != null ? fitSel[i] : firstOwn(i), own = fcHave(i, sel), now = cur.fits === i && cur.outfit === sel;
    const sws = '<span class="sw fsw' + (fcHave(i, sel) ? ' own' : '') + '" style="--c:' + OUTFITS[sel] + ';opacity:1;cursor:default" aria-label="今日顏色"></span>';
    const act = now ? '<small>目前穿著</small>' : '<button type="button" class="btn small" data-a="' + (own ? 'fwear' : 'fbuy') + '" data-i="' + i + '" data-c="' + sel + '"' + (syBusy || (!own && coins < p) ? ' disabled' : '') + '>' + (own ? '穿上' : '買並穿上 ' + p + ' G') + '</button>';
    return '<div class="row" style="align-items:flex-start"><canvas width="16" height="22" data-i="' + i + '" data-c="' + sel + '" style="width:48px;height:66px;image-rendering:pixelated;flex:none"></canvas>' +
      '<div class="meta"><b>' + esc(FITS[i]) + '</b><small>今日顏色 ' + p + ' G · 已收集 ' + n + '/' + NC + (n >= NC ? ' ✅' : '') + '</small>' +
      '<div class="sws" style="gap:5px;margin:6px 0">' + sws + '</div>' + act + '</div></div>';
  }).join('');
  syCard.innerHTML = head + '<p style="margin:0 0 6px;font-size:12px;opacity:.7">今天上架 ' + fitToday.items.length + ' 件，每件只有一種顏色，GMT+8 0 點換新。每天來看看，慢慢買齊同一件的 ' + NC + ' 種顏色會得到成就。</p>' + rows + tail;
  syCard.querySelectorAll('canvas[data-i]').forEach(cv => {
    const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 16, 22); g = c2;
    try { drawPlayer(0, 6, 'down', false, 0, { ...cur, fits: +cv.dataset.i, outfit: +cv.dataset.c }); } catch (e) { /* 略過 */ }
    g = ctx;
  });
}
/* ---------- 家具店（小村右上角）：家具只在這裡買，每天隨機上架 6 件；牆面、地板常駐 ---------- */
let fyTab = 'furn';
let furnToday = null;   // 後端 furn_daily：今天上架的 6 件（每個玩家各自、GMT+8 換日）
async function loadFurnToday() {
  try { const d = await enqueue(() => rpc('furn_daily')); furnToday = { day: d.day, keys: d.items || [] }; }
  catch (e) { furnToday = null; toast(errText(e)); }
}
const furnDailyList = () => (furnToday ? furnToday.keys : []).map(k => house.cat[k]).filter(Boolean);
function renderFurnShop(head, coins) {
  const S = SHOP_STY.furn;
  const tail = '<button type="button" class="btn ghost wide" data-a="talk">回去跟' + S.clerk + '說話</button><button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  if (!house) { syCard.innerHTML = head + '<div class="row"><div class="meta"><small>家具目錄載入失敗了，回去再按一次「' + S.look + '」</small></div></div>' + tail; return; }
  const tab = (k, n) => '<button type="button" class="cb" data-a="ytab" data-c="' + k + '" aria-pressed="' + (fyTab === k) + '">' + n + '</button>';
  let rows = '', note = '';
  if (fyTab === 'furn') {
    const list = furnDailyList();
    if (!furnToday) { syCard.innerHTML = head + '<div class="row"><div class="meta"><small>今天的家具載入失敗了，回去再按一次「' + S.look + '」</small></div></div>' + tail; return; }
    note = '<p style="margin:6px 0;font-size:12px;opacity:.7">今天上架 ' + list.length + ' 件，GMT+8 0 點換一批新的。今天沒有想要的，明天再來看看。</p>';
    rows = list.length ? list.map(c => '<div class="row"><canvas width="32" height="32" data-fk="' + esc(c.key) + '" style="width:48px;height:48px;image-rendering:pixelated;flex:none"></canvas><div class="meta"><b>' + esc(c.name) + '</b><small>' + c.w + '×' + c.h + ' 格 · ' + (c.layer === 'wall' ? '掛牆' : c.layer === 'flat' ? '地毯' : '落地') + ' · 持有 ' + have('f:' + c.key) + '</small></div>' +
      '<button type="button" class="btn small" data-a="ybuy" data-c="' + esc(c.key) + '"' + (syBusy || coins < c.price ? ' disabled' : '') + '>' + c.price + ' G</button></div>').join('') : '<p class="empty">今天沒有上架的家具</p>';
  } else {
    const kd = fyTab, names = kd === 'wall' ? WALL_NAMES : FLOOR_NAMES, cur = house.style[kd];
    rows = names.map((n, i) => {
      const key = kd + '_' + i, c = house.cat[key], owned = i === 0 || have('f:' + key) > 0, price = c ? c.price : 0;
      return '<div class="row"><i class="swatch" style="background:' + iconRowColor[kd][i] + '"></i><div class="meta"><b>' + n + '</b><small>' + (cur === i ? '目前使用中' : owned ? '已擁有' : price + ' G') + '</small></div>' +
        (cur === i ? '' : '<button type="button" class="btn small" data-a="ystyle" data-c="' + i + '"' + (syBusy || (!owned && coins < price) ? ' disabled' : '') + '>' + (owned ? '套用' : '買並套用') + '</button>') + '</div>';
    }).join('');
  }
  syCard.innerHTML = head + '<div class="tabs2">' + tab('furn', '今日家具') + tab('wall', '牆面') + tab('floor', '地板') + '</div>' + note + rows + tail;
  syCard.querySelectorAll('canvas[data-fk]').forEach(cv => { try { furnIcon(cv, cv.dataset.fk); } catch (e) { /* 略過 */ } });
}
function openSty(kind) { syKind = kind; syStage = 'talk'; syLine = pickOf(SHOP_STY[kind].hello); syOpen = true; pressed.length = 0; renderSty(); syEl.hidden = false; syCard.focus(); }
function closeSty() { syOpen = false; syEl.hidden = true; }
syCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, i = +b.dataset.c, S = SHOP_STY[syKind];
  if (a === 'close') { closeSty(); return; }
  if (a === 'list' || a === 'talk') {
    syStage = a;
    if (a === 'list' && syKind === 'fit') await loadFitToday();
    if (a === 'list' && syKind === 'hair') await loadLookToday();
    if (a === 'list' && syKind === 'furn') { if (!house) { try { await enqueue(() => loadHouse()); } catch (err) { toast(errText(err)); } } await loadFurnToday(); }
    renderSty(); return;
  }
  if (a === 'stab') { ssTab = b.dataset.c; renderSty(); return; }
  if (a === 'ytab') { fyTab = b.dataset.c; renderSty(); return; }
  if (a === 'ybuy' || a === 'ystyle') {
    syBusy = true; renderSty();
    try {
      const r_ = await enqueue(() => a === 'ybuy' ? rpc('buy_furniture', { p_item: b.dataset.c, p_qty: 1 }) : rpc('house_style', { p_kind: fyTab, p_idx: +b.dataset.c }));
      if (r_.inv) Object.assign(inv, r_.inv);
      if (typeof r_.coins === 'number') me.coins = r_.coins;
      if (r_.style) house.style = r_.style;
      toast(a === 'ybuy' ? '買下了，回家布置吧' : '換好了', 2000);
    } catch (err) { toast(errText(err)); await resync(); }
    syBusy = false; if (syOpen) renderSty(); refreshHud(); return;
  }
  if (a === 'chat') { syLine = pickOf(S.chat); renderSty(); return; }
  if (a === 'pick') { fitSel[+b.dataset.i] = +b.dataset.c; renderSty(); return; }
  if (a === 'fbuy' || a === 'fwear') {
    const fi = +b.dataset.i, fc = +b.dataset.c;
    syBusy = true; renderSty();
    try {
      let got = null;
      if (a === 'fbuy') {
        const r_ = await enqueue(() => rpc('buy_fit', { p_idx: fi, p_col: fc }));
        if (r_.inv) Object.assign(inv, r_.inv);
        if (typeof r_.coins === 'number') me.coins = r_.coins;
        got = r_.ach || null;
      }
      const look = {}; const cur = myChar(); for (const k in LIMIT) look[k] = cur[k];
      look.fits = fi; look.outfit = fc;
      await enqueue(() => rpc('set_look', { p_name: me.name, p_look: look }));
      me.look = look;
      const A = got && ACH.find(x => x.id === got);
      toast(A ? '🎉 獲得成就：' + A.n : a === 'fbuy' ? '買下並穿上了' : '換好了', A ? 3800 : 2200);
    } catch (err) { toast(errText(err)); await resync(); }
    syBusy = false;
    if (syOpen) renderSty();
    refreshHud();
    return;
  }
  const kk = b.dataset.k || S.k, ii = b.dataset.i != null ? +b.dataset.i : i, cc = b.dataset.i != null ? +b.dataset.c : 0, ck_ = LOOK_COLKEY[kk];
  syBusy = true; renderSty();
  try {
    if (a === 'buy') {
      const r_ = await enqueue(() => rpc('buy_look', { p_kind: kk, p_idx: ii, p_col: cc }));
      if (r_.inv) Object.assign(inv, r_.inv);
      if (typeof r_.coins === 'number') me.coins = r_.coins;
    }
    const look = {}; const cur = myChar(); for (const k in LIMIT) look[k] = cur[k];
    look[kk] = ii; look[ck_] = cc;
    await enqueue(() => rpc('set_look', { p_name: me.name, p_look: look }));
    me.look = look; toast(a === 'buy' ? '買下並穿上了' : '換好了', 2200);
  } catch (err) { toast(errText(err)); await resync(); }
  syBusy = false;
  if (syOpen) renderSty();
  refreshHud();
});

/* ---------- 店裡的房間（10×8）：後牆是貨架／鏡子，櫃檯後面站著店員，下方是門 ---------- */
const SRW = 10, SRH = 8, SYK = 27, SYC = 28;   // SYK 店員 SYC 櫃檯
const srkind = Array.from({ length: SRH }, () => Array(SRW).fill(G));
for (let y = 0; y < SRH; y++) for (let x = 0; x < SRW; x++) if (y < 3 || y === SRH - 1 || x === 0 || x === SRW - 1) srkind[y][x] = BWL;
srkind[SRH - 1][4] = BX; srkind[SRH - 1][5] = BX;
[3, 4, 5].forEach(x => { srkind[4][x] = SYC; });
srkind[3][4] = SYK;
srkind[5][1] = DEC; srkind[5][8] = DEC;   // 試衣模特兒／試戴模特兒
/* 牧場小屋室內（展示欄型）：左邊雞牛小欄、右邊櫃檯，小茉站在 (7,3) */
const rrkind = Array.from({ length: SRH }, () => Array(SRW).fill(G));
for (let y = 0; y < SRH; y++) for (let x = 0; x < SRW; x++) if (y < 3 || y === SRH - 1 || x === 0 || x === SRW - 1) rrkind[y][x] = BWL;
rrkind[SRH - 1][4] = BX; rrkind[SRH - 1][5] = BX;
[6, 7, 8].forEach(x => { rrkind[4][x] = SYC; }); rrkind[3][7] = SYK;
for (let y = 4; y <= 6; y++) for (let x = 1; x <= 3; x++) rrkind[y][x] = DEC;   // 雞牛的小欄
rrkind[6][8] = DEC;                                                           // 乾草堆
/* 園藝工坊室內（村長家）：工具牆、鐵砧、庭院燈，橡果村長站在櫃檯後面 */
const wkkind = Array.from({ length: SRH }, () => Array(SRW).fill(G));
for (let y = 0; y < SRH; y++) for (let x = 0; x < SRW; x++) if (y < 3 || y === SRH - 1 || x === 0 || x === SRW - 1) wkkind[y][x] = BWL;
wkkind[SRH - 1][4] = BX; wkkind[SRH - 1][5] = BX;
[3, 4, 5].forEach(x => { wkkind[4][x] = SYC; }); wkkind[3][4] = SYK;
wkkind[5][1] = DEC; wkkind[5][8] = DEC;   // 鐵砧／庭院燈
function enterStylist(kind) {
  if (scene !== 'town' || !ready || !me || paused()) return;
  styRoom = kind; pose = null; scene = 'stylist'; K = kind === 'ranch' ? rrkind : kind === 'work' ? wkkind : srkind; W = SRW; H = SRH;
  pl.x = pl.sx = 4; pl.y = pl.sy = SRH - 2; pl.prog = 1; pl.face = 'up'; pressed.length = 0;
  view.snap = true; fitView(); toast(kind === 'ranch' ? '歡迎光臨牧場小屋' : kind === 'fit' ? '歡迎光臨裁縫鋪' : kind === 'furn' ? '歡迎光臨家具店' : kind === 'work' ? '歡迎光臨園藝工坊' : '歡迎光臨造型店');
}
function leaveStylist(silent) {
  if (scene !== 'stylist') return;
  closeSty();
  scene = 'town'; K = tkind; W = TW; H = TH;
  const d = styRoom === 'ranch' ? [20, 6] : styRoom === 'fit' ? [5, 6] : styRoom === 'furn' ? [27, 6] : styRoom === 'work' ? [13, 6] : [21, 15];
  pl.x = pl.sx = d[0]; pl.y = pl.sy = d[1]; pl.prog = 1; pl.face = 'down'; pressed.length = 0;
  view.snap = true; fitView(); if (!silent) toast('回到小村了');
}
function stylistAct(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (catchShown) { hideCatch(); return; }
  const k = K[y][x];
  if (k === BX) leaveStylist();
  else if (k === SYK || k === SYC) { if (styRoom === 'ranch') openRanch(); else if (styRoom === 'work') openShop('work'); else openSty(styRoom); }
  else if (k === DEC) pop(x, y, styRoom === 'ranch' ? (x === 8 ? '堆得高高的乾草' : '雞和牛的小欄，隔著欄杆看看牠們') : styRoom === 'fit' ? '試衣用的模特兒' : styRoom === 'furn' ? '店裡展示用的家具' : styRoom === 'work' ? (x === 1 ? '鐵砧，鋤頭和水壺都是在這裡敲出來的' : '庭院燈的樣品，晚上會亮') : '試戴用的模特兒，戴著店裡的新帽子和眼鏡', '#fff3b0');
}
function drawRanchRoom(now) {
  const bob = Math.floor(now / 600) % 2;
  const hay = (x, y, w, h) => { ob('#e8c070', '#a8802a', x, y, w, h); r('#c9984a', x + 2, y + (h >> 1), w - 4, 1); };
  const chick = (x, y, b) => { ob('#ffffff', '#b8b8b8', x, y + b, 6, 5); r('#e8453c', x + 2, y - 1 + b, 2, 2); r('#ffb62e', x - 1, y + 2 + b, 1, 1); r('#333333', x + 1, y + 1 + b, 1, 1); r('#ffb62e', x + 1, y + 5, 1, 1); r('#ffb62e', x + 4, y + 5, 1, 1); };
  const cow = (x, y, b) => { ob('#ffffff', '#9a9aa6', x, y + b, 12, 7); r('#3a3a3a', x + 4, y + 1 + b, 3, 3); r('#3a3a3a', x + 9, y + 3 + b, 2, 2); ob('#ffffff', '#9a9aa6', x - 4, y + 1 + b, 5, 6); r('#ffb3b3', x - 4, y + 5 + b, 4, 2); r('#333333', x - 2, y + 3 + b, 1, 1); r('#e8d4a8', x - 3, y + b, 1, 2); r('#9a9aa6', x + 1, y + 7, 2, 3); r('#9a9aa6', x + 9, y + 7, 2, 3); r('#9a9aa6', x + 12, y + 1 + b, 1, 4); };
  for (let tx = 0; tx < SRW; tx++) r('#c4915a', tx * T + 7, 0, 1, 2 * T);                                  // 木板牆
  hay(104, 16, 16, 16); hay(120, 16, 16, 16); hay(112, 2, 16, 14);                                          // 牆邊的乾草堆
  ob('#fffaf0', '#c9a37a', 8, 8, 18, 14); r('#ffffff', 12, 12, 4, 3); r('#e8453c', 13, 11, 2, 1); r('#ffb62e', 11, 13, 1, 1);
  r('#ffffff', 18, 11, 5, 4); r('#333333', 19, 12, 1, 1); r('#ffb3b3', 18, 14, 3, 1);                        // 招牌：雞和牛
  r('#e8c070', T, 4 * T, 3 * T, 3 * T);                                                                     // 小欄的稻草地
  for (let i = 0; i < 12; i++) r('#c9984a', T + 2 + (i * 13) % 44, 4 * T + 2 + (i * 17) % 44, 3, 1);
  chick(20, 76, bob); chick(31, 84, 1 - bob); chick(22, 94, bob); cow(46, 90, 0);
  for (let x = 0; x <= 48; x += 8) { r('#9b6a44', T + x, 4 * T - 2, 2, 16); r('#9b6a44', T + x, 7 * T - 18, 2, 16); }
  r('#9b6a44', T, 4 * T + 2, 3 * T, 2); r('#9b6a44', T, 7 * T - 6, 3 * T, 2); r('#9b6a44', 4 * T - 2, 4 * T, 2, 3 * T);
  ob('#c98f62', '#8c5b3c', 6 * T, 4 * T + 3, 3 * T, T - 3); r('#e8b27a', 6 * T, 4 * T + 3, 3 * T, 2);       // 櫃檯
  ob('#c08a62', '#8c5b3c', 6 * T + 3, 4 * T - 2, 9, 5); r('#fff6e6', 6 * T + 4, 4 * T - 4, 3, 3); r('#fff6e6', 6 * T + 8, 4 * T - 4, 3, 3);
  ob('#d8dde6', '#8a93a3', 8 * T + 5, 4 * T - 6, 6, 9); r('#8a93a3', 8 * T + 5, 4 * T - 4, 6, 1);
  hay(8 * T + 1, 6 * T + 4, 14, 11); ob('#e8dcc0', '#a8987a', 8 * T + 4, 6 * T - 3, 8, 9); r('#c9584a', 8 * T + 6, 6 * T, 4, 2);
  ob('#fff0d4', '#9b6a44', 4 * T + 1, (H - 1) * T - 1, 2 * T - 2, T + 1); r('#9b6a44', 5 * T, (H - 1) * T, 1, T);   // 門
  drawNpc(7 * T, 3 * T, 'mo', now);
}
function drawStylistRoom(now) {
  const fit = styRoom === 'fit', furn = styRoom === 'furn', ranch = styRoom === 'ranch', work = styRoom === 'work';
  const wall = (furn || ranch || work) ? '#d9a56c' : fit ? '#ffe3ec' : '#e3f6ec', wallD = (furn || ranch || work) ? '#a8764a' : fit ? '#f3b8cb' : '#a9d9c0', fa = (furn || ranch || work) ? '#e8c79a' : fit ? '#f6dcc0' : '#e8e3d6', fb = (furn || ranch || work) ? '#dfb98a' : fit ? '#efd2b4' : '#ddd7c8';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3b2a1e'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
  r('#3b2a1e', 0, 0, W * T, H * T);
  if (styRoom === 'hair') { drawStyleRoom(now); return; }
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const px = tx * T, py = ty * T;
    if (ty < 3) { r(wall, px, py, T, T); if (ty === 2) { r(wallD, px, py + T - 2, T, 2); } }
    else if (K[ty][tx] === BWL) { r(wallD, px, py, T, T); r(shade(wallD, 0.9), px + 7, py, 1, T); }
    else { r((tx + ty) % 2 ? fa : fb, px, py, T, T); }
  }
  if (ranch) { drawRanchRoom(now); return; }
  for (let tx = 1; tx < W - 1; tx++) {
    const px = tx * T;
    if (work) {
      r('#c9a37a', px, T + 1, T, 12);                                                       // 釘板
      if (tx % 4 === 1) { r('#8c5b3c', px + 7, T + 2, 2, 10); r('#7a8590', px + 3, T + 2, 10, 3); }           // 鋤頭
      else if (tx % 4 === 2) { ob('#6fb7e8', '#3f7fae', px + 3, T + 5, 9, 6); r('#3f7fae', px + 11, T + 6, 3, 1); }   // 水壺
      else if (tx % 4 === 3) { r('#c9984a', px + 4, T + 1, 1, 12); r('#c9984a', px + 11, T + 1, 1, 12); }   // 釣竿
      else { r('#8c5b3c', px + 7, T + 2, 2, 10); r('#7a8590', px + 4, T + 2, 8, 2); }
      r('#a8764a', px, 2 * T + 9, T, 3);
      if (tx % 3 === 0) { rr('#c08a62', px + 5, 2 * T + 5, 6, 4); rr('#ff8fa8', px + 4, 2 * T + 1, 8, 5); }  // 小花盆
      else if (tx % 3 === 1) { r('#5e3a24', px + 7, 2 * T + 3, 2, 6); rr('#ffe58a', px + 4, 2 * T + 1, 8, 3); } // 小燈
    } else if (furn) {
      if (tx % 3 === 1) { ob('#fff0d4', '#8c5b3c', px + 2, T + 2, 12, 10); r(['#ff9bb3', '#8fd3c0', '#ffd27a'][(tx / 3 | 0) % 3], px + 4, T + 4, 8, 6); }   // 掛畫
      r('#a8764a', px, 2 * T + 9, T, 3);
      if (tx % 3 === 0) { rr('#d9667f', px + 3, 2 * T + 2, 3, 7); rr('#d9667f', px + 3, 2 * T + 6, 9, 3); }                // 小椅子
      else if (tx % 3 === 1) { r('#8c5b3c', px + 7, 2 * T + 4, 2, 5); rr('#ffd34d', px + 4, 2 * T + 1, 8, 4); }          // 小檯燈
      else { rr('#c08a62', px + 5, 2 * T + 5, 6, 4); rr('#7fd08a', px + 4, 2 * T + 1, 8, 5); }                            // 小盆栽
    } else if (fit) {
      r('#9b6a44', px, T + 4, T, 1);                                               // 吊衣桿
      const c = OUTFITS[(tx * 5) % OUTFITS.length]; ob(c, shade(c, 0.8), px + 3, T + 5, 10, 9);
      r('#b8895a', px, 2 * T + 9, T, 3); const c2 = OUTFITS[(tx * 7 + 3) % OUTFITS.length]; ob(c2, shade(c2, 0.8), px + 2, 2 * T + 3, 12, 6);   // 貨架上的摺好衣服
    } else {
      if (tx % 3 === 1) { ob('#d6ecf8', '#8a6a4a', px + 1, 3, 14, 24); r('#ffffff', px + 3, 6, 2, 6); }   // 鏡子
      r('#b8895a', px, 2 * T + 9, T, 3);
      if (tx % 2 === 0) { r(['#ff9bb3', '#8fd3c0', '#ffd27a'][tx % 3], px + 5, 2 * T + 3, 4, 6); r('#6a7a8a', px + 6, 2 * T + 1, 2, 2); }   // 瓶瓶罐罐
    }
  }
  ob('#c98f62', '#8c5b3c', 3 * T, 4 * T + 3, 3 * T, T - 3); r('#e8b27a', 3 * T, 4 * T + 3, 3 * T, 2);   // 櫃檯
  if (furn) { ob('#ffd34d', '#b8932a', 3 * T + 3, 4 * T, 6, 4); rr('#7fd08a', 5 * T + 6, 4 * T - 1, 7, 5); } else if (work) { ob('#7a8590', '#4a4e58', 3 * T + 3, 4 * T, 8, 4); rr('#6fb7e8', 5 * T + 6, 4 * T - 1, 7, 5); } else if (fit) { ob('#ff9bb3', '#d4688a', 3 * T + 3, 4 * T, 8, 4); } else { r('#6a7a8a', 5 * T + 4, 4 * T + 1, 1, 4); r('#6a7a8a', 5 * T + 6, 4 * T + 1, 1, 4); }
  [[1, 5], [8, 5]].forEach(([tx, ty]) => {
    const px = tx * T, py = ty * T;
    if (work) {
      if (tx === 1) { r('#3a3d46', px + 1, py + 5, 14, 3); r('#3a3d46', px + 4, py + 8, 8, 3); r('#3a3d46', px + 3, py + 11, 10, 3); r('#c9ccd6', px + 2, py + 5, 12, 1); }
      else { r('#5e3a24', px + 7, py + 6, 2, 9); ob('#ffe58a', '#c9971a', px + 4, py + 2, 8, 5); r('#5e3a24', px + 4, py + 14, 8, 2); }
    }
    else if (furn) { try { (tx === 1 ? FURN.plant : FURN.chair)(px, py, now); } catch (e) { /* 略過 */ } }
    else if (fit) { r('#9b6a44', px + 7, py + 8, 2, 7); r('#9b6a44', px + 4, py + 14, 8, 2); ob(OUTFITS[tx % OUTFITS.length], '#8a5a44', px + 4, py + 2, 8, 7); r('#f6c9a0', px + 6, py, 4, 3); }
    else { ob('#e26b88', '#9b3f5a', px + 3, py + 4, 10, 8); ob('#e26b88', '#9b3f5a', px + 3, py + 1, 10, 4); r('#6a7a8a', px + 7, py + 12, 2, 3); r('#6a7a8a', px + 4, py + 14, 8, 2); }
  });
  ob('#fff0d4', '#9b6a44', 4 * T + 1, (H - 1) * T - 1, 2 * T - 2, T + 1); r('#9b6a44', 5 * T, (H - 1) * T, 1, T);   // 門
  drawNpc(4 * T, 3 * T, work ? 'oak' : SHOP_STY[styRoom].ck, now);
}
