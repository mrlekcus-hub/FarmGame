'use strict';
/* 角色外觀選擇 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 角色外觀 ---------- */
const mk = $('maker'), optsEl = $('opts'), pctx = $('pv').getContext('2d');
let draft = null, pvTimer = 0, pvFace = 0, pvPhase = 0;
const FACES = ['down', 'right', 'up', 'left'];
const LIMIT = { gender: GENDERS.length, skin: SKINS.length, hair: HAIRS.length, style: STYLES.length, hat: HATS.length, hatc: HATCOL.length, glass: GLASSES.length, glassc: GLASSCOL.length, outfit: OUTFITS.length, fits: FITS.length };
function toChar(name, look) {
  const c = { ...DEF_CHAR, name: clean(name, 8) || DEF_CHAR.name };
  for (const k in LIMIT) { const v = look && look[k]; if (Number.isInteger(v) && v >= 0 && v < LIMIT[k]) c[k] = v; }
  return c;
}
const myChar = () => toChar(me && me.name, me && me.look);
/* 衣櫥側欄：左邊分類、右邊縮圖；沒買到的款式與顏色完全不顯示 */
const MK_TABS = [
  { id: 'style', ic: '💇', n: '髮型' }, { id: 'hat', ic: '🎩', n: '帽子' }, { id: 'glass', ic: '👓', n: '眼鏡' },
  { id: 'fits', ic: '👕', n: '衣服' }, { id: 'body', ic: '🧑', n: '身體' }
];
let mkTab = 'fits';
const mkSplit = $('mk-split');
const ownedStyles = () => STYLES.map((_, i) => i).filter(i => styOwned('style', i));
const ownedHats = () => HATS.map((_, i) => i).filter(i => lookOwned('hat', i));
const ownedGlass = () => GLASSES.map((_, i) => i).filter(i => lookOwned('glass', i));
const mkIsNone = (k, i) => (k === 'hat' && i === 3) || (k === 'glass' && i === 0);
const ownedFits = () => FITS.map((_, i) => i).filter(i => i < FREE_N.fits || fitAny(i));
const ownedCols = f => OUTFITS.map((_, c) => c).filter(c => f < FREE_N.fits || fcHave(f, c));
const mkCell = (k, i, name, on) => '<button type="button" class="mk-cell" data-k="' + k + '" data-i="' + i + '" aria-pressed="' + on + '">' +
  (mkIsNone(k, i) ? '<div class="mk-none">✕</div>' : '<canvas width="16" height="22" data-k="' + k + '" data-i="' + i + '"></canvas>') +
  '<span>' + esc(name) + '</span></button>';
const mkSw = (k, cols, idxs, label) => idxs.map(i => '<button type="button" class="sw" data-k="' + k + '" data-i="' + i + '" style="--c:' + cols[i] + '" aria-pressed="' + (draft[k] === i) + '" aria-label="' + label + ' ' + (i + 1) + '"></button>').join('');
function renderMakerPanel() {
  mkSplit.innerHTML = '<div class="mk-rail">' + MK_TABS.map(t => '<button type="button" class="mk-ri" data-tab="' + t.id + '" aria-pressed="' + (t.id === mkTab) + '"><b>' + t.ic + '</b>' + t.n + '</button>').join('') + '</div><div class="mk-main"></div>';
  const m = mkSplit.querySelector('.mk-main');
  let h = '';
  if (mkTab === 'style') {
    h = '<div class="mk-grid">' + ownedStyles().map(i => mkCell('style', i, STYLES[i], draft.style === i)).join('') + '</div>' +
      '<div class="mk-sec"><span class="optlabel">髮色</span><div class="sws">' + mkSw('hair', HAIRS, lookCols('style', draft.style | 0), '髮色') + '</div></div>' +
      '<div class="mk-hint">更多髮型和顏色在小村的造型店，每天上架不同的</div>';
  } else if (mkTab === 'hat') {
    h = '<div class="mk-grid">' + ownedHats().map(i => mkCell('hat', i, HATS[i], draft.hat === i)).join('') + '</div>';
    if (draft.hat !== 3) h += '<div class="mk-sec"><span class="optlabel">帽子顏色</span><div class="sws">' + mkSw('hatc', HATCOL, lookCols('hat', draft.hat | 0), '帽子顏色') + '</div></div>';
    h += '<div class="mk-hint">更多帽子在小村的造型店，每天上架不同的</div>';
  } else if (mkTab === 'glass') {
    h = '<div class="mk-grid">' + ownedGlass().map(i => mkCell('glass', i, GLASSES[i], draft.glass === i)).join('') + '</div>' +
      (draft.glass ? '<div class="mk-sec"><span class="optlabel">眼鏡顏色</span><div class="sws">' + mkSw('glassc', GLASSCOL, lookCols('glass', draft.glass | 0), '眼鏡顏色') + '</div></div>' : '') +
      '<div class="mk-hint">眼鏡在小村的造型店買，每天上架不同的</div>';
  } else if (mkTab === 'fits') {
    const f = draft.fits | 0, cols = ownedCols(f), paid = f >= FREE_N.fits;
    h = '<div class="mk-grid">' + ownedFits().map(i => mkCell('fits', i, FITS[i], f === i)).join('') + '</div>';
    h += '<div class="mk-sec"><span class="optlabel">' + (paid ? esc(FITS[f]) + '的顏色　' + cols.length + ' / ' + OUTFITS.length : '衣服顏色') + '</span>' +
      (paid ? '<div class="mk-prog"><i style="width:' + Math.round(cols.length / OUTFITS.length * 100) + '%"></i></div>' : '') +
      '<div class="sws">' + mkSw('outfit', OUTFITS, cols, '衣服顏色') + '</div>' +
      (paid ? '<div class="mk-hint">' + (cols.length >= OUTFITS.length ? '✅ 已集滿，獲得「' + esc(FITS[f]) + '收藏家」成就' : '集滿 ' + OUTFITS.length + ' 色可得「' + esc(FITS[f]) + '收藏家」成就') + '</div>' : '') + '</div>';
  } else {
    h = '<div class="mk-sec"><span class="optlabel">性別</span><div class="chips">' + GENDERS.map((n, i) => '<button type="button" class="cb" data-k="gender" data-i="' + i + '" aria-pressed="' + (draft.gender === i) + '">' + n + '</button>').join('') + '</div></div>' +
      '<div class="mk-sec"><span class="optlabel">膚色</span><div class="sws">' + mkSw('skin', SKINS, SKINS.map((_, i) => i), '膚色') + '</div></div>';
  }
  m.innerHTML = h;
  m.querySelectorAll('canvas[data-k]').forEach(cv => {
    const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 16, 22); g = c2;
    try { drawPlayer(0, 6, 'down', false, 0, { ...draft, [cv.dataset.k]: +cv.dataset.i }); } catch (e) { /* 略過 */ }
    g = ctx;
  });
}
mkSplit.addEventListener('click', e => {
  if (!draft) return;
  const t = e.target.closest('button[data-tab]');
  if (t) { mkTab = t.dataset.tab; renderMakerPanel(); return; }
  const b = e.target.closest('button[data-k]');
  if (!b) return;
  draft[b.dataset.k] = +b.dataset.i; syncMaker();
});
function drawPreview() {
  g = pctx;
  pctx.clearRect(0, 0, 16, 22);
  drawPlayer(0, 6, FACES[pvFace], true, pvPhase, draft);
  g = ctx;
}
function fitFix() {
  if (!draft) return;
  const f = draft.fits | 0;
  if (f < FREE_N.fits) return;
  if (!fitAny(f)) { draft.fits = 0; return; }
  if (!fcHave(f, draft.outfit | 0)) for (let c = 0; c < OUTFITS.length; c++) if (fcHave(f, c)) { draft.outfit = c; break; }
}
function syncMaker() {
  fitFix();
  if ((draft.style | 0) >= FREE_N.style && !styOwned('style', draft.style | 0)) draft.style = 0;
  if (!lookOwned('hat', draft.hat | 0)) draft.hat = 3;
  if (!lookOwned('glass', draft.glass | 0)) draft.glass = 0;
  [['style', 'hair'], ['hat', 'hatc'], ['glass', 'glassc']].forEach(([k, ck]) => {
    if (k === 'glass' && !draft.glass) return;
    if (k === 'hat' && draft.hat === 3) return;
    const cols = lookCols(k, draft[k] | 0);
    if (cols.length && !cols.includes(draft[ck] | 0)) draft[ck] = cols[0];
  });
  renderMakerPanel();
  drawPreview();
}
function openMaker(first) {
  if (shopOpen || makerOpen) return;
  makerOpen = true; firstTime = first; pressed.length = 0;
  draft = first ? { ...DEF_CHAR, name: '' } : myChar();
  $('mk-name').value = draft.name === DEF_CHAR.name && first ? '' : draft.name;
  $('mk-cancel').hidden = first;
  $('mk-ok').textContent = first ? '開始農場生活' : '完成';
  $('mk-inv-wrap').hidden = !(first && !pendingInvite);
  mkMsg(''); mk.hidden = false; mk.scrollTop = 0; mkTab = 'fits';
  syncMaker();
  clearInterval(pvTimer);
  let n = 0;
  pvTimer = setInterval(() => { pvPhase = (pvPhase + 1) % 2; if (++n % 6 === 0) pvFace = (pvFace + 1) % 4; drawPreview(); }, 280);
}
function closeMaker() { makerOpen = false; mk.hidden = true; clearInterval(pvTimer); }
let mkBusy = false;
const mkMsg = t => { const el = $('mk-msg'); el.textContent = t || ''; el.hidden = !t; };
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('連線逾時，請檢查網路後再按一次')), ms))]);
$('mk-ok').addEventListener('click', async () => {
  if (mkBusy) return;
  mkMsg('');
  const name = clean(($('mk-name').value || '').trim(), 8);
  if (!name) { mkMsg('先幫農夫取個名字吧'); return; }
  const look = {}; for (const k in LIMIT) look[k] = draft[k];
  const invite = pendingInvite || ($('mk-inv').value || '').trim();
  if (firstTime && !invite) { mkMsg('請輸入邀請碼'); return; }
  mkBusy = true;
  const btn = $('mk-ok'), label = btn.textContent;
  btn.disabled = true; btn.textContent = firstTime ? '建立中…' : '儲存中…';
  try {
    if (firstTime) {
      applyState(await withTimeout(rpc('claim_profile', { p_username: authUser, p_name: name, p_look: look, p_invite: invite }), 20000));
      pendingInvite = ''; afterReady();
    } else {
      await withTimeout(enqueue(() => rpc('set_look', { p_name: name, p_look: look })), 20000);
      me.name = name; me.look = look;
    }
    closeMaker(); refreshHud();
    toast(firstTime ? '歡迎，' + name + '！有不懂的地方，可以點「手冊」查看喔。' : '換好新造型了', firstTime ? 5000 : 2800);
  } catch (e) { mkMsg(errText(e)); }
  btn.disabled = false; btn.textContent = label;
  mkBusy = false;
});
$('mk-cancel').addEventListener('click', () => { if (!firstTime) closeMaker(); });
$('mk-rand').addEventListener('click', () => {
  const rnd = n => Math.floor(Math.random() * n);
  for (const k in LIMIT) draft[k] = rnd(FREE_N[k] != null ? FREE_N[k] : LIMIT[k]);
  syncMaker();
});
$('pvturn').addEventListener('click', () => { pvFace = (pvFace + 1) % 4; drawPreview(); });
