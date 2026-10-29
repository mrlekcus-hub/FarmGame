'use strict';
/* 圖鑑 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 圖鑑（魚類收集，隨時可開） ---------- */
const dexEl = $('dexm'), dexCard = $('dexcard');
let dexTab = 'fish', dexBusy = false;
function renderDex() {
  const isBug = dexTab === 'bug', isSea = dexTab === 'sea';
  const cat = isBug ? bugCat : fishCat.filter(f => (habitatOf(f) !== 'fresh') === isSea), log = isBug ? bugLog : fishLog;   // 淡水／海釣兩個分頁（海釣 = 出海團的魚）
  const found = cat.filter(f => (log[f.key] | 0) > 0).length;
  const order = { legend: 0, rare: 1, uncommon: 2, common: 3, junk: 4 };
  const list = cat.slice().sort((a, b) => (order[a.rarity] - order[b.rarity]) || (b.price - a.price));
  const dat = isBug ? 'data-bug' : 'data-fish';
  const cells = list.map(f => {
    const n = log[f.key] | 0, rc = RARITY[f.rarity] || ['', '#a8a0a0'];
    const hint = !n ? '還沒抓到' : '';
    const sn = f.seasons && f.seasons !== 'any' ? ' ' + f.seasons.split(',').map(x => SEA_SHORT[x]).join('') + '季' : '';
    const when = !n && (isBug || sn) ? '<small style="color:#bdada5">' + (isBug ? ({ any: '', dawn: '清晨', day: '白天', dusk: '黃昏', night: '夜晚' }[f.phase] || '') + ({ any: '', rain: ' 雨天', clear: ' 晴天' }[f.weather] || '') : '') + sn + '</small>' : '';
    return '<div class="dexc' + (n ? '' : ' no') + '" style="' + (n ? 'border-color:' + rc[1] : '') + '"><canvas width="16" height="16" ' + dat + '="' + esc(f.key) + '"' + (n ? '' : ' data-dim="1"') + '></canvas>' +
      '<small><b>' + (n ? esc(f.name) : '？？？') + '</b></small><small style="color:' + (n ? rc[1] : '#bdada5') + '">' + (n ? rc[0] + ' · ' + f.price + 'G' : (isBug ? '還沒抓到' : habitatOf(f) === 'mystery' ? '神秘路線限定' : '還沒釣到')) + '</small>' +
      (n ? '<small>' + (isBug ? '抓到' : '釣到') + ' ×' + n + (!isBug && fishRec[f.key] ? ' · 最大 ' + fishRec[f.key].best + ' cm' : '') + '</small>' : when) + '</div>';
  }).join('');
  const tabs = '<div class="v-quick" style="margin:6px 0">' + [['fish', '淡水'], ['sea', '海釣'], ['bug', '蟲與蝴蝶']].map(([k, n]) =>
    '<button type="button" class="chipbtn" data-a="tab" data-c="' + k + '" aria-pressed="' + (dexTab === k ? 'true' : 'false') + '">' + n + '</button>').join('') + '</div>';
  /* 收集獎勵：集滿 30% / 60% / 100% 各領一次（要和 SQL 的 dex_claim 一致） */
  const tot = cat.length, thr = [Math.ceil(tot * 0.3), Math.ceil(tot * 0.6), tot], REW = [150, 400, 1500];
  const claimed = dexClaims[dexTab] | 0;
  let reached = 0; thr.forEach((t, i) => { if (tot > 0 && found >= t) reached = i + 1; });
  let pend = 0; for (let t = claimed; t < reached; t++) pend += REW[t];
  const miles = isSea ? '<div class="row"><div class="meta" style="min-width:0"><b>海釣圖鑑</b><small>全部集滿可得成就「海釣圖鑑全收集」（神秘路線的魚只在神秘路線出現）</small></div></div>' : '<div class="row" style="flex-wrap:wrap;gap:6px"><div class="meta" style="min-width:0"><b>收集獎勵</b><small>' + thr.map((t, i) =>
    (i < claimed ? '✓ ' : '') + t + ' 種 ' + REW[i] + ' G').join(' ／ ') + '</small></div>' +
    (pend && !isSea ? '<button type="button" class="btn" data-a="claim" data-c="' + dexTab + '"' + (dexBusy ? ' disabled' : '') + '>領取 ' + pend + ' G</button>' : '') + '</div>';
  let recRow = '';
  if (!isBug) {
    const total = cat.reduce((t, f) => t + (fishLog[f.key] | 0), 0);
    let bk = null; Object.keys(fishRec).forEach(k => { if (cat.some(f => f.key === k) && (!bk || fishRec[k].best > fishRec[bk].best)) bk = k; });
    const bf = bk && cat.find(f => f.key === bk);
    recRow = '<div class="row"><div class="meta" style="min-width:0"><b>我的釣魚紀錄</b><small>累計釣到 ' + total + ' 條' + (bf ? ' · 最大紀錄：' + esc(bf.name) + ' ' + fishRec[bk].best + ' cm' : '') + '</small></div></div>';
  }
  dexCard.innerHTML = '<div class="shop-h"><h2>' + (isBug ? '蟲蝶圖鑑' : isSea ? '海釣圖鑑' : '魚類圖鑑') + '</h2><span class="chip">' + found + '/' + cat.length + '</span></div>' + tabs + miles + recRow +
    (cat.length ? '<div class="dex" style="grid-template-columns:repeat(auto-fill,minmax(92px,1fr))">' + cells + '</div>' : '<p class="empty">還沒有資料。</p>') +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  dexCard.querySelectorAll('canvas[data-fish]').forEach(cv => drawFish(cv.getContext('2d'), cv.dataset.fish, !!cv.dataset.dim));
  dexCard.querySelectorAll('canvas[data-bug]').forEach(cv => drawBug(cv.getContext('2d'), cv.dataset.bug, !!cv.dataset.dim));
}
function openDex() { if (!ready || !me || authOpen || paused()) return; dexOpen = true; pressed.length = 0; renderDex(); dexEl.hidden = false; dexCard.focus(); }
function closeDex() { dexOpen = false; dexEl.hidden = true; }
dexCard.addEventListener('click', e => {
  const t = e.target.closest('button[data-a=tab]');
  if (t) { dexTab = t.dataset.c; renderDex(); return; }
  const cl = e.target.closest('button[data-a=claim]');
  if (cl && !dexBusy) {
    dexBusy = true; renderDex();
    enqueue(() => rpc('dex_claim', { p_kind: cl.dataset.c })).then(r => {
      if (typeof r.coins === 'number') me.coins = r.coins;
      Object.assign(dexClaims, r.claims || {});
      toast('收集獎勵 +' + r.earned + ' G！'); refreshHud();
    }).catch(err => { toast(errText(err)); resync(); }).finally(() => { dexBusy = false; if (dexOpen) renderDex(); });
    return;
  }
  if (e.target.closest('button[data-a=close]')) closeDex();
});
dexEl.addEventListener('click', e => { if (e.target === dexEl) closeDex(); });
