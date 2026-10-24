'use strict';
/* 狀態與小提示、特效 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 狀態（以伺服器為準） ---------- */
let sb = null;
let me = null;                    // { username, name, look, coins }
let inv = {};                     // 's:radish' / 'c:radish' -> 數量
const INV_CAP = 999;             // 每種物品最多 999 個（要和 SQL 的上限一致；真正擋住的是伺服器，這裡只負責顯示）
let plots = new Map();            // 'x,y' -> { crop, grown, tick, wet }
let cfg = { wet_s: 10800 };
let tool = 0, offset = 0, ready = false;
/* 快捷列 1~6 號格各裝哪個物品（存的是 TOOLS 目錄的編號，-1 = 空格），可在背包裡自己安排 */
const DEFHOT = [0, 1, 2, 3, 4, 5];
/* 快捷列共 3 組，每組 6 格；hot 永遠指向「目前這一組」的陣列，所以其他程式照舊讀寫 hot 就好 */
const HOT_SETS = 3;
let hotSets = [DEFHOT.slice(), Array(6).fill(-1), Array(6).fill(-1)], hotPage = 0;
let hot = hotSets[0];
const curTool = () => TOOLS[hot[tool]] || { id: 'none', n: '空格' };
let fishCat = [], fishLog = {}, rods = [], bugCat = [], bugLog = {};
let recipes = [], buffs = {}, toolLv = { hoe: 1, can: 1 }, toolCost = {};   // 料理食譜、buff（種類 -> 結束毫秒）、鋤頭／水壺等級
let featNeed = { ranch: 2, forage: 2, yard: 2, mine: 4, cave: 4, town: 1, forest: 3 };
const FEAT_N = { ranch: '動物牧場', forage: '採集', yard: '庭院佈置', mine: '採礦', cave: '山洞', town: '雷克斯小村', forest: '西邊森林' };
let fishRec = {}, yardMap = new Map(), ycat = [], storyDone = 0, yardSel = '', stData = null, bdTab = 'order', stBusy = false;
const MINE_FALLBACK = {
  'm:stone': { name: '石頭', shape: 'rock', color: '#b4b8c4' }, 'm:copper': { name: '銅礦', shape: 'ore', color: '#d98a52' }, 'm:gem': { name: '水晶', shape: 'gem', color: '#8fd3ff' },
  'm:iron': { name: '鐵礦', shape: 'ore', color: '#8e93a6' }, 'm:coal': { name: '煤炭', shape: 'rock', color: '#4a4658' }, 'm:gold': { name: '金礦', shape: 'ore', color: '#ffd34d' }
};
/* 伺服器的物品表沒列到的雜物，用內建的中文名稱和圖示當後備（不然商人、牧場、背包會直接顯示 hay、fert2、egg 這種英文代號）。價格交給伺服器，這裡只管名字和外觀。 */
const ITEM_FALLBACK = {
  'a:hay': { name: '乾草', shape: 'sack', color: '#e8c070' }, 'a:egg': { name: '雞蛋', shape: 'round', color: '#fff3d6' },
  'a:milk': { name: '牛奶', shape: 'bottle', color: '#ffffff' }, 'a:wool': { name: '羊毛', shape: 'cloud', color: '#f4f4f4' },
  'x:fert': { name: '肥料', shape: 'sack', color: '#8c6a44' }, 'x:fert2': { name: '高級肥料', shape: 'sack', color: '#f0c040' }
};
const fallbackItem = k => ITEM_FALLBACK[k] || ITEM_FALLBACK['a:' + k] || ITEM_FALLBACK['x:' + k] || null;   // 也接受沒有前綴的寫法（egg、hay、fert2）
let itemMeta = {}, forPool = [], forTaken = new Set(), fgSlot = -1, rocksAt = {}, fgList = [];
let soldToday = {}, soldDay = 0, bugTaken = new Set(), dexClaims = {};
/* 收購飽和（要和 SQL 的 _sell_value 一致）：每種魚、蟲每天前 5 隻原價、第 6~10 隻 6 折、之後 3 折（GMT+8 凌晨重置） */
const sellDayNow = () => Math.floor((srvNow() + 8 * 3600000) / 86400000);
const soldOf = item => (soldDay === sellDayNow() ? (soldToday[item] | 0) : 0);
function sellValue(sold, qty, price) {
  return Math.min(qty, Math.max(0, 5 - sold)) * price
    + Math.max(0, Math.min(sold + qty, 10) - Math.max(sold, 5)) * Math.max(1, Math.floor((price * 6 + 5) / 10))
    + Math.max(0, sold + qty - Math.max(sold, 10)) * Math.max(1, Math.floor((price * 3 + 5) / 10));
}
const pl = { x: 4, y: 4, sx: 4, sy: 4, prog: 1, face: 'down', step: 0 };
const srvNow = () => Date.now() + offset;

let bagOpen = false, shopOpen = false, makerOpen = false, authOpen = true, actQueued = false, actHeld = false, actPtr = -1, firstTime = false, vmOpen = false, gmOpen = false;
let pendingInvite = '';
const pressed = [];
let frOpen = false;
let lkOpen = false, bdOpen = false, ckOpen = false, rcOpen = false, mcOpen = false, dgOpen = false;
let syOpen = false, lvOpen = false, cdOpen = false, dexOpen = false, qOpen = false, dsOpen = false, emOpen = false, stOpen = false, imm = false, sheetOpen = false, trOpen = false;
let pnOpen = false;
const paused = () => lkOpen || bdOpen || ckOpen || rcOpen || mcOpen || dgOpen || lvOpen || cdOpen || dexOpen || qOpen || dsOpen || pnOpen || stOpen || trOpen || (imm && sheetOpen) || frOpen || mlOpen || bagOpen || shopOpen || makerOpen || authOpen || vmOpen || gmOpen || fOpen || syOpen || !ready;

/* ---------- 小提示與特效 ---------- */
const toastEl = $('toast');
let toastTimer = 0;
function toast(msg, ms = 2800) {
  toastEl.textContent = msg; toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}
const pops = [], fx = [];
const pop = (x, y, txt, col = '#ffffff') => pops.push({ x: x * T + 8, y: y * T + 2, l: 0, txt, col });
function burst(x, y, n, cols, vy0, spread) {
  for (let i = 0; i < n; i++) fx.push({
    x: x * T + 8 + (Math.random() - 0.5) * spread, y: y * T + 8,
    vx: (Math.random() - 0.5) * 1.2, vy: vy0 + (Math.random() - 0.5) * 0.6,
    l: 0, max: 450 + Math.random() * 250, c: cols[(Math.random() * cols.length) | 0]
  });
}
const dust = (x, y) => burst(x, y, 8, ['#8b5e38', '#a37548', '#6e4727'], -0.8, 10);
const drops = (x, y) => burst(x, y, 7, ['#8fd3ff', '#58b2e6'], 0.3, 10);
const splash = (x, y) => burst(x, y, 10, ['#8fd3ff', '#ffffff', '#58b2e6'], -1.4, 12);
const sparkle = (x, y, c) => burst(x, y, 10, [c, '#fff6a8', '#ffffff'], -1.6, 10);
const rain = Array.from({ length: 70 }, () => ({ x: Math.random() * W * T, y: Math.random() * H * T }));
