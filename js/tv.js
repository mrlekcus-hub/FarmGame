'use strict';
/* 餐桌與電視 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 餐桌：屋主擺菜、訪客直接吃，訪客也能放 1 份自己煮的菜 ---------- */
const dtEl = $('dtm'), dtCard = $('dtcard');
let dtBusy = false, dtMsg = '';   // dtMsg：餐桌視窗裡的錯誤訊息（toast 會被全螢幕視窗蓋住，所以直接寫在視窗裡）
const dishName = k => (recipes.find(x => x.key === k) || {}).name || k;
function openDishTable(it) {
  if (paused() || typeof it.id !== 'number' || !isFinite(it.id)) return;
  dtId = it.id; dtTv = false; dtMsg = ''; dsOpen = true; pressed.length = 0; renderDish(); dtEl.hidden = false; dtCard.focus();
}
/* ---------- 電視：換頻道（同一間屋子的人看到一樣的畫面）＋今日情報／天氣預報 ---------- */
const TV_CH = [{ n: '卡通', t: '播著軟綿綿的卡通。' }, { n: '烹飪節目', t: '主廚說：火候最重要。去灶台試試看吧。' }, { n: '釣魚節目', t: '看起來很好釣的樣子。' }, { n: '天氣預報' }, { n: '今日情報' }];
let tvCh = {}, dtTv = false, tvFurnLoading = false;   // 家具編號 → 頻道（家具編號全服唯一，所以不同屋子不會撞到）
try { tvCh = JSON.parse(localStorage.getItem('dw_tv') || '{}') || {}; } catch (e) { tvCh = {}; }
const tvOf = id => { const c = tvCh[id] | 0; return c >= 0 && c < TV_CH.length ? c : 0; };
function setTvCh(id, c, send) {
  c |= 0; if (c < 0 || c >= TV_CH.length) return;
  tvCh[id] = c;
  if (!send) return;
  if (!visiting) try { localStorage.setItem('dw_tv', JSON.stringify(tvCh)); } catch (e) { /* 略過 */ }   // 只記自己家的選擇；拜訪時換的只在這次有效
  try { if (net && net.ch) net.ch.send({ type: 'broadcast', event: 'tv', payload: { i: myUid, id, c } }); } catch (e) { /* 略過 */ }
}
function onTv(p) {
  if (!p || p.i === myUid || scene !== 'house' || !house) return;
  const id = +p.id, c = p.c | 0;
  if (!isFinite(id) || c < 0 || c >= TV_CH.length || !house.items.some(x => x.id === id && x.k === 'tv')) return;
  tvCh[id] = c;
  if (dsOpen && dtTv && dtId === id) renderTv();
}
async function tvLoadFurn() {
  if (tvFurnLoading) return;
  tvFurnLoading = true; if (dsOpen && dtTv) renderTv();
  await loadFurnToday();
  tvFurnLoading = false; if (dsOpen && dtTv) renderTv();
}
function openTv(it) {
  if (paused() || typeof it.id !== 'number' || !isFinite(it.id)) return;
  dtId = it.id; dtTv = true; dtMsg = ''; dsOpen = true; pressed.length = 0; renderTv(); dtEl.hidden = false; dtCard.focus();
  if (tvOf(it.id) === 4) tvLoadFurn();
}
function tvWeatherHtml() {
  const ms = srvNow(), h0 = Math.floor(ms / 3600000);
  const icon = h => { const wet = precipHour(h), snow = wet && (seasonAt(h * 3600000) === 'winter' || (SNOW_ON && hash(h, 0, 78) < 0.35)); return wet ? (snow ? '❄️' : '🌧️') : '☀️'; };
  const cells = []; for (let i = 0; i < 8; i++) cells.push('<span style="display:inline-block;min-width:54px;text-align:center"><small>' + ((h0 + i + 8) % 24) + ' 點</small><br>' + icon(h0 + i) + '</span>');
  return '<p class="empty">現在：' + icon(h0) + '　' + esc(SEASON_N[seasonAt(ms)] || '') + '</p><div style="margin:4px 0">' + cells.join('') + '</div><small class="empty">下雨下雪的時候，作物不用澆水。</small>';
}
function tvInfoHtml() {
  const ms = srvNow(), d = merchantDay();
  let mer = '今天在小村（米羅）';
  if (!merchantHere()) { let o = 1; while (o < 8 && ![5, 6, 0].includes(((d + o) % 7 + 4) % 7)) o++; mer = '今天不在，' + o + ' 天後回來'; }
  const act = Object.keys(buffs).filter(buffOn).map(k => (BUFF_N[k] || k) + '（剩 ' + Math.ceil((buffs[k] - srvNow()) / 60000) + ' 分鐘）');
  const furn = tvFurnLoading ? '載入中…' : furnToday ? (furnDailyList().map(c => esc(c.name)).join('、') || '今天沒有上架') : '暫時查不到';
  return '<p class="empty">' + esc(SEASON_N[seasonAt(ms)] || '') + '</p>' +
    '<div class="strow"><span>旅行商人</span><span>' + mer + '</span></div>' +
    '<div class="strow"><span>料理效果</span><span>' + (act.length ? esc(act.join('、')) : '目前沒有') + '</span></div>' +
    '<div class="strow" style="flex-wrap:wrap"><span>家具店今天上架</span><span style="flex:1;min-width:140px;text-align:right">' + furn + '</span></div>';
}
function renderTv() {
  const it = house && house.items.find(i => i.id === dtId); if (!it) { closeDisplay(); return; }
  const cur = tvOf(dtId);
  let h = '<h2>電視</h2><p class="empty">選一個頻道，同一間屋子的人看到的畫面一樣。</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">' +
    TV_CH.map((c, i) => '<button type="button" class="btn small' + (i === cur ? '' : ' ghost') + '" data-a="ch" data-c="' + i + '">' + c.n + '</button>').join('') + '</div>';
  h += cur === 4 ? tvInfoHtml() : cur === 3 ? tvWeatherHtml() : '<p class="empty">' + esc(TV_CH[cur].t) + '</p>';
  dtCard.innerHTML = h + '<button type="button" class="btn wide" data-a="close">完成</button>';
}
const setDishBy = (id, arr) => { if (!house) return; const o = {}; (arr || []).forEach(x => { o[x.s | 0] = { u: String(x.uid), n: clean(x.name, 8) }; }); (house.by || (house.by = {}))[id] = o; };
function renderDish() {
  if (dtTv) { renderTv(); return; }
  const it = house && house.items.find(i => i.id === dtId); if (!it) { closeDisplay(); return; }
  const arr = house.disp[dtId] || [], by = (house.by && house.by[dtId]) || {}, mine = !visiting;
  const myPut = Object.keys(by).some(s => arr[s] && arr[s].n > 0 && by[s].u === myUid);   // 訪客：自己是不是已經放了一份
  let h = '<h2>餐桌</h2><p class="empty">' + (mine ? '擺上料理，朋友來拜訪時可以直接吃；朋友也可以放上自己煮的菜' : esc(visiting.name) + ' 的餐桌，每天最多吃 5 份；你自己同時最多放 1 份') + '</p>';
  const rcOf = k => recipes.find(x => x.key === k) || {};
  const fx = rc => rc.buff ? (BUFF_N[rc.buff] || rc.buff) : '';
  const onTable = {};
  for (let s = 0; s < 4; s++) {
    const d = arr[s], has = d && d.n > 0, rc = has ? rcOf(d.k) : {};
    const g = has ? by[s] : null, own = !!(g && g.u === myUid);   // g：訪客放的；own：是我自己放的
    if (has && !g) onTable[d.k] = 1;
    const who = g ? '<small class="empty" style="display:block">' + (own ? '你放的' : esc(g.n || '朋友') + ' 放的') + '</small>' : '';
    let btn = '';
    if (has) {
      if (mine) btn = (rc.buff ? '<button type="button" class="btn small" data-a="' + (g ? 'eat' : 'selfeat') + '" data-s="' + s + '" data-k="' + esc(d.k) + '">吃一份</button> ' : '') +
        '<button type="button" class="btn ghost small" data-a="take" data-s="' + s + '">' + (g ? '請走（退回給 ' + esc(g.n || '朋友') + '）' : '收回') + '</button>';
      else if (own) btn = '<button type="button" class="btn ghost small" data-a="take" data-s="' + s + '">收回</button>';
      else if (rc.buff) btn = '<button type="button" class="btn small" data-a="eat" data-s="' + s + '">吃一份</button>';
    }
    h += '<div class="strow" style="flex-wrap:wrap"><span style="flex:1;min-width:120px">' + (has ? esc(dishName(d.k)) + (d.n > 1 ? ' ×' + d.n : '') + who + (fx(rc) ? '<small class="empty" style="display:block;color:#5c8a3a">吃了：' + esc(fx(rc)) + '</small>' : '<small class="empty" style="display:block">沒有特別效果</small>') : '（空）') + '</span>' + btn + '</div>';
  }
  if (mine || !myPut) {
    const ds = recipes.filter(rc => have('dish:' + rc.key) > 0 && (!mine || !onTable[rc.key]));
    h += '<p class="empty">' + (mine ? '放上桌（每道料理放 1 份）' : '把你煮的菜放上桌（只放 1 份，朋友和屋主都能吃）') + '</p>' + (ds.length ? ds.map(rc => '<button type="button" class="btn ghost small" data-a="put" data-k="' + esc(rc.key) + '">' + esc(rc.name) + '（有 ' + have('dish:' + rc.key) + '）' + (fx(rc) ? ' · ' + esc(fx(rc)) : '') + '</button>').join(' ') : '<small class="empty">背包裡沒有可以放上桌的料理' + (mine ? '（已經在桌上的不會重複放）' : '') + '。</small>');
  } else h += '<small class="empty">你已經放了一份在桌上，收回後才能再放。</small>';
  if (dtMsg) h += '<p class="empty" role="alert" style="color:#d0475f;font-weight:700">' + esc(dtMsg) + '</p>';
  dtCard.innerHTML = h + '<button type="button" class="btn wide" data-a="close">完成</button>';
}
dtCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || dtBusy) return;
  const a = b.dataset.a, s = +b.dataset.s, id = dtId;
  if (dtTv) {   // 電視：換頻道
    if (a === 'close') closeDisplay();
    else if (a === 'ch') { const c = +b.dataset.c; setTvCh(id, c, true); if (c === 4) tvLoadFurn(); renderTv(); }
    return;
  }
  if (a === 'close') { closeDisplay(); return; }
  dtBusy = true; dtMsg = '';
  let ate = null;
  try {
    if (a === 'selfeat') {   // 自己吃：先收回桌上那份，再當成背包的料理吃掉（加成和廚房的「吃一份」一樣）
      const t = await enqueue(() => rpc('dish_table_take', { p_id: id, p_slot: s }));
      if (t && t.inv) Object.assign(inv, t.inv);
      const disp0 = []; ((t && t.display) || []).forEach(x => { disp0[x.s | 0] = { t: 'dish', k: String(x.k), n: x.n | 0 }; });
      if (house) house.disp[id] = disp0;
      setDishBy(id, t && t.by);
      const r2 = await enqueue(() => rpc('eat', { p_key: b.dataset.k }));
      if (r2 && r2.inv) Object.assign(inv, r2.inv);
      if (r2 && r2.buff) { buffs[r2.buff] = +r2.until; updateBuffChip(); }
      toast('好吃！' + (r2 && r2.buff ? '（' + (BUFF_N[r2.buff] || r2.buff) + '）' : '')); chime([76, 81], 0.1);
      refreshHud(); dtBusy = false;
      if (r2 && r2.buff) { closeDisplay(); playEat(b.dataset.k, r2.buff); }   // 關掉餐桌視窗才看得到角色吃東西
      else if (dsOpen && dtId != null) renderDish();
      return;
    }
    const call = a === 'put' ? () => rpc('dish_table_put', { p_id: id, p_key: b.dataset.k, p_n: 1 })
      : a === 'take' ? () => rpc('dish_table_take', { p_id: id, p_slot: s }) : () => rpc('dish_table_eat', { p_id: id, p_slot: s });
    const r = await enqueue(call);
    if (!r || typeof r !== 'object') throw new Error('伺服器沒有回應內容');
    if (r.inv) Object.assign(inv, r.inv);
    if (!Array.isArray(r.display)) { reloadHouse(); }
    const disp = []; (r.display || []).forEach(x => { disp[x.s | 0] = { t: 'dish', k: String(x.k), n: x.n | 0 }; });
    if (house) house.disp[id] = disp;
    setDishBy(id, r.by);
    if (a === 'eat') {
      if (r.buff) { buffs[r.buff] = +r.until; updateBuffChip(); }
      toast('好吃！' + (r.buff ? '（' + (BUFF_N[r.buff] || r.buff) + '）' : '')); chime([76, 81], 0.1);
      if (r.buff) ate = { k: r.k, b: r.buff };
      try { net.ch.send({ type: 'broadcast', event: 'ate', payload: { i: myUid, n: me.name, d: dishName(r.k) } }); } catch (er) { /* 略過 */ }
    }
    refreshHud();
  } catch (er) { console.error('dish_table', a, er); toast(errText(er)); dtMsg = errText(er); }
  dtBusy = false;
  if (ate) { closeDisplay(); playEat(ate.k, ate.b); }   // 吃的時候關掉視窗，讓你看到角色的動作
  else if (dsOpen && dtId != null) renderDish();
});
