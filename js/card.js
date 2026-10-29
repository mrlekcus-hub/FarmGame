'use strict';
/* 玩家名片 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 玩家名片：自我介紹、等級、成就（自己和好友看得到） ---------- */
const cdEl = $('cdm'), cdCard = $('cdcard');
let cd = null, cdMsg = '', cdSeq = 0, cdCat = '';
const ACH = [
  { id: 'days7', ic: '🌱', n: '農場新鮮人', d: '加入滿 7 天' }, { id: 'days30', ic: '🏡', n: '老住戶', d: '加入滿 30 天' },
  { id: 'pl5', ic: '⭐', n: '玩家 Lv.5', d: '玩家等級達到 5' }, { id: 'pl10', ic: '🌟', n: '玩家滿級', d: '玩家等級達到 10' },
  { id: 'farm5', ic: '🥕', n: '農耕達人', d: '農耕 Lv.5' }, { id: 'farm10', ic: '🌾', n: '農耕大師', d: '農耕 Lv.10' },
  { id: 'fish5', ic: '🎣', n: '釣魚達人', d: '釣魚 Lv.5' }, { id: 'bug5', ic: '🦋', n: '捕蟲達人', d: '捕蟲 Lv.5' },
  { id: 'fish100', ic: '🐟', n: '百魚', d: '累計釣到 100 條魚' }, { id: 'bug100', ic: '🐞', n: '百蟲', d: '累計抓到 100 隻蟲蝶' },
  { id: 'fish_half', ic: '📘', n: '魚圖鑑過半', d: '魚類圖鑑集滿一半' }, { id: 'fish_all', ic: '📗', n: '魚圖鑑全收集', d: '魚類圖鑑全部集滿' },
  { id: 'bug_half', ic: '📙', n: '蟲圖鑑過半', d: '蟲蝶圖鑑集滿一半' }, { id: 'bug_all', ic: '📕', n: '蟲圖鑑全收集', d: '蟲蝶圖鑑全部集滿' },
  { id: 'plots10', ic: '🌻', n: '田園風光', d: '擁有 10 塊田' }, { id: 'home15', ic: '🛋️', n: '溫馨小窩', d: '家裡擺 15 件家具' },
  { id: 'friend3', ic: '🤝', n: '好人緣', d: '擁有 3 位好友' },
  { id: 'photo', ic: '📸', n: '命運之交', d: '和好友完成第一次合照' },
  { id: 'voy1', ic: '⛵', n: '初次出海', d: '完成 1 趟出海團' }, { id: 'voy10', ic: '🚢', n: '老水手', d: '完成 10 趟出海團' }, { id: 'voy50', ic: '⚓', n: '海上傳奇', d: '完成 50 趟出海團' },
  { id: 'sea_all', ic: '🐙', n: '海釣圖鑑全收集', d: '海釣圖鑑全部集滿' }
];
FITS.forEach((nm, i) => { if (i >= FREE_N.fits) ACH.push({ id: 'fit' + i, ic: FIT_IC[i] || '👗', n: nm + '收藏家', d: '集齊「' + nm + '」的 ' + OUTFITS.length + ' 種顏色' }); });
/* 成就分類：成長、技能、收集、生活、服裝（服裝成就 id 都是 fit 開頭） */
const ACH_CATS = [
  { k: 'g', ic: '🌱', n: '成長', ids: ['days7', 'days30', 'pl5', 'pl10'] },
  { k: 's', ic: '🌾', n: '技能', ids: ['farm5', 'farm10', 'fish5', 'bug5'] },
  { k: 'c', ic: '📚', n: '收集', ids: ['fish100', 'bug100', 'fish_half', 'fish_all', 'bug_half', 'bug_all'] },
  { k: 'l', ic: '🏡', n: '生活', ids: ['plots10', 'home15', 'friend3', 'photo'] },
  { k: 'v', ic: '⛵', n: '出海', ids: ['voy1', 'voy10', 'voy50', 'sea_all'] },
  { k: 'f', ic: '👗', n: '服裝', ids: ACH.filter(x => /^fit\d+$/.test(x.id)).map(x => x.id) }
];
ACH_CATS.forEach(c => { c.a = c.ids.map(id => ACH.find(x => x.id === id)).filter(Boolean); });
/* 商人專屬家具的中文名（伺服器家具目錄沒給時的備用，不然會顯示英文 key） */
const MERCHANT_FURN_N = { lantern: '紙燈籠', globe: '地球儀', vase: '青花瓶' };
const itemName = k => {
  if (/^y:/.test(k)) { const yc = ycat.find(q => q.key === k.slice(2)); return yc ? yc.name : k.slice(2); }
  const [t, id] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
  if (t === 'c') return CROPS[id] ? CROPS[id].n : id;
  if (t === 'fish') { const f = fishCat.find(x => x.key === id); return f ? f.name : id; }
  if (t === 'bug') { const b = bugCat.find(x => x.key === id); return b ? b.name : id; }
  if (t === 'dish') { const rc = recipes.find(x => x.key === id); return rc ? rc.name : id; }
  if (t === 'q1' || t === 'q2') return (t === 'q2' ? '金星' : '銀星') + (CROPS[id] ? CROPS[id].n : id);
  if (itemMeta[k]) return itemMeta[k].name;
  if (t === 'f') { const d = defOf(id); return d ? d.name : (MERCHANT_FURN_N[id] || id); }
  if (t === 's') return (CROPS[id] ? CROPS[id].n : id) + '種子';
  const fb = fallbackItem(k);
  return fb ? fb.name : id;
};
let cdGift = false;
function renderCard() {
  let h = '<div class="shop-h"><h2>' + (cd && cd.self ? '我的名片' : '玩家名片') + '</h2></div>';
  if (!cd) h += '<p class="empty">' + esc(cdMsg || '讀取中…') + '</p>' + (cdMsg ? '<button type="button" class="btn wide" data-a="retry">重試</button>' : '');
  else if (cdGift) {
    const items = Object.keys(inv).filter(k => /^(c|fish|bug):[a-z0-9_]+$/.test(k) && have(k) > 0);
    h += '<p class="empty">選一樣送給 ' + esc(cd.name) + '（每天最多送 3 份，一次送 1 個）</p>' + (cdMsg ? '<p class="mk-msg">' + esc(cdMsg) + '</p>' : '') +
      (items.length ? items.map(k => '<div class="giftrow"><span>' + esc(itemName(k)) + ' ×' + have(k) + '</span><button type="button" class="btn small" data-a="give" data-k="' + esc(k) + '">送出</button></div>').join('') : '<p class="empty">背包裡沒有可以送的作物、魚或蟲蝶。</p>');
  } else {
    const st = cd.stats || {}, got = new Set((cd.ach || []).concat(cd.self ? voyAchSelf() : [])), pins = (cd.badges || []).filter(x => got.has(x));
    h += '<div class="cdav"><canvas id="cd-av" width="16" height="22"></canvas><div class="offer" style="flex:1"><p><b>' + esc(cd.name) + '</b>　<small>@' + esc(cd.username) + '</small></p>' +
      '<p>' + (pins.length ? pins.map(id => { const a = ACH.find(x => x.id === id); return a ? '<span title="' + esc(a.n) + '" style="font-size:22px">' + a.ic + '</span>' : ''; }).join(' ') : '<small style="opacity:.5">' + (cd.self ? '點下面的成就可以置頂（最多 3 個）' : '還沒有置頂成就') + '</small>') + '</p></div></div>';
    if (cd.self) {
      h += '<div class="gmrow"><input class="nameinput" id="cd-bio" type="text" maxlength="80" autocomplete="off" placeholder="寫一句自我介紹（好友看得到）" value="' + esc(cd.bio || '') + '"><button type="button" class="btn small" data-a="bio">儲存</button></div>';
      if (cdMsg) h += '<p class="mk-msg">' + esc(cdMsg) + '</p>';
    } else h += '<div class="cdbio">' + (cd.bio ? esc(cd.bio) : '<span style="opacity:.5">這個人還沒有寫自我介紹</span>') + '</div>';
    h += '<div class="cdlv"><div><b>' + (cd.pl | 0) + '</b>玩家</div><div><b>' + (cd.farm | 0) + '</b>農耕</div><div><b>' + (cd.fish | 0) + '</b>釣魚</div><div><b>' + (cd.bug | 0) + '</b>捕蟲</div></div>';
    h += '<p class="empty">魚圖鑑 ' + (st.fish_found | 0) + '/' + (st.fish_total | 0) + ' · 蟲蝶圖鑑 ' + (st.bug_found | 0) + '/' + (st.bug_total | 0) + ' · 釣到 ' + (st.fish_caught | 0) + ' 條 · 抓到 ' + (st.bug_caught | 0) + ' 隻<br>田 ' + (st.plots | 0) + ' 塊 · 家具 ' + (st.furniture | 0) + ' 件 · 好友 ' + (st.friends | 0) + ' 位 · 加入 ' + (st.days | 0) + ' 天</p>';
    const tot = ACH.filter(a => got.has(a.id)).length, pct = Math.round(tot / ACH.length * 100);
    const cat = ACH_CATS.find(c => c.k === cdCat);
    if (!cat) {
      h += '<div class="achhero"><div class="achring" style="--p:' + pct + '"><b>' + tot + '/' + ACH.length + '</b></div><div><b>成就收集</b><small>' + (tot >= ACH.length ? '全部集滿了！' : '還差 ' + (ACH.length - tot) + ' 個，點分類看看') + '</small></div></div>' +
        '<div class="achcats">' + ACH_CATS.map(c => { const n = c.a.filter(a => got.has(a.id)).length; return '<button type="button" class="achcat" data-a="acat" data-c="' + c.k + '"><i>' + c.ic + '</i><b>' + c.n + '</b><span class="achbar"><i style="width:' + Math.round(n / c.a.length * 100) + '%"></i></span><small>' + n + ' / ' + c.a.length + '</small></button>'; }).join('') + '</div>';
    } else {
      const n = cat.a.filter(a => got.has(a.id)).length;
      h += '<button type="button" class="achback" data-a="aback">◀ 回總覽</button><h3>' + cat.ic + ' ' + cat.n + '　' + n + '/' + cat.a.length + '</h3><div class="achl' + (cd.self ? ' cdself' : '') + '">' +
        cat.a.map(a => {
          const ok = got.has(a.id), pin = ok && (cd.badges || []).includes(a.id), fm = /^fit(\d+)$/.exec(a.id);
          let st = ok ? (pin ? '📌' : '✓') : '';
          if (!ok && fm && cd.self) { let c_ = 0; for (let c = 0; c < OUTFITS.length; c++) if (fcHave(+fm[1], c)) c_++; st = c_ + '/' + OUTFITS.length; }
          return '<div class="achrow ach' + (ok ? '' : ' off') + (pin ? ' pin' : '') + '" data-a="' + (cd.self && ok ? 'pin' : '') + '" data-id="' + a.id + '"><i>' + a.ic + '</i><div class="m">' + esc(a.n) + '<small>' + esc(a.d) + '</small></div><span class="st">' + st + '</span></div>';
        }).join('') + '</div>' + (cd.self ? '<p class="empty">點已獲得的成就可以置頂（最多 3 個）</p>' : '');
    }
  }
  const keep = $('cd-bio') ? $('cd-bio').value : null;
  cdCard.innerHTML = h + (cd && !cd.self && !cdGift ? '<button type="button" class="btn wide" data-a="gift">寄明信片＆禮物給 ' + esc(cd.name) + '</button>' : '') +
    (cdGift ? '<button type="button" class="btn ghost wide" data-a="back">回到名片</button>' : '') +
    (cd && cd.self && !cdGift ? '<button type="button" class="btn wide" data-a="lv">等級與解鎖說明</button>' : '') + '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  if (keep !== null && $('cd-bio') && cdMsg === '') $('cd-bio').value = keep;
  const cv = $('cd-av');
  if (cv && cd) { const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 16, 22); g = c2; try { drawPlayer(0, 6, 'down', false, 0, toChar(cd.name, cd.look)); } catch (e) { /* 略過 */ } g = ctx; }
}
let cdUid = '';
const cdTimeout = (p, ms) => Promise.race([p, new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms))]);
const cdArr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v) : []);   // 伺服器偶爾回物件（空的 {}）而不是陣列
function cdNorm(r) {
  if (Array.isArray(r)) r = r[0];                                  // 回傳成資料表時是「只有一列的陣列」
  if (!r || typeof r !== 'object') return null;
  r.ach = cdArr(r.ach); r.badges = cdArr(r.badges);
  if (!r.stats || typeof r.stats !== 'object') r.stats = {};
  return r;
}
function cdShow() {                                                // 畫面出錯也不要一直卡在「讀取中…」
  try { renderCard(); }
  catch (e) { console.error('名片顯示失敗', e); cd = null; cdMsg = '名片資料讀取失敗，請重試'; try { renderCard(); } catch (e2) { /* 略過 */ } }
}
async function loadCard() {
  const my = ++cdSeq; cd = null; cdMsg = ''; cdGift = false; cdCat = ''; cdShow();
  try {
    const r = cdNorm(await cdTimeout(rpc('card_get', cdUid ? { p_uid: cdUid } : {}), 12000));
    if (my === cdSeq) { cd = r; if (!r) cdMsg = '找不到這張名片，對方可能剛離開'; }
  } catch (e) { if (my === cdSeq) cdMsg = /timeout/.test(String((e && e.message) || e)) ? '讀取太久了，請檢查網路後按重試' : errText(e); }
  if (my === cdSeq && cdOpen) cdShow();
}
async function openCard(uid) {
  if (!ready || !me || authOpen || paused()) return;
  cdOpen = true; pressed.length = 0; cdUid = uid || ''; cdEl.hidden = false; cdCard.focus();
  await loadCard();
}
function closeCard() { cdOpen = false; cdEl.hidden = true; cdSeq++; }
cdCard.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b || !b.dataset.a) return;
  const a = b.dataset.a;
  if (a === 'close') closeCard();
  else if (a === 'retry') loadCard();
  else if (a === 'lv') { closeCard(); openLevels(); }
  else if (a === 'gift') { const u = cd && cd.uid; closeCard(); if (u && isFriend(u)) openMail(u); else toast('要先成為好友才能寄明信片'); }
  else if (a === 'back') { cdGift = false; cdMsg = ''; renderCard(); }
  else if (a === 'acat') { cdCat = b.dataset.c; cdMsg = ''; renderCard(); cdEl.scrollTop = 0; }
  else if (a === 'aback') { cdCat = ''; cdMsg = ''; renderCard(); }
  else if (a === 'give') {
    const k = b.dataset.k; b.disabled = true;
    try { const r = await rpc('gift_send', { p_uid: cd.uid, p_item: k }); if (r.inv) Object.assign(inv, r.inv); cdMsg = '已送出 ' + itemName(k) + '！今天還能送 ' + (r.left | 0) + ' 份'; refreshHud(); }
    catch (err) { cdMsg = errText(err); }
    renderCard();
  }
  else if (a === 'pin') {
    const id = b.dataset.id, cur = (cd.badges || []).slice(), i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else if (cur.length < 3) cur.push(id); else { cdMsg = '最多置頂 3 個'; renderCard(); return; }
    try { const r = await rpc('badges_set', { p_ids: cur }); cd.badges = r.badges || cur; cdMsg = ''; } catch (err) { cdMsg = errText(err); }
    renderCard();
  }
  else if (a === 'bio') {
    const v = ($('cd-bio').value || '').trim().slice(0, 80);
    try { const r = await rpc('bio_set', { p_bio: v }); cd.bio = r.bio; cdMsg = '已儲存'; } catch (err) { cdMsg = errText(err); }
    renderCard();
  }
});
cdEl.addEventListener('click', e => { if (e.target === cdEl) closeCard(); });
