'use strict';
/* 新手教學 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 新手教學：跟著動作自動前進，可隨時跳過或從快捷列重玩 ---------- */
/* 步驟欄位：t 標題、d 說明（字串或函式）、ev 要等的動作（null＝按「下一步」）、
   show 條件（回傳 false 就跳過，例如電腦不顯示打橫）、btns 說明下面的小按鈕（回傳 [{t, f}]） */
const tutIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function tutSetOrient(o) {                       // 和「設定 → 畫面方向」同一套
  orientPref = o; syncOrientUI();
  try { localStorage.setItem('dw_orient', o); } catch (e) { /* 略過 */ }
  applyOrient(true);
}
const TUT = [
  { t: '走走看', d: '用左下角的搖桿（電腦用方向鍵或 WASD）在農場上走幾步。', ev: 'move' },
  { t: '打橫玩更寬', show: () => orientOK,
    d: () => '手機打橫的視野更寬：十字鍵在左、工具列和動作鈕在右，背包、好友、信箱這些收進「選單」，選單裡還有「全螢幕」。' +
      (tutIOS() ? 'iPhone 的網頁無法鎖定方向：請先關掉控制中心的「直向鎖定」，再把手機轉橫。' : '按下面的按鈕就能鎖定方向。') + '之後可以到「設定 → 畫面方向」再改。',
    btns: () => tutIOS() ? [] : [{ t: '切換成橫向', f: () => tutSetOrient('landscape') }, { t: '改回直向', f: () => tutSetOrient('portrait') }], ev: null },
  { t: '翻土', d: '選工具列的「鋤頭」（電腦按 1），面向房子下方的草地，按「動作」鍵翻出一塊田。', ev: 'till' },
  { t: '播種', d: '選「蘿蔔種子」（電腦按 3），面向剛翻好的土按「動作」。你一開始有 5 顆種子。', ev: 'plant' },
  { t: '澆水', d: '選「水壺」（電腦按 2），面向作物按「動作」。晴天要澆水作物才會長；下雨和下雪時會自動澆水，不用澆！', ev: 'water' },
  { t: '等它長大', d: '作物依真實時間成長（蘿蔔約 30 分鐘），關掉遊戲也會繼續長。回來看到作物成熟，面向它按「動作」就能收成。', ev: null },
  { t: '裝成 App 更方便', show: () => !isStandalone(),
    d: () => '趁作物長大的空檔，把遊戲裝成 App：從主畫面一點就開，全螢幕沒有網址列，打橫玩也更滿版。' +
      (installEvt ? '按下面的按鈕就能安裝。' : installSteps()) + '　之後想裝，也可以到「設定 → App 版本」。',
    btns: () => installEvt ? [{ t: '現在安裝', f: () => appBtn.click() }] : [], ev: null },
  { t: '雜貨攤', d: '走到農場上方小路旁的柴犬雜貨攤前面，按「動作」：可以買種子、賣作物和魚。數量可以按 +1、+10、+50 一次次加上去；每種東西最多持有 999 個。庭院裝飾和工具升級要到小村的村長家（園藝工坊）。', ev: 'shop' },
  { t: '釣魚', d: '選「釣竿」（電腦按 6），面向池塘按「動作」拋竿；看到紅色驚嘆號時馬上再按一次拉竿，太早或太慢魚會跑掉。', ev: 'fish' },
  { t: '回家布置', d: '走到房子的門前按「動作」進屋，換牆面和地板、布置自己的家；家具要到小村右上角的家具店買，每天上架的都不一樣。', ev: 'house' },
  { t: '做料理', d: '家裡擺一台「廚房灶台」，走到灶台旁按「動作」打開廚房，選一道料理開始烹飪。共三段：按住「動作」鍵加熱，指針進到綠區就放開，頭上的小錶會顯示火候；失誤太多會煮糊，走開就取消，材料都不會消耗。做好的料理可以吃（有加成效果）、賣錢或交委託，每天能吃的份數有上限。', ev: null },
  { t: '雷克斯小村', d: '農場左邊（西邊）的大門通往「雷克斯小村」，村裡有居民、布告欄和旅行商人。頭上有黃色「！」的居民有故事要告訴你，走近按「動作」就能對話。', ev: null },
  { t: '布告欄與每週委託', d: '小村的布告欄每週更新一次委託，交付作物或料理可得金幣，還能拿玩家經驗。「故事」分頁會記錄劇情進度，並提示下一位該去找誰。', ev: null },
  { t: '更多工具', d: '工具列的「鎬子」可敲礦石（Lv.4 解鎖山洞與採礦）；「肥料」能提升作物品質，品質分銀星、金星，特定作物還能雜交出新品種；「庭院」工具能在農場擺放裝飾（Lv.2 解鎖）。', ev: null },
  { t: '動物牧場', d: 'Lv.2 解鎖動物牧場：走進農場上方的穀倉，能看到動物在裡面走動；飼料槽餵乾草、收成籃收蛋奶毛。買動物和乾草要到雷克斯小村的牧場小屋找小茉（養雞，牛 Lv.3、羊 Lv.5）。', ev: null },
  { t: '採集、商人與圖鑑', d: '野外有可以採集的東西。旅行商人只在週五、六、日出現，會賣稀有東西。釣到的魚和抓到的蟲會記進圖鑑，魚還會記錄最大尺寸。', ev: null },
  { t: '快捷列與好友', d: '右上角的快捷列（打橫時在「選單」裡）可以隨時開背包、好友、信箱（寄明信片給好友，1～10 金幣）、圖鑑、等級。可以去好友家拜訪，也能在他的餐桌上吃東西。', ev: null },
  { t: '廣場', d: '農場右邊的大門通往廣場，能聊天、釣魚、交朋友。想重看教學，點「❓教學」。', ev: null }
];
const tutEl = $('tut');
let tutI = -1, tutMoves = 0;
const tutKey = () => 'dewfarm_tut_' + authUser;
const tutSave = v => { try { localStorage.setItem(tutKey(), String(v)); } catch (e) { /* 略過 */ } };
const tutOn = st => !st.show || st.show();                                  // 這一步現在要不要顯示
const tutText = st => typeof st.d === 'function' ? st.d() : st.d;
function tutSkipHidden() { while (tutI < TUT.length && !tutOn(TUT[tutI])) tutI++; }   // 跳過不適用的步驟（例如電腦不顯示打橫）
let tutBtns = [];
function tutRender() {
  tutSkipHidden();
  if (tutI < 0 || tutI >= TUT.length) { tutEl.hidden = true; if (tutI >= TUT.length) tutDone(false); return; }
  const s = TUT[tutI], vis = TUT.filter(tutOn), pos = vis.indexOf(s) + 1, last = pos === vis.length;
  tutBtns = s.btns ? s.btns() : [];
  tutEl.innerHTML = '<div class="tut-h"><b>新手教學 ' + pos + '/' + vis.length + '</b><button type="button" class="tutx" data-t="skip">關閉教學</button></div>' +
    '<div class="tut-t">' + esc(s.t) + '</div><p>' + esc(tutText(s)) + '</p>' +
    (tutBtns.length ? '<div class="tut-a">' + tutBtns.map((b, i) => '<button type="button" class="btn small" data-t="act" data-i="' + i + '">' + esc(b.t) + '</button>').join('') + '</div>' : '') +
    '<div class="tut-b"><span class="tut-wait">' + (s.ev ? '做完動作會自動下一步' : '') + '</span>' +
    '<button type="button" class="btn small' + (s.ev ? ' ghost' : '') + '" data-t="next">' + (last ? '完成' : s.ev ? '略過這步' : '下一步') + '</button></div>';
  tutEl.hidden = false;
}
function tutStart(i) { tutI = i || 0; tutMoves = 0; tutSave(tutI); tutRender(); }
function tutNext() {
  tutI++; tutMoves = 0; tutSkipHidden();
  if (tutI >= TUT.length) { tutDone(false); return; }
  tutSave(tutI); tutRender();
}
function tutDone(silent) {
  tutI = -1; tutEl.hidden = true; tutSave('done');
  if (!silent) toast('教學完成！祝你農場生活愉快', 3500);
}
function tutEvent(ev) {
  if (tutI < 0 || tutI >= TUT.length || TUT[tutI].ev !== ev) return;
  if (ev === 'move' && ++tutMoves < 6) return;
  if (ev !== 'move') toast('做到了！', 900);
  tutNext();
}
function tutResume() {                       // 上次沒看完的玩家，重新登入時接著看；看完或沒玩過的老玩家不會自動跳出
  let v = null;
  try { v = localStorage.getItem(tutKey()); } catch (e) { /* 略過 */ }
  const i = parseInt(v, 10);
  if (v !== null && v !== 'done' && i >= 0 && i < TUT.length) { tutI = i; tutMoves = 0; tutRender(); }
}
tutEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-t]');
  if (!b) return;
  if (b.dataset.t === 'skip') tutDone(true);
  else if (b.dataset.t === 'act') { const a = tutBtns[+b.dataset.i]; if (a) { try { a.f(); } catch (err) { /* 略過 */ } } }
  else tutNext();
});
tutEl.addEventListener('pointerdown', e => e.stopPropagation());
window.addEventListener('beforeinstallprompt', () => setTimeout(() => { if (tutI >= 0 && TUT[tutI] && TUT[tutI].t === '裝成 App 更方便') tutRender(); }, 0));   // 安裝提示晚到時，補上「現在安裝」按鈕
