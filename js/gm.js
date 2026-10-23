'use strict';
/* 出門選單與 GM 邀請碼 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 出門選單（村莊大門） ---------- */
const vmEl = $('vmenu'), vmCard = $('vmcard');
let vmRooms = null, vmSeq = 0;
function renderVMenu() {
  const rooms = vmRooms
    ? '<h3>公開廣場（目前人數）</h3><div class="v-quick">' + vmRooms.map(r => {
        const full = r.n >= r.cap;
        return '<button type="button" class="qbtn" data-a="room" data-k="' + r.k + '"' + (full ? ' disabled' : '') + '>#' + r.k + ' · ' + r.n + '/' + r.cap + (full ? ' 已滿' : r.n ? ' 人' : ' 空') + '</button>';
      }).join('') + '</div>'
    : '';
  vmCard.innerHTML = '<div class="shop-h"><h2>村莊大門</h2></div>' +
    '<p class="empty">廣場上最多 8 個人，可以一起走動、聊天。</p>' +
    '<button type="button" class="btn wide" data-a="public">去公開廣場（自動分配）</button>' + rooms +
    '<button type="button" class="btn wide" data-a="new">建立私人村（只有知道邀請碼的人能進）</button>' +
    '<h3>加入朋友的私人村</h3>' +
    '<div class="gmrow"><input class="nameinput" id="vm-code" type="text" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="6 碼村莊邀請碼"><button type="button" class="btn small" data-a="join">加入</button></div>' +
    '<button type="button" class="btn ghost wide" data-a="close">先不要</button>';
}
async function loadVRooms() {
  const my = ++vmSeq;
  try {
    const list = await rpc('village_rooms');
    if (my !== vmSeq || !vmOpen || !Array.isArray(list)) return;
    vmRooms = list.filter(r => r && Number.isInteger(r.k) && Number.isInteger(r.n) && Number.isInteger(r.cap));
    const code = $('vm-code') ? $('vm-code').value : '';
    renderVMenu(); if ($('vm-code')) $('vm-code').value = code;
  } catch (e) { /* 還沒跑 SQL 補丁就照舊，只是看不到人數 */ }
}
function openVMenu() { vmOpen = true; pressed.length = 0; vmRooms = null; renderVMenu(); vmEl.hidden = false; vmCard.focus(); loadVRooms(); }
function closeVMenu() { vmOpen = false; vmSeq++; vmEl.hidden = true; }
vmCard.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]');
  if (!b) return;
  const a = b.dataset.a;
  if (a === 'close') closeVMenu();
  else if (a === 'public') joinVillage('public');
  else if (a === 'room') joinVillage('room', null, +b.dataset.k);
  else if (a === 'new') joinVillage('private_new');
  else if (a === 'join') joinVillage('private_join', $('vm-code').value);
});

/* ---------- GM：邀請碼 ---------- */
const gmEl = $('gm'), gmCard = $('gmcard');
let gmList = [], gmNew = [];
function renderGM() {
  const fresh = gmNew.length
    ? '<h3>剛產生的邀請碼</h3><div class="offer">' + gmNew.map(c => '<p class="codebox">' + esc(c) + '</p>').join('') + '</div><button type="button" class="btn small" data-a="copyall">全部複製</button>'
    : '';
  const rows = gmList.length ? gmList.map(i => {
    const used = !!i.used_by;
    return '<div class="row"><div class="meta"><b class="codebox">' + esc(i.code) + '</b><small>' +
      (used ? '已由 ' + esc(i.used_by) + ' 使用' : '未使用') + (i.note ? ' · ' + esc(i.note) : '') + ' · ' + fmtTime(i.created) + '</small></div>' +
      (used ? '' : '<button type="button" class="btn small" data-a="copy" data-c="' + esc(i.code) + '">複製</button> <button type="button" class="btn small ghost" data-a="revoke" data-c="' + esc(i.code) + '">作廢</button>') + '</div>';
  }).join('') : '<p class="empty">還沒有邀請碼。</p>';
  gmCard.innerHTML = '<div class="shop-h"><h2>GM 邀請碼</h2></div>' +
    '<h3>發金幣</h3><div class="gmrow"><input class="nameinput" id="gm-gu" type="text" maxlength="16" placeholder="玩家帳號（不用加 @）" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="玩家帳號"><input class="num gm-amt" id="gm-ga" type="number" min="1" max="1000000" value="1000" aria-label="金幣數量"><button type="button" class="btn small" data-a="grant">發送</button></div><p class="gm-msg" id="gm-gmsg" aria-live="polite"></p>' +
    '<p class="empty">每組邀請碼只能讓一個人註冊一次。</p>' +
    '<div class="gmrow"><input class="num" id="gm-n" type="number" min="1" max="20" value="1" aria-label="數量"><input class="nameinput" id="gm-note" type="text" maxlength="30" placeholder="備註（例如給誰）"><button type="button" class="btn small" data-a="make">產生</button></div>' +
    fresh + '<h3>最近的邀請碼</h3>' + rows + '<button type="button" class="btn ghost wide" data-a="close">關閉</button>';
}
async function loadGM() {
  try { gmList = await rpc('gm_list_invites') || []; } catch (e) { toast(errText(e)); }
  renderGM();
}
function openGM() { gmOpen = true; pressed.length = 0; gmNew = []; renderGM(); gmEl.hidden = false; loadGM(); }
function closeGM() { gmOpen = false; gmEl.hidden = true; }
gmCard.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]');
  if (!b) return;
  const a = b.dataset.a, c = b.dataset.c;
  try {
    if (a === 'close') closeGM();
    else if (a === 'make') {
      gmNew = await rpc('gm_create_invites', { p_count: Math.max(1, Math.min(20, parseInt($('gm-n').value, 10) || 1)), p_note: $('gm-note').value || null });
      await loadGM();
    } else if (a === 'copy') copyText(c);
    else if (a === 'copyall') copyText(gmNew.join('\n'));
    else if (a === 'revoke') { await rpc('gm_revoke_invite', { p_code: c }); gmNew = gmNew.filter(x => x !== c); await loadGM(); }
    else if (a === 'grant') {
      const msgEl = $('gm-gmsg');
      const say = (t, ok) => { msgEl.textContent = t; msgEl.className = 'gm-msg ' + (ok ? 'ok' : 'err'); };
      const u = ($('gm-gu').value || '').trim().replace(/^@/, '');
      const n = Math.floor(+$('gm-ga').value);
      if (!u) { say('請輸入玩家帳號', false); return; }
      if (!(n >= 1 && n <= 1000000)) { say('金幣數量要在 1 到 1,000,000 之間', false); return; }
      b.disabled = true; say('發送中…', true);
      try {
        await rpc('gm_grant_coins', { p_username: u, p_amount: n });
        say('已發送 ' + n + ' G 給 @' + u, true);
        try { await enqueue(async () => { applyState(await rpc('get_state')); refreshHud(); }); } catch (e2) {}
      } catch (er) {
        const m = String((er && (er.message || er.msg)) || er || '');
        const code = String((er && er.code) || '');
        if (/Could not find the function|PGRST202/i.test(m + ' ' + code)) say('找不到 gm_grant_coins 函式（可能還沒建，或 Supabase 還沒重新載入）。詳細：' + m.slice(0, 160), false);
        else if (Object.keys(ERR).some(k => m.includes(k))) say(errText(er), false);
        else say('發生錯誤：' + m.slice(0, 220) + (code ? '（' + code + '）' : ''), false);
      } finally { b.disabled = false; }
    }
  } catch (err) { toast(errText(err)); }
});
$('gmbtn').addEventListener('click', () => { if (ready && me && me.gm) openGM(); });
