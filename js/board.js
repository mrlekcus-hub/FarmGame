'use strict';
/* 委託布告欄 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 委託布告欄（農場小路旁）：每天 3 張委託，內容由伺服器決定 ---------- */
const bdEl = $('bdm'), bdCard = $('bdcard');
let bdData = null, bdBusy = false;
async function openBoard() {
  if (!ready || !me || authOpen || paused() || bdOpen) return;
  bdOpen = true; pressed.length = 0; bdData = null; stData = null; bdTab = 'order'; renderBoard(); bdEl.hidden = false; bdCard.focus();
  try { bdData = await rpc('order_get'); } catch (e) { toast(errText(e)); closeBoard(); return; }
  if (bdOpen) renderBoard();
}
function closeBoard() { bdOpen = false; bdEl.hidden = true; }
function renderBoard() {
  let h = '<div class="shop-h"><h2>布告欄</h2><span class="chip gold">' + (me ? me.coins : 0) + ' G</span></div>' +
    '<div class="v-quick" style="margin:6px 0">' + [['order', '每週委託'], ['story', '村莊故事']].map(([k, n]) =>
      '<button type="button" class="chipbtn" data-a="tab" data-c="' + k + '" aria-pressed="' + (bdTab === k ? 'true' : 'false') + '">' + n + '</button>').join('') + '</div>';
  if (bdTab === 'story') h += renderStory();
  else if (!bdData) h += '<p class="empty">讀取中…</p>';
  else {
    const done = new Set(bdData.done || []);
    h += '<p class="empty">每週 3 張委託，週一凌晨 0 點更新（還有 ' + (bdData.left_days || 1) + ' 天）；報酬比雜貨攤賣價高，每張完成都有玩家經驗。三張都完成再加碼 300 G 和 30 經驗。</p>' +
      (bdData.orders || []).map(o => {
        const hv = have(o.item), ok = hv >= o.qty, dn = done.has(o.i);
        return '<div class="row"><div class="meta"><b>' + esc(itemName(o.item)) + ' ×' + o.qty + '</b><small>報酬 ' + o.reward + ' G ＋ ' + (o.xp | 0) + ' 玩家經驗 · 持有 ' + hv + '</small></div>' +
          '<button type="button" class="btn" data-a="fill" data-c="' + o.i + '"' + (dn || !ok || bdBusy ? ' disabled' : '') + '>' + (dn ? '已完成' : ok ? '交付' : '材料不足') + '</button></div>';
      }).join('');
  }
  bdCard.innerHTML = h + '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
}
function renderStory() {
  if (!stData) return '<p class="empty">讀取中…</p>';
  const d = stData.done | 0, chs = stData.chapters || [], cur = chs.find(c => c.ch === d + 1);
  let h = '<p class="empty">雷克斯小村的故事共 ' + chs.length + ' 章，進度 ' + d + '/' + chs.length + '。到村子裡找對應的村民對話、交付物品，故事就會繼續。頭上有「!」的人有事找你。</p>';
  chs.filter(c => c.ch <= d).forEach(c => { h += '<div class="row"><div class="meta"><b>✓ 第 ' + c.ch + ' 章：' + esc(c.title) + '</b><small>' + esc(c.intro) + '</small></div></div>'; });
  if (!cur) return h + '<p class="empty">目前的故事都完成了，之後還會有新章節！</p>';
  const nq = NPCS.find(q => q.k === cur.npc), lock = plv() < cur.pl;
  h += '<div class="row"><div class="meta"><b>第 ' + cur.ch + ' 章：' + esc(cur.title) + '</b><small>' + esc(cur.intro) + '</small><small>' +
    (lock ? '玩家 Lv.' + cur.pl + ' 才會開始' : '去找' + esc(cur.npc_name) + (nq ? '（在' + nq.where + '）' : '')) + '</small></div></div>';
  return h;
}
bdCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  if (b.dataset.a === 'close') { closeBoard(); return; }
  if (b.dataset.a === 'tab') {
    bdTab = b.dataset.c; renderBoard();
    if (bdTab === 'story') { try { stData = await rpc('story_get'); } catch (err) { toast(errText(err)); } if (bdOpen) renderBoard(); }
    return;
  }
  if (b.dataset.a === 'story') {
    stBusy = true; renderBoard();
    try {
      const r = await enqueue(() => rpc('story_submit'));
      if (r.inv) Object.assign(inv, r.inv);
      if (typeof r.coins === 'number') me.coins = r.coins;
      storyDone = r.done | 0;
      toast('故事過關！+' + r.earned + ' G' + Object.keys(r.items || {}).map(k => '、' + itemName(k) + ' ×' + r.items[k]).join(''));
      stData = await rpc('story_get');
    } catch (err) { toast(errText(err)); await resync(); try { stData = await rpc('story_get'); } catch (e2) {} }
    stBusy = false; if (bdOpen) renderBoard(); refreshHud(); return;
  }
  bdBusy = true; renderBoard();
  try {
    const r = await enqueue(() => rpc('order_fill', { p_i: +b.dataset.c }));
    if (r.inv) Object.assign(inv, r.inv);
    if (typeof r.coins === 'number') me.coins = r.coins;
    toast('完成委託！+' + r.earned + ' G、+' + r.xp + ' 玩家經驗' + (r.bonus ? '（三張都完成，含加碼 ' + r.bonus + ' G）' : '')); loadLevelSoon();
    bdData = await rpc('order_get');
  } catch (err) { toast(errText(err)); await resync(); try { bdData = await rpc('order_get'); } catch (e2) {} }
  bdBusy = false;
  if (bdOpen) renderBoard();
  refreshHud();
});
bdEl.addEventListener('click', e => { if (e.target === bdEl) closeBoard(); });
