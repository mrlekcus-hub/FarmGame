'use strict';
/* 每日任務與等級、升級儀式 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 每日任務：進度與獎勵都由伺服器記錄；凌晨 0 點重置（和雜貨攤同一條日界線） ---------- */
const QUESTS = [
  { id: 'plant', ic: '🌱', n: '種下作物', need: 6, reward: 60 },
  { id: 'water', ic: '💧', n: '澆水', need: 8, reward: 40 },
  { id: 'harvest', ic: '🌾', n: '收成作物', need: 6, reward: 80 },
  { id: 'fish', ic: '🎣', n: '釣到魚', need: 3, reward: 80 },
  { id: 'bug', ic: '🦋', n: '抓到蟲蝶', need: 3, reward: 80 },
];
const QBONUS = 150;
/* ---------- 等級：玩家等級只靠每日任務；農耕技能上限 = 玩家等級 + 2 ---------- */
const CROP_NEED = { radish: 1, tomato: 2, pumpkin: 3, beet: 2, corn: 3, melon: 4 };   // 蓮藕／藍莓／霜根是用採集物換來的種子，不看農耕等級，換到就能種
const ROD_NEED = { 1: 1, 2: 2, 3: 4, 4: 6 }, BUG_NEED = { common: 1, uncommon: 2, rare: 4, legend: 6 };
const rodLocked = l => !!lv && lv.fish < (ROD_NEED[l] || 1);
const bugNeed = b => (b && b.need) || BUG_NEED[b && b.rarity] || 1;   // 新蟲可以在目錄裡帶 need（例如森林稀有蟲 = 5），沒有就照稀有度
const bugLocked = b => !!lv && lv.bug < bugNeed(b);
let lv = null, lvTimer = 0;
const cropLocked = k => !!lv && lv.farm < (CROP_NEED[k] || 1);
async function loadLevel() {
  try {
    const old = lv; lv = await rpc('level_get');
    if (old) {
      if (lv.pl > old.pl) levelUp('玩家等級 Lv.' + lv.pl, plUnlocks(lv.pl).map(x => '解鎖：' + x));
      ['farm', 'fish', 'bug'].forEach(k => { if (lv[k] > old[k]) levelUp(SK[k].n + '等級 Lv.' + lv[k], [SK[k].un[lv[k]] ? '解鎖：' + SK[k].un[lv[k]] : '熟練度又提升了']); });
      if (old.cook != null && lv.cook > old.cook) {
        const names = recipes.filter(rc => !/^hw_/.test(rc.key) && ckTier(rc) === lv.cook).map(rc => rc.name);
        levelUp('烹飪等級 Lv.' + lv.cook, [names.length ? '解鎖：' + names.join('、') : '熟練度又提升了', '火候的綠區變寬了，更好停']);
      }
    }
    if (qOpen) renderQuests(); if (shopOpen) renderShop(); if (lvOpen) renderLevels();
  } catch (e) { /* 伺服器還沒裝等級功能就略過 */ }
}
/* ---------- 升級儀式：彈窗＋音效＋小動畫（一次一個，點一下或 5 秒後關掉） ---------- */
let chimeCtx = null;
function chime(notes, vol) {
  if (musicVol <= 0) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    chimeCtx = chimeCtx || new AC(); if (chimeCtx.state === 'suspended') chimeCtx.resume();
    const t0 = chimeCtx.currentTime + 0.02, v = (vol || 0.16) * Math.max(0.25, musicVol / 100);
    notes.forEach((m, i) => {
      const o = chimeCtx.createOscillator(), gn = chimeCtx.createGain(), t = t0 + i * 0.13;
      o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(v, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(gn); gn.connect(chimeCtx.destination); o.start(t); o.stop(t + 0.75);
    });
  } catch (e) { /* 沒有音效也沒關係 */ }
}
const lvupQ = []; let lvupOn = false, lvupT = 0;
function levelUp(title, lines) { lvupQ.push({ title, lines: lines || [] }); if (!lvupOn) lvupNext(); }
function lvupNext() {
  const el = $('lvup'), it = lvupQ.shift();
  if (!it) { lvupOn = false; el.hidden = true; return; }
  lvupOn = true; clearTimeout(lvupT);
  const sp = Array.from({ length: 14 }, (_, i) => '<i style="--a:' + (i * 360 / 14) + 'deg;--d:' + (60 + (i % 3) * 22) + 'px;animation-delay:' + (i % 4) * 40 + 'ms">' + ['✨', '⭐', '🌸'][i % 3] + '</i>').join('');
  el.innerHTML = '<div class="lvu-box"><div class="lvu-burst">' + sp + '</div><div class="lvu-star">⭐</div><h2>升級！</h2><p class="lvu-t">' + esc(it.title) + '</p>' +
    (it.lines.length ? '<ul>' + it.lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') + '<small>點一下繼續</small></div>';
  el.hidden = false; chime([72, 76, 79, 84], 0.18);
  lvupT = setTimeout(lvupNext, 5000);
}
$('lvup').addEventListener('click', () => { clearTimeout(lvupT); lvupNext(); });
function loadLevelSoon() { clearTimeout(lvTimer); lvTimer = setTimeout(loadLevel, 1200); }
function lvBar(lo, hi, xp, wait) {
  const pct = hi > lo ? Math.max(0, Math.min(100, (xp - lo) / (hi - lo) * 100)) : 100;
  return '<i class="qbar"><i style="width:' + pct + '%"></i></i>' + (wait ? '<small>' + wait + '</small>' : '');
}
function lvHtml(noSkills) {   // noSkills：每日任務視窗只顯示玩家等級，技能等級留在「等級與解鎖」
  if (!lv) return '';
  const row = (ic, name, sub, bar) => '<div class="row"><span style="font-size:24px;line-height:1">' + ic + '</span><div class="meta"><b>' + name + '</b><small>' + sub + '</small>' + bar + '</div></div>';
  const skill = (ic, n, k) => {
    const L = lv[k], mx = L >= lv.max_skill, cap = L >= lv.cap;
    return row(ic, n + ' Lv.' + L + ' / 上限 ' + lv.cap, mx ? '已滿級' : cap ? '需要玩家 Lv.' + (lv.pl + 1) + ' 才能繼續成長' : '經驗 ' + lv['xp_' + k] + ' / ' + lv[k + '_next'], lvBar(lv[k + '_cur'], lv[k + '_next'], lv['xp_' + k], ''));
  };
  const nxt = [[2, '牧場／採集／庭院'], [4, '山洞／採礦／高級家具']].find(a => a[0] > lv.pl);
  return row('⭐', '玩家等級 Lv.' + lv.pl, lv.pl >= lv.max_pl ? '已滿級' : '任務與委託經驗 ' + lv.xp_player + ' / ' + lv.pl_next + '（每日任務每天最多 70）' + (nxt ? ' · Lv.' + nxt[0] + '：' + nxt[1] : '') + ' · 田地 ' + plots.size + '/' + plotCap() + (nextCap() ? '（下一級 ' + nextCap() + '）' : ''), lvBar(lv.pl_cur, lv.pl_next, lv.xp_player, '')) +
    (noSkills ? '' : skill('🌱', '農耕', 'farm') + skill('🎣', '釣魚', 'fish') + skill('🦋', '捕蟲', 'bug') + ckSkillHtml());
}
const qEl = $('qm'), qCard = $('qcard');
let qs = { day: 0, c: {}, claimed: {} }, qBusy = false, qMsg = '', qErr = false;
const qFresh = () => qs.day === sellDayNow();
const qCount = id => qFresh() ? (qs.c[id] | 0) : 0;
const qClaimed = id => qFresh() && !!qs.claimed[id];
const qNeed = q => (q.id === 'plant' || q.id === 'water' || q.id === 'harvest') ? Math.min(q.need, plotCap()) : q.need;   // 要和 SQL 的 _quest_need 一致：目標不超過田地數
const qDone = q => qCount(q.id) >= qNeed(q);
const qAllClaimed = () => QUESTS.every(q => qClaimed(q.id));
const qReady = () => QUESTS.filter(q => qDone(q) && !qClaimed(q.id)).length + (qAllClaimed() && !qClaimed('bonus') ? 1 : 0);
function qBadge() { const n = ready && me ? qReady() : 0, b = $('questbadge'); b.hidden = !n; b.textContent = n; const b2 = $('immqb'); if (b2) { b2.hidden = !n; b2.textContent = n; } updateFoldBadge(); }
function qApply(d) {
  if (d) qs = { day: d.day | 0, c: d.c || {}, claimed: d.claimed || {} };
  qBadge(); if (qOpen) renderQuests();
}
async function loadQuests() { try { qApply(await rpc('quest_get')); } catch (e) { /* 伺服器還沒裝任務功能就略過 */ } }
function qAdd(id) {
  const q = QUESTS.find(x => x.id === id); if (!q) return;
  if (!qFresh()) qs = { day: sellDayNow(), c: {}, claimed: {} };
  const n = qs.c[id] | 0; if (n >= qNeed(q)) return;
  qs.c[id] = n + 1;
  if (n + 1 >= qNeed(q)) toast('每日任務完成：' + q.n + '！到「任務」領獎勵');
  qBadge(); if (qOpen) renderQuests();
  enqueue(() => rpc('quest_progress', { p_kind: id })).then(qApply).catch(() => {});
}
function renderQuests() {
  const row = (ic, name, sub, bar, btn) => '<div class="row"><span style="font-size:24px;line-height:1">' + ic + '</span><div class="meta"><b>' + name +
    '</b><small>' + sub + '</small>' + bar + '</div>' + btn + '</div>';
  const btn = (id, state) => '<button type="button" class="btn" data-a="qclaim" data-c="' + id + '"' + (state !== 'go' || qBusy ? ' disabled' : '') + '>' +
    (state === 'got' ? '已領取' : state === 'go' ? '領取' : '進行中') + '</button>';
  const rows = QUESTS.map(q => {
    const n = Math.min(qCount(q.id), qNeed(q));
    return row(q.ic, q.n + ' ' + n + '/' + qNeed(q), '獎勵 ' + q.reward + ' G', '<i class="qbar"><i style="width:' + (n / qNeed(q) * 100) + '%"></i></i>',
      btn(q.id, qClaimed(q.id) ? 'got' : qDone(q) ? 'go' : 'wait'));
  }).join('');
  const bonus = row('🎁', '全部完成加碼', '五項都領完，再得 ' + QBONUS + ' G', '', btn('bonus', qClaimed('bonus') ? 'got' : qAllClaimed() ? 'go' : 'wait'));
  qCard.innerHTML = '<div class="shop-h"><h2>每日任務</h2><span class="chip gold">' + (me ? me.coins : 0) + ' G</span></div>' + lvHtml(true) + rows + bonus +
    (qMsg ? '<p class="empty" role="alert" style="font-weight:700;word-break:break-all;color:' + (qErr ? 'var(--pink-deep)' : '#3a8a4a') + '">' + esc(qMsg) + '</p>' : '') +
    '<small class="empty">每天凌晨 0 點重置。</small><button type="button" class="btn ghost wide" data-a="close">關閉</button>';
}
function openQuests() { if (!ready || !me || authOpen || paused()) return; qOpen = true; qMsg = ''; pressed.length = 0; renderQuests(); qEl.hidden = false; qCard.focus(); loadQuests(); loadLevel(); }
function closeQuests() { qOpen = false; qEl.hidden = true; }
qCard.addEventListener('click', e => {
  if (e.target.closest('button[data-a=close]')) { closeQuests(); return; }
  const b = e.target.closest('button[data-a=qclaim]');
  if (!b || b.disabled || qBusy) return;
  qBusy = true; qMsg = '領取中…'; qErr = false; renderQuests();
  enqueue(() => rpc('quest_claim', { p_id: b.dataset.c })).then(r => {
    if (typeof r.coins === 'number') me.coins = r.coins;
    qMsg = '領到 ' + r.earned + ' G！'; qErr = false; qApply(r.state); refreshHud(); loadLevel();
  }).catch(err => { qMsg = errText(err) + '（' + String((err && (err.message || err.msg)) || err).slice(0, 160) + '）'; qErr = true; console.error('quest_claim', err); loadQuests(); }).finally(() => { qBusy = false; if (qOpen) renderQuests(); });
});
qEl.addEventListener('click', e => { if (e.target === qEl) closeQuests(); });

/* ---------- 等級頁面：每一級解鎖什麼 ---------- */
const lvEl = $('lvm'), lvCard = $('lvcard');
const PL_XP = [0, 70, 140, 280, 420, 630, 840, 1120, 1400, 1750];   // 要和 SQL 的 _lv_player 一致
const skillNeed = L => 40 * (L - 1) * (L - 1);                       // 要和 SQL 的 _lv_skill_need 一致
const SK = {
  farm: { ic: '🌱', n: '農耕', un: { 1: '蘿蔔種子', 2: '番茄種子', 3: '南瓜種子' } },
  fish: { ic: '🎣', n: '釣魚', un: { 1: '基本釣竿', 2: '竹釣竿', 4: '碳纖釣竿', 5: '森林稀有魚', 6: '黃金釣竿' } },
  bug: { ic: '🦋', n: '捕蟲', un: { 1: '普通蟲蝶', 2: '少見蟲蝶', 4: '稀有蟲蝶', 5: '森林稀有蟲', 6: '傳說蟲蝶' } }
};
function plUnlocks(L) {
  const a = ['田地上限 ' + PLOT_CAP[L - 1] + ' 塊', '技能等級上限 ' + Math.min(L + 2, 12)];
  if (L === 1) a.push('基本家具與 100 G 以下的家具', '故事第 1 章');
  if (L === 2) a.push('單價 100 G 以上的家具', '動物牧場（養雞）', '野外採集', '庭院佈置', '故事第 2、3 章');
  if (L === 3) a.push('西邊森林（抓蟲、釣魚）', '養牛', '故事第 4 章');
  if (L === 4) a.push('山洞', '採礦（鎬子）', '單價 200 G 以上的家具', '故事第 5 章');
  if (L === 5) a.push('養羊', '故事終章');
  return a;
}
function renderLevels() {
  const cur = lv ? lv.pl : 1;
  let h = '<div class="shop-h"><h2>等級與解鎖</h2></div>';
  if (!lv) h += '<p class="empty">讀取中…（如果一直沒出現，請確認伺服器已更新）</p>';
  else {
    h += lvHtml() + '<h3>玩家等級</h3><small class="empty">經驗來自每日任務（每天最多 70 點）與小村布告欄的每週委託；技能等級上限＝玩家等級＋2。旅行商人只在週五～日出現。</small>';
    for (let L = 1; L <= 10; L++) {
      const st = L < cur ? '✓' : L === cur ? '目前' : '🔒';
      h += '<div class="lvrow' + (L === cur ? ' on' : L > cur ? ' lock' : '') + '"><b>Lv.' + L + ' ' + st + '</b><div>' + plUnlocks(L).join('、') +
        '<small>累計 ' + PL_XP[L - 1] + ' 點經驗（約第 ' + Math.ceil(PL_XP[L - 1] / 70) + ' 天）</small></div></div>';
    }
    Object.keys(SK).forEach(k => {
      const sk = SK[k], my = lv[k];
      h += '<details' + '><summary style="cursor:pointer;font-weight:800;margin:8px 0">' + sk.ic + ' ' + sk.n + ' Lv.' + my + '（展開看每一級）</summary>';
      for (let L = 1; L <= 12; L++) {
        const need = Math.max(1, L - 2), st = L <= my ? '✓' : L === my + 1 ? '下一級' : '🔒';
        h += '<div class="lvrow' + (L === my ? ' on' : L > my ? ' lock' : '') + '"><b>Lv.' + L + ' ' + st + '</b><div>' + (sk.un[L] ? '解鎖：' + esc(sk.un[L]) : '熟練度提升') +
          '<small>累計 ' + skillNeed(L) + ' 經驗 · 需要玩家 Lv.' + need + '</small></div></div>';
      }
      h += '</details>';
    });
    const cmy = ckLv();
    h += '<details><summary style="cursor:pointer;font-weight:800;margin:8px 0">🍳 烹飪 Lv.' + cmy + '（展開看每一級）</summary>';
    for (let L = 1; L <= 12; L++) {
      const need = Math.max(1, L - 2), st = L <= cmy ? '✓' : L === cmy + 1 ? '下一級' : '🔒', nm = recipes.filter(rc => ckTier(rc) === L).map(rc => rc.name);
      h += '<div class="lvrow' + (L === cmy ? ' on' : L > cmy ? ' lock' : '') + '"><b>Lv.' + L + ' ' + st + '</b><div>' + (nm.length ? '解鎖：' + esc(nm.join('、')) : '熟練度提升，火候的綠區變寬') +
        '<small>累計 ' + skillNeed(L) + ' 經驗 · 需要玩家 Lv.' + need + '</small></div></div>';
    }
    h += '</details>';
  }
  lvCard.innerHTML = h + '<button type="button" class="btn wide" data-a="card">我的名片</button><button type="button" class="btn ghost wide" data-a="close">關閉</button>';
}
function openLevels() { if (!ready || !me || authOpen || paused()) return; lvOpen = true; pressed.length = 0; renderLevels(); lvEl.hidden = false; lvCard.focus(); loadLevel(); }
function closeLevels() { lvOpen = false; lvEl.hidden = true; }
lvCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  if (b.dataset.a === 'close') closeLevels();
  else if (b.dataset.a === 'card') { closeLevels(); openCard(null); }
});
lvEl.addEventListener('click', e => { if (e.target === lvEl) closeLevels(); });
