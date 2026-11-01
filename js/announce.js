'use strict';
/* 更新通告 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   每次更新只要改下面這一份 ANNOUNCE：v 換成新的版本代號（一個新字串就會讓大家再看到一次），三塊內容各寫幾行。
   玩家每個版本只會自動看到一次（按「知道了」後記在自己的瀏覽器），新通告會直接蓋掉舊的，不保留歷史。
   不想彈窗時：把 v 設成 ''。 */
const ANNOUNCE = {
  v: '2026-11-01a',
  title: '畫架上的畫變大變清楚、畫板多了 16 種顏色、更多畫布大小、格線刻度準星、可以存草稿、布置可以一鍵清空、碼頭完工信修好了',
  add: [
    '<b>畫架外觀更清楚</b>：兩種畫架的畫布變大（三腳 16×24、寬幅 25×15），掛在房間裡的畫不再糊成一團，邊緣和細線都看得清楚',
    '<b>畫板更多大小</b>：寬幅畫架最小 20×12、最大 100×60；三腳畫架最小 12×18、最大 64×96，共 7 種可選',
    '<b>畫板定位輔助</b>：畫畫時多了「格線」（每 5 格一條粗線）、「刻度」（上方和左邊的座標數字）、「準星」（游標所在的行列亮起並顯示座標），可以各自開關',
    '<b>畫板 32 色</b>：調色盤從 16 色變成 32 色，新增黑色、膚色、橘色、金黃色、深綠、紅色、淡藍紫等；以前畫好的畫不受影響',
    '<b>畫板草稿</b>：畫到一半可以按「💾 存草稿，下次再畫」，下次打開畫架會出現「繼續上次的草稿」；畫的時候也會自動存，不小心關掉也不會白畫（草稿存在這個瀏覽器裡，換裝置不會跟著走）',
    '<b>一鍵清空</b>：布置模式的「花紋」分頁選「橡皮擦」，會出現「🧹 一鍵清空」按鈕，可以一次擦掉整層的地板、牆紙、隔間牆或門；按下去會先再確認一次，不會誤擦'
  ],
  fix: [
    '修正手機出海時切到別的 App（例如回訊息）再回到遊戲，船上只看到自己一個人的問題；現在會自動重新連線，找回其他人',
    '修正出海時在船上不能和朋友做雙人動作的問題：現在在船上可以擊掌、跳舞、擁抱、合照（「坐在地上」除外）',
    '修正捐完碼頭最後一份材料時跳出錯誤、碼頭卡在最後一步無法完工的問題；現在會正常完工，全服都會收到信'
  ]
};
const ANN_KEY = 'dw_annc_seen';
let anEl = null;
const anSeen = () => { try { return localStorage.getItem(ANN_KEY) || ''; } catch (e) { return ''; } };
function anClose() {
  if (anEl) { anEl.remove(); anEl = null; }
  anOpen = false;
  try { localStorage.setItem(ANN_KEY, ANNOUNCE.v); } catch (e) { /* 略過：下次登入會再看到一次 */ }
}
function anShow() {
  const sec = (cls, name, arr) => arr && arr.length ? '<div class="an-sec"><b class="an-t ' + cls + '">' + name + '</b><ul>' + arr.map(t => '<li>' + t + '</li>').join('') + '</ul></div>' : '';
  anEl = document.createElement('div'); anEl.className = 'shop'; anEl.id = 'annc';
  anEl.innerHTML = '<div class="card an-card" tabindex="-1"><div class="shop-h"><h2>📢 更新通告</h2><span class="chip">' + esc(ANNOUNCE.v) + '</span></div>' +
    (ANNOUNCE.title ? '<p class="an-ver">' + esc(ANNOUNCE.title) + '</p>' : '') +
    sec('new', '✨ 新增', ANNOUNCE.add) + sec('chg', '🔧 調整', ANNOUNCE.chg) + sec('fix', '🐛 修正', ANNOUNCE.fix) +
    '<button type="button" class="btn wide" data-a="ok" style="margin-top:8px">知道了</button></div>';
  $('shop').parentNode.appendChild(anEl);
  anOpen = true; pressed.length = 0;
  anEl.addEventListener('pointerdown', e => e.stopPropagation());
  anEl.addEventListener('click', e => { if (e.target === anEl || e.target.closest('button[data-a="ok"]')) anClose(); });
  const b = anEl.querySelector('button[data-a="ok"]'); if (b) b.focus();
}
setInterval(() => {   // 登入進遊戲、沒有其他視窗開著、不是剛建角色時，這個版本第一次顯示
  if (anOpen || !ANNOUNCE.v || !ready || !me || authOpen || firstTime || paused() || scene === 'boat') return;
  if (anSeen() === ANNOUNCE.v) return;
  anShow();
}, 1500);
