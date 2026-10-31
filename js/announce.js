'use strict';
/* 更新通告 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   每次更新只要改下面這一份 ANNOUNCE：v 換成新的版本代號（一個新字串就會讓大家再看到一次），三塊內容各寫幾行。
   玩家每個版本只會自動看到一次（按「知道了」後記在自己的瀏覽器），新通告會直接蓋掉舊的，不保留歷史。
   不想彈窗時：把 v 設成 ''。 */
const ANNOUNCE = {
  v: '2026-10-31e',
  title: '畫畫變大了、iPad 畫面一次看得完、聊天一下就送出',
  add: [
    '<b>畫畫表情</b>：在畫架上畫畫時，頭上會出現一個小調色盤泡泡，同一間屋子的人都看得到',
    '<b>畫畫可以縮放、移動</b>：電腦用滾輪縮放，按住空白鍵（或滑鼠中鍵）拖動畫面；手機用兩根手指縮放、移動',
    '<b>手機放大鏡</b>：手指按住畫畫時，上方會浮出放大鏡，看得到落筆的格子，不會被手指擋住',
    '<b>iPad 也有全螢幕模式</b>：十字鍵、動作鈕和工具列會浮在畫面上，農場鋪滿整個螢幕，不用再上下捲動'
  ],
  chg: [
    '畫板一打開，畫布就自動放到最大（電腦約是以前的 2 倍），不用先按＋',
    '手機畫畫畫面改成滿版，三腳畫架的直式畫布更好畫',
    'iPad 一次看到的範圍比手機大一點，鏡頭會跟著角色移動',
    '其他功能（背包、好友、信箱⋯）請點「☰ 選單」打開'
  ],
  fix: [
    '修正畫布在 1× 時也會出現捲軸的問題',
    '修正 iPad 橫放時，畫面比螢幕高、要往下滑才看得到下面的問題',
    '修正 iPad 聊天時，按鍵盤的傳送鍵有時只會確認注音、輸入列跳到右下小窗，要再按一次才送出的問題；現在按一下就送'
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
