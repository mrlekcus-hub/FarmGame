'use strict';
/* 占卜屋小遊戲 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 占卜屋小遊戲：翻牌配對、客人的煩惱（目前沒有獎勵，只在客戶端玩） ---------- */
let mg = null, mgTimer = 0, wy = null;
/* 手機視窗矮的時候，答完題把回饋和「下一題」按鈕捲進畫面，不用自己再往下滑 */
function lkScrollTo(sel) { const el = lkCard.querySelector(sel); if (el) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* 略過 */ } } }
const mgBestKey = n => 'dw_lkmatch_best_' + n;
function mgBest(n) { try { return parseInt(localStorage.getItem(mgBestKey(n)), 10) || 0; } catch (e) { return 0; } }
function mgStart(pairs) {
  clearTimeout(mgTimer);
  const pick = lkShuffle(TAROT.map((_, i) => i)).slice(0, pairs);
  mg = { pairs, cards: lkShuffle(pick.concat(pick)).map(c => ({ c, open: false, done: false })), first: -1, lock: false, moves: 0, found: 0, t0: 0, fin: null };
  lkMode = 'match'; renderLekcus();
}
function mgPick(i) {
  if (!mg || mg.lock || mg.fin) return;
  const c = mg.cards[i]; if (!c || c.open || c.done) return;
  c.open = true; if (!mg.t0) mg.t0 = Date.now();
  if (mg.first < 0) { mg.first = i; renderLekcus(); return; }
  const a = mg.cards[mg.first]; mg.moves++; mg.first = -1;
  if (a.c === c.c) {
    a.done = c.done = true; mg.found++;
    if (mg.found >= mg.pairs) {
      const secs = Math.round((Date.now() - mg.t0) / 1000), prev = mgBest(mg.pairs);
      mg.fin = { secs, rec: !prev || mg.moves < prev };
      if (mg.fin.rec) { try { localStorage.setItem(mgBestKey(mg.pairs), String(mg.moves)); } catch (e) { /* 略過 */ } }
    }
    renderLekcus(); return;
  }
  mg.lock = true; renderLekcus();
  mgTimer = setTimeout(() => { a.open = c.open = false; mg.lock = false; if (lkOpen && lkMode === 'match') renderLekcus(); }, 800);
}
function renderMatch() {
  let h = '<div class=\"shop-h\"><h2>翻牌配對</h2><span class=\"chip\">' + (mg ? '步數 ' + mg.moves : '塔羅小遊戲') + '</span></div>';
  if (!mg) {
    h += '<p class=\"lkline\" style=\"min-height:0\">牌面朝下洗好了，一次翻兩張，找出一樣的牌。步數越少越好。</p>' +
      '<button type=\"button\" class=\"btn wide\" data-a=\"mg-start\" data-n=\"6\">簡單：6 對' + (mgBest(6) ? '（最佳 ' + mgBest(6) + ' 步）' : '') + '</button>' +
      '<button type=\"button\" class=\"btn wide\" data-a=\"mg-start\" data-n=\"8\">普通：8 對' + (mgBest(8) ? '（最佳 ' + mgBest(8) + ' 步）' : '') + '</button>';
  } else {
    h += '<div class=\"mggrid\" style=\"--mgc:' + (mg.cards.length / 2) + '\">' + mg.cards.map((c, i) => {
      const on = c.open || c.done;
      return '<button type=\"button\" class=\"mc' + (c.done ? ' done' : c.open ? ' open' : '') + '\" data-a=\"mg-pick\" data-i=\"' + i + '\"' + (on || mg.lock || mg.fin ? ' disabled' : '') +
        (on ? ' data-ic=\"' + TAROT[c.c].ic + '\"' : '') + '>' + (on ? TAROT[c.c].n : '') + '</button>';
    }).join('') + '</div>';
    if (mg.fin) {
      h += '<div class=\"lkfb\">全部配對完成！用了 ' + mg.moves + ' 步、' + mg.fin.secs + ' 秒。' + (mg.fin.rec ? '這是你的最佳紀錄！' : '最佳紀錄是 ' + mgBest(mg.pairs) + ' 步。') + '</div>' +
        '<div class=\"lkbtns\"><button type=\"button\" class=\"btn wide\" data-a=\"mg-start\" data-n=\"' + mg.pairs + '\">再玩一次</button>' +
        '<button type=\"button\" class=\"btn ghost wide\" data-a=\"g-back\">回櫃檯</button></div>';
      lkCard.innerHTML = h; lkScrollTo('.lkfb'); return;
    }
  }
  h += '<div class=\"lkbtns\"><button type=\"button\" class=\"btn ghost wide\" data-a=\"g-back\">回櫃檯</button></div>';
  lkCard.innerHTML = h;
}

/* 客人的煩惱：[正確的牌, 三張干擾牌, 客人, 煩惱]；牌的編號對應上面 TAROT 的順序 */
const WORRIES = [
  [0, [9, 4, 11], '🧑‍🌾', '我想辭掉工作去種田，可是我從來沒種過。'],
  [1, [9, 15, 16], '🧑‍🎨', '點子很多，材料也都準備好了，就是不知道怎麼動手開始。'],
  [2, [19, 7, 3], '🧑‍🏫', '總覺得有件事不太對勁，但大家都沒說，我也說不上來。'],
  [3, [7, 16, 15], '👵', '最近太忙了，我只想好好照顧家人，大家一起好好吃頓飯。'],
  [4, [0, 10, 6], '🧑‍💼', '我想把店裡的排班和規則整理清楚，讓大家都照著走。'],
  [5, [0, 15, 1], '🧒', '我想請教有經驗的前輩，照著傳統的做法一步一步來。'],
  [6, [9, 21, 13], '🧑‍🦰', '兩個人都對我很好，我得選一個，真不知道怎麼辦。'],
  [7, [14, 12, 2], '🏃', '比賽快到了，目標很明確，我只想全力往前衝。'],
  [8, [7, 16, 4], '🧑‍🌾', '我家的狗狗很怕生，我想用耐心慢慢陪牠。'],
  [9, [19, 10, 6], '🧙', '我想一個人安靜待幾天，把一些事情想清楚。'],
  [10, [9, 11, 12], '🧑‍🍳', '運氣好像突然轉了，今天剛好收到一個意外的邀請。'],
  [11, [0, 15, 18], '🧑‍⚖️', '合約上有幾條寫得不清楚，我希望大家都能被公平對待。'],
  [12, [7, 4, 19], '🧑‍🔧', '這件事卡了好久，一直用同一個方法都行不通。'],
  [13, [3, 5, 8], '👴', '店要結束營業了，我很捨不得，但也想重新開始。'],
  [14, [7, 16, 15], '🧑‍🚀', '作息和心情最近都有點失衡，我想慢慢調回來。'],
  [15, [14, 17, 19], '🧑‍💻', '我明知道睡前滑手機不好，還是怎麼樣都停不下來。'],
  [16, [3, 14, 4], '🧑‍🔬', '家裡突然出了大變動，感覺一切都被打亂了。'],
  [17, [16, 9, 11], '👧', '最近有點失望，可是我還是想再許一個願望。'],
  [18, [19, 7, 1], '🧑‍🎤', '我很不安，卻說不出原因，覺得很多事都看不清楚。'],
  [19, [9, 18, 15], '🧑‍🎓', '今天事事順利，我想大聲跟大家分享這份好心情！'],
  [20, [12, 9, 0], '🧑‍🏭', '辛苦了一整年，終於有人看見我的努力了。'],
  [21, [0, 16, 1], '🧑‍🎨', '作品終於全部完成了，我想好好慶祝一下。']
];
const WY_N = 5;
function wyStart() {
  wy = { list: lkShuffle(WORRIES).slice(0, WY_N), i: 0, score: 0, picked: -1, choices: [] };
  wyChoices(); lkMode = 'worry'; renderLekcus();
}
function wyChoices() { const w = wy.list[wy.i]; wy.choices = w ? lkShuffle([w[0]].concat(w[1])) : []; wy.picked = -1; }
function wyPick(c) {
  if (!wy || wy.picked >= 0 || wy.i >= WY_N) return;
  wy.picked = c; if (c === wy.list[wy.i][0]) wy.score++;
  renderLekcus();
}
function renderWorry() {
  let h = '<div class=\"shop-h\"><h2>客人的煩惱</h2><span class=\"chip\">' + (wy ? Math.min(wy.i + 1, WY_N) + ' / ' + WY_N : '塔羅小遊戲') + '</span></div>';
  if (!wy) {
    h += '<p class=\"lkline\" style=\"min-height:0\">客人帶著煩惱來到小屋，請從四張牌裡，挑出最符合牌義的那一張。一輪 ' + WY_N + ' 位客人。</p>' +
      '<button type=\"button\" class=\"btn wide\" data-a=\"wy-start\">開始看診</button>';
  } else if (wy.i >= WY_N) {
    const sc = wy.score, cm = sc === WY_N ? '滿分！你已經有占卜師的直覺了。' : sc >= 3 ? '很不錯，牌義已經很熟了。' : '多抽幾次牌，慢慢就會熟悉牌義。';
    h += '<div class=\"lkfb\" style=\"text-align:center\"><b>答對 ' + sc + ' / ' + WY_N + '</b><br>' + cm + '</div>' +
      '<button type=\"button\" class=\"btn wide\" data-a=\"wy-start\">再來一輪</button>';
  } else {
    const w = wy.list[wy.i], done = wy.picked >= 0;
    h += '<div class=\"lkcust\"><div class=\"av\">' + w[2] + '</div><p>' + esc(w[3]) + '</p></div><div class=\"lkchoices\">' + wy.choices.map(c => {
      const cls = done ? (c === w[0] ? ' ok' : c === wy.picked ? ' bad' : '') : '';
      return '<button type=\"button\" class=\"' + cls.trim() + '\" data-a=\"wy-pick\" data-c=\"' + c + '\"' + (done ? ' disabled' : '') + '><span class=\"ic\">' + TAROT[c].ic + '</span>' + TAROT[c].n + '</button>';
    }).join('') + '</div>';
    if (done) {
      const t = TAROT[w[0]];
      h += '<div class=\"lkfb\">' + (wy.picked === w[0] ? '答對了！' : '這位客人最適合的是「' + t.n + '」。') + '<br>' + esc(t.n + '：' + t.up) + '</div>' +
        '<div class=\"lkbtns\"><button type=\"button\" class=\"btn wide\" data-a=\"wy-next\">' + (wy.i + 1 >= WY_N ? '看結果' : '下一位客人') + '</button>' +
        '<button type=\"button\" class=\"btn ghost wide\" data-a=\"g-back\">回櫃檯</button></div>';
      lkCard.innerHTML = h; lkScrollTo('.lkfb'); return;
    }
  }
  h += '<div class=\"lkbtns\"><button type=\"button\" class=\"btn ghost wide\" data-a=\"g-back\">回櫃檯</button></div>';
  lkCard.innerHTML = h;
}

lkCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'close') closeLekcus();
  else if (a === 'draw') { closeLekcus(); openTarot(); }
  else if (a === 'chat') { lkMsg = LK_CHAT[Math.floor(Math.random() * LK_CHAT.length)]; renderLekcus(); }
  else if (a === 'g-match') { mg = null; lkMode = 'match'; renderLekcus(); }
  else if (a === 'g-worry') { wy = null; lkMode = 'worry'; renderLekcus(); }
  else if (a === 'g-back') { clearTimeout(mgTimer); mg = null; wy = null; lkMode = 'chat'; renderLekcus(); }
  else if (a === 'mg-start') mgStart(b.dataset.n | 0);
  else if (a === 'mg-pick') mgPick(b.dataset.i | 0);
  else if (a === 'wy-start') wyStart();
  else if (a === 'wy-pick') wyPick(b.dataset.c | 0);
  else if (a === 'wy-next') { wy.i++; wyChoices(); renderLekcus(); }
});
lkEl.addEventListener('click', e => { if (e.target === lkEl) closeLekcus(); });
