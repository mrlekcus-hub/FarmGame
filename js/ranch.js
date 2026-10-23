'use strict';
/* 動物牧場 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 動物牧場（穀倉）：買動物、看狀態的視窗，從告示牌開啟 ---------- */
const rcEl = $('rcm'), rcCard = $('rccard');
let rcData = null, rcBusy = false;
async function openRanch() {
  if (!ready || !me || authOpen || paused() || rcOpen) return;
  if (featLocked('ranch')) return;
  rcOpen = true; pressed.length = 0; rcData = null; renderRanch(); rcEl.hidden = false; rcCard.focus();
  try { rcData = await rpc('ranch_get'); } catch (e) { toast(errText(e)); closeRanch(); return; }
  if (rcOpen) { renderRanch(); barnSync(); }
}
function closeRanch() { rcOpen = false; rcEl.hidden = true; }
function renderRanch() {
  if (!rcData) { rcCard.innerHTML = '<div class="shop-h"><h2>牧場小屋 小茉</h2></div><p class="empty">讀取中…</p>'; return; }
  const d = rcData, now = srvNow(), dis = rcBusy ? ' disabled' : '', coins = me ? me.coins : 0, hayP = (itemMeta['a:hay'] || {}).buy || 6;
  const pk = k => itemMeta['a:' + k] ? 'a:' + k : k;
  const nm = k => ((d.species || []).find(s => s.key === k) || { name: k }).name;
  const buy = (d.species || []).map(s => {
    const lock = plv() < s.need, full = d.animals.length >= d.cap;
    return '<div class="row"><div class="meta"><b>' + esc(s.name) + '</b><small>每餵一次乾草，約 ' + (+s.hours) + ' 小時後產 ' + esc(itemName(pk(s.product))) + '（' + miscPrice(pk(s.product)) + ' G）</small></div>' +
      '<button type="button" class="btn small" data-a="buy" data-c="' + esc(s.key) + '"' + (rcBusy || lock || full || coins < s.buy ? ' disabled' : '') + '>' + (lock ? '玩家 Lv.' + s.need + ' 解鎖' : s.buy + ' G') + '</button></div>';
  }).join('');
  rcCard.innerHTML = '<div class="shop-h"><h2>牧場小屋 小茉</h2><span class="chip gold">' + coins + ' G</span></div>' +
    '<h3>買乾草</h3><div class="row"><div class="meta"><b>乾草</b><small>每把 ' + hayP + ' G，拿去穀倉餵動物 · 持有 ' + have('a:hay') + ' 把</small></div><button type="button" class="btn small" data-a="hay" data-n="1"' + (rcBusy || coins < hayP ? ' disabled' : '') + '>買 1 把</button><button type="button" class="btn small" data-a="hay" data-n="5"' + (rcBusy || coins < hayP * 5 ? ' disabled' : '') + '>買 5 把</button></div>' +
    '<h3>買動物（' + d.animals.length + '/' + d.cap + '，玩家升級會變大）</h3>' + buy + '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
}
rcCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'close') { closeRanch(); return; }
  rcBusy = true; renderRanch();
  try {
    let r = await enqueue(() => a === 'hay' ? rpc('buy_misc', { p_item: 'a:hay', p_qty: +b.dataset.n || 1 }) : a === 'feed' ? rpc('ranch_feed') : a === 'collect' ? rpc('ranch_collect') : rpc('ranch_buy', { p_species: b.dataset.c }));
    if (r.inv) Object.assign(inv, r.inv);
    if (typeof r.coins === 'number') me.coins = r.coins;
    if (a === 'hay') { toast('買了乾草 ×' + (+b.dataset.n || 1)); rcData = await rpc('ranch_get'); }
    else { rcData = r; barnSync(); }
    if (a === 'feed') toast('餵了 ' + r.fed + ' 隻');
    if (a === 'collect') toast('收成：' + Object.keys(r.got).map(k => itemName(k) + ' ×' + r.got[k]).join('、'));
    if (a === 'buy') toast('買了一隻' + (((r.species || []).find(s => s.key === b.dataset.c) || {}).name || '動物'));
  } catch (err) { toast(errText(err)); try { rcData = await rpc('ranch_get'); } catch (_) {} }
  rcBusy = false; if (rcOpen) renderRanch(); refreshHud();
});
rcEl.addEventListener('click', e => { if (e.target === rcEl) closeRanch(); });
