'use strict';
/* 萬聖節料理 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 糖果攤（買材料）、魔女鍋（煮活動料理、吃料理）、夜行／提燈 buff 的畫面效果。
   資料在 Supabase：hw_items（糖果攤食材）、recipes（hw_ 開頭的三道料理）、hw_event（活動日期），用 hw_get／hw_buy／hw_cook 存取；吃料理用原本的 eat。
   背包的 key：食材 h:candy、h:caramel、h:spice；料理是正式料理 dish:hw_pudding、dish:hw_soup、dish:hw_special（登錄在 recipes，背包、餐桌、吃料理都沿用原本的功能）。南瓜用農場原本的 c:pumpkin。 */
Object.assign(BUFF_N, { night: '夜行', lantern: '提燈', witch: '魔女祝福' });
Object.assign(BUFF_I, { night: '👻', lantern: '🏮', witch: '🔮' });
Object.assign(BUFF_D, { night: '夜晚走路變快（約 +25%），身邊飄著一團鬼火', lantern: '夜晚身邊亮起一圈暖暖的燈光', witch: '夜行和提燈一起生效' });
Object.assign(EAT_AURA, { night: '#7ae04a', lantern: '#ffd34d', witch: '#a070e0' });
Object.assign(DISHC, { hw_pudding: '#e8a040', hw_soup: '#8ad850', hw_special: '#a070e0' });   // 盤子、餐桌、吃東西的動畫用

const hwEl = $('hwm'), hwCard = $('hwcard');
let hwMode = '', hwData = null, hwBusy = false, hwBoilUntil = 0;
const HW_STALL = [[-3, 4], [-2, 4], [-3, 5], [-2, 5]];   // 糖果攤（舊廣場座標，A2 放在左側）
const hwAtStall = (x, y) => HW_STALL.some(a => a[0] + PXO === x && a[1] + PYO === y);
const hwAtCauld = (x, y) => x === HW_CAULD[0] + PXO && y === HW_CAULD[1] + PYO;
function hwHint(x, y) {   // 面向時的提示文字（ui.js 用）
  if (scene !== 'plaza') return '';
  if (!hwOn()) return hwAtCauld(x, y) ? '灶台：按動作鍵煮料理。' : '';
  if (hwAtCauld(x, y)) return '魔女鍋：按動作鍵煮萬聖節料理、吃料理。';
  if (hwAtStall(x, y)) return '糖果攤：按動作鍵買萬聖節料理的材料。';
  return '';
}
function hwTouch(x, y) {   // act() 呼叫：面向的是糖果攤或魔女鍋就打開，回傳 true
  if (scene !== 'plaza') return false;
  if (!hwOn()) { if (hwAtCauld(x, y)) { hwOpen('stove'); return true; } return false; }   // 活動結束後：原位變成灶台
  if (hwAtCauld(x, y)) { hwOpen('cauldron'); return true; }
  if (hwAtStall(x, y)) { hwOpen('stall'); return true; }
  return false;
}
async function hwOpen(mode) {
  if (!ready || !me || authOpen || paused() || hwUi) return;
  hwUi = true; hwMode = mode; hwData = null; pressed.length = 0;
  if (mode === 'stove') { hwData = { items: [] }; hwRender(); hwEl.hidden = false; hwCard.focus(); return; }   // 灶台不用活動資料
  hwRender(); hwEl.hidden = false; hwCard.focus();
  try {
    const r = await rpc('hw_get');
    if (!r || !r.active) { toast('萬聖節活動已經結束了'); hwClose(); return; }
    hwData = r;
  } catch (e) { toast(errText(e)); hwClose(); return; }
  if (hwUi) hwRender();
}
function hwClose() { hwUi = false; hwEl.hidden = true; }
const hwList = kind => (hwData ? hwData.items.filter(x => x.kind === kind) : []);
const hwKey = it => (it.kind === 'dish' ? 'dish:' : 'h:') + it.key;
function hwRender() {
  const coins = me ? me.coins : 0, dis = hwBusy ? ' disabled' : '';
  const title = hwMode === 'stall' ? '糖果攤' : hwMode === 'stove' ? '灶台' : '魔女鍋';
  let h = '<div class="shop-h"><h2>' + title + '</h2><span class="chip gold">' + coins + ' G</span></div>';
  if (!hwData) { hwCard.innerHTML = h + '<p class="empty">讀取中…</p>'; return; }
  if (hwMode === 'stall') {
    h += '<p class="empty">萬聖節限定的料理材料。南瓜請自己在農場種，再拿到廣場的魔女鍋煮。</p>';
    h += hwList('ing').map(it => '<div class="row"><canvas class="fico" width="16" height="16" data-hi="' + esc(hwKey(it)) + '"></canvas><div class="meta"><b>' + esc(it.name) + '</b><small>' + esc(it.descr || '') + '　持有 ' + have(hwKey(it)) + '</small></div>' +
      '<button type="button" class="btn small" data-a="buy" data-k="' + esc(it.key) + '" data-n="1"' + (hwBusy || coins < it.price ? ' disabled' : '') + '>買 1 個 ' + it.price + ' G</button>' +
      '<button type="button" class="btn small" data-a="buy" data-k="' + esc(it.key) + '" data-n="5"' + (hwBusy || coins < it.price * 5 ? ' disabled' : '') + '>買 5 個</button></div>').join('');
  } else {
    const act_ = ['night', 'lantern', 'witch'].filter(buffOn).map(k => BUFF_N[k] + '（剩 ' + Math.ceil((buffs[k] - srvNow()) / 60000) + ' 分鐘）');
    if (hwMode !== 'stove') h += '<p class="empty">魔女鍋不用灶台，在這裡直接煮。做好的料理吃下去有萬聖節專屬效果（同一種最多累積 60 分鐘）。' + (act_.length ? '<br>目前效果：' + esc(act_.join('、')) : '') + '</p>';
    if (hwMode === 'stove') h += '<p class="empty">廣場的灶台：選一道料理，站在這裡就能煮，火候和烹飪等級的規則跟廚房一樣。</p>';
    else h += hwList('dish').map(it => {
      const mx = Object.keys(it.ing).reduce((m, k) => Math.min(m, Math.floor(have(k) / it.ing[k])), 99), dn = have(hwKey(it));
      const ing = Object.keys(it.ing).map(k => esc(itemName(k)) + ' ' + have(k) + '/' + it.ing[k]).join('、');
      return '<div class="row" style="flex-wrap:wrap;gap:6px"><canvas class="fico" width="16" height="16" data-hi="' + esc(hwKey(it)) + '"></canvas><div class="meta" style="min-width:150px"><b>' + esc(it.name) + (dn ? '　持有 ' + dn : '') + '</b><small>' + ing + '</small><small>' + esc(it.descr || '') + '</small></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn small" data-a="cook" data-k="' + esc(it.key) + '"' + (hwBusy || mx < 1 ? ' disabled' : '') + '>開始煮</button>' +
        (dn ? '<button type="button" class="btn small" data-a="eat" data-k="' + esc(it.key) + '"' + dis + '>吃一份</button>' : '') + '</div></div>';
    }).join('');
    // 魔女鍋也能煮所有一般料理（和廚房同一份食譜、同樣的烹飪等級限制）
    const L = ckLv();
    if (hwMode !== 'stove') h += '<p class="empty" style="margin-top:10px">一般料理：魔女鍋也煮得出來，火候和烹飪等級的規則跟廚房一樣。</p>';
    h += recipes.filter(rc => !/^hw_/.test(rc.key)).map(rc => {
      const mx = maxCook(rc), dn = have('dish:' + rc.key), T = ckTier(rc), lock = L < T;
      const ing = Object.keys(rc.ing).map(k => esc(itemName(k)) + ' ' + have(k) + '/' + rc.ing[k]).join('、');
      return '<div class="row" style="flex-wrap:wrap;gap:6px"><canvas class="fico" width="16" height="16" data-hi="dish:' + esc(rc.key) + '"></canvas><div class="meta" style="min-width:150px"><b>' + esc(rc.name) + (dn ? '　持有 ' + dn : '') + '</b> <span class="cg-star">' + '★'.repeat(T) + '</span><small>' + ing + '</small><small>' + esc(rc.descr || '') + '</small></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        (lock ? '<button type="button" class="btn small" disabled>烹飪 Lv.' + T + ' 解鎖</button>' : '<button type="button" class="btn small" data-a="cook" data-k="' + esc(rc.key) + '"' + (hwBusy || mx < 1 ? ' disabled' : '') + '>開始煮</button>') +
        (dn && rc.buff ? '<button type="button" class="btn small" data-a="eat" data-k="' + esc(rc.key) + '"' + dis + '>吃一份</button>' : '') + '</div></div>';
    }).join('');
  }
  hwCard.innerHTML = h + '<button type="button" class="btn ghost wide" data-a="close">離開</button>';
  hwCard.querySelectorAll('canvas[data-hi]').forEach(cv => { const k = cv.dataset.hi; if (/^dish:/.test(k)) dishIcon(cv.getContext('2d'), k.slice(5)); else miscIcon(cv.getContext('2d'), k); });
}
hwCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, k = b.dataset.k;
  if (a === 'close') { hwClose(); return; }
  const it = (hwData && hwData.items.find(x => x.key === k)) || recipes.find(x => x.key === k); if (!it) return;
  if (a === 'cook') { hwCookStart(k); return; }
  hwBusy = true;
  hwRender();
  try {
    if (a === 'buy') {
      const r = await enqueue(() => rpc('hw_buy', { p_key: k, p_qty: +b.dataset.n }));
      if (r.inv) Object.assign(inv, r.inv);
      if (typeof r.coins === 'number') me.coins = r.coins;
      toast('買到了！');
    } else if (a === 'eat') {
      hwBusy = false; hwClose();
      const r = await eatDish(k);   // 原本的吃料理（和背包、廚房共用）
      refreshHud();
      if (r && r.buff) playEat(k, r.buff);
      return;
    }
  } catch (err) { toast(errText(err)); await resync(); }
  hwBusy = false; if (hwUi) hwRender(); refreshHud();
});
hwEl.addEventListener('click', e => { if (e.target === hwEl) hwClose(); });
/* 煮料理＝和廚房灶台同一個火候條小遊戲（cooking.js）：站在鍋子前按住動作鍵加熱，指針進綠區放開，共三段；成功才扣材料（hw_cook） */
const HW_TIER = { hw_pudding: 2, hw_soup: 2, hw_special: 3 };
function hwCookStart(key) {
  const it = (hwData && hwData.items.find(x => x.key === key)) || recipes.find(x => x.key === key); if (!it || cooking || ckBusy) return;
  if (!/^hw_/.test(key) && ckLv() < ckTier(it)) { toast('烹飪 Lv.' + ckTier(it) + ' 才能做這道'); return; }
  if (Object.keys(it.ing).some(k => have(k) < it.ing[k])) { toast('材料不夠'); return; }
  const rc = { key: it.key, name: it.name, ing: it.ing, hw: true };
  hwClose();
  const p = ckPlan(rc), now = Date.now();
  cooking = { id: ++cookSeq, rc, T: p.T, plan: p.plan, maxMiss: p.maxMiss, miss: 0, done: 0, i: 0, hit: 0, itId: 0, host: null, fx: HW_CAULD[0] + PXO, fy: HW_CAULD[1] + PYO, hw: true, scene, phase: 'wait', t0: now, at: now + 900, ok: true, heat: 0, lt: now, msg: '', needRel: false };
}

/* ---------- 夜行（鬼火＋夜晚變快）與提燈（身邊一圈暖光）：畫在夜色濾鏡之後，sky.js 呼叫 ---------- */
/* 把自己的 buff 打包成 2 個位元（1 = 夜行鬼火、2 = 提燈）隨位置心跳送給同房的人，對方才看得到 */
function hwBits() { return (buffOn('night') || buffOn('witch') ? 1 : 0) | (buffOn('lantern') || buffOn('witch') ? 2 : 0); }
function hwFxAt(now, dark, rx, ry, indoors, night, lan, ph) {
  const cx = Math.round(rx * T) + 8, cy = Math.round(ry * T) + 8;
  if (lan && !indoors && dark > 0.04) {
    ctx.globalAlpha = clamp(dark * 1.6, 0, 1);
    plDisc(ctx, cx, cy, Math.round(32 + Math.sin(now / 170 + ph) * 1.5), '255,214,120', 1.4);
    ctx.globalAlpha = 1;
  }
  if (lan) {   // 手邊的小提燈
    const lx = cx + 7, ly = cy + 1 + Math.round(Math.sin(now / 300 + ph));
    r('#5a3a1a', lx, ly - 1, 3, 1); r('#ffd34d', lx, ly, 3, 3); r('#fff3b0', lx + 1, ly + 1, 1, 1); r('#5a3a1a', lx, ly + 3, 3, 1);
  }
  if (night) {   // 繞著頭轉的鬼火
    const an = now / 600 + ph, fx = Math.round(cx + Math.cos(an) * 11), fy = Math.round(cy - 10 + Math.sin(an) * 3), fl = Math.floor(now / 140) % 2;
    if (!indoors && dark > 0.04) { ctx.globalAlpha = clamp(dark * 1.5, 0, 1) * 0.9; plDisc(ctx, fx, fy, 10, '122,224,74', 1.2); ctx.globalAlpha = 1; }
    r('#7ae04a', fx, fy - (fl ? 1 : 0), 2, 3); r('#d8ff9a', fx, fy + 1 - (fl ? 1 : 0), 1, 1); r('#3a8a2a', fx, fy + 2, 2, 1);
  }
}
function drawHwBuffFx(now, dark, rx, ry, indoors) {
  hwDark = indoors ? 0 : dark;
  if (!ready || !me) return;
  const b = hwBits();
  if (b) hwFxAt(now, dark, rx, ry, indoors, !!(b & 1), !!(b & 2), 0);
  if (syncScene()) remotes.forEach(rp => {   // 同房其他玩家的 buff（對方心跳帶來的 rp.hw）
    const h = rp.hw | 0; if (!h || !hereRp(rp)) return;
    let ph = 0; for (let k = 0; k < rp.id.length; k++) ph = (ph + rp.id.charCodeAt(k)) % 63;
    hwFxAt(now, dark, rp.x, rp.y, indoors, !!(h & 1), !!(h & 2), ph / 10);
  });
}
