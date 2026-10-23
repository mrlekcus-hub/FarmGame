'use strict';
/* 塔羅小攤抽牌 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 塔羅小攤：每天抽一張牌，看今天的運勢 ---------- */
/* 牌、正逆位、幸運數字由伺服器抽（一天一次）；牌義文字在這裡。st = 整體 / 愛情 / 事業 / 財運（正位 1–5 顆星，逆位會自動降一些） */
const TAROT = [
  { n: '愚者', en: 'The Fool', ic: '🎒', col: ['#ffe27a', '鵝黃'], st: [4, 4, 3, 3], up: '帶著好奇心出發就對了，今天適合嘗試第一次的事。', rv: '想到就衝容易踩空，出手前先看一眼腳下。', tip: '挑一件從沒做過的小事，今天就去做。' },
  { n: '魔術師', en: 'The Magician', ic: '🎩', col: ['#ff7a7a', '紅'], st: [5, 3, 5, 4], up: '手上的資源剛剛好，只差你動手把它們變成作品。', rv: '點子多但落地少，小心講得比做得漂亮。', tip: '先把今天最想做的事，拆成第一個小步驟。' },
  { n: '女祭司', en: 'The High Priestess', ic: '🌙', col: ['#8fa8ff', '月光藍'], st: [3, 4, 3, 3], up: '答案不在別人嘴裡，安靜下來聽聽自己的直覺。', rv: '想太多反而看不清，別急著替別人的沉默下結論。', tip: '今天少說一點、多觀察一點。' },
  { n: '皇后', en: 'The Empress', ic: '🌸', col: ['#ffb3c7', '櫻花粉'], st: [5, 5, 4, 4], up: '被愛也愛人的一天，好好吃飯、好好對待自己。', rv: '給出去太多，記得留一點給自己。', tip: '為自己準備一份喜歡的小點心。' },
  { n: '皇帝', en: 'The Emperor', ic: '🏰', col: ['#d9a066', '木棕'], st: [4, 3, 5, 4], up: '規劃清楚、守住界線，事情會照你的節奏走。', rv: '太想掌控會讓人想躲，放一點空間給別人。', tip: '把今天的待辦排出先後順序。' },
  { n: '教皇', en: 'The Hierophant', ic: '📿', col: ['#c9a6f0', '薰衣草紫'], st: [4, 3, 4, 3], up: '照著前人走過的路，今天穩穩的最安心。', rv: '舊規矩未必適合現在，可以問問「為什麼要這樣做」。', tip: '請教一位比你有經驗的人。' },
  { n: '戀人', en: 'The Lovers', ic: '💞', col: ['#ff8fa8', '玫瑰粉'], st: [5, 5, 4, 3], up: '心意相通的一天，也是為自己的選擇負責的一天。', rv: '三心二意會讓好事溜走，先弄清楚你真正想要什麼。', tip: '把想說的心裡話，說出口。' },
  { n: '戰車', en: 'The Chariot', ic: '🛡️', col: ['#7fc8f8', '天空藍'], st: [4, 3, 5, 4], up: '方向明確、全力往前，今天衝得過去。', rv: '用力過猛容易失控，先把方向盤握穩。', tip: '專心做完一件事再換下一件。' },
  { n: '力量', en: 'Strength', ic: '🦁', col: ['#ffb347', '橘'], st: [4, 4, 4, 3], up: '溫柔比強硬更有力量，耐心會幫你搞定難題。', rv: '對自己沒信心的一天，記得你比想像中勇敢。', tip: '對自己說一句鼓勵的話。' },
  { n: '隱者', en: 'The Hermit', ic: '🏮', col: ['#a0a0b8', '霧灰'], st: [3, 2, 4, 3], up: '一個人靜靜想事情的好日子，答案會自己浮現。', rv: '躲太久會變孤單，願意開口，就有人願意聽。', tip: '關掉通知，給自己一小時安靜時間。' },
  { n: '命運之輪', en: 'Wheel of Fortune', ic: '🎡', col: ['#6fd0a0', '薄荷綠'], st: [5, 4, 4, 5], up: '風向正在轉，意外的好機會可能就在今天。', rv: '運氣暫時卡住，別硬推，等下一圈。', tip: '遇到突然的邀請，先別拒絕。' },
  { n: '正義', en: 'Justice', ic: '⚖️', col: ['#5f8fd8', '藍'], st: [4, 3, 4, 4], up: '是非分明、有來有往，今天做的選擇會得到公平的回應。', rv: '不太公平的感覺別悶著，把事實攤開說清楚。', tip: '簽約、答應別人前，再看一次細節。' },
  { n: '倒吊人', en: 'The Hanged Man', ic: '🙃', col: ['#7fd0c8', '湖水綠'], st: [3, 3, 3, 2], up: '換個角度看，卡住的地方就有出口。', rv: '一直原地等也不是辦法，該放下的就放下。', tip: '用完全相反的方式做一次同一件事。' },
  { n: '死神', en: 'Death', ic: '🦋', col: ['#9a7fb8', '暮紫'], st: [3, 3, 3, 3], up: '舊的告一段落，新的才有位置，結束是為了重新開始。', rv: '捨不得放手，會讓新的機會一直在門外。', tip: '整理一個不再需要的東西。' },
  { n: '節制', en: 'Temperance', ic: '🕊️', col: ['#bfe3f5', '淺天藍'], st: [4, 4, 4, 4], up: '剛剛好最好，調整步調，事情就順起來了。', rv: '最近有點失衡，作息或情緒需要調一調。', tip: '喝杯溫水，深呼吸三次。' },
  { n: '惡魔', en: 'The Devil', ic: '🔥', col: ['#e0524a', '深紅'], st: [2, 3, 3, 2], up: '有個習慣或誘惑正在綁著你，看清楚就不怕它。', rv: '鬆綁的好時機，一點一點掙脫就會輕鬆。', tip: '今天少滑一個小時手機。' },
  { n: '高塔', en: 'The Tower', ic: '⚡', col: ['#ffd24a', '閃電黃'], st: [2, 2, 2, 2], up: '突如其來的變動，雖然嚇人，卻是把虛假拆掉的機會。', rv: '最糟的快過去了，慢慢收拾就好。', tip: '重要的東西先備份、先存檔。' },
  { n: '星星', en: 'The Star', ic: '⭐', col: ['#ffe9a8', '星光金'], st: [5, 4, 4, 4], up: '希望回來了，一點小小的光就足夠照亮前面。', rv: '有點失望但還沒結束，別放掉心裡的那顆星。', tip: '寫下一個你還在期待的願望。' },
  { n: '月亮', en: 'The Moon', ic: '🌕', col: ['#c5c8ff', '月暈銀'], st: [3, 3, 2, 3], up: '看不清楚的一天，不安多半是想像，先別急著決定。', rv: '迷霧正在散去，真相慢慢浮現。', tip: '重要決定延後到明天再做。' },
  { n: '太陽', en: 'The Sun', ic: '☀️', col: ['#ffcf3f', '陽光黃'], st: [5, 5, 5, 5], up: '全面開朗的好日子，笑容和好運都會被你吸引過來。', rv: '雲有點厚，但太陽還在，換個心情就亮了。', tip: '出門曬五分鐘太陽。' },
  { n: '審判', en: 'Judgement', ic: '📯', col: ['#ff9f7a', '晨曦橘'], st: [4, 4, 4, 3], up: '迴響來了，過去的努力會被看見。', rv: '別再苛責過去的自己，原諒才能前進。', tip: '回頭看看你這個月做到了什麼。' },
  { n: '世界', en: 'The World', ic: '🌍', col: ['#7fd08a', '草綠'], st: [5, 4, 5, 4], up: '圓滿完成，值得好好慶祝一下。', rv: '只差最後一點收尾，別在終點前放棄。', tip: '把差一點完成的事收尾。' }
];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const trEl = $('trm'), trCard = $('trcard');
let trToday = null, trBusy = false;
function trStars(card, rev, day, i) {                        // 星星數：牌義的基礎值，加上「今天＋這張牌」固定的一點點變化，逆位降一些
  const base = TAROT[card].st[i];
  const wob = Math.floor(hash(day | 0, card * 4 + i, 31) * 3) - 1;      // -1 / 0 / +1，同一天同一張牌永遠一樣
  return clamp(base + wob - (rev ? 2 : 0), 1, 5);
}
function trCardHTML(c, rev, flip) {
  const t = TAROT[c];
  return '<div class="tcard' + (rev ? ' rev' : '') + (flip ? ' flip' : '') + '"><span class="no">' + ROMAN[c] + '</span><span class="ic" aria-hidden="true">' + t.ic + '</span><span><div class="nm">' + t.n + '</div><div class="en">' + t.en + '</div></span></div>';
}
function trRewardHTML(rw) {
  if (!rw || !(rw.coins > 0 || rw.n > 0)) return '';
  const sd = rw.seed && CROPS[rw.seed] ? CROPS[rw.seed].n + '種子 ×' + (rw.n | 0) : '';
  return '<div class="trtip">🎁 今日祝福：' + (rw.coins | 0) + ' G' + (sd ? '、' + sd : '') + '（已放進背包）</div>';
}
function renderTarot(flip) {
  const d = new Date(), date = (d.getMonth() + 1) + '/' + d.getDate();
  if (!trToday) {
    trCard.innerHTML = '<h2>塔羅小攤</h2><div class="tcard back" aria-hidden="true"></div>' +
      '<p class="trtxt">歡迎光臨。每天可以抽一張牌，看看今天的運勢。<br>靜下心來，想著「今天的我」，再翻牌。</p>' +
      '<button type="button" class="btn wide" id="tr-draw"' + (trBusy ? ' disabled' : '') + '>' + (trBusy ? '洗牌中…' : '抽今天的牌') + '</button>' +
      '<button type="button" class="btn ghost wide" id="tr-close">下次再說</button>';
  } else {
    const { card, rev, lucky, day } = trToday, t = TAROT[card];
    const rows = ['整體', '愛情', '事業', '財運'].map((nm, i) => {
      const n = trStars(card, rev, day, i);
      return '<span>' + nm + '</span><span class="st">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>';
    }).join('');
    trCard.innerHTML = '<h2>今日運勢 · ' + date + '</h2>' + trCardHTML(card, rev, flip) +
      '<span class="trpos' + (rev ? ' rv' : '') + '">' + (rev ? '逆位' : '正位') + '</span>' +
      '<p class="trtxt">' + (rev ? t.rv : t.up) + '</p>' +
      '<div class="trrows">' + rows + '</div>' +
      '<div class="trlucky"><span><i class="sw" style="background:' + t.col[0] + '"></i>幸運色　' + t.col[1] + '</span><span>幸運數字　' + lucky + '</span></div>' +
      '<div class="trtip">小提醒：' + t.tip + '</div>' + trRewardHTML(trToday.reward) +
      '<p class="trnote">今天已經占卜過了，明天再來看看新的運勢。</p>' +
      '<button type="button" class="btn wide" id="tr-close">收下祝福</button>';
  }
  const dr = $('tr-draw'); if (dr) dr.addEventListener('click', drawTarot);
  $('tr-close').addEventListener('click', closeTarot);
}
async function openTarot() {
  if (!ready || !me || authOpen || paused() || trOpen) return;
  trOpen = true; pressed.length = 0; trToday = null; trBusy = true; renderTarot(false); trEl.hidden = false; trCard.focus();
  try { const r = await rpc('tarot_today'); if (trOpen && r && Number.isInteger(r.card) && r.card >= 0 && r.card < TAROT.length) trToday = { card: r.card, rev: !!r.rev, lucky: intIn(r.lucky, 1, 9, 1), day: r.day | 0, reward: r.reward || null }; }
  catch (e) { if (trOpen) { toast(errText(e)); closeTarot(); } return; }
  trBusy = false; if (trOpen) renderTarot(false);
}
async function drawTarot() {
  if (trBusy || trToday) return;
  trBusy = true; renderTarot(false);
  try {
    const r = await rpc('tarot_draw');
    if (!r || !Number.isInteger(r.card) || r.card < 0 || r.card >= TAROT.length) throw new Error('bad_response');
    trToday = { card: r.card, rev: !!r.rev, lucky: intIn(r.lucky, 1, 9, 1), day: r.day | 0, reward: r.reward || null };
    if (r.fresh) { if (typeof r.coins === 'number') me.coins = r.coins; if (r.inv) Object.assign(inv, r.inv); refreshHud(); chime([69, 74, 78], 0.12); }
  } catch (e) { trBusy = false; if (trOpen) { toast(errText(e)); renderTarot(false); } return; }
  trBusy = false; if (trOpen) renderTarot(true);
}
function closeTarot() { trOpen = false; trEl.hidden = true; }
trEl.addEventListener('pointerdown', e => { if (e.target === trEl) closeTarot(); });
