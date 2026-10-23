'use strict';
/* 旅行商人 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 旅行商人（週五、六、日） ---------- */
const mcEl = $('mcm'), mcCard = $('mccard');
let mcData = null, mcBusy = false;
async function openMerchant() {
  if (!ready || !me || authOpen || paused() || mcOpen) return;
  mcOpen = true; pressed.length = 0; mcData = null; renderMerchant(); mcEl.hidden = false; mcCard.focus();
  try { mcData = await rpc('merchant_get'); } catch (e) { toast(errText(e)); closeMerchant(); return; }
  if (mcOpen) renderMerchant();
}
function closeMerchant() { mcOpen = false; mcEl.hidden = true; }
function renderMerchant() {
  if (!mcData) { mcCard.innerHTML = '<div class="shop-h"><h2>旅行商人 米羅</h2></div><p class="empty">讀取中…</p>'; return; }
  const d = mcData, coins = me ? me.coins : 0;
  if (!d.here) { mcCard.innerHTML = '<div class="shop-h"><h2>旅行商人 米羅</h2></div><p class="empty">商人還沒到。他每週五、六、日會來，約 ' + d.next + ' 天後。</p><button type="button" class="btn ghost wide" data-a="close">離開</button>'; return; }
  const dis = mcBusy ? ' disabled' : '';
  const offers = d.offers.map(o => {
    const got = (d.bought || []).includes(o.k);
    return '<div class="row"><canvas class="fico" width="16" height="16" data-mi="' + esc(o.item) + '"></canvas><div class="meta"><b>' + esc(itemName(o.item)) + (o.qty > 1 ? ' ×' + o.qty : '') + '</b><small>' + (/^f:/.test(o.item) ? '商人專屬家具，家具店買不到' : /^s:/.test(o.item) ? '雜交種子，雜貨攤買不到' : '每天限買一份') + '</small></div>' +
      '<button type="button" class="btn small" data-a="buy" data-i="' + o.i + '"' + (mcBusy || got || coins < o.price ? ' disabled' : '') + '>' + (got ? '已買' : o.price + ' G') + '</button></div>';
  }).join('');
  const w = d.want, mx = Math.min(w.left, have(w.item));
  const want = '<div class="row"><canvas class="fico" width="16" height="16" data-mi="' + esc(w.item) + '"></canvas><div class="meta"><b>今天高價收：' + esc(itemName(w.item)) + '</b><small>每個 ' + w.price + ' G（原價 1.6 倍）· 今天還能賣 ' + w.left + ' 個 · 持有 ' + have(w.item) + '</small></div>' +
    '<button type="button" class="btn small" data-a="sell" data-n="1"' + (mcBusy || mx < 1 ? ' disabled' : '') + '>賣 1 個</button>' +
    '<button type="button" class="btn small" data-a="sell" data-n="' + mx + '"' + (mcBusy || mx < 2 ? ' disabled' : '') + '>全賣 ' + mx + ' 個</button></div>';
  mcCard.innerHTML = '<div class="shop-h"><canvas class="fico" width="16" height="16" data-milo="1"></canvas><h2>旅行商人 米羅</h2><span class="chip gold">' + coins + ' G</span></div><p class="empty">米羅：「走過路過別錯過，都是遠方帶來的好東西！」</p><h3>今天的商品</h3>' + offers + '<h3>高價收購</h3>' + want +
    '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
  mcCard.querySelectorAll('canvas[data-milo]').forEach(cv => npcIcon(cv.getContext('2d'), 'milo'));
  mcCard.querySelectorAll('canvas[data-mi]').forEach(cv => {
    const k = cv.dataset.mi, c2d = cv.getContext('2d');
    if (/^s:/.test(k)) drawIcon(c2d, TOOLS.findIndex(x => x.crop === k.slice(2)));
    else if (/^c:/.test(k)) cropIcon(c2d, k.slice(2));
    else if (/^fish:/.test(k)) drawFish(c2d, k.slice(5), false);
    else if (/^bug:/.test(k)) drawBug(c2d, k.slice(4), false);
    else if (/^f:/.test(k)) { c2d.clearRect(0, 0, 16, 16); g = c2d; if (FURN[k.slice(2)]) FURN[k.slice(2)](0, 0, 0); g = ctx; }
    else miscIcon(c2d, k);
  });
}
mcCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'close') { closeMerchant(); return; }
  mcBusy = true; renderMerchant();
  try {
    const r = await enqueue(() => a === 'buy' ? rpc('merchant_buy', { p_i: +b.dataset.i }) : rpc('merchant_sell', { p_qty: +b.dataset.n }));
    if (r.inv) Object.assign(inv, r.inv);
    if (typeof r.coins === 'number') me.coins = r.coins;
    if (r.earned) toast('賣出得到 ' + r.earned + ' G');
    if (a === 'buy') toast('買到了！');
    mcData = await rpc('merchant_get');
    if (a === 'buy' && house) { try { await loadHouse(); } catch (_) {} }
  } catch (err) { toast(errText(err)); try { mcData = await rpc('merchant_get'); } catch (_) {} }
  mcBusy = false; if (mcOpen) renderMerchant(); refreshHud();
});
mcEl.addEventListener('click', e => { if (e.target === mcEl) closeMerchant(); });
