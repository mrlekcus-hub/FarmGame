'use strict';
/* 畫板（寬幅畫架、三腳畫架）：自己畫、掛在家具上、拜訪的人可以看並送愛心 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 畫存成一串字元：每格 1 個字元，0~9a~f = 調色盤編號，. = 空白；列優先。格數要和 SQL 的 _art_sizes 一致。
   rect = 畫在家具上的位置和大小（像素）；每種格數都和 rect 同比例，縮小顯示時不會變形。 */
const ART = {
  easel1: { rect: [6, 5, 20, 12], sizes: [[30, 18, '小'], [40, 24, '中'], [60, 36, '大']] },   // 寬幅畫架：5:3 橫向
  easel2: { rect: [11, 5, 10, 15], sizes: [[16, 24, '小'], [24, 36, '中'], [32, 48, '大']] }   // 三腳畫架：2:3 直式
};
const ART_PAL = ['#ff8fa8', '#ff9b7a', '#ffd27a', '#ffe08a', '#8fe09a', '#7fd08a', '#8fc8f4', '#bfe6ff', '#b99aff', '#ffb3c6', '#e8b27a', '#9b6a44', '#6b4848', '#ffffff', '#cfcfd8', '#3b3b4f'];
const ART_PAPER = [255, 247, 224];
const ART_RGB = ART_PAL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
Object.assign(ERR, { art_own: '不能給自己的畫送愛心', art_hearted: '你已經送過愛心了', art_none: '這幅畫已經不在了', art_bad: '畫的資料不對', art_not_yours: '這不是你的畫架' });

/* ---------- 家具外觀（沒有畫時只有一張空白畫布；畫好的圖由 DCONT 疊在 rect 位置） ---------- */
FURN.easel1 = (px, py) => {                        // 寬幅畫架（2x2）：橫向畫布、地上一塊調色盤
  r('rgba(90,60,40,.18)', px + 3, py + 29, 26, 2);
  r('#9b6a44', px + 6, py + 14, 2, 15); r('#9b6a44', px + 24, py + 14, 2, 15); r('#7d5535', px + 15, py + 16, 2, 12);
  ob('#fff7e0', '#9b6a44', px + 4, py + 3, 24, 16);
  r('#d9a066', px + 3, py + 19, 26, 2); r('#9b6a44', px + 3, py + 21, 26, 1);
  ob('#e8b27a', '#9b6a44', px + 18, py + 25, 9, 4); r('#ff8fa8', px + 20, py + 26, 2, 1); r('#8fc8f4', px + 23, py + 26, 2, 1); r('#ffd27a', px + 21, py + 27, 2, 1);
};
FURN.easel2 = (px, py) => {                        // 三腳畫架（2x2）：直式畫布、頂端披布、兩罐顏料
  r('rgba(90,60,40,.18)', px + 4, py + 29, 24, 2);
  for (let y = 8; y <= 29; y++) { const o = Math.round((y - 8) * 0.45); r('#9b6a44', px + 15 - o, py + y, 2, 1); r('#9b6a44', px + 15 + o, py + y, 2, 1); }
  r('#7d5535', px + 15, py + 8, 2, 20);
  ob('#fff7e0', '#9b6a44', px + 9, py + 3, 14, 19);
  r('#ff9b7a', px + 8, py + 1, 16, 3); r('#ff9b7a', px + 8, py + 4, 3, 4); r('#ff9b7a', px + 21, py + 4, 3, 3); r('#d9604a', px + 8, py + 3, 16, 1);
  ob('#ff8fa8', '#c06078', px + 3, py + 25, 4, 4); r('#ffffff', px + 4, py + 24, 2, 1);
  ob('#8fc8f4', '#5a8fb8', px + 25, py + 25, 4, 4); r('#ffffff', px + 26, py + 24, 2, 1);
};

/* ---------- 資料：artCache['屋主uid:家具id'] = { id, w, h, data, hearts, mine, ver } ---------- */
let artCache = {}, artTimer = 0, artLast = 0;
const artOwner = () => (visiting ? visiting.uid : myUid);
const artOf = it => (it && typeof it.id === 'number' ? artCache[artOwner() + ':' + it.id] || null : null);
const artHas = () => !!(house && house.items.some(i => ART[i.k]));
function artClean(a) {
  if (!a || typeof a !== 'object') return null;
  const id = +a.id, w = a.w | 0, h = a.h | 0, data = String(a.data || '');
  if (!isFinite(id) || w < 1 || h < 1 || w > 64 || h > 64 || data.length !== w * h || !/^[0-9a-f.]+$/.test(data)) return null;
  return { id, w, h, data, hearts: Math.max(0, a.hearts | 0), mine: !!a.mine, ver: a.ver | 0 };
}
async function artLoad() {
  if (!house || scene !== 'house' || !artHas()) return;
  const owner = artOwner();
  let list;
  try { list = await rpc('art_list', visiting ? { p_uid: visiting.uid } : {}); } catch (e) { return; }   // 伺服器還沒裝畫板功能時靜靜略過
  if (owner !== artOwner() || scene !== 'house') return;
  Object.keys(artCache).forEach(k => { if (k.indexOf(owner + ':') === 0) delete artCache[k]; });
  (Array.isArray(list) ? list : []).forEach(a => { const c = artClean(a); if (c) artCache[owner + ':' + c.id] = c; });
  if (artId != null && artMode === 'view') artRender();
}
function artSoon() {                               // 別人畫了新畫或送了愛心：稍等一下再向伺服器要最新的（最多每 1.5 秒一次）
  if (artTimer) return;
  artTimer = setTimeout(() => { artTimer = 0; artLast = Date.now(); artLoad(); }, Math.max(300, 1500 - (Date.now() - artLast)));
}

/* 縮成家具上的小圖：每個小格取對應範圍的平均色（空白當紙色） */
function artOff(a, k) {
  a.offs = a.offs || {};
  if (a.offs[k]) return a.offs[k];
  const rw = ART[k].rect[2], rh = ART[k].rect[3], cv = document.createElement('canvas');
  cv.width = rw; cv.height = rh;
  const c = cv.getContext('2d'), im = c.createImageData(rw, rh);
  for (let ty = 0; ty < rh; ty++) for (let tx = 0; tx < rw; tx++) {
    const x0 = Math.floor(tx * a.w / rw), x1 = Math.max(x0 + 1, Math.floor((tx + 1) * a.w / rw)), y0 = Math.floor(ty * a.h / rh), y1 = Math.max(y0 + 1, Math.floor((ty + 1) * a.h / rh));
    let R = 0, G = 0, B = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const ch = a.data[y * a.w + x], v = ch === '.' ? ART_PAPER : ART_RGB[parseInt(ch, 16)];
      R += v[0]; G += v[1]; B += v[2]; n++;
    }
    const o = (ty * rw + tx) * 4; im.data[o] = Math.round(R / n); im.data[o + 1] = Math.round(G / n); im.data[o + 2] = Math.round(B / n); im.data[o + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  return (a.offs[k] = cv);
}
DCONT.easel1 = DCONT.easel2 = (it, px, py) => {
  const a = artOf(it); if (!a) return;
  g.drawImage(artOff(a, it.k), px + ART[it.k].rect[0], py + ART[it.k].rect[1]);
  if (a.hearts > 0) { const x = px + 26, y = py - 1; r('#ff8fa8', x, y, 2, 1); r('#ff8fa8', x + 3, y, 2, 1); r('#ff8fa8', x, y + 1, 5, 1); r('#ff8fa8', x + 1, y + 2, 3, 1); r('#ff8fa8', x + 2, y + 3, 1, 1); }   // 有人送過愛心就在畫架上角冒一顆小愛心
};

/* ---------- 對話框：看畫、選格數、畫畫 ---------- */
const artEl = $('artm'), artCard = $('artcard');
let artId = null, artK = '', artMode = '', adW = 0, adH = 0, adG = null, adCol = 0, adTool = 'pen', adZ = 1, adHist = [], adDown = false, adPan = null, adBusy = false, adNote = '';
function openArt(it) {
  if (paused() || edit.on) return;
  if (typeof it.id !== 'number') { toast('家具還在存檔，等一下再試', 1800); return; }
  const a = artOf(it);
  if (visiting && !a) { toast('這個畫架上還沒有畫', 2200); return; }
  artId = it.id; artK = it.k; dsOpen = true; pressed.length = 0; adNote = '';
  artMode = a ? 'view' : 'size';
  artRender(); artEl.hidden = false; artCard.focus();
}
let adEmoTm = 0;
function artPaintEmoStop() { clearInterval(adEmoTm); adEmoTm = 0; if (myEmo && myEmo.id === 'paint') myEmo = null; }
function artPaintEmoStart() { paintEmote(); if (!adEmoTm) adEmoTm = setInterval(() => { if (artMode === 'draw' && artId != null) paintEmote(); else artPaintEmoStop(); }, 2000); }
function artClose() { artPaintEmoStop(); artLpHide(); adPtrs.clear(); adPinch = null; adSpace = false; artCard.classList.remove('art-draw'); artId = null; artMode = ''; adDown = false; adPan = null; dsOpen = false; artEl.hidden = true; }
const _closeDisplay0 = closeDisplay;
closeDisplay = function () { if (artId != null) { if (artMode !== 'draw') artClose(); } else _closeDisplay0(); };   // 按 Esc 時先關畫板（畫到一半不關，免得白畫，要用「取消」）
const _joinHouseRoom0 = joinHouseRoom;
joinHouseRoom = function (u) { _joinHouseRoom0(u); artCache = {}; artLoad(); };        // 進自己的家／拜訪朋友時，向伺服器要這間屋子的畫
const _fxHint0 = fxHint;
fxHint = function (hit) { return ART[hit.k] && !edit.on ? '：按動作鍵' + (visiting ? '欣賞畫作' : '畫畫或欣賞') : _fxHint0(hit); };
const _onFx0 = onFx;
onFx = function (p) {                              // 別人畫好或送愛心的通知：只當作「重新讀取」的提示，內容以伺服器為準
  if (p && (p.a === 'art' || p.a === 'heart')) { if (p.i !== myUid && scene === 'house' && house) artSoon(); return; }
  _onFx0(p);
};

function artRender() {
  artCard.classList.toggle('art-draw', artMode === 'draw');
  const it = house && house.items.find(i => i.id === artId);
  if (!it || !ART[it.k]) { artClose(); return; }
  const name = esc((defOf(it.k) || {}).name || '畫架');
  if (artMode === 'view') artRenderView(it, name);
  else if (artMode === 'size') artRenderSize(it, name);
  else artRenderDraw(name);
}
function artPaintCanvas(cv, a, maxPx) {            // 把整幅畫畫在 cv 上（每格 cell 像素）
  const cell = Math.max(2, Math.floor(maxPx / Math.max(a.w, a.h)));
  cv.width = a.w * cell; cv.height = a.h * cell;
  const c = cv.getContext('2d');
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const ch = a.data[y * a.w + x]; c.fillStyle = ch === '.' ? '#fff7e0' : ART_PAL[parseInt(ch, 16)]; c.fillRect(x * cell, y * cell, cell, cell);
  }
}
function artRenderView(it, name) {
  const a = artOf(it), own = !visiting;
  artCard.innerHTML = '<div class="shop-h"><h2>' + name + '</h2><span class="chip gold" id="arth">♥ ' + (a ? a.hearts : 0) + '</span></div>' +
    '<div class="art-frame"><canvas id="artv"></canvas></div>' +
    '<p class="empty">' + (own ? '你的畫。朋友來拜訪時可以欣賞並送愛心；重畫會清掉目前的畫和愛心。' : esc(visiting.name) + ' 的畫。每個人對同一幅畫只能送一次愛心。') + '</p>' +
    (adNote ? '<p class="empty">' + esc(adNote) + '</p>' : '') +
    (own ? '<button type="button" class="btn wide" data-a="redraw">重畫</button>'
      : '<button type="button" class="btn wide" data-a="heart"' + (a && a.mine ? ' disabled' : '') + '>' + (a && a.mine ? '已送出愛心' : '送愛心') + '</button>') +
    '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  if (a) artPaintCanvas($('artv'), a, 320);
}
function artRenderSize(it, name) {
  const d = ART[it.k], had = !!artOf(it);
  artCard.innerHTML = '<div class="shop-h"><h2>' + name + '</h2></div>' +
    '<p class="empty">選一種畫布大小。格數越多越精細，但畫起來也越久；大的可以用 ＋／－ 放大再畫。畫好之後大小就固定了，要換大小得重畫。' + (had ? '重畫會清掉目前的畫和愛心。' : '') + '</p>' +
    (artDraftGet() ? '<button type="button" class="btn wide" data-a="resume">▶ 繼續上次的草稿（' + artDraftGet().w + '×' + artDraftGet().h + '）</button><p class="empty">選下面的大小重新開始，會蓋掉這份草稿。</p>' : '') +
    '<div class="pn-row">' + d.sizes.map((s, i) => '<button type="button" class="btn" data-a="size" data-i="' + i + '">' + s[2] + '　' + s[0] + '×' + s[1] + (i === 1 ? '（推薦）' : '') + '</button>').join('') + '</div>' +
    '<button type="button" class="btn ghost wide" data-a="' + (had ? 'back' : 'close') + '">' + (had ? '回去看畫' : '取消') + '</button>';
}
function artBox() {                                // 畫布框最大能用多少像素：電腦最寬 920，手機幾乎整個寬度；高度扣掉標題、工具、調色盤、按鈕
  const vw = window.innerWidth, vh = window.innerHeight, mob = vw < 700;
  return { w: Math.max(200, Math.min(mob ? vw - 48 : 920, vw - 100)), h: Math.max(160, vh - (mob ? 300 : 330)) };
}
function artBase() { const bx = artBox(); return Math.max(3, Math.floor(Math.min(bx.w / adW, bx.h / adH))); }   // 縮放 1× 時每格的螢幕像素：整幅畫剛好放滿可用空間
function artRenderDraw(name) {
  artCard.innerHTML = '<div class="shop-h"><h2>' + name + '</h2><span class="chip">' + adW + '×' + adH + '</span></div>' +
    '<div class="pn-row"><span class="art-lb">縮放</span><button type="button" class="btn small" data-a="zo" aria-label="縮小">－</button><b id="artz" class="art-z">1×</b><button type="button" class="btn small" data-a="zi" aria-label="放大">＋</button></div>' +
    '<p class="empty art-tip">' + (matchMedia('(pointer:coarse)').matches ? '兩根手指可以縮放、移動畫面；手指按住時上方會出現放大鏡。' : '滾輪縮放；按住空白鍵（或滑鼠中鍵）拖動畫面。') + '</p>' +
    '<div class="art-vp" id="artvp"><canvas id="artc" width="' + adW * 8 + '" height="' + adH * 8 + '"></canvas></div>' +
    '<div class="pn-row" id="arttl">' + [['pen', '畫筆'], ['erase', '橡皮擦'], ['fill', '填色'], ['pan', '移動']].map(([k, n]) => '<button type="button" class="btn small" data-a="tool" data-c="' + k + '" aria-pressed="' + (adTool === k) + '">' + n + '</button>').join('') +
    '<button type="button" class="btn small" data-a="undo">復原</button><button type="button" class="btn small" data-a="clear">清空</button></div>' +
    '<div class="pn-row" id="artpal">' + ART_PAL.map((c, i) => '<button type="button" class="art-sw" data-a="col" data-c="' + i + '" aria-label="顏色 ' + (i + 1) + '" aria-pressed="' + (adCol === i) + '" style="background:' + c + '"></button>').join('') + '</div>' +
    '<button type="button" class="btn wide" data-a="save"' + (adBusy ? ' disabled' : '') + '>完成，掛上畫架</button>' +
    '<button type="button" class="btn ghost wide" data-a="draft">💾 存草稿，下次再畫</button>' +
    '<button type="button" class="btn ghost wide" data-a="cancel">取消</button>';
  artSizeView(); artDrawAll();
}
function artSizeView() {                           // 依縮放設定畫布的顯示大小；外框固定，放大後在框內捲動
  const b = artBase(), vp = $('artvp'), cv = $('artc'); if (!vp || !cv) return;
  vp.style.width = adW * b + 'px'; vp.style.height = adH * b + 'px';
  cv.style.width = adW * b * adZ + 'px'; cv.style.height = adH * b * adZ + 'px';
  artCard.style.setProperty('--artw', adW * b + 'px');
  $('artz').textContent = (Math.round(adZ * 10) / 10) + '×';
}
function artDrawAll() {
  const cv = $('artc'); if (!cv) return;
  const c = cv.getContext('2d');
  for (let y = 0; y < adH; y++) for (let x = 0; x < adW; x++) {
    const v = adG[y * adW + x]; c.fillStyle = v >= 0 ? ART_PAL[v] : ((x + y) % 2 ? '#fffaf0' : '#fff3da'); c.fillRect(x * 8, y * 8, 8, 8);
  }
  if (artMode === 'draw') artDraftSoon();
}
function artZoomTo(nz, ax, ay) {                   // 以框內 (ax, ay) 這一點為中心縮放；沒給就以框的中心
  const vp = $('artvp'); if (!vp) return;
  nz = Math.max(1, Math.min(8, nz)); if (nz === adZ) return;
  if (ax == null) { ax = vp.clientWidth / 2; ay = vp.clientHeight / 2; }
  const k = nz / adZ, px = vp.scrollLeft + ax, py = vp.scrollTop + ay;
  adZ = nz; artSizeView();
  vp.scrollLeft = px * k - ax; vp.scrollTop = py * k - ay;
}
function artZoom(d) { artZoomTo(adZ + d); }
function artFill(x, y) {
  const t = adG[y * adW + x], c = adCol; if (t === c) return;
  const st = [[x, y]];
  while (st.length) { const [a, b] = st.pop(); if (a < 0 || b < 0 || a >= adW || b >= adH || adG[b * adW + a] !== t) continue; adG[b * adW + a] = c; st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
}
function artPaintAt(e) {
  const cv = $('artc'); if (!cv) return;
  const rc = cv.getBoundingClientRect(), x = Math.floor((e.clientX - rc.left) / rc.width * adW), y = Math.floor((e.clientY - rc.top) / rc.height * adH);
  if (x < 0 || y < 0 || x >= adW || y >= adH) return;
  if (adTool === 'fill') artFill(x, y); else adG[y * adW + x] = adTool === 'erase' ? -1 : adCol;
  artDrawAll();
}
/* ---------- 草稿：畫到一半可以存起來，下次再繼續（存在這個瀏覽器的 localStorage，換裝置不會跟著走） ---------- */
let adDraftTm = 0;
const artDraftKey = () => 'rf_art_draft:' + myUid + ':' + artId;
function artDraftGet() {
  try {
    const d = JSON.parse(localStorage.getItem(artDraftKey()) || 'null'), sz = ART[artK] && ART[artK].sizes;
    if (!d || !sz || !sz.some(s => s[0] === d.w && s[1] === d.h) || typeof d.data !== 'string' || d.data.length !== d.w * d.h || !/^[0-9a-f.]+$/.test(d.data) || /^\.+$/.test(d.data)) return null;
    return d;
  } catch (e) { return null; }
}
function artDraftDel() { clearTimeout(adDraftTm); adDraftTm = 0; try { localStorage.removeItem(artDraftKey()); } catch (e) { /* 略過 */ } }
function artDraftPut() {
  clearTimeout(adDraftTm); adDraftTm = 0;
  if (artId == null || artMode !== 'draw' || !adG) return false;
  const s = adG.map(v => (v < 0 ? '.' : v.toString(16))).join('');
  try {
    if (/^\.+$/.test(s)) { localStorage.removeItem(artDraftKey()); return false; }
    localStorage.setItem(artDraftKey(), JSON.stringify({ k: artK, w: adW, h: adH, data: s, t: Date.now() })); return true;
  } catch (e) { return false; }
}
function artDraftSoon() { clearTimeout(adDraftTm); adDraftTm = setTimeout(artDraftPut, 1200); }   // 畫的時候自動存，意外關掉也不會白畫
function artResume() {
  const d = artDraftGet(); if (!d) return;
  adW = d.w; adH = d.h; adG = d.data.split('').map(ch => (ch === '.' ? -1 : parseInt(ch, 16))); adCol = 0; adTool = 'pen'; adZ = 1; adHist = []; artMode = 'draw'; artRender(); artPaintEmoStart();
}
function artPush() { adHist.push(adG.slice()); if (adHist.length > 40) adHist.shift(); }
function artStart(i) {
  const s = ART[artK].sizes[i]; if (!s) return;
  adW = s[0]; adH = s[1]; adG = new Array(adW * adH).fill(-1); adCol = 0; adTool = 'pen'; adZ = 1; adHist = []; artMode = 'draw'; artRender(); artPaintEmoStart();
}
async function artSave() {
  if (adBusy) return;
  const s = adG.map(v => (v < 0 ? '.' : v.toString(16))).join('');
  if (/^\.+$/.test(s)) { toast('還沒畫任何東西', 1800); return; }
  adBusy = true; artRender();
  try {
    const res = await enqueue(() => rpc('art_save', { p_item: artId, p_w: adW, p_h: adH, p_data: s }));
    artCache[artOwner() + ':' + artId] = { id: artId, w: adW, h: adH, data: s, hearts: 0, mine: false, ver: (res && res.ver) | 0 };
    fxSend({ a: 'art', id: artId });
    artDraftDel(); adNote = '畫好了，已經掛在畫架上。'; artMode = 'view'; artPaintEmoStop();
  } catch (e) { toast(errText(e), 4000); }
  adBusy = false; if (artId != null) artRender();
}
async function artHeart() {
  const a = artCache[artOwner() + ':' + artId]; if (!a || a.mine || adBusy) return;
  adBusy = true;
  try {
    const res = await enqueue(() => rpc('art_heart', { p_item: artId }));
    a.mine = true; a.hearts = res && res.hearts != null ? res.hearts | 0 : a.hearts + 1;
    fxSend({ a: 'heart', id: artId });
    toast('送出愛心了', 1800);
  } catch (e) { toast(errText(e), 3500); if (/art_hearted/.test(String((e && e.message) || ''))) a.mine = true; }
  adBusy = false; if (artId != null && artMode === 'view') artRender();
}
artCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'close') artClose();
  else if (a === 'redraw') { adNote = ''; artMode = 'size'; artRender(); }
  else if (a === 'back') { artMode = 'view'; artRender(); }
  else if (a === 'size') { if (artDraftGet() && !window.confirm('有一份還沒畫完的草稿，重新開始會把它蓋掉。\n要重新開始嗎？')) return; artDraftDel(); artStart(+b.dataset.i); }
  else if (a === 'resume') artResume();
  else if (a === 'heart') artHeart();
  else if (a === 'zi') artZoom(1);
  else if (a === 'zo') artZoom(-1);
  else if (a === 'tool') { adTool = b.dataset.c; document.querySelectorAll('#arttl [data-a=tool]').forEach(x => x.setAttribute('aria-pressed', x.dataset.c === adTool)); const cv = $('artc'); if (cv) cv.style.cursor = adTool === 'pan' ? 'grab' : 'crosshair'; }
  else if (a === 'col') { adCol = +b.dataset.c; if (adTool === 'erase' || adTool === 'pan') adTool = 'pen'; document.querySelectorAll('#artpal [data-a=col]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.c === adCol)); document.querySelectorAll('#arttl [data-a=tool]').forEach(x => x.setAttribute('aria-pressed', x.dataset.c === adTool)); }
  else if (a === 'undo') { if (adHist.length) { adG = adHist.pop(); artDrawAll(); } }
  else if (a === 'clear') { artPush(); adG.fill(-1); artDrawAll(); }
  else if (a === 'save') artSave();
  else if (a === 'draft') { const ok = artDraftPut(); toast(ok ? '草稿已存好，下次打開畫架就能繼續畫' : '還沒畫任何東西', 2400); artPaintEmoStop(); if (artCache[artOwner() + ':' + artId]) { artMode = 'view'; artRender(); } else artClose(); }
  else if (a === 'cancel') { if (adG && adG.some(v => v >= 0) && !window.confirm('要放棄這幅畫嗎？\n存好的草稿也會一起刪掉，不能復原。\n（想留著下次再畫，請按「存草稿」）')) return; artDraftDel(); const had = !!artCache[artOwner() + ':' + artId]; adNote = ''; artPaintEmoStop(); if (had) { artMode = 'view'; artRender(); } else artClose(); }
});
/* ---------- 指標：單指／滑鼠畫畫；兩指縮放＋移動；空白鍵或中鍵拖動；手指按住時顯示放大鏡 ---------- */
const adPtrs = new Map();
let adPinch = null, adSpace = false;
const adPs = () => { const [a, b] = [...adPtrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; };
function artLpShow(e) {
  if (e.pointerType !== 'touch' || !adG) return;
  const cv = $('artc'); if (!cv) return;
  const rc = cv.getBoundingClientRect(), px = Math.floor((e.clientX - rc.left) / rc.width * adW), py = Math.floor((e.clientY - rc.top) / rc.height * adH);
  let lp = $('artlp');
  if (!lp) { lp = document.createElement('canvas'); lp.id = 'artlp'; lp.width = lp.height = 99; artEl.appendChild(lp); }
  const c = lp.getContext('2d'), N = 9, S = 11, h = (N - 1) / 2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = px + i - h, y = py + j - h, v = x < 0 || y < 0 || x >= adW || y >= adH ? -2 : adG[y * adW + x];
    c.fillStyle = v === -2 ? '#cfcfd8' : v >= 0 ? ART_PAL[v] : ((x + y) % 2 ? '#fffaf0' : '#fff3da'); c.fillRect(i * S, j * S, S, S);
  }
  c.strokeStyle = '#d9608a'; c.lineWidth = 2; c.strokeRect(h * S + 1, h * S + 1, S - 2, S - 2);
  lp.style.left = Math.max(8, Math.min(window.innerWidth - 107, e.clientX - 50)) + 'px';
  lp.style.top = (e.clientY - 150 >= 8 ? e.clientY - 150 : e.clientY + 70) + 'px';
  lp.hidden = false;
}
function artLpHide() { const lp = $('artlp'); if (lp) lp.hidden = true; }
artCard.addEventListener('pointerdown', e => {
  const cv = e.target.closest && e.target.closest('#artc'); if (!cv) return;
  if (e.pointerType === 'mouse' && e.button > 1) return;
  cv.setPointerCapture(e.pointerId);
  adPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (adPtrs.size >= 2) {                           // 兩指：縮放＋移動，不畫；剛才第一指畫的那一筆收回
    if (adDown) { if (adHist.length) adG = adHist.pop(); artDrawAll(); adDown = false; }
    adPan = null; artLpHide();
    const vp = $('artvp'), rc = vp.getBoundingClientRect(), s2 = adPs();
    adPinch = { z: adZ, d: s2.d, cx: (vp.scrollLeft + s2.mx - rc.left - vp.clientLeft) / adZ, cy: (vp.scrollTop + s2.my - rc.top - vp.clientTop) / adZ };
    return;
  }
  if (adTool === 'pan' || adSpace || e.button === 1) { const vp = $('artvp'); adPan = [e.clientX, e.clientY, vp.scrollLeft, vp.scrollTop]; cv.style.cursor = 'grabbing'; return; }
  artPush(); adDown = true; artPaintAt(e); artLpShow(e);
});
artCard.addEventListener('pointermove', e => {
  if (adPtrs.has(e.pointerId)) adPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (adPinch && adPtrs.size >= 2) {
    const vp = $('artvp'), rc = vp.getBoundingClientRect(), s2 = adPs();
    adZ = Math.max(1, Math.min(8, adPinch.z * s2.d / adPinch.d)); artSizeView();
    vp.scrollLeft = adPinch.cx * adZ - (s2.mx - rc.left - vp.clientLeft); vp.scrollTop = adPinch.cy * adZ - (s2.my - rc.top - vp.clientTop);
    return;
  }
  if (adPan) { const vp = $('artvp'); vp.scrollLeft = adPan[2] - (e.clientX - adPan[0]); vp.scrollTop = adPan[3] - (e.clientY - adPan[1]); return; }
  if (adDown && adTool !== 'fill') { artPaintAt(e); artLpShow(e); }
});
const artUp = e => {
  adPtrs.delete(e.pointerId); if (adPtrs.size < 2) adPinch = null;
  if (!adPtrs.size) adDown = false;
  artLpHide();
  if (adPan) { adPan = null; const cv = $('artc'); if (cv) cv.style.cursor = adSpace || adTool === 'pan' ? 'grab' : 'crosshair'; }
};
artCard.addEventListener('pointerup', artUp); artCard.addEventListener('pointercancel', artUp);
artCard.addEventListener('wheel', e => {            // 電腦：滾輪以游標位置為中心縮放
  const vp = e.target.closest && e.target.closest('#artvp'); if (!vp || artMode !== 'draw') return;
  e.preventDefault();
  const rc = vp.getBoundingClientRect();
  artZoomTo(adZ * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX - rc.left - vp.clientLeft, e.clientY - rc.top - vp.clientTop);
}, { passive: false });
artCard.addEventListener('mousedown', e => { if (e.button === 1 && e.target.closest && e.target.closest('#artc')) e.preventDefault(); });   // 中鍵不要觸發自動捲動
document.addEventListener('keydown', e => {          // 按住空白鍵 = 暫時變成「移動」
  if (artId == null || artMode !== 'draw' || e.code !== 'Space') return;
  e.preventDefault(); e.stopPropagation();
  if (!adSpace) { adSpace = true; const cv = $('artc'); if (cv) cv.style.cursor = 'grab'; }
}, true);
document.addEventListener('keyup', e => {
  if (e.code !== 'Space' || !adSpace) return;
  e.preventDefault(); adSpace = false; const cv = $('artc'); if (cv) cv.style.cursor = adTool === 'pan' ? 'grab' : 'crosshair';
}, true);
window.addEventListener('resize', () => { if (artId != null && artMode === 'draw') artSizeView(); });
artEl.addEventListener('click', e => { if (e.target === artEl && artMode !== 'draw') artClose(); });   // 畫到一半時點背景不關，免得白畫
