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
const SB = 60;   // 廣場左上角的蛇梯棋棋盤（js/snakes.js），縮成 4×4 格，放在廣場左上角 (2,2)～(5,5)，走不進去，面向它按動作鍵開始
const CS = 29, BS = 30, FS = 31, RS = 32, WK = 33;   // WK 村長家（園藝工坊）的門   // RS 牧場小屋的門（室內場景 'stylist' 的 ranch 房間）   // CS 裁縫鋪的門  BS 造型店的門  FS 家具店的門（走進去是室內場景 'stylist'）
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
  { x: 19, y: 12, w: 5, h: 3, t: 'salon' },     // 造型店（髮型、帽子、眼鏡），門在 (21,14)，站在 (21,15) 面向上
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
/* 廣場地圖（30×20，鏡頭跟隨）：中央噴水池、十字步道、長椅，下方是回農場的門。
   原本 20×14 的廣場整組往右下平移 (PXO, PYO)，四周多出一圈空地；萬聖節、路燈、塔羅攤等舊座標都是「舊廣場座標」，畫的時候加上位移。 */
const PLW = 30, PLH = 20, PXO = 5, PYO = 3;
const pkind = Array.from({ length: PLH }, () => Array(PLW).fill(G));
for (let y = 0; y < PLH; y++) for (let x = 0; x < PLW; x++) if (x === 0 || y === 0 || x === PLW - 1 || y === PLH - 1) pkind[y][x] = TR;
{
  const ps = (x, y, k) => { pkind[y + PYO][x + PXO] = k; };   // 用舊廣場座標放東西
  for (let x = 1; x <= PLW - 2; x++) pkind[PYO + 7][x] = P;                 // 東西向的大路一路通到兩邊
  for (let y = PYO + 3; y <= PLH - 2; y++) pkind[y][PXO + 10] = P;          // 南北向的直路：塔羅攤下面一路通到大門
  for (let x = 8; x <= 12; x++) for (let y = 5; y <= 9; y++) if (x === 8 || x === 12 || y === 5 || y === 9) ps(x, y, P);
  for (let x = 9; x <= 11; x++) for (let y = 6; y <= 8; y++) ps(x, y, FR);
  ps(10, 7, WA);
  [[6, 10]].forEach(([x, y]) => ps(x, y, BN));   // 水池旁的兩張、大路上方的單人椅都拿掉了
  for (let y = 8; y <= 14; y++) for (let x = 13; x <= 21; x++) {   // 右下的大水池（放大版：新地圖約 7×5 格，和大路中間隔一排草地）
    const dx = (x - 17) / 3.3, dy = (y - 11) / 2.8;
    if (dx * dx + dy * dy + hash(x, y, 9) * 0.25 <= 1) ps(x, y, WA);
  }
  [[16, 3], [3, 10], [2, 11], [15, 2], [17, 8]].forEach(([x, y]) => ps(x, y, TR));
  for (let y = 1; y <= 2; y++) for (let x = 9; x <= 11; x++) ps(x, y, TS);   // 直路最北端的塔羅攤
  [[3, 9], [4, 11], [21, 9], [22, 9]].forEach(([x, y]) => { pkind[y][x] = BN; });   // 外圍長椅（新座標）；(21,9)(22,9) 兩格相連是一張雙人長椅，在大路上方
  for (let y = 2; y <= 5; y++) for (let x = 2; x <= 5; x++) pkind[y][x] = SB;   // 蛇梯棋縮小成 4×4 格，放在整張地圖的左上角
  /* 新增的外圈空地：零星種樹（路、水、長椅旁和大門前面留空） */
  for (let y = 1; y < PLH - 1; y++) for (let x = 1; x < PLW - 1; x++) {
    if (pkind[y][x] !== G) continue;
    if (x >= PXO && x < PXO + BW && y >= PYO && y < PYO + BH) continue;   // 舊廣場範圍內維持原樣
    if (x >= PXO + 8 && x <= PXO + 12 && y >= PLH - 5) continue;           // 大門前面
    let near = false;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const q = pkind[y + j] && pkind[y + j][x + i]; if (q !== undefined && q !== G && q !== TR) near = true; }
    if (!near && hash(x, y, 53) < 0.16) pkind[y][x] = TR;
  }
}
pkind[PLH - 1][PXO + 10] = GT;
let scene = 'farm', K = kind;
const farmBase = (x, y) => x >= 2 && x <= 13 && y >= 6 && y <= 12 && kind[y][x] === G;
const plv = () => lv ? lv.pl : 99;
/* 田地數量上限依玩家等級（要和 SQL 的 _plot_cap 一致）；位置自己選。還沒讀到等級就先不限 */
const PLOT_CAP = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
const plotCap = () => lv ? PLOT_CAP[Math.min(lv.pl, 10) - 1] : 999;
const nextCap = () => lv && lv.pl < 10 ? PLOT_CAP[lv.pl] : 0;
const farmable = (x, y) => farmBase(x, y);
const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H &&
  (K[y][x] === G || K[y][x] === P) && !hwBlocked(x, y) && !plBlocked(x, y) && (scene !== 'house' || !houseBlocked(x, y)) && !(scene === 'town' && (x === MXT || x === MXT + 1) && y === MYT && merchantHere()) && !(scene === 'farm' && yardBlocks(x, y));
function tryMove(dir) {
  const d = DIRS[dir];
  pl.face = dir;
  const nx = pl.x + d[0], ny = pl.y + d[1];
  if (walkable(nx, ny)) { pl.sx = pl.x; pl.sy = pl.y; pl.x = nx; pl.y = ny; pl.prog = 0; pl.step++; }
}
/* 點地面走過去：用廣度優先搜尋找最短路徑。點到走不進去的格子（門、NPC、家具、水邊），就走到旁邊並面向它，再按動作鍵 */
let autoPath = null;
function planPath(tx, ty, force) {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
  const sx = pl.x, sy = pl.y, idx = (x, y) => y * W + x, DL = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  const direct = !force && walkable(tx, ty), goals = new Set();   // force：野外採集物、飛著的蟲，一律走到旁邊再動手
  if (direct) goals.add(idx(tx, ty));
  else DL.forEach(([, dx, dy]) => { const x = tx + dx, y = ty + dy; if (x >= 0 && y >= 0 && x < W && y < H && walkable(x, y)) goals.add(idx(x, y)); });
  if (!goals.size) return null;
  const prev = new Int16Array(W * H).fill(-2); prev[idx(sx, sy)] = -1;
  const q = [[sx, sy]]; let hit = -1;
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (goals.has(idx(x, y))) { hit = idx(x, y); break; }
    for (const [, dx, dy] of DL) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[idx(nx, ny)] !== -2 || !walkable(nx, ny)) continue;
      prev[idx(nx, ny)] = idx(x, y); q.push([nx, ny]);
    }
  }
  if (hit < 0) return null;
  const tiles = [];
  for (let c = hit; c !== idx(sx, sy); c = prev[c]) tiles.push([c % W, (c / W) | 0]);
  tiles.reverse();
  const dirs = []; let cx = sx, cy = sy;
  tiles.forEach(([x, y]) => { dirs.push(x > cx ? 'right' : x < cx ? 'left' : y > cy ? 'down' : 'up'); cx = x; cy = y; });
  const face = direct ? null : (tx > cx ? 'right' : tx < cx ? 'left' : ty > cy ? 'down' : 'up');
  return { scene, tiles, dirs, i: 0, face, tx, ty, act: !direct };   // act：點的是門、NPC、水、家具這類走不進去的格子，到了就自動按一次動作鍵
}
/* 點到可以「動手」的東西：野外採集物（農場）、拿著捕蟲網時點到的蟲蝶。回傳要動手的那一格，不是就回 null */
function tapTarget(tx, ty) {
  if (scene === 'farm' && !yardMap.has(pk(tx, ty)) && fgList.some(f => f.x === tx && f.y === ty && !forTaken.has(f.slot + ':' + f.i))) return [tx, ty, 'fg'];
  if (scene === 'farm') { const p = plots.get(pk(tx, ty)); if (p && p.crop && ripeNow(p)) return [tx, ty, 'crop']; }   // 熟了的作物也一樣：走到旁邊直接收
  if (scene === 'farm' && curTool().crop) { const p = plots.get(pk(tx, ty)); if (p && !p.crop) return [tx, ty, 'plant']; }   // 裝備種子：點翻好的空田，走到旁邊直接播種
  if (scene === 'farm' && curTool().id === 'hoe' && K[ty] && K[ty][tx] === G && !plots.has(pk(tx, ty)) && !yardMap.has(pk(tx, ty)) && farmable(tx, ty) && plots.size < plotCap()) return [tx, ty, 'till'];   // 裝備鋤頭：點能耕種的空草地，走到旁邊直接翻土
  if (scene === 'farm' && curTool().id === 'can' && !world().wet) { const p = plots.get(pk(tx, ty)); if (p && !isWet(p)) return [tx, ty, 'water']; }   // 裝備水壺：點還乾的田，走到旁邊直接澆（下雨天不用澆，照一般走路）
  if ((scene === 'farm' || scene === 'forest') && curTool().id === 'net') {
    let best = null, bd = 1.0;
    critters.forEach(c => { const d = Math.hypot(c.x - (tx + 0.5), c.y - (ty + 0.5)); if (d < bd) { bd = d; best = c; } });
    if (best) return [Math.floor(best.x), Math.floor(best.y), 'bug'];   // 蟲會飛，以牠現在所在的格子為目標；揮網有範圍，飄一點也抓得到
  }
  return null;
}
/* 走到了：採集物直接採（不靠面向那一格），其他的按一次動作鍵 */
function pathDone(a) {
  if (a.face) pl.face = a.face;
  if (!a.act) return;
  if (a.kind === 'fg' && !catchShown && !fishing) {
    const f = fgList.find(q => q.x === a.tx && q.y === a.ty && !forTaken.has(q.slot + ':' + q.i));
    if (f) { takeForage(f); return; }
  }
  actQueued = true;
}
function tapMove(e) {
  let [tx, ty] = tileFromEvent(e);
  if (catchShown) { hideCatch(); return; }   // 釣到魚、抓到蟲的視窗開著：點一下就收起來
  if (fishing) {   // 釣魚中：有咬鉤就收竿；等待中點水面不理它；點別的地方才算收竿走開
    if (fishing.phase === 'bite') { actQueued = true; return; }
    if (fishing.phase !== 'wait' || (tx === fishing.x && ty === fishing.y)) return;
  }
  const tg = tapTarget(tx, ty);
  if (tg) { tx = tg[0]; ty = tg[1]; }
  if (!tg && tx === pl.x && ty === pl.y) return;
  const p = planPath(tx, ty, !!tg);
  if (p && tg) p.kind = tg[2];
  if (!p) { pop(tx, ty - 0.3, '走不到', '#ffffff'); return; }
  if (fishing) fishCancel();
  if (cooking) cookCancel();
  if (!p.dirs.length) { if (!pose) pathDone(p); return; }
  autoPath = p;
}
function pathStep() {
  const a = autoPath;
  if (!a || a.scene !== scene) { autoPath = null; return; }
  if (a.i >= a.dirs.length) { pathDone(a); autoPath = null; return; }
  if (pose) standUp();
  const px = pl.x, py = pl.y;
  tryMove(a.dirs[a.i]);
  if (pl.x === px && pl.y === py) { autoPath = null; return; }   // 被擋住了（有東西擋路）就停下
  a.i++;
}
const facing = () => [pl.x + DIRS[pl.face][0], pl.y + DIRS[pl.face][1]];
