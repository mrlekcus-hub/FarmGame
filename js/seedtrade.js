'use strict';
/* NPC 換種子 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- NPC 用採集物換特別種子 ----------
   版型：A（上方季節標籤＋一行一筆的兌換清單）加 B（點一筆展開細節：需要、可換得、長成什麼、能煮什麼、次數）。
   資料全部來自 Supabase：seedtrade_get（兌換表＋今天剩幾次）、seedtrade_do（兌換）。
   兌換表（seed_trades）每列有季節：只有「現在這個季節」的才能換，其他季節灰掉；但換到的種子不分季節都能種。
   換到的種子是 s:<作物>，種出來的是 c:<作物>；「能煮什麼」直接從 recipes 裡找用到這個作物的食譜，不用另外維護。 */
const SEED_NPC = {
  gui: { n: '桂花婆婆', say: '「這些花讓我想起年輕的時候。拿來換點種子吧，種出來的東西，廚房裡用得上。」' },
  mo: { n: '小茉', say: '「野莓和蒲公英我最喜歡了！給你特別的種子，種好了記得分我一點～」' },
  li: { n: '老鯉叔', say: '「……冬天的冰花和果子，換你一把種子。別吵到魚。」' }
};
const seEl = $('sem'), seCard = $('secard');
let seData = null, seBusy = false, seNpc = '', seTab = '', seSel = -1, seN = 1;
async function openSeedTrade(npc) {
  if (!ready || !me || authOpen || paused() || seOpen || !SEED_NPC[npc]) return;
  seOpen = true; pressed.length = 0; seNpc = npc; seData = null; seTab = seasonAt(srvNow()); seSel = -1; seN = 1;
  seRender(); seEl.hidden = false; seCard.focus();
  try { seData = await rpc('seedtrade_get', { p_npc: npc }); } catch (e) { toast(errText(e)); closeSeedTrade(); return; }
  if (!seOpen) return;
  const cur = seasonAt(srvNow()), first = (seData.offers || []).find(o => o.season === cur);
  seSel = first ? first.i : -1;
  seRender();
}
function closeSeedTrade() { seOpen = false; seEl.hidden = true; }
const seMax = o => {   // 這一筆現在最多能換幾次（材料夠、今天還有次數）
  let m = seData.left | 0;
  for (const k in o.need) m = Math.min(m, Math.floor(have(k) / o.need[k]));
  return Math.max(0, m);
};
const seDishes = crop => recipes.filter(rc => rc.ing && rc.ing['c:' + crop] && !/^hw_/.test(rc.key)).map(rc => rc.name);
function seNeedHtml(o, times) {
  return Object.keys(o.need).map(k => esc(itemName(k)) + ' ' + have(k) + '/' + o.need[k] * (times || 1)).join('、');
}
function seRender() {
  const npc = SEED_NPC[seNpc];
  if (!seData) { seCard.innerHTML = '<div class="shop-h"><h2>' + esc(npc.n) + '</h2></div><p class="empty">讀取中…</p>'; return; }
  const d = seData, cur = seasonAt(srvNow()), dis = seBusy ? ' disabled' : '', offers = d.offers || [];
  const tabs = SEASONS.map(s => '<button type="button" class="chipbtn" data-a="tab" data-s="' + s + '" aria-pressed="' + (seTab === s) + '">' + SEA_SHORT[s] + (s === cur ? '（現在）' : '') + '</button>').join('');
  const list = offers.filter(o => o.season === seTab);
  const rows = list.map(o => {
    const here = o.season === cur, mx = seMax(o), on = o.i === seSel, c = CROPS[o.seed];
    const state = !here ? '<span class="chip">' + SEA_SHORT[o.season] + '季</span>' : mx > 0 ? '<span class="chip gold">可換</span>' : '<span class="chip">不夠</span>';
    return '<button type="button" class="row se-row" data-a="pick" data-i="' + o.i + '" aria-pressed="' + on + '" style="width:100%;text-align:left;background:' + (on ? '#fff' : 'transparent') + ';border:0;border-bottom:2px dotted var(--edge);cursor:pointer;color:var(--ink);font:inherit;' + (here ? '' : 'opacity:.65;') + (on ? 'outline:3px solid var(--pink-deep);outline-offset:-3px;border-radius:12px;' : '') + '">' +
      '<canvas class="fico" width="16" height="16" data-sd="' + esc(o.seed) + '"></canvas>' +
      '<span class="meta"><b>' + esc(c ? c.n : o.seed) + '種子 ×' + o.qty + '</b><small>' + seNeedHtml(o, 1) + '</small></span>' + state + '</button>';
  }).join('');
  const o = offers.find(x => x.i === seSel && x.season === seTab);
  let detail = '';
  if (o) {
    const here = o.season === cur, mx = seMax(o), n = Math.max(1, Math.min(seN, mx || 1)), c = CROPS[o.seed], dishes = seDishes(o.seed);
    detail = '<h3>' + esc(c ? c.n : o.seed) + '種子</h3><div class="se-detail" style="background:#fff;border:2px dotted var(--edge);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px;font-size:14px">' +
      '<div>需要：' + seNeedHtml(o, n) + '</div><div>可換得：<b>' + esc(c ? c.n : o.seed) + '種子 ×' + (o.qty * n) + '</b></div>' +
      '<small class="empty" style="margin:0">' + (c ? fmtDur(growSec(o.seed)) + '成熟，每個賣 ' + cropPrice(o.seed) + ' G' + seasonTag(o.seed) + '　不分季節都能種' : '') + '</small>' +
      '<small class="empty" style="margin:0">' + (dishes.length ? '可以煮：' + dishes.map(esc).join('、') : '料理：之後會有') + '</small></div>' +
      (here ? '<div class="qty" style="justify-content:space-between;margin-top:6px"><span style="display:flex;align-items:center;gap:4px"><button type="button" data-a="minus"' + (n <= 1 || seBusy ? ' disabled' : '') + ' aria-label="少換一次">−</button><output>' + n + ' 次</output><button type="button" data-a="plus"' + (n >= mx || seBusy ? ' disabled' : '') + ' aria-label="多換一次">＋</button></span><small class="empty" style="margin:0">今天還能換 ' + (d.left | 0) + ' 次</small></div>' +
        '<button type="button" class="btn wide" data-a="do"' + (seBusy || mx < 1 ? ' disabled' : '') + '>' + (mx < 1 ? ((d.left | 0) < 1 ? '今天換完了' : '材料還不夠') : '換 ' + (o.qty * n) + ' 顆種子') + '</button>'
        : '<p class="empty">' + SEA_SHORT[o.season] + '季才換得到。換到的種子隨時都能種。</p>');
  }
  seCard.innerHTML = '<div class="shop-h"><h2>' + esc(npc.n) + '</h2><span class="chip gold">今天 ' + (d.left | 0) + ' / ' + (d.max | 0) + '</span></div>' +
    '<p class="empty">' + esc(npc.say) + '</p><div class="chips" role="group" aria-label="季節">' + tabs + '</div>' +
    (rows || '<p class="empty">這個季節沒有可換的。</p>') + detail + '<button type="button" class="btn ghost wide" data-a="close"' + (seBusy ? ' disabled' : '') + '>離開</button>';
  seCard.querySelectorAll('canvas[data-sd]').forEach(cv => { const i = TOOLS.findIndex(x => x.crop === cv.dataset.sd); if (i >= 0) drawIcon(cv.getContext('2d'), i); });
}
seCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'close') { closeSeedTrade(); return; }
  if (a === 'tab') { seTab = b.dataset.s; const f = (seData.offers || []).find(o => o.season === seTab); seSel = f ? f.i : -1; seN = 1; seRender(); return; }
  if (a === 'pick') { seSel = +b.dataset.i; seN = 1; seRender(); return; }
  if (a === 'minus') { seN = Math.max(1, seN - 1); seRender(); return; }
  if (a === 'plus') { seN++; seRender(); return; }
  if (a !== 'do') return;
  const o = (seData.offers || []).find(x => x.i === seSel); if (!o) return;
  const n = Math.max(1, Math.min(seN, seMax(o)));
  seBusy = true; seRender();
  try {
    const r = await enqueue(() => rpc('seedtrade_do', { p_npc: seNpc, p_i: o.i, p_n: n }));
    if (r.inv) Object.assign(inv, r.inv);
    toast('換到了 ' + (o.qty * n) + ' 顆' + (CROPS[o.seed] ? CROPS[o.seed].n : o.seed) + '種子！');
    seN = 1;
    seData = await rpc('seedtrade_get', { p_npc: seNpc });
  } catch (err) { toast(errText(err)); try { seData = await rpc('seedtrade_get', { p_npc: seNpc }); } catch (_) {} }
  seBusy = false; if (seOpen) seRender(); refreshHud();
});
seEl.addEventListener('click', e => { if (e.target === seEl && !seBusy) closeSeedTrade(); });
