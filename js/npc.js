'use strict';
/* 村民：像素圖與對話 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 村民：像素圖與對話 ---------- */
const NPC_LOOK = {
  oak:  { hair: '#f4f4f4', hat: '#8c5b3c', cloth: '#6fa56f', beard: true },
  gui:  { hair: '#cfcfd6', hat: null, cloth: '#f2a3b8', bun: true },
  li:   { hair: '#7a6a5a', hat: '#e8c872', cloth: '#6a9ac4', rod: true },
  luo:  { hair: '#5a3a2a', hat: '#ffc83d', cloth: '#e8873a', lamp: true },
  mo:   { hair: '#a06a3a', hat: null, cloth: '#7ab0e8', ribbon: true },
  tao:  { hair: '#7a4a3a', hat: null, cloth: '#ff9bb3', ribbon: true },
  jian: { hair: '#2f2a33', hat: null, cloth: '#8fd3c0' },
  mu:   { hair: '#7a5a3a', hat: '#7fc48a', cloth: '#c9955f', beard: true }
};
/* 旅行商人 米羅（選項 I：捲毯背包客）：背包頂上綁著花紋地毯捲，紅帽插白羽毛 */
function miloArt(px, py, bob) {
  const o = 'rgba(90,60,40,.55)', b = bob;
  r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 2);
  ob('#b05a4a', '#7a3428', px, py + 6 + b, 5, 9);
  ob('#e8c070', '#a8802a', px, py + 3 + b, 5, 4); r('#c9584a', px + 1, py + 4 + b, 3, 1); r('#6a9ac4', px + 1, py + 5 + b, 3, 1);
  ob('#6a9ac4', o, px + 4, py + 9 + b, 8, 6);
  ob('#ffe0c4', o, px + 4, py + 3 + b, 8, 7);
  r('#3a2a2a', px + 4, py + 3 + b, 8, 2); r('#3a2a2a', px + 4, py + 3 + b, 1, 5); r('#3a2a2a', px + 11, py + 3 + b, 1, 5);
  r('#4a3a3a', px + 6, py + 7 + b, 1, 1); r('#4a3a3a', px + 9, py + 7 + b, 1, 1); r('#ff9ab0', px + 7, py + 9 + b, 2, 1);
  ob('#c9584a', '#8a2e26', px + 3, py + b, 10, 4); r('#ffffff', px + 12, py + b, 1, 3); r('#ffffff', px + 13, py + 1 + b, 1, 2);
}
function npcArt(px, py, key, bob) {
  if (key === 'milo') { miloArt(px, py, bob); return; }
  const L = NPC_LOOK[key] || NPC_LOOK.oak, o = 'rgba(90,60,40,.55)';
  r('rgba(90,60,40,.18)', px + 3, py + 14, 10, 2);
  ob(L.cloth, o, px + 4, py + 9 + bob, 8, 6);
  if (key === 'gui') r('#fff6e6', px + 5, py + 11 + bob, 6, 4);
  ob('#ffe0c4', o, px + 4, py + 3 + bob, 8, 7);
  r(L.hair, px + 4, py + 3 + bob, 8, 2); r(L.hair, px + 4, py + 3 + bob, 1, 5); r(L.hair, px + 11, py + 3 + bob, 1, 5);
  r('#4a3a3a', px + 6, py + 7 + bob, 1, 1); r('#4a3a3a', px + 9, py + 7 + bob, 1, 1); r('#ff9ab0', px + 7, py + 9 + bob, 2, 1);
  if (L.beard) { r(L.hair, px + 5, py + 9 + bob, 6, 3); r('#ff9ab0', px + 7, py + 9 + bob, 2, 1); }
  if (L.bun) { ob(L.hair, o, px + 6, py + 1 + bob, 4, 3); }
  if (L.hat) {
    if (key === 'luo') { ob(L.hat, '#b8892a', px + 3, py + 1 + bob, 10, 4); r('#fff6a8', px + 7, py + bob, 2, 2); }
    else if (key === 'li') { ob(L.hat, '#b8932a', px + 1, py + 2 + bob, 14, 3); ob(L.hat, '#b8932a', px + 4, py + bob, 8, 3); }
    else ob(L.hat, '#5e3a24', px + 4, py + bob, 8, 4);
  }
  if (L.ribbon) { r('#ff6b8a', px + 3, py + 3 + bob, 3, 2); r('#ff6b8a', px + 10, py + 3 + bob, 3, 2); r(L.hair, px + 3, py + 5 + bob, 2, 4); r(L.hair, px + 11, py + 5 + bob, 2, 4); }
  if (L.rod) { r('#8c5b3c', px + 13, py + 5 + bob, 1, 9); r('#ffffff', px + 14, py + 5 + bob, 1, 4); }
  if (L.lamp) { r('#ffe58a', px + 7, py + 9 + bob, 2, 1); }
}
function drawNpc(px, py, key, now) {
  const bob = Math.floor(now / 600 + key.charCodeAt(0)) % 2;
  npcArt(px, py, key, bob);
}
/* 頭上的「！」要在房子、樹之後才畫，不然會被屋頂蓋住 */
function drawNpcMark(px, py, key, now) {
  const t = storyTarget();
  if (t && t.npc === key && plv() >= t.pl) {
    const by = py - 10 + Math.round(Math.sin(now / 250) * 1.5);
    r('#ffffff', px + 4, by - 1, 8, 10);                       // 白色底，冬天的淡紫色地面上才看得清楚
    ob('#ffd34d', '#b87a00', px + 5, by, 6, 8);
    r('#7a4a00', px + 7, by + 1, 2, 3); r('#7a4a00', px + 7, by + 5, 2, 2);
  }
}
/* 目前該找誰：以伺服器的章節表為準（story_get），還沒讀到時才用本地的對照表 */
function storyTarget() {
  const d = stData && stData.done != null ? stData.done | 0 : storyDone | 0;
  if (stData && Array.isArray(stData.chapters) && stData.chapters.length) {
    const c = stData.chapters.find(x => x.ch === d + 1);
    return c ? { npc: c.npc, pl: c.pl | 0 } : null;
  }
  return d < NPC_CH.length ? { npc: NPC_CH[d], pl: CH_PL[d] } : null;
}
function npcIcon(c2d, key) { g = c2d; g.clearRect(0, 0, 16, 16); npcArt(0, 0, key, 0); g = ctx; }
const dgEl = $('dgm'), dgCard = $('dgcard');
let dg = null, dgBusy = false;
async function openNpc(i) {
  if (i < 0 || !ready || !me || authOpen || paused() || dgOpen) return;
  const nq = NPCS[i];
  dgOpen = true; pressed.length = 0; dg = { npc: nq, lines: [], i: 0, mode: 'chat', cur: null };
  renderDlg(); dgEl.hidden = false; dgCard.focus();
  try { stData = await rpc('story_get'); } catch (e) { toast(errText(e)); closeDlg(); return; }
  const d = stData.done | 0, chs = stData.chapters || [], cur = chs.find(c => c.ch === d + 1);
  if (cur && cur.npc === nq.k) {
    if (plv() < cur.pl) dg.lines = [{ s: nq.k, t: '再多歷練一下吧，等你到玩家 Lv.' + cur.pl + '，我再把這件事託付給你。' }];
    else { dg.mode = 'quest'; dg.cur = cur; dg.lines = cur.lines; }
  } else {
    const T = NPC_TALK[nq.k], mine = chs.some(c => c.npc === nq.k && c.ch <= d);
    const pool = !cur ? T.end : mine ? T.after : T.idle;
    dg.lines = [{ s: nq.k, t: pool[Math.floor(srvNow() / 86400000) % pool.length] }];
  }
  dg.i = 0; if (dgOpen) renderDlg();
}
function closeDlg() { dgOpen = false; dgEl.hidden = true; dg = null; }
function renderDlg() {
  if (!dg) return;
  if (!dg.lines.length) { dgCard.innerHTML = '<p class="empty">讀取中…</p>'; return; }
  const ln = dg.lines[dg.i], last = dg.i >= dg.lines.length - 1, me_ = ln.s === 'me';
  const sp = me_ ? { k: null, n: me ? me.name : '我' } : (NPCS.find(q => q.k === ln.s) || dg.npc);
  let btn = '';
  const dis = dgBusy ? ' disabled' : '';
  if (!last) btn = '<button type="button" class="btn wide" data-a="next">下一句</button>';
  else if (dg.mode === 'quest') {
    const cur = dg.cur, need = Object.keys(cur.need).map(k => esc(itemName(k)) + ' ' + Math.min(have(k), cur.need[k]) + '/' + cur.need[k]).join('、');
    const ok = Object.keys(cur.need).every(k => have(k) >= cur.need[k]);
    const rw = cur.coins + ' G' + Object.keys(cur.items || {}).map(k => '、' + esc(itemName(k)) + ' ×' + cur.items[k]).join('');
    btn = '<div class="v-quick"><small class="empty">需要：' + need + '<br>獎勵：' + rw + '</small></div>' +
      '<button type="button" class="btn wide" data-a="give"' + (dgBusy || !ok ? ' disabled' : '') + '>' + (ok ? '交付' : '材料還不夠') + '</button>' +
      '<button type="button" class="btn ghost wide" data-a="close">等一下再來</button>';
  } else btn = (dg.mode === 'chat' && SEED_NPC[dg.npc.k] ? '<button type="button" class="btn wide" data-a="seed"' + dis + '>用採集物換種子</button>' : '') +
    '<button type="button" class="btn' + (dg.mode === 'chat' && SEED_NPC[dg.npc.k] ? ' ghost' : '') + ' wide" data-a="close">' + (dg.mode === 'outro' ? '完成' : '再見') + '</button>';
  dgCard.innerHTML = '<div class="shop-h"><h2>' + esc(sp.n) + '</h2>' + (dg.mode === 'quest' ? '<span class="chip">第 ' + dg.cur.ch + ' 章：' + esc(dg.cur.title) + '</span>' : '') + '</div>' +
    '<div style="display:flex;gap:12px;align-items:flex-start;margin:8px 0">' +
    (me_ ? '<canvas width="16" height="22" data-me="1" style="width:64px;height:88px;flex:none;image-rendering:pixelated"></canvas>' : '<canvas width="16" height="16" data-npc="' + sp.k + '" style="width:64px;height:64px;flex:none;image-rendering:pixelated"></canvas>') +
    '<p style="margin:0;font-size:16px;line-height:1.7;min-height:80px">' + esc(ln.t) + '</p></div>' +
    '<small class="empty">' + (dg.i + 1) + ' / ' + dg.lines.length + '</small>' + btn;
  dgCard.querySelectorAll('canvas[data-npc]').forEach(cv => npcIcon(cv.getContext('2d'), cv.dataset.npc));
  dgCard.querySelectorAll('canvas[data-me]').forEach(cv => { const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 16, 22); g = c2; try { drawPlayer(0, 6, 'down', false, 0, myChar()); } catch (e) { /* 略過 */ } g = ctx; });
}
dgCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled || !dg) return;
  const a = b.dataset.a;
  if (a === 'close') { closeDlg(); return; }
  if (a === 'next') { dg.i++; renderDlg(); return; }
  if (a === 'seed') { const k = dg.npc.k; closeDlg(); openSeedTrade(k); return; }
  if (a === 'give') {
    dgBusy = true; renderDlg();
    try {
      const r = await enqueue(() => rpc('story_submit'));
      if (r.inv) Object.assign(inv, r.inv);
      if (typeof r.coins === 'number') me.coins = r.coins;
      storyDone = r.done | 0;
      toast('故事過關！+' + r.earned + ' G' + Object.keys(r.items || {}).map(k => '、' + itemName(k) + ' ×' + r.items[k]).join(''));
      const cur = dg && dg.cur;
      stData = await rpc('story_get');
      if (dg && cur) { dg.mode = 'outro'; dg.lines = cur.outro && cur.outro.length ? cur.outro : [{ s: cur.npc, t: '謝謝你！' }]; dg.i = 0; }
    } catch (err) { toast(errText(err)); await resync(); }
    dgBusy = false; if (dgOpen) renderDlg(); refreshHud(); loadLevelSoon();
  }
});
dgEl.addEventListener('click', e => { if (e.target === dgEl && !dgBusy) closeDlg(); });
