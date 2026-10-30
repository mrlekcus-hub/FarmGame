'use strict';
/* 圖鑑 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 圖鑑（魚類收集，隨時可開） ---------- */
const dexEl = $('dexm'), dexCard = $('dexcard');
let dexTab = 'fish', dexBusy = false;
let dexSel = null;   // 目前點開詳情的 { bug: bool, key }
/* 淡水魚出沒條件（和 SQL fish 表一致：時段、天氣、季節、地點、等級）；伺服器有回傳同名欄位時以伺服器為準 */
const FISH_COND = {
  amberfish: ['any', 'any', 'autumn,winter', 'forest', 5], bass: ['dusk', 'any', 'autumn,winter', 'any', 1], boot: ['any', 'any', 'any', 'any', 1],
  carp: ['day', 'any', 'any', 'any', 1], catfish: ['night', 'any', 'summer,autumn', 'any', 1], crucian: ['any', 'any', 'any', 'any', 1],
  eel: ['any', 'rain', 'summer,autumn', 'any', 1], koi: ['day', 'clear', 'spring,summer', 'any', 1], maplefish: ['any', 'any', 'autumn', 'forest', 5],
  minnow: ['any', 'any', 'any', 'any', 1], moonfish: ['night', 'clear', 'autumn,winter', 'any', 1], mosstrout: ['any', 'any', 'spring,summer', 'forest', 5],
  rainbow: ['any', 'rain', 'spring,autumn', 'any', 1], sunfish: ['day', 'clear', 'summer', 'any', 1], tilapia: ['dawn', 'any', 'spring,summer', 'any', 1]
};
const FISH_SZ = { amberfish: '15～35 cm', bass: '25～60 cm', boot: '20～35 cm', carp: '30～80 cm', catfish: '30～110 cm', crucian: '10～30 cm', eel: '40～100 cm', koi: '40～90 cm', maplefish: '12～30 cm', minnow: '4～10 cm', moonfish: '50～120 cm', mosstrout: '18～40 cm', rainbow: '20～60 cm', sunfish: '10～25 cm', tilapia: '15～40 cm' };
const DEX_PH = { dawn: ['清晨', '🌅', '05～08 點', [[5, 8]]], day: ['白天', '☀️', '08～17 點', [[8, 17]]], dusk: ['黃昏', '🌇', '17～20 點', [[17, 20]]], night: ['夜晚', '🌙', '20～05 點', [[20, 24], [0, 5]]] };
const DEX_SEA4 = ['spring', 'summer', 'autumn', 'winter'];
function dexCond(f, isBug) {
  const d = isBug ? [] : (FISH_COND[f.key] || []);
  return { phase: f.phase || d[0] || 'any', weather: f.weather || d[1] || 'any', seasons: f.seasons || d[2] || 'any', zone: f.zone || d[3] || 'any', lv: +(f.min_lv || d[4] || 1) };
}
/* 圖鑑格子上的小標示：四個小方塊 = 春夏秋冬（亮的是會出現的季節）＋時段／天氣小圖示 */
function dexMini(f, isBug) {
  if (!isBug && habitatOf(f) !== 'fresh') return '';
  const c = dexCond(f, isBug), on = c.seasons === 'any' ? DEX_SEA4 : c.seasons.split(',');
  const sq = c.seasons === 'any' ? '' : DEX_SEA4.map(x => '<b class="' + (on.includes(x) ? 'on' : '') + '"></b>').join('');
  const ic = (DEX_PH[c.phase] ? DEX_PH[c.phase][1] : '') + (c.weather === 'rain' ? '🌧' : c.weather === 'clear' ? '☀' : '');
  return sq || ic ? '<span class="dxmini">' + sq + (ic ? '<i>' + ic + '</i>' : '') + '</span>' : '';
}
const dexdEl = document.createElement('div');
dexdEl.className = 'maker dexd'; dexdEl.hidden = true; dexdEl.innerHTML = '<div class="card maker-card dexdc" tabindex="-1"></div>';
dexEl.after(dexdEl);
const dexdCard = dexdEl.firstChild;
function closeDexDetail() { dexSel = null; dexdEl.hidden = true; }
/* 點開某一格：只有解鎖過（釣到／抓到過）的才看得到所有資料 */
function openDexDetail(key, isBug) {
  const cat = isBug ? bugCat : fishCat, log = isBug ? bugLog : fishLog, f = cat.find(x => x.key === key);
  if (!f || !((log[key] | 0) > 0)) return;
  dexSel = { bug: isBug, key };
  const rc = RARITY[f.rarity] || ['', '#a8a0a0'], n = log[key] | 0, sea = !isBug && habitatOf(f) !== 'fresh';
  const c = dexCond(f, isBug), rec = !isBug && fishRec[key] ? fishRec[key].best : 0;
  const cm = !isBug && f.min_cm !== undefined ? f.min_cm + '～' + f.max_cm + ' cm' : (!isBug && FISH_SZ[key] ? FISH_SZ[key] : '');
  const head = '<div class="dxh"><canvas width="16" height="16" ' + (isBug ? 'data-bug' : 'data-fish') + '="' + esc(key) + '"></canvas><div><div class="dxn">' + esc(f.name) +
    '<span class="dxt" style="color:' + rc[1] + ';border-color:' + rc[1] + '">' + rc[0] + '</span></div><small>' + f.price + ' G' + (cm ? ' · ' + cm : '') + ' · ' + (isBug ? '抓到' : '釣到') + ' ×' + n + (rec ? ' · 最大 ' + rec + ' cm' : '') + '</small></div></div>';
  let rows = '';
  if (sea) {
    rows = '<div class="dxr"><span>地點</span><span class="dxch">' + (habitatOf(f) === 'mystery' ? '神秘路線限定' : '出海團的海釣') + '</span></div>';
  } else {
    const on = c.seasons === 'any' ? DEX_SEA4 : c.seasons.split(','), p = DEX_PH[c.phase];
    const seg = p ? p[3].map(a => '<div style="left:' + (a[0] / 24 * 100) + '%;width:' + ((a[1] - a[0]) / 24 * 100) + '%"></div>').join('') : '<div style="left:0;width:100%"></div>';
    const zone = isBug ? (c.zone === 'forest' ? '只在森林' : '農場、森林') : (c.zone === 'forest' ? '森林池塘、廣場魚池' : '農場池塘、森林池塘、廣場魚池');
    rows = '<div class="dxr"><span>季節</span><div class="dxsq">' + DEX_SEA4.map(x => '<div class="' + (on.includes(x) ? 'on' : '') + '">' + SEA_SHORT[x] + '</div>').join('') + '</div></div>' +
      '<div class="dxr"><span>時間</span><div style="flex:1"><div class="dxbar">' + seg + '</div><div class="dxtk"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div><small>' + (p ? p[0] + ' ' + p[2] : '全天都可以') + '</small></div></div>' +
      '<div class="dxr"><span>天氣</span><span class="dxch">' + ({ rain: '雨天才有', clear: '晴天才有' }[c.weather] || '晴雨都可以') + '</span></div>' +
      '<div class="dxr"><span>地點</span><span class="dxch">' + zone + '</span></div>' +
      (c.lv > 1 ? '<div class="dxr"><span>等級</span><span class="dxch">Lv.' + c.lv + ' 以上</span></div>' : '');
  }
  dexdCard.innerHTML = head + rows + '<button type="button" class="btn ghost wide" data-a="dclose">關閉</button>';
  dexdEl.hidden = false; dexdCard.focus();
  dexdCard.querySelectorAll('canvas[data-fish]').forEach(cv => drawFish(cv.getContext('2d'), cv.dataset.fish, false));
  dexdCard.querySelectorAll('canvas[data-bug]').forEach(cv => drawBug(cv.getContext('2d'), cv.dataset.bug, false));
}
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
    return '<div class="dexc' + (n ? ' yes' : ' no') + '"' + (n ? ' role="button" tabindex="0" data-d="' + esc(f.key) + '" data-b="' + (isBug ? 1 : 0) + '"' : '') + ' style="' + (n ? 'border-color:' + rc[1] : '') + '"><canvas width="16" height="16" ' + dat + '="' + esc(f.key) + '"' + (n ? '' : ' data-dim="1"') + '></canvas>' +
      '<small><b>' + (n ? esc(f.name) : '？？？') + '</b></small><small style="color:' + (n ? rc[1] : '#bdada5') + '">' + (n ? rc[0] + ' · ' + f.price + 'G' : (isBug ? '還沒抓到' : habitatOf(f) === 'mystery' ? '神秘路線限定' : '還沒釣到')) + '</small>' +
      (n ? '<small>' + (isBug ? '抓到' : '釣到') + ' ×' + n + (!isBug && fishRec[f.key] ? ' · 最大 ' + fishRec[f.key].best + ' cm' : '') + '</small>' + dexMini(f, isBug) : when) + '</div>';
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
function closeDex() { dexOpen = false; dexEl.hidden = true; closeDexDetail(); }
function dexOpenFrom(el) { if (el) openDexDetail(el.dataset.d, el.dataset.b === '1'); }
dexCard.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const el = e.target.closest('.dexc[data-d]'); if (el) { e.preventDefault(); dexOpenFrom(el); } } });
dexdEl.addEventListener('click', e => { if (e.target === dexdEl || e.target.closest('button[data-a=dclose]')) closeDexDetail(); });
dexCard.addEventListener('click', e => {
  const cell = e.target.closest('.dexc[data-d]');
  if (cell) { dexOpenFrom(cell); return; }
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
