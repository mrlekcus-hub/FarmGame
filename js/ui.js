'use strict';
/* 介面 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 介面 ---------- */
const slots = [];
for (let i = 0; i < 6; i++) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'slot';
  b.innerHTML = '<span class="k">' + (i + 1) + '</span><canvas width="16" height="16"></canvas><span class="n"></span>';
  $('hotbar').appendChild(b);
  b.addEventListener('click', () => { selectTool(i); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  slots.push({ el: b, cv: b.querySelector('canvas'), n: b.querySelector('.n') });
}
/* 切換組合的按鈕（第 1／2／3 組），放在 1~6 格後面 */
const pgBtn = document.createElement('button');
pgBtn.type = 'button'; pgBtn.className = 'slot hbpage';
pgBtn.innerHTML = '<span class="k">組</span><span class="pgn"></span>';
$('hotbar').appendChild(pgBtn);
pgBtn.addEventListener('click', () => { setHotPage(hotPage + 1); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
/* 依 hot[] 重畫快捷列圖示 */
function paintSlots() {
  pgBtn.querySelector('.pgn').innerHTML = (hotPage + 1) + '<small>/' + HOT_SETS + '</small>';
  pgBtn.setAttribute('aria-label', '切換快捷列組合，目前第 ' + (hotPage + 1) + ' 組');
  pgBtn.title = '切換快捷列組合（電腦可按 Tab）';
  slots.forEach((s, i) => {
    const c2d = s.cv.getContext('2d'), it = TOOLS[hot[i]];
    if (it) drawIcon(c2d, hot[i]); else c2d.clearRect(0, 0, 16, 16);
    s.el.setAttribute('aria-label', (i + 1) + ' 號格：' + (it ? it.n : '空'));
  });
}
const hotKey = () => 'dewfarm_hot_' + authUser;
/* 同一組裡物品不重複（不同組可以放一樣的，例如每組都放鋤頭） */
function hotClean(v) {
  const seen = new Set();
  return v.map(x => (Number.isInteger(x) && x >= 0 && x < TOOLS.length && !seen.has(x) && seen.add(x)) ? x : -1);
}
function hotLoad() {
  hotSets = [DEFHOT.slice(), Array(6).fill(-1), Array(6).fill(-1)]; hotPage = 0;
  try {
    const v = JSON.parse(localStorage.getItem(hotKey()) || 'null');
    if (Array.isArray(v) && v.length === 6) hotSets[0] = hotClean(v);          // 舊存檔：只有一組，變成第 1 組
    else if (v && Array.isArray(v.s)) {
      for (let i = 0; i < HOT_SETS; i++) if (Array.isArray(v.s[i]) && v.s[i].length === 6) hotSets[i] = hotClean(v.s[i]);
      if (Number.isInteger(v.p) && v.p >= 0 && v.p < HOT_SETS) hotPage = v.p;
    }
  } catch (e) { /* 用預設 */ }
  hot = hotSets[hotPage];
  paintSlots();
}
function hotSave() { try { localStorage.setItem(hotKey(), JSON.stringify({ p: hotPage, s: hotSets })); } catch (e) { /* 略過 */ } }
/* 切到第 p 組（0~2，會循環）；手上拿的格號不變 */
function setHotPage(p, quiet) {
  hotPage = ((p % HOT_SETS) + HOT_SETS) % HOT_SETS;
  hot = hotSets[hotPage];
  hotSave(); paintSlots(); refreshHud();
  if (!quiet) toast('快捷列　第 ' + (hotPage + 1) + ' 組', 900);
}
/* 把物品 idx 放進第 s 格：再按一次同格就取下；已在別格的會和這格互換 */
function setSlot(s, idx) {
  if (hot[s] === idx) hot[s] = -1;
  else { const j = hot.indexOf(idx); if (j >= 0) hot[j] = hot[s]; hot[s] = idx; }
  hotSave(); paintSlots(); refreshHud();
}
function selectTool(i) {
  if (paused()) return;
  tool = i; refreshHud();
  pop(pl.x, pl.y - 1, curTool().n, '#fff3b0');
}
paintSlots();
let lastClock = '';
function updateClock() {
  const w = world();
  const h = Math.floor(w.min / 60), m = Math.floor(w.min % 60);
  const s = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  const sea = seasonAt(srvNow());
  const sig = s + '|' + w.wet + w.snow + sea;
  if (sig === lastClock) return;
  lastClock = sig;
  $('clock').textContent = s;
  $('clock').classList.toggle('late', darkness(w.min) > 0.5);
  const wx = $('wx');
  wx.textContent = w.snow ? '雪天' : w.wet ? '雨天' : '晴天';
  wx.classList.toggle('rain', w.wet);
  $('sn').textContent = SEASON_N[sea];
  const ws = $('wxs');   // 手機（沉浸／橫屏）把 #wx、#sn 藏起來，改顯示這一個合併的小標籤
  ws.textContent = (w.snow ? '❄️ 雪' : w.wet ? '🌧️ 雨' : '☀️ 晴') + '・' + SEASON_N[sea].replace(' ', '').replace('天', '');
  ws.classList.toggle('rain', w.wet);
}
function refreshHud() {
  $('gold').textContent = (me ? me.coins : 0) + ' G';
  $('who').textContent = me ? me.name : '未登入';
  $('gmbtn').hidden = !(me && me.gm);
  slots.forEach((s, i) => {
    const tl = TOOLS[hot[i]];
    s.el.classList.toggle('sel', tool === i);
    if (!tl) { s.n.textContent = ''; s.el.classList.add('empty'); }
    else if (tl.id === 'seed') { const n = have('s:' + tl.crop); s.n.textContent = '×' + n; s.el.classList.toggle('empty', n <= 0); }
    else { s.n.textContent = ''; s.el.classList.remove('empty'); }
  });
  lastClock = ''; updateClock(); updateBuffChip();
}
let lastTip = '';
function updateTip() {
  const [x, y] = facing();
  let s = '走到田邊，面向一塊草地，按動作鍵。';
  if (cooking) {
    s = cookTip();
  } else if (fishing) {
    s = fishing.phase === 'bite' ? '魚咬鉤了！快按動作鍵拉竿！' : fishing.phase === 'cast' ? '拋竿…' : fishing.phase === 'reel' ? '拉起來…' : '等魚上鉤…看到「!」立刻按動作鍵。太早拉會嚇跑魚。';
  } else if (scene === 'house') {
    s = visiting ? '這是 ' + visiting.name + ' 的家，隨意參觀吧。' : '這是你的家。按「布置模式」可以擺放家具。';
    if (pose) s = (pose.type === 'lie' ? '躺著休息中…' : '坐著休息中…') + '按方向鍵或動作鍵起身。';
    else
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const lx = x - RX, ly = y - RY, hit = house && lx >= 0 && lx < RW && ly >= -2 && ly < RH ? itemAtLocal(lx, ly) : null;
      if (K[y][x] === GT) s = '門口：按動作鍵回農場。';
      else if (hit) s = ((defOf(hit.k) || {}).name || '') + (DISP[hit.k] ? '：按動作鍵' + (visiting ? '看展示品' : '換展示品') : hit.k === 'kitchen' && !edit.on ? '：按動作鍵做料理' : STYLER[hit.k] && !visiting && !edit.on ? '：按動作鍵換造型' : hit.k === 'tv' && !edit.on ? '：按動作鍵換頻道、看今日情報' : hit.k === 'piano' && !edit.on ? '：按動作鍵彈琴' : SEAT[hit.k] && !edit.on ? '：按動作鍵' + (SEAT[hit.k] === 'lie' ? '躺下' : '坐下') : '');
    }
  } else if (scene === 'plaza') {
    s = '和朋友聊聊天吧，下方可以打字。';
    if (pose) s = '坐著休息中…按方向鍵或動作鍵起身。';
    else
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const rp = remoteAt(x, y);
      if (K[y][x] === GT) s = '出口：按動作鍵回農場。';
      else if (rp) s = '這是 ' + rp.name + '。';
      else if (K[y][x] === WA) s = curTool().id === 'rod' ? '池塘：按動作鍵拋竿釣魚。' : '池塘。（換成釣竿就能釣魚）';
      else if (hwHint(x, y)) s = hwHint(x, y);
      else if (K[y][x] === FR) s = '噴水池。';
      else if (K[y][x] === BN) s = '長椅：按動作鍵坐下。';
      else if (K[y][x] === SB) s = '蛇梯棋：按動作鍵開桌或加入（1～4 人，一個人也能玩）。';
      else if (K[y][x] === TS) s = '塔羅小攤：按動作鍵走進去，找 Lekcus 抽今天的運勢牌。';
    }
  } else if (scene === 'barn') {
    s = '穀倉：和動物面對面按動作鍵看狀態；飼料槽餵乾草、收成籃收蛋奶毛；買動物和乾草到小村的牧場小屋。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const an = barnAn.find(a => Math.abs(a.x - x) < 0.8 && Math.abs(a.y - y) < 0.8), k = K[y][x];
      if (an && rcData) s = barnStatus(an);
      else if (k === BX) s = '門口：按動作鍵回農場。';
      else if (k === TRG) s = '飼料槽：按動作鍵，用乾草餵所有肚子餓的動物（乾草 ' + have('a:hay') + ' 把）。';
      else if (k === BSK) s = '收成籃：按動作鍵，收所有做好的蛋、牛奶和羊毛。';
      else if (k === SGN) s = '告示牌：買動物和乾草請到小村的牧場小屋找小茉。';
    }
  } else if (scene === 'tarot') {
    s = '塔羅小屋：和 Lekcus 面對面按動作鍵，打招呼或抽今天的牌。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const k = K[y][x];
      if (k === BX) s = '門口：按動作鍵回廣場。';
      else if (y <= 1 && x >= 4 && x <= 7) s = '招牌：按動作鍵，選擇前往 Lekcus 的直播或 Instagram。';
      else if (k === LK || k === TBL) s = 'Lekcus：按動作鍵打招呼、抽牌。';
    }
  } else if (scene === 'stylist') {
    s = '店員站在櫃檯後面，面對櫃檯按動作鍵和他說話。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const k = K[y][x];
      if (k === BX) s = '門口：按動作鍵回小村。';
      else if (k === SYK || k === SYC) s = (styRoom === 'ranch' ? '小茉' : styRoom === 'work' ? '橡果村長' : SHOP_STY[styRoom].clerk) + '：按動作鍵說話。';
    }
  } else if (scene === 'cave') {
    s = '山洞：礦石都在這裡，換成鎬子，面向礦石按動作鍵敲開。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const k = K[y][x];
      if (k === CX) s = '洞口：按動作鍵回森林。';
      else if (k === RK) s = plv() < featNeed.mine ? '礦石：玩家 Lv.' + featNeed.mine + ' 解鎖採礦。' : curTool().id === 'pick' ? '礦石：按動作鍵敲開，每顆每 2 小時恢復一次。' : '礦石：換成鎬子才敲得動。';
    }
  } else if (scene === 'forest') {
    s = '西邊森林：草叢裡有蟲蝶，池塘可以釣魚；往北走有一個山洞（玩家 Lv.' + featNeed.cave + ' 才能進入），礦石在裡面。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const k = K[y][x];
      if (k === FE) s = '森林出口：按動作鍵回小村。';
      else if (k === CV) s = plv() < featNeed.cave ? '山洞入口：玩家 Lv.' + featNeed.cave + ' 才能進入。' : '山洞入口：按動作鍵走進去（礦石在裡面）。';
      else if (k === NP) s = (npcAt(x, y) || {}).n + '：按動作鍵對話。';
      else if (k === HB) s = '山壁，很厚實。';
      else if (k === WA) s = curTool().id === 'rod' ? '森林的池塘：按動作鍵拋竿釣魚。' : '森林的池塘。（換成釣竿就能釣魚）';
      else if (curTool().id === 'net') s = critters.length ? '捕蟲網：蟲蝶靠近時，面向牠按動作鍵揮網！' : '捕蟲網：這一輪的蟲蝶都被你抓光了。每 5 分鐘會有新的一輪。';
    }
  } else if (scene === 'town') {
    s = '雷克斯小村：找村民聊聊，頭上有「!」的人有故事要告訴你；布告欄和旅行商人也在這裡。';
    if (x >= 0 && y >= 0 && x < W && y < H) {
      const k = K[y][x];
      if (k === FG) s = '村口：按動作鍵回農場。';
      else if (k === FW) s = plv() < featNeed.forest ? '西邊的出口：玩家 Lv.' + featNeed.forest + ' 才能進入森林。' : '西邊的出口：按動作鍵去森林（有蟲、有魚，北邊還有山洞）。';
      else if (k === NP) s = (npcAt(x, y) || {}).n + '：按動作鍵對話。';
      else if (k === BD) s = '委託布告欄：按動作鍵，看本週的委託和村莊故事進度。';
      else if ((x === MXT || x === MXT + 1) && y === MYT && merchantHere()) s = '旅行商人 米羅：按動作鍵，看今天賣什麼、收什麼。';
      else if (k === WL) s = '村子的水井。';
      else if (k === WA) s = curTool().id === 'rod' ? '池塘：按動作鍵拋竿釣魚。' : '池塘。（換成釣竿就能釣魚）';
      else if (k === CS) s = '裁縫鋪：按動作鍵走進去。';
      else if (k === BS) s = '造型店：按動作鍵走進去（髮型、帽子、眼鏡）。';
      else if (k === RS) s = '牧場小屋：按動作鍵走進去（買雞、牛和乾草）。';
      else if (k === FS) s = '家具店：按動作鍵走進去（家具只在這裡買，每天上架不同的）。';
      else if (k === WK) s = '園藝工坊（村長家）：按動作鍵走進去，庭院裝飾和工具升級都在這裡。';
      else if (k === HB) s = '村民的家。';
    }
  } else if (false) {
    s = fishing.phase === 'bite' ? '魚咬鉤了！快按動作鍵拉竿！' : fishing.phase === 'cast' ? '拋竿…' : fishing.phase === 'reel' ? '拉起來…' : '等魚上鉤…看到「!」立刻按動作鍵。太早拉會嚇跑魚。';
  } else if (x >= 0 && y >= 0 && x < W && y < H) {
    const p = plots.get(pk(x, y)), k = K[y][x];
    if (curTool().id === 'net' && !ripeNow(p)) s = critters.length ? '捕蟲網：蟲蝶靠近時，面向牠按動作鍵揮網！' : '捕蟲網：這一輪的蟲蝶都被你抓光了。每 5 分鐘會有新的一輪。';
    else if (p && p.crop) {
      const need = growSec(p.crop) - grownNow(p);
      const nm = CROPS[p.crop].n;
      if (need <= 0) s = nm + '成熟了，按動作鍵收成！';
      else {
        const wl = p.wet && p.wet > srvNow() ? (p.wet - srvNow()) / 1000 : 0;
        const pct = Math.floor(progress(p) * 100);
        const wnow = world();
        if (wnow.wet) s = nm + ' ' + pct + '%　' + (wnow.snow ? '下雪' : '下雨') + '中，不用澆水也會長，還要約 ' + fmtDur(need) + '。';
        else if (wl <= 0) s = nm + ' ' + pct + '%　土是乾的，要澆水才會繼續長（下雨下雪時免澆）。';
        else if (wl >= need) s = nm + ' ' + pct + '%　還要約 ' + fmtDur(need) + '成熟。';
        else s = nm + ' ' + pct + '%　水撐不到成熟（還能長 ' + fmtDur(wl) + '），記得再澆水。';
      }
    } else if (p) s = curTool().id === 'seed'
      ? CROPS[curTool().crop].n + '種子：' + fmtDur(growSec(curTool().crop)) + '成熟，每個賣 ' + cropPrice(curTool().crop) + ' G' + seasonTag(curTool().crop) + '。按動作鍵播種。'
      : '已翻好的土' + (isWet(p) ? '，濕的' : '，乾的') + '。可以播種或澆水。';
    else if (k === GT) s = '村莊大門：去公共廣場和朋友見面。';
    else if (k === DR) s = '房子的門：按動作鍵進屋，可以布置你的家。';
    else if (k === SH) s = '柴犬雜貨攤：買種子、賣作物。';
      else if (curTool().id === 'yard' && k === G) s = yardMap.has(pk(x, y)) ? '庭院佈置：按動作鍵收回這件裝飾。' : '庭院佈置：按動作鍵在這格擺裝飾（要空草地）。';
      else if (k === TG) s = plv() < featNeed.town ? '西邊的出口：玩家 Lv.' + featNeed.town + ' 才能進入雷克斯小村。' : '西邊的出口：按動作鍵前往雷克斯小村（村民、布告欄、旅行商人都在那裡）。';
      else if (k === BR) s = plv() < featNeed.ranch ? '穀倉：玩家 Lv.' + featNeed.ranch + ' 解鎖動物牧場。' : '穀倉：按動作鍵走進去，看看養的雞、牛、羊。';
      else if (k === RK) s = plv() < featNeed.mine ? '礦石：玩家 Lv.' + featNeed.mine + ' 解鎖採礦。' : curTool().id === 'pick' ? '礦石：按動作鍵敲開，每顆每 2 小時恢復一次。' : '礦石：換成鎬子才敲得動。';
      else if (fgList.some(f => f.x === x && f.y === y && !forTaken.has(f.slot + ':' + f.i))) s = plv() < featNeed.forage ? '野外採集物：玩家 Lv.' + featNeed.forage + ' 解鎖採集。' : '野外採集物：按動作鍵撿起來。';
    else if (k === WA) s = curTool().id === 'rod' ? '池塘：按動作鍵拋竿釣魚。' : '池塘。（換成釣竿就能釣魚）';
    else if (k === G) s = farmable(x, y) ? '空地：用鋤頭翻成田（' + plots.size + '/' + (lv ? plotCap() : '—') + '）。' : '這裡不能耕種，田地在房子下方的草地。';
  }
  if (s !== lastTip) { lastTip = s; $('tip').textContent = s; }
}
