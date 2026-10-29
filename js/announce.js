'use strict';
/* 更新通告 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。
   每次更新只要改下面這一份 ANNOUNCE：v 換成新的版本代號（一個新字串就會讓大家再看到一次），三塊內容各寫幾行。
   玩家每個版本只會自動看到一次（按「知道了」後記在自己的瀏覽器），新通告會直接蓋掉舊的，不保留歷史。
   不想彈窗時：把 v 設成 ''。 */
const ANNOUNCE = {
  v: '2026-10-30',
  title: '出海碼頭、砍樹、庭院佈置',
  add: [
    '<b>出海碼頭</b>：全服一起捐木頭、石頭、銅礦，把廣場的碼頭和船蓋起來，進度大家即時看得到；完工後就能組隊出海釣大魚，出海時有海浪聲 BGM',
    '<b>碼頭獎勵</b>：完工時所有捐過材料的人獲得稱號「碼頭建設者」；貢獻榜前 3 名還會收到限定家具「小船模型」（掛牆、會動），到信箱簽收',
    '<b>砍樹</b>：西邊森林（玩家 Lv.3）有 17 棵樹，背包裡的斧頭按一下就砍倒，掉木頭',
    '<b>庭院佈置</b>：右側功能列新增「🏡 庭院」，點格子就能擺放、收回裝飾'
  ],
  chg: [
    '山洞礦石從 6 顆增加到 13 顆，礦石和樹改成每天 0 點刷新',
    '斧頭、鋤頭換了新圖案，比較好分辨'
  ],
  fix: [
    '手機橫向鎖定在切換 App 後會跑掉的問題',
    '站在作物上時，左邊提示文字會一直跳動的問題'
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
