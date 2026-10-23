'use strict';
/* 世界時間、作物成長、地圖規則、小村與西邊森林 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 世界時間（所有玩家一樣） ---------- */
function world() {
  const ms = srvNow();
  const min = (((ms + 8 * 3600000) % 86400000) + 86400000) % 86400000 / 60000;   // 現實時間 GMT+8，0~1440 分鐘
  const hh = Math.floor(ms / 3600000);
  const wet = precipHour(hh), snow = wet && (seasonAt(ms) === 'winter' || (SNOW_ON && hash(hh, 0, 78) < 0.35));  // 雨雪都算「降水」；降水時作物不用澆水                         // 每個整點小時隨機決定一次天氣
  return { min, wet, snow };
}
/* 下雪開關：false = 降水時一律下雨；接近聖誕想開雪天時，改成 true 即可（不用動資料庫） */
const SNOW_ON = false;
/* 降水時段（要和 SQL 的 _precip 一致）：這個整點小時有沒有下雨或下雪 */
function precipHour(h) { return hash(h, 0, 77) < 0.25; }
/* 從 t0 到 t1（毫秒）作物「有水」的秒數：降水的小時整段都算，其餘只算到 wu（澆水的濕潤期限）為止。
   最多回算 720 小時，和 SQL 的 _wet_secs 完全相同。 */
let noPrecip = false;   // 伺服器退回過「還沒長好」→ 這個伺服器不算降水時間，之後客戶端也不算，避免誤判成熟
function wetSecs(t0, t1, wu) {
  if (!(t1 > t0)) return 0;
  const h1 = Math.floor(t1 / 3600000), h0 = Math.max(Math.floor(t0 / 3600000), h1 - 720);
  let tot = 0;
  for (let h = h0; h <= h1; h++) {
    const a = Math.max(t0, h * 3600000), b = Math.min(t1, (h + 1) * 3600000);
    if (b <= a) continue;
    if (!noPrecip && precipHour(h)) tot += b - a;
    else if (wu && wu > a) tot += Math.max(0, Math.min(b, wu) - a);
  }
  return tot / 1000;
}
function darkness(m) {
  if (m < 300) return 1;
  if (m < 360) return 1 - (m - 300) / 60;
  if (m < 1020) return 0;
  return clamp((m - 1020) / 270, 0, 1);
}

/* ---------- 作物成長（和伺服器同一套算法） ---------- */
const growSec = k => (cropCfg[k] ? cropCfg[k].grow_s : 1800);
let cropCfg = {};
/* 作物目前賣價：當季 +25%（要和 SQL 的 _crop_price 一致） */
function cropPrice(k) {
  const c = CROPS[k], sn = (cropCfg[k] || {}).seasons;
  return sn && sn !== 'any' && sn.split(',').includes(seasonAt(srvNow())) ? Math.floor((c.sell * 125 + 50) / 100) : c.sell;
}
function seasonTag(k) {
  const sn = (cropCfg[k] || {}).seasons;
  if (!sn || sn === 'any') return '';
  return sn.split(',').includes(seasonAt(srvNow())) ? '（當季 +25%）' : '（' + sn.split(',').map(x => SEA_SHORT[x]).join('') + '季 +25%）';
}
const buffOn = k => (+buffs[k] || 0) > srvNow();   // 毫秒時間戳超過 32 位元，不能用 | 0
const toolN = lv => lv >= 3 ? 5 : lv === 2 ? 3 : 1;   // 鋤頭／水壺一次處理幾格（面向方向排成一直線）
function grownNow(p) {
  if (!p.crop) return 0;
  let g = p.grown;
  g += wetSecs(p.tick, srvNow(), p.wet);          // 澆過水的時間 + 下雨下雪的時間
  return Math.min(g, growSec(p.crop));
}
const progress = p => p.crop ? grownNow(p) / growSec(p.crop) : 0;
/* 可以收成：多留 3 秒緩衝，避免本機時鐘和伺服器差一點點，剛成熟就按會被伺服器退回「還沒長好」 */
const ripeNow = p => !!(p && p.crop && p.grown + wetSecs(p.tick, srvNow(), p.wet) >= growSec(p.crop) + 3);
const isWet = p => !!(p.wet && p.wet > srvNow());
function settleLocal(p) { p.grown = grownNow(p) ; p.tick = srvNow(); }
const fromServer = j => ({ crop: j.crop || null, grown: +j.grown || 0, tick: +j.tick || 0, wet: j.wet ? +j.wet : null, fert: j.fert | 0 });


/* ---------- 地圖規則（要和 schema.sql 的 _farmable 一致） ---------- */
/* 農場右邊多一道村莊大門，通往公共廣場 */
const GT = 7, FR = 8, BN = 9, TS = 10, BD = 11, BR = 12, RK = 13, NP = 14, HB = 15, FG = 16, WL = 17, TG = 18;   // HB 建築 FG 小村通往農場的門 WL 水井 TG 農場通往小村的門
const CS = 29, BS = 30, FS = 31, RS = 32, WK = 33;   // WK 村長家（園藝工坊）的門   // RS 牧場小屋的門（室內場景 'stylist' 的 ranch 房間）   // CS 裁縫鋪的門  BS 理髮店的門  FS 家具店的門（走進去是室內場景 'stylist'）
const FW = 40, FE = 41, CV = 42, CW = 43, CX = 44;   // CW 山洞岩壁  CX 山洞出口   // FW 小村通往西邊森林的門  FE 森林回小村的門  CV 森林北邊的山洞入口
   // BD：委託布告欄（農場）   // TS：塔羅小攤（3×2 格，不能走進去，面向它按動作鍵占卜）
for (let x = 15; x <= 18; x++) kind[5][x] = P;
kind[5][19] = GT;
/* 穀倉＋筒倉（農場上方 4×2，原本雜貨攤的位置）、礦石（順序要和 SQL mine(0~5) 對應）、旅行商人的位置（週五六日才出現） */
for (let y = 1; y <= 2; y++) for (let x = 12; x <= 15; x++) kind[y][x] = BR;
const ROCKS = [[3, 3], [12, 3], [5, 6], [10, 6], [3, 9], [13, 9]];   // 礦石在北邊山洞裡（順序要和 SQL mine(0~5) 對應），農場上沒有礦石
const CAW = 16, CAH = 12;
const cakind = Array.from({ length: CAH }, () => Array(CAW).fill(G));
for (let y = 0; y < CAH; y++) for (let x = 0; x < CAW; x++) if (x === 0 || y === 0 || x === CAW - 1 || y === CAH - 1) cakind[y][x] = CW;
[[7, 4], [8, 4], [7, 8], [1, 6], [14, 5]].forEach(([x, y]) => { cakind[y][x] = CW; });   // 洞裡的石柱
cakind[CAH - 1][8] = CX;
ROCKS.forEach(([x, y]) => { cakind[y][x] = RK; });
const MXT = 18, MYT = 10;   // 旅行商人在雷克斯小村的攤位
/* 村民（站在固定位置，面向他們按動作鍵對話；故事任務要找對應的人。位置要避開 SQL _yard_ok 的排除格） */
const NPCS = [
  { k: 'oak', n: '橡果村長', x: 14, y: 6, where: '村長家門口' },
  { k: 'gui', n: '桂花婆婆', x: 6, y: 6, where: '西邊的粉紅小屋門口' },
  { k: 'li', n: '老鯉叔', x: 10, y: 15, where: '村子西南的池塘邊' },
  { k: 'luo', n: '阿洛', x: 15, y: 7, sc: 'forest', where: '森林北邊的山洞外面' },
  { k: 'mo', n: '小茉', x: 21, y: 6, where: '紅色牧場小屋門口' }
];
/* ---------- 雷克斯小村（32×22，鏡頭跟隨）：村民、布告欄、旅行商人都在這裡 ---------- */
const TW = 32, TH = 22;
const tkind = Array.from({ length: TH }, () => Array(TW).fill(G));
for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (x === 0 || y === 0 || x === TW - 1 || y === TH - 1) tkind[y][x] = TR;
const TOWN_BLD = [
  { x: 3, y: 3, w: 5, h: 3, t: 'cottage', sign: 'cloth' },    // 桂花婆婆的家，門在 (5,5)
  { x: 11, y: 2, w: 5, h: 4, t: 'chief' },     // 村長家，門在 (13,5)
  { x: 18, y: 3, w: 5, h: 3, t: 'ranch' },     // 牧場小屋，門在 (20,5)
  { x: 19, y: 12, w: 5, h: 3, t: 'salon' },     // 理髮店，門在 (21,14)，站在 (21,15) 面向上
  { x: 25, y: 3, w: 5, h: 3, t: 'furn' }        // 家具店（森林木屋），門在 (27,5)，站在 (27,6) 面向上
];
TOWN_BLD.forEach(b => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) tkind[y][x] = HB; });
tkind[5][5] = CS; tkind[14][21] = BS; tkind[5][27] = FS; tkind[5][20] = RS; tkind[5][13] = WK;   // 三間店的門
for (let x = 1; x <= 30; x++) tkind[11][x] = P;                               // 東西向大路
[5, 13, 20, 27].forEach(x => { for (let y = 6; y <= 10; y++) tkind[y][x] = P; }); // 各家門前的小路
for (let y = 10; y <= 14; y++) for (let x = 13; x <= 17; x++) tkind[y][x] = P;   // 中央小廣場
for (let y = 12; y <= 15; y++) tkind[y][11] = P;                              // 通往池塘的小路
tkind[12][15] = WL;                                                           // 水井
for (let y = 14; y <= 19; y++) for (let x = 3; x <= 9; x++) tkind[y][x] = WA; // 西南池塘
[[2, 8], [2, 13], [10, 8], [11, 18], [12, 20], [19, 15], [21, 17], [24, 13], [26, 16], [28, 19], [22, 19], [17, 17], [8, 12], [29, 8], [23, 9], [6, 12], [15, 18], [28, 13]].forEach(([x, y]) => { tkind[y][x] = TR; });
tkind[10][9] = BD;                                                            // 委託布告欄
tkind[11][TW - 1] = FG;                                                       // 村口：回農場
tkind[11][0] = FW;                                                            // 村子最西邊：通往森林
NPCS.forEach(q => { if (q.sc !== 'forest') tkind[q.y][q.x] = NP; });
const npcAt = (x, y) => NPCS.find(q => q.x === x && q.y === y && (q.sc || 'town') === scene);
kind[5][0] = TG; for (let x = 1; x <= 3; x++) kind[5][x] = P;                 // 農場西邊的出口，通往小村

/* ---------- 西邊森林（30×26，鏡頭跟隨）：有蟲可抓、有池塘可釣魚，北邊有山洞入口 ---------- */
const FOW = 30, FOH = 26;
const FOREST_BLD = [{ x: 12, y: 2, w: 5, h: 4, t: 'mine' }];   // 北邊的山洞，洞口在 (14,5)，站在 (14,6) 面向上
const FOREST_XTRA = 0;   // 森林額外多出幾隻蟲（要伺服器 bug_catch 一起放寬 p_i 才能開，目前和農場共用同一輪的 3 隻）
const fkind = Array.from({ length: FOH }, () => Array(FOW).fill(G));
for (let y = 0; y < FOH; y++) for (let x = 0; x < FOW; x++) if (x === 0 || y === 0 || x === FOW - 1 || y === FOH - 1) fkind[y][x] = TR;
{
  const ponds = [[8, 18.5, 5.2, 3.8], [23, 8, 2.8, 2.1]];
  ponds.forEach(([cx, cy, rx, ry]) => {
    for (let y = 1; y < FOH - 1; y++) for (let x = 1; x < FOW - 1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy + (hash(x, y, 41) - 0.5) * 0.3 <= 1) fkind[y][x] = WA;
    }
  });
  for (let y = 1; y < FOH - 1; y++) for (let x = 1; x < FOW - 1; x++) {
    if (fkind[y][x] !== G) continue;
    const corridor = y >= 12 && y <= 14;                       // 東西向的小路兩旁留空
    const approach = x >= 12 && x <= 16 && y <= 13;            // 山洞前面留空
    let nearWater = false;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (fkind[y + j] && fkind[y + j][x + i] === WA) nearWater = true;
    if (!corridor && !approach && !nearWater && hash(x, y, 77) < 0.14) fkind[y][x] = TR;
  }
}
FOREST_BLD.forEach(b => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) fkind[y][x] = HB; });
fkind[5][14] = CV;                                              // 山洞入口
for (let x = 14; x <= FOW - 2; x++) fkind[13][x] = P;           // 從村子過來的小路
for (let y = 6; y <= 13; y++) fkind[y][14] = P;                 // 通往山洞的小路
fkind[13][FOW - 1] = FE;                                        // 森林東邊：回小村
NPCS.forEach(q => { if (q.sc === 'forest') fkind[q.y][q.x] = NP; });   // 阿洛站在山洞外面
const NPC_CH = ['oak', 'gui', 'li', 'luo', 'mo', 'oak'], CH_PL = [1, 2, 2, 3, 4, 5];   // 第幾章找誰、玩家等級（要和 SQL story_chapters 一致；只用來顯示「!」標記）
const NPC_TALK = {
  oak: { idle: ['今天的露水特別亮呢。', '有空就來布告欄看看，每週都有新委託。'], after: ['種子需要時間，別急。', '村子能熱鬧起來，多虧有你。'], end: ['祭典真熱鬧，謝謝你。晨露種子就拜託你了。', '花開的那天，我們再見。'] },
  gui: { idle: ['年紀大了，記性不好，唉。', '廚房的香味最能讓人想起以前。'], after: ['祭典湯的味道，我又想起來了。', '來，喝碗湯暖暖身子。'], end: ['這輩子還能再煮一次祭典湯，真好。'] },
  li: { idle: ['……噓，魚被你嚇跑了。', '池塘的魚，各有各的脾氣。'], after: ['那條老鯉魚，後來再也沒上鉤。', '鑰匙派上用場，我就放心了。'], end: ['老傢伙，今天也來釣魚吧。'] },
  luo: { idle: ['礦石敲一敲，就有銅和石頭！', '聽說最深處有水晶，運氣好才挖得到。'], after: ['坑道加固之後，安全多了！', '下次想挖礦，記得帶鎬子。'], end: ['祭典上的礦燈，是我親手掛的！'] },
  mo: { idle: ['我家的雞和牛今天心情都很好！', '想養動物的話，記得準備乾草。'], after: ['祭典糕大成功！我也想再烤一次。', '牛奶和雞蛋隨時歡迎來拿。'], end: ['下次豐收祭，我們烤更大的糕！'] }
};
const merchantDay = () => Math.floor((srvNow() + 8 * 3600000) / 86400000);
const merchantHere = () => [5, 6, 0].includes((merchantDay() % 7 + 4) % 7);   // 和 SQL _merchant_here 一致
/* 廣場地圖：中央噴水池、十字步道、長椅，下方是回農場的門 */
const pkind = Array.from({ length: H }, () => Array(W).fill(G));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x === 0 || y === 0 || x === W - 1 || y === H - 1) pkind[y][x] = TR;
for (let x = 1; x <= 18; x++) pkind[7][x] = P;
for (let y = 1; y <= 12; y++) pkind[y][10] = P;
for (let x = 8; x <= 12; x++) for (let y = 5; y <= 9; y++) if (x === 8 || x === 12 || y === 5 || y === 9) pkind[y][x] = P;
for (let x = 9; x <= 11; x++) for (let y = 6; y <= 8; y++) pkind[y][x] = FR;
pkind[7][10] = WA;
[[6, 4], [14, 4], [6, 10], [14, 10]].forEach(([x, y]) => { pkind[y][x] = BN; });
for (let y = 9; y <= 12; y++) for (let x = 15; x <= 18; x++) {
  const dx = (x - 16.5) / 2.4, dy = (y - 10.6) / 2.4;
  if (dx * dx + dy * dy + hash(x, y, 9) * 0.25 <= 1) pkind[y][x] = WA;
}
[[3, 3], [16, 3], [3, 10], [2, 11], [5, 2], [15, 2], [2, 6], [17, 8]].forEach(([x, y]) => { pkind[y][x] = TR; });
for (let y = 1; y <= 2; y++) for (let x = 9; x <= 11; x++) pkind[y][x] = TS;   // 直路最北端，緊貼上方樹籬的正中間
pkind[13][10] = GT;
let scene = 'farm', K = kind;
const farmBase = (x, y) => x >= 2 && x <= 13 && y >= 6 && y <= 12 && kind[y][x] === G;
const plv = () => lv ? lv.pl : 99;
/* 田地數量上限依玩家等級（要和 SQL 的 _plot_cap 一致）；位置自己選。還沒讀到等級就先不限 */
const PLOT_CAP = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
const plotCap = () => lv ? PLOT_CAP[Math.min(lv.pl, 10) - 1] : 999;
const nextCap = () => lv && lv.pl < 10 ? PLOT_CAP[lv.pl] : 0;
const farmable = (x, y) => farmBase(x, y);
const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H &&
  (K[y][x] === G || K[y][x] === P) && (scene !== 'house' || !houseBlocked(x, y)) && !(scene === 'town' && (x === MXT || x === MXT + 1) && y === MYT && merchantHere()) && !(scene === 'farm' && yardBlocks(x, y));
function tryMove(dir) {
  const d = DIRS[dir];
  pl.face = dir;
  const nx = pl.x + d[0], ny = pl.y + d[1];
  if (walkable(nx, ny)) { pl.sx = pl.x; pl.sy = pl.y; pl.x = nx; pl.y = ny; pl.prog = 0; pl.step++; tutEvent('move'); }
}
const facing = () => [pl.x + DIRS[pl.face][0], pl.y + DIRS[pl.face][1]];
