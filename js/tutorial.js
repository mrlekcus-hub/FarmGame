'use strict';
/* 新手教學 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 新手教學：跟著動作自動前進，可隨時跳過或從快捷列重玩 ---------- */
const TUT = [
  { t: '走走看', d: '用左下角的搖桿（電腦用方向鍵或 WASD）在農場上走幾步。', ev: 'move' },
  { t: '翻土', d: '選工具列的「鋤頭」（電腦按 1），面向房子下方的草地，按「動作」鍵翻出一塊田。', ev: 'till' },
  { t: '播種', d: '選「蘿蔔種子」（電腦按 3），面向剛翻好的土按「動作」。你一開始有 5 顆種子。', ev: 'plant' },
  { t: '澆水', d: '選「水壺」（電腦按 2），面向作物按「動作」。晴天要澆水作物才會長；下雨和下雪時會自動澆水，不用澆！', ev: 'water' },
  { t: '等它長大', d: '作物依真實時間成長（蘿蔔約 30 分鐘），關掉遊戲也會繼續長。回來看到作物成熟，面向它按「動作」就能收成。', ev: null },
  { t: '雜貨攤', d: '走到農場上方小路旁的柴犬雜貨攤前面，按「動作」：可以買種子、賣作物和魚。庭院裝飾和工具升級要到小村的村長家（園藝工坊）。', ev: 'shop' },
  { t: '釣魚', d: '選「釣竿」（電腦按 6），面向池塘按「動作」拋竿；看到紅色驚嘆號時馬上再按一次拉竿，太早或太慢魚會跑掉。', ev: 'fish' },
  { t: '回家布置', d: '走到房子的門前按「動作」進屋，換牆面和地板、布置自己的家；家具要到小村右上角的家具店買，每天上架的都不一樣。', ev: 'house' },
  { t: '雷克斯小村', d: '農場左邊（西邊）的大門通往「雷克斯小村」，村裡有居民、布告欄和旅行商人。頭上有黃色「！」的居民有故事要告訴你，走近按「動作」就能對話。', ev: null },
  { t: '布告欄與每週委託', d: '小村的布告欄每週更新一次委託，交付作物或料理可得金幣，還能拿玩家經驗。「故事」分頁會記錄劇情進度，並提示下一位該去找誰。', ev: null },
  { t: '更多工具', d: '工具列的「鎬子」可敲礦石（Lv.4 解鎖山洞與採礦）；「肥料」能提升作物品質，品質分銀星、金星，特定作物還能雜交出新品種；「庭院」工具能在農場擺放裝飾（Lv.2 解鎖）。', ev: null },
  { t: '牧場、採集與商人', d: 'Lv.2 解鎖動物牧場：走進農場上方的穀倉，能看到動物在裡面走動；飼料槽餵乾草、收成籃收蛋奶毛；買動物和乾草要到雷克斯小村的牧場小屋找小茉（養雞，牛 Lv.3、羊 Lv.5）。另外還有野外採集。旅行商人只在週五、六、日出現，會賣稀有東西。釣到的魚會記錄最大尺寸，在圖鑑裡看。', ev: null },
  { t: '快捷列與廣場', d: '右上角的快捷列可以隨時開背包、好友、信箱（寄明信片給好友，1～10 金幣）、圖鑑、等級。農場右邊的大門通往廣場，能聊天、釣魚、交朋友。玩家等級靠每日任務和每週委託升級，詳情看「等級與解鎖」。想重看教學，點「❓教學」。', ev: null }
];
const tutEl = $('tut');
let tutI = -1, tutMoves = 0;
const tutKey = () => 'dewfarm_tut_' + authUser;
const tutSave = v => { try { localStorage.setItem(tutKey(), String(v)); } catch (e) { /* 略過 */ } };
function tutRender() {
  if (tutI < 0 || tutI >= TUT.length) { tutEl.hidden = true; return; }
  const s = TUT[tutI], last = tutI === TUT.length - 1;
  tutEl.innerHTML = '<div class="tut-h"><b>新手教學 ' + (tutI + 1) + '/' + TUT.length + '</b><button type="button" class="tutx" data-t="skip">關閉教學</button></div>' +
    '<div class="tut-t">' + esc(s.t) + '</div><p>' + esc(s.d) + '</p>' +
    '<div class="tut-b"><span class="tut-wait">' + (s.ev ? '做完動作會自動下一步' : '') + '</span>' +
    '<button type="button" class="btn small' + (s.ev ? ' ghost' : '') + '" data-t="next">' + (last ? '完成' : s.ev ? '略過這步' : '下一步') + '</button></div>';
  tutEl.hidden = false;
}
function tutStart(i) { tutI = i || 0; tutMoves = 0; tutSave(tutI); tutRender(); }
function tutNext() {
  tutI++; tutMoves = 0;
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
  if (b.dataset.t === 'skip') tutDone(true); else tutNext();
});
tutEl.addEventListener('pointerdown', e => e.stopPropagation());
