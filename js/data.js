'use strict';
/* 資料、地圖、季節 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 資料 ---------- */
const CROPS = {
  radish:  { n: '蘿蔔', days: 3, buy: 10, sell: 25,  c: '#ff8fa8' },
  tomato:  { n: '番茄', days: 5, buy: 20, sell: 55,  c: '#ff6b5e' },
  pumpkin: { n: '南瓜', days: 8, buy: 40, sell: 130, c: '#ffab4a' },
  beet:    { n: '甜菜', days: 1, buy: 25, sell: 85,  c: '#b0386a', hy: true },
  corn:    { n: '玉米', days: 3, buy: 45, sell: 170, c: '#ffd84a', hy: true },
  melon:   { n: '蜜瓜', days: 5, buy: 70, sell: 280, c: '#8fd67a', hy: true }
};
const KEYS = ['radish', 'tomato', 'pumpkin'];            // 雜貨攤買得到的種子
const ALLK = ['radish', 'tomato', 'pumpkin', 'beet', 'corn', 'melon'];   // 含雜交作物
const TOOLS = [
  { id: 'hoe', n: '鋤頭' },
  { id: 'can', n: '水壺' },
  { id: 'seed', crop: 'radish', n: '蘿蔔種子' },
  { id: 'seed', crop: 'tomato', n: '番茄種子' },
  { id: 'seed', crop: 'pumpkin', n: '南瓜種子' },
  { id: 'rod', n: '釣竿' },
  { id: 'net', n: '捕蟲網' },
  { id: 'seed', crop: 'beet', n: '甜菜種子' },
  { id: 'seed', crop: 'corn', n: '玉米種子' },
  { id: 'seed', crop: 'melon', n: '蜜瓜種子' },
  { id: 'pick', n: '鎬子' },
  { id: 'fert', n: '肥料' },
  { id: 'yard', n: '庭院佈置' }
];
const CAN_MAX = 12;

/* ---------- 地圖 ---------- */
const G = 0, P = 1, WA = 2, TR = 3, HO = 4, DR = 5, SH = 6;
const kind = Array.from({ length: H }, () => Array(W).fill(G));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (x === 0 || y === 0 || x === W - 1 || y === H - 1) kind[y][x] = TR;
}
for (let y = 1; y <= 3; y++) for (let x = 2; x <= 6; x++) kind[y][x] = HO;
kind[3][4] = DR;
for (let y = 3; y <= 4; y++) for (let x = 9; x <= 10; x++) kind[y][x] = SH;   // 柴犬雜貨攤（2×2，面向它按動作鍵）
kind[4][4] = P;
for (let x = 4; x <= 14; x++) kind[5][x] = P;
for (let y = 3; y <= 5; y++) { kind[y][13] = P; kind[y][14] = P; }
for (let y = 8; y <= 12; y++) for (let x = 14; x <= 18; x++) {
  const dx = (x - 16) / 2.7, dy = (y - 10) / 2.7;
  if (dx * dx + dy * dy + hash(x, y, 9) * 0.25 <= 1) kind[y][x] = WA;
}
[[9, 2], [18, 4], [1, 7], [11, 12], [9, 7]].forEach(([x, y]) => { if (kind[y][x] === G) kind[y][x] = TR; });
const isWater = (x, y) => x >= 0 && y >= 0 && x < W && y < H && K[y][x] === WA;

/* ---------- 季節（要和 SQL 的 _season 一致：每 7 天換一季，春→夏→秋→冬，以 GMT+8 的日子計算） ---------- */
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_N = { spring: '🌸 春天', summer: '☀️ 夏天', autumn: '🍂 秋天', winter: '❄️ 冬天' };
const SEA_SHORT = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
const seasonAt = ms => SEASONS[Math.floor(Math.floor((ms + 8 * 3600000) / 86400000) / 7) % 4];
const inSeason = (s, sea) => !s || s === 'any' || s.split(',').includes(sea);
let SEA = 'spring';   // 目前這一幀的季節（draw 開頭更新）
const GRASSP = { spring: ['#aadd7d', '#a3d876'], summer: ['#9fd86d', '#97d266'], autumn: ['#cfd486', '#c7cc7d'], winter: ['#eaf3f7', '#e1edf2'] };
const GRASSB = { spring: ['#8ac860', '#c8ee9c'], summer: ['#7ec253', '#bfeb8c'], autumn: ['#b9bd66', '#e6e6b0'], winter: ['#cfe0e8', '#ffffff'] };
const TREEP = {
  spring: [['#fbc4d4', '#e58fab', '#ffe6ee', '#e58fab'], ['#86d98f', '#4fa968', '#b5f0b5', '#5fba76']],
  summer: [['#6fcf7e', '#3f9a58', '#a0e8a8', '#4fa968'], ['#6fcf7e', '#3f9a58', '#a0e8a8', '#4fa968']],
  autumn: [['#f2a26a', '#c46a36', '#ffd3a8', '#c46a36'], ['#f3d36b', '#c79a3a', '#fff0a8', '#c79a3a']],
  winter: [['#eef6fa', '#9fbccd', '#ffffff', '#b9d0de'], ['#e4eff5', '#9fbccd', '#ffffff', '#b9d0de']]
};
