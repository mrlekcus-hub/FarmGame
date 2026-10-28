'use strict';
/* 明信片與寫信 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 明信片與寫信：寄給好友，花 1～10 金幣，收件匣最多留 50 封 ---------- */
const mlEl = $('mlm'), mlCard = $('mlcard');
let mlOpen = false, ml = { cards: [], inbox: [], unread: 0 }, mlTab = 'in', mlTo = '', mlPick = 'plain', mlMsg = '', mlView = 0, mlItem = '', mlBusy = false, mlErr = '', mlOk = '', mlLoaded = false;
function disc(g, cx, cy, rad, col) { g.fillStyle = col; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.5) g.fillRect(cx + x, cy + y, 1, 1); }
function cardArt(cv, key) {
  const g = cv.getContext('2d'), W2 = 64, H2 = 40;
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const bands = (cols, y0, y1) => { const n = cols.length, h = (y1 - y0) / n; cols.forEach((c, i) => R(c, 0, Math.round(y0 + i * h), W2, Math.ceil(h))); };
  const hill = (c, base, amp, ph, w) => { for (let x = 0; x < W2; x++) { const y = Math.round(base - Math.abs(Math.sin(x / w + ph)) * amp); R(c, x, y, 1, H2 - y); } };
  const stars = (n, seed, col) => { for (let i = 0; i < n; i++) { const x = Math.floor(hash(i, seed, 1) * W2), y = Math.floor(hash(i, seed, 2) * 22); R(col || '#fff6c8', x, y, 1, 1); if (i % 5 === 0) { R(col || '#fff6c8', x - 1, y, 3, 1); R(col || '#fff6c8', x, y - 1, 1, 3); } } };
  const tree = (x, y, trunk, leaf, leaf2) => { R(trunk, x, y, 2, 9); disc(g, x + 1, y - 2, 6, leaf); disc(g, x - 2, y, 4, leaf2 || leaf); disc(g, x + 4, y, 4, leaf2 || leaf); };
  g.imageSmoothingEnabled = false;
  if (key === 'plain') {
    R('#fff6e0', 0, 0, W2, H2); R('#e8c9a0', 0, 0, W2, 1); R('#e8c9a0', 0, H2 - 1, W2, 1); R('#e8c9a0', 0, 0, 1, H2); R('#e8c9a0', W2 - 1, 0, 1, H2);
    R('#d9b894', 34, 8, 1, 24); for (let i = 0; i < 4; i++) R('#d9b894', 6, 10 + i * 6, 22, 1);
    R('#ff8fa8', 46, 6, 12, 12); R('#fff6e0', 48, 8, 8, 8); R('#ff8fa8', 51, 10, 2, 4);
  } else if (key === 'meadow') {
    bands(['#a8dcf5', '#bfe6ff', '#d8f1ff'], 0, 24); disc(g, 50, 9, 5, '#ffe27a'); disc(g, 14, 8, 4, '#ffffff'); disc(g, 19, 9, 4, '#ffffff'); R('#ffffff', 10, 9, 12, 3);
    hill('#8fd47a', 30, 6, 0.3, 11); hill('#6fbf5a', 36, 4, 1.6, 7);
    [[6, 34, '#ff8fa8'], [14, 37, '#ffd34d'], [26, 35, '#ffffff'], [40, 36, '#ff8fa8'], [52, 34, '#ffd34d'], [58, 37, '#ffffff']].forEach(([x, y, c]) => { R('#3f8f3a', x, y + 1, 1, 3); R(c, x - 1, y, 3, 1); R(c, x, y - 1, 1, 3); R('#ffd34d', x, y, 1, 1); });
  } else if (key === 'pond') {
    bands(['#7a5ab8', '#c0679a', '#ff8f7a', '#ffc27a'], 0, 22); disc(g, 32, 22, 8, '#fff0a8');
    R('#3a5f86', 0, 22, W2, 18); R('#5a82ad', 0, 25, W2, 1); R('#5a82ad', 8, 29, 20, 1); R('#5a82ad', 36, 33, 20, 1);
    R('#ffe9a0', 26, 24, 12, 1); R('#ffe9a0', 28, 27, 8, 1); R('#ffe9a0', 29, 30, 6, 1);
    for (const x of [4, 8, 56, 60]) { R('#2f5a3a', x, 14, 1, 14); R('#7a5a3a', x - 1, 11, 3, 4); }
    R('#2f5a3a', 0, 30, 14, 10); R('#2f5a3a', 50, 32, 14, 8);
  } else if (key === 'stars') {
    bands(['#141a44', '#1d2458', '#2a2f6e', '#3a3a82'], 0, 28); stars(26, 5); disc(g, 48, 9, 6, '#fff6c8'); disc(g, 51, 8, 5, '#2a2f6e');
    hill('#1a1f3c', 32, 5, 0.5, 9); hill('#10142c', 37, 3, 2.1, 6);
  } else if (key === 'sakura') {
    bands(['#ffe3ef', '#ffd1e0', '#ffc2d8'], 0, 30); R('#8a6a5a', 30, 14, 4, 26); R('#8a6a5a', 24, 20, 8, 2); R('#8a6a5a', 33, 18, 9, 2);
    [[32, 8, 10], [22, 13, 7], [42, 12, 8], [28, 4, 6], [36, 3, 6]].forEach(([x, y, rr], i) => disc(g, x, y, rr, i % 2 ? '#ff9fc0' : '#ffb3cc'));
    R('#a8dc9a', 0, 36, W2, 4); for (let i = 0; i < 16; i++) R('#fff', Math.floor(hash(i, 3, 4) * 62), 10 + Math.floor(hash(i, 3, 5) * 28), 1, 1);
  } else if (key === 'maple') {
    bands(['#ffd9a0', '#ffc27a', '#ffa86a'], 0, 30); disc(g, 12, 9, 4, '#fff0c0');
    R('#8a5a3a', 31, 20, 3, 20); tree(32, 20, '#8a5a3a', '#e0483c', '#ff9a3a'); disc(g, 32, 8, 7, '#ff7a2a');
    R('#b8793a', 0, 36, W2, 4); for (let i = 0; i < 14; i++) R(i % 2 ? '#e0483c' : '#ff9a3a', Math.floor(hash(i, 6, 1) * 62), 24 + Math.floor(hash(i, 6, 2) * 15), 2, 1);
  } else if (key === 'snow') {
    bands(['#10163a', '#1c2552', '#2c3a72'], 0, 26); stars(14, 8); disc(g, 52, 8, 4, '#fff6c8');
    hill('#e8f0ff', 30, 5, 0.4, 10); R('#e8f0ff', 0, 33, W2, 7);
    R('#7a4a3a', 22, 22, 18, 12); R('#c9ddf5', 20, 19, 22, 4); R('#e8f0ff', 22, 17, 18, 3); R('#7a4a3a', 32, 20, 3, 4);
    R('#ffe27a', 25, 26, 4, 4); R('#ffe27a', 34, 26, 3, 8); R('#fff6c8', 26, 27, 2, 2);
    tree(8, 24, '#5a3a2a', '#2f6a4a'); tree(54, 26, '#5a3a2a', '#2f6a4a'); for (let i = 0; i < 16; i++) R('#fff', Math.floor(hash(i, 2, 7) * 63), Math.floor(hash(i, 2, 8) * 38), 1, 1);
  } else if (key === 'beach') {
    bands(['#ff9a6a', '#ffb87a', '#ffd6a0', '#ffe9c0'], 0, 22); disc(g, 32, 22, 9, '#fff0b0'); disc(g, 32, 22, 6, '#ffd86a');
    R('#3a8fb8', 0, 22, W2, 8); R('#5ab0d0', 0, 24, W2, 1); R('#ffe9a0', 24, 23, 16, 1); R('#8fd0e8', 6, 27, 14, 1); R('#8fd0e8', 42, 28, 14, 1);
    R('#f0d08a', 0, 30, W2, 10); R('#fff6e0', 0, 30, W2, 1); R('#e0b868', 8, 34, 6, 1); R('#e0b868', 40, 36, 8, 1);
    R('#8a5a3a', 52, 18, 2, 18); R('#3f9f4a', 48, 16, 10, 2); R('#3f9f4a', 49, 14, 8, 2); R('#3f9f4a', 51, 12, 4, 2);
  } else if (key === 'rainbow') {
    bands(['#9fd8f5', '#bfe6ff', '#d8f1ff'], 0, 28);
    ['#ff6a6a', '#ffa84d', '#ffe36a', '#7ad66a', '#5ab0f0', '#9a7ae8'].forEach((c, i) => { const rad = 26 - i * 2; for (let a = 0; a <= 180; a += 2) { const x = Math.round(32 + Math.cos(a * Math.PI / 180) * rad * 1.15), y = Math.round(32 - Math.sin(a * Math.PI / 180) * rad); R(c, x, y, 2, 2); } });
    disc(g, 8, 8, 4, '#fff'); disc(g, 13, 9, 4, '#fff'); disc(g, 54, 12, 4, '#fff'); disc(g, 50, 13, 3, '#fff');
    R('#7ad66a', 0, 32, W2, 8); R('#5fbf55', 0, 34, W2, 1);
    for (let i = 0; i < 14; i++) { const x = 2 + i * 4.5 | 0, c = ['#ff8fa8', '#ffd34d', '#ffffff', '#c9a0ff', '#ff6a6a'][i % 5]; R('#3f8f3a', x, 35, 1, 4); R(c, x - 1, 34, 3, 1); R(c, x, 33, 1, 3); R('#ffd34d', x, 34, 1, 1); }
  } else if (key === 'photo') {
    bands(['#ffd6e4', '#ffe3ec', '#fff0f5'], 0, 40);
    R('#fffaf0', 12, 4, 40, 32); R('#e8c8b0', 12, 4, 40, 1); R('#e8c8b0', 12, 35, 40, 1); R('#e8c8b0', 12, 4, 1, 32); R('#e8c8b0', 51, 4, 1, 32);
    R('#bfe6ff', 15, 7, 34, 20); R('#9fd8f5', 15, 7, 34, 7); R('#8fe09a', 15, 22, 34, 5);
    [[24, '#ffcfa8', '#6b4848', '#ff8fa8'], [36, '#ffcfa8', '#a0522d', '#5fb8e6']].forEach(([x, skin, hair, cloth]) => {
      R(hair, x, 12, 7, 3); R(skin, x, 14, 7, 6); R('#4a2c2c', x + 1, 16, 1, 1); R('#4a2c2c', x + 5, 16, 1, 1); R(cloth, x - 1, 20, 9, 6);
    });
    disc(g, 32, 9, 2, '#ff6a8a'); R('#ffd34d', 44, 9, 3, 1); R('#ffd34d', 45, 8, 1, 3);
    R('#e8c8b0', 20, 29, 24, 1); R('#f0d8c8', 22, 31, 20, 1);
  } else {
    bands(['#050a24', '#0a1a3a', '#0e2e4a', '#0f3f4a'], 0, 30); stars(18, 3);
    for (let x = 0; x < W2; x++) {
      const t = Math.sin(x / 7) * 4 + Math.sin(x / 3.1) * 1.5;
      R('rgba(80,255,170,.55)', x, Math.round(8 + t), 1, 10); R('rgba(120,255,200,.35)', x, Math.round(5 + t), 1, 5);
      R('rgba(170,110,255,.4)', x, Math.round(18 + t * 0.7), 1, 6); R('rgba(255,120,220,.25)', x, Math.round(22 + t * 0.6), 1, 3);
    }
    hill('#e0ecff', 33, 4, 0.8, 9); R('#e0ecff', 0, 36, W2, 4); tree(10, 26, '#3a2a2a', '#1f4a3a'); tree(52, 27, '#3a2a2a', '#1f4a3a');
  }
  R('rgba(0,0,0,.15)', 0, 0, W2, 1);
}
function mailBadge() {
  const n = ml.unread | 0;
  ['mailbadge', 'immmb'].forEach(id => { const b = $(id); if (b) { b.hidden = !n; b.textContent = n; } });
  updateFoldBadge();
}
async function mailLoad(quiet) {
  try {
    mailPollAt = Date.now();
    const before = ml.unread | 0, d = await rpc('mail_list');
    ml = { cards: Array.isArray(d.cards) ? d.cards : [], inbox: Array.isArray(d.inbox) ? d.inbox : [], unread: d.unread | 0 }; mlLoaded = true;
    if (!quiet && ml.unread > before && before >= 0 && !mlOpen) toast('收到新的明信片！按 M 打開信箱', 4000);
    mailBadge(); if (mlOpen) renderMail();
  } catch (e) { /* 伺服器還沒更新就略過 */ }
}
let mailPollAt = 0;
document.addEventListener('visibilitychange', () => { if (!document.hidden && ready) mailPoll(); });   // 切回遊戲分頁時，超過 5 分鐘沒查就馬上查
async function mailPoll() {   // 每 5 分鐘只問「有幾封未讀」（幾十個位元組），有新的才讀完整收件匣
  if (Date.now() - mailPollAt < 290000 || mlOpen) return;
  mailPollAt = Date.now();
  try {
    const n = await rpc('mail_unread');
    if (typeof n === 'number' && n !== (ml.unread | 0)) { if (n > (ml.unread | 0)) toast('收到新的明信片！按 M 打開信箱', 4000); await mailLoad(true); }
  } catch (e) { /* 略過 */ }
}
function openMail(to) {
  if (!ready || !me || authOpen || paused() || mlOpen) return;
  mlOpen = true; pressed.length = 0; mlErr = ''; mlView = 0;
  if (to) { mlTab = 'send'; mlTo = to; } else mlTab = ml.unread ? 'in' : (mlTab || 'in');
  renderMail(); mlEl.hidden = false; mlCard.focus();
  mailLoad(true).then(() => { if (mlOpen && mlTab === 'in' && ml.unread) rpc('mail_read').then(() => { ml.unread = 0; ml.inbox.forEach(m => { m.read = true; }); mailBadge(); }).catch(() => {}); });
}
function closeMail() { mlOpen = false; mlOk = ''; mlEl.hidden = true; }
function renderMail() {
  const cname = k => ((ml.cards.find(c => c.key === k) || {}).name || '明信片');
  let h = '<div class="shop-h"><h2>✉️ 信箱</h2><span class="chip gold">' + (me ? me.coins : 0) + ' G</span></div>' +
    '<div class="mltabs"><button type="button" class="btn small' + (mlTab === 'in' ? '' : ' ghost') + '" data-a="tab" data-t="in">收件匣' + (ml.unread ? '（' + ml.unread + '）' : '') + '</button>' +
    '<button type="button" class="btn small' + (mlTab === 'send' ? '' : ' ghost') + '" data-a="tab" data-t="send">寄明信片</button></div>';
  if (mlOk) h += '<p class="mk-msg ml-ok" role="status">' + esc(mlOk) + '</p>';
  if (mlErr) h += '<p class="mk-msg">' + esc(mlErr) + '</p>';
  if (mlTab === 'in') {
    const v = mlView ? ml.inbox.find(m => m.id === mlView) : null;
    if (v) {
      h += '<div class="mlbig"><canvas width="64" height="40" data-card="' + esc(v.card) + '"></canvas><div class="mlmsg">' + esc(v.msg).replace(/\n/g, '<br>') + '</div>' +
        '<div class="mlfrom">— ' + esc(v.name) + ' · ' + fmtDay(v.at) + '</div></div>' +
        (v.item ? '<div class="giftrow"><span>🎁 附贈禮物：' + esc(itemName(v.item)) + ' ×1</span>' + (v.claimed ? '<small>已領取</small>' : '<button type="button" class="btn small" data-a="claim" data-id="' + v.id + '">領取</button>') + '</div>' : '') +
        '<div class="v-quick"><button type="button" class="btn" data-a="reply" data-u="' + esc(v.from) + '"' + (isFriend(v.from) ? '' : ' disabled') + '>回信給 ' + esc(v.name) + '</button>' +
        '<button type="button" class="btn ghost" data-a="del" data-id="' + v.id + '"' + (v.item && !v.claimed ? ' disabled' : '') + '>刪除</button></div>' +
        '<button type="button" class="btn ghost wide" data-a="back">回收件匣</button>';
    } else if (!mlLoaded) h += '<p class="empty">讀取中…（如果一直沒出現，請確認伺服器已更新）</p>';
    else if (!ml.inbox.length) h += '<p class="empty">還沒有收到明信片。到「寄明信片」寄一張給好友吧！</p>';
    else h += ml.inbox.map(m => '<div class="mlrow' + (m.read && !(m.item && !m.claimed) ? '' : ' new') + '" data-a="open" data-id="' + m.id + '" role="button" tabindex="0"><canvas width="64" height="40" data-card="' + esc(m.card) + '"></canvas>' +
      '<div class="meta"><b>' + (m.read ? '' : '🔴 ') + (m.item && !m.claimed ? '🎁 ' : '') + esc(m.name) + '</b><small>' + esc(cname(m.card)) + ' · ' + fmtDay(m.at) + '</small><small>' + esc(m.msg.slice(0, 24)) + (m.msg.length > 24 ? '…' : '') + '</small></div></div>').join('');
  } else {
    const fl = fr.friends;
    if (!fl.length) h += '<p class="empty">還沒有好友。先到好友頁加好友，才能寄明信片。</p>';
    else {
      if (!fl.some(f => f.uid === mlTo)) mlTo = fl[0].uid;
      const pr = (ml.cards.find(c => c.key === mlPick) || { price: 1 }).price;
      h += '<label class="mllab">寄給</label><select id="ml-to" class="nameinput">' + fl.map(f => '<option value="' + esc(f.uid) + '"' + (f.uid === mlTo ? ' selected' : '') + '>' + esc(f.name) + '（@' + esc(f.username) + '）</option>').join('') + '</select>' +
        '<label class="mllab">選明信片</label><div class="mlgrid">' + ml.cards.map(c => '<button type="button" class="mlpick' + (c.key === mlPick ? ' on' : '') + '" data-a="pick" data-k="' + esc(c.key) + '"><canvas width="64" height="40" data-card="' + esc(c.key) + '"></canvas><b>' + esc(c.name) + '</b><small>' + c.price + ' G</small></button>').join('') + '</div>' +
        '<label class="mllab">附上禮物（選填，每張明信片只能附 1 個；一天最多 3 份）</label><select id="ml-item" class="nameinput"><option value="">不附禮物</option>' +
        Object.keys(inv).filter(k => /^(c|fish|bug):[a-z0-9_]+$/.test(k) && have(k) > 0).map(k => '<option value="' + esc(k) + '"' + (k === mlItem ? ' selected' : '') + '>' + esc(itemName(k)) + '（寄 1 個，持有 ' + have(k) + '）</option>').join('') + '</select>' +
        '<label class="mllab">寫幾句話（最多 200 字）</label><textarea id="ml-msg" class="nameinput mltext" maxlength="200" rows="4" placeholder="今天農場的蘿蔔長得很好，改天一起釣魚吧！">' + esc(mlMsg) + '</textarea>' +
        '<button type="button" class="btn wide" data-a="send"' + (mlBusy || !me || me.coins < pr ? ' disabled' : '') + '>寄出（' + pr + ' G' + (mlItem ? '，附 ' + itemName(mlItem) + ' ×1' : '') + '）</button>';
    }
  }
  h += '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
  mlCard.innerHTML = h;
  mlCard.querySelectorAll('canvas[data-card]').forEach(cv => cardArt(cv, cv.dataset.card));
}
mlCard.addEventListener('input', e => { if (e.target.id === 'ml-msg') mlMsg = e.target.value; });
mlCard.addEventListener('change', e => { if (e.target.id === 'ml-to') mlTo = e.target.value; if (e.target.id === 'ml-item') mlItem = e.target.value; });
mlCard.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a; mlErr = ''; mlOk = '';
  if (a === 'close') { closeMail(); return; }
  if (a === 'tab') { mlTab = b.dataset.t; mlView = 0; renderMail(); return; }
  if (a === 'open') { mlView = +b.dataset.id; renderMail(); return; }
  if (a === 'back') { mlView = 0; renderMail(); return; }
  if (a === 'pick') { mlPick = b.dataset.k; renderMail(); return; }
  if (a === 'reply') { mlTo = b.dataset.u; mlTab = 'send'; mlView = 0; renderMail(); return; }
  if (a === 'claim') {
    try { const r = await rpc('mail_claim', { p_id: +b.dataset.id }); if (r.inv) Object.assign(inv, r.inv); const m = ml.inbox.find(x => x.id === +b.dataset.id); if (m) m.claimed = true; toast('領到了 ' + itemName(r.item) + '！'); refreshHud(); }
    catch (err) { mlErr = errText(err); }
    renderMail(); return;
  }
  if (a === 'del') {
    try { const d = await rpc('mail_delete', { p_id: +b.dataset.id }); ml = { cards: d.cards || [], inbox: d.inbox || [], unread: d.unread | 0 }; mlView = 0; mailBadge(); }
    catch (err) { mlErr = errText(err); }
    renderMail(); return;
  }
  if (a === 'send') {
    const msg = mlMsg.trim();
    if (!msg) { mlErr = '先寫幾句話再寄出吧'; renderMail(); return; }
    mlBusy = true; renderMail();
    try {
      const r = await enqueue(() => rpc('mail_send', { p_to: mlTo, p_card: mlPick, p_msg: msg, p_item: mlItem || null }));
      if (typeof r.coins === 'number') me.coins = r.coins;
      if (r.inv) Object.assign(inv, r.inv);
      mlMsg = ''; mlItem = ''; const f = fr.friends.find(x => x.uid === mlTo);
      mlOk = '✅ 已發送！明信片寄給 ' + (f ? f.name : '好友') + ' 了' + (typeof r.left === 'number' && r.inv && Object.keys(r.inv).length ? '（今天還能送 ' + r.left + ' 份禮物）' : '');
      toast(mlOk); refreshHud();
    } catch (err) { mlErr = errText(err); }
    mlBusy = false; renderMail();
  }
});
mlEl.addEventListener('click', e => { if (e.target === mlEl) closeMail(); });

async function frCall(name, args, okMsg, notifyUid) {
  if (frBusy) return;
  frBusy = true; frMsg = '';
  try {
    const before = fr.friends.length;
    applyFriends(await rpc(name, args));
    if (notifyUid) notifyFriend(notifyUid);
    toast(fr.friends.length > before ? '你們成為好友了！' : okMsg, 2500);
  } catch (e) { frMsg = errText(e); renderFriends(); }
  frBusy = false;
}
frCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b) return;
  const a = b.dataset.a, u = b.dataset.u;
  if (a === 'close') { closeFriends(); return; }
  if (a === 'rmask') { frConfirm = u; renderFriends(); return; }
  if (a === 'card') { closeFriends(); openCard(u); return; }
  if (a === 'mail') { closeFriends(); openMail(u); return; }
  if (a === 'pact') { closeFriends(); pactInvite(u, b.dataset.p); return; }
  if (a === 'block') {
    const was = isBlocked(u);
    try {
      const d = await rpc('visit_block', { p_uid: u, p_on: !was }); visitBlocks = d.blocks || [];
      if (was) toast('已解除禁止拜訪'); else { kickGuest(u); toast('已禁止拜訪，可再按一次或到設定解除'); }
    } catch (er) { toast(errText(er)); }
    if (frOpen) renderFriends(); syncVisitUI();
    return;
  }
  if (a === 'visit') {
    const f = fr.friends.find(x => x.uid === u) || (frTarget && frTarget.id === u ? frTarget : null);
    closeFriends(); visitHouse(u, f && f.name); return;
  }
  frConfirm = '';
  if (a === 'reqid') await frCall('friend_request_uid', { p_uid: u }, '已送出好友申請', u);
  else if (a === 'accept') await frCall('friend_accept', { p_uid: u }, '已接受', u);
  else if (a === 'clear') await frCall('friend_clear', { p_uid: u }, '已處理');
  else if (a === 'remove') await frCall('friend_remove', { p_uid: u }, '已刪除好友');
  else if (a === 'requser') {
    const name = ($('fr-user').value || '').trim().toLowerCase();
    if (!name) { frMsg = '請輸入對方的帳號'; renderFriends(); return; }
    await frCall('friend_request', { p_username: name }, '已送出好友申請');
    const hit = fr.outgoing.concat(fr.friends).find(f => f.username === name);
    if (hit) { notifyFriend(hit.uid); $('fr-user').value = ''; }
  }
});
