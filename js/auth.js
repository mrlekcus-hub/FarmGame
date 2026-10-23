'use strict';
/* 登入與註冊 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 登入與註冊 ---------- */
const authEl = $('auth'), bootEl = $('boot');
let authMode = 'in', authUser = '', authBusy = false;
const setBoot = (t, m) => { $('boot-t').textContent = t; $('boot-m').textContent = m || ''; bootEl.hidden = false; };
function setMode(m) {
  authMode = m;
  $('tab-in').setAttribute('aria-pressed', m === 'in');
  $('tab-up').setAttribute('aria-pressed', m === 'up');
  $('au-go').textContent = m === 'in' ? '登入' : '註冊並開始';
  $('au-pass').autocomplete = m === 'in' ? 'current-password' : 'new-password';
  $('au-msg').textContent = '';
  $('au-code-wrap').hidden = m !== 'up';
}
$('tab-in').addEventListener('click', () => setMode('in'));
$('tab-up').addEventListener('click', () => setMode('up'));
const emailOf = u => u + '@' + EMAIL_DOMAIN;
function authErr(e) {
  const m = String((e && e.message) || e || '');
  if (/bad_invite/.test(m)) return '邀請碼無效或已被使用';
  if (/invalid login/i.test(m)) return '帳號或密碼不對';
  if (/already|registered/i.test(m)) return '這個帳號已經有人用了';
  if (/password/i.test(m) && /6|short|weak/i.test(m)) return '密碼至少要 6 個字元';
  if (/rate|too many/i.test(m)) return '嘗試太多次了，請等一下再試';
  if (/fetch|network/i.test(m)) return '連線不穩，請稍後再試';
  return '失敗：' + clean(m, 80);
}
$('auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (authBusy) return;
  const u = $('au-user').value.trim().toLowerCase(), pw = $('au-pass').value;
  const msg = $('au-msg');
  if (!/^[a-z0-9_]{3,16}$/.test(u)) { msg.textContent = '帳號要 3–16 個小寫英文字母、數字或底線'; return; }
  if (pw.length < 6) { msg.textContent = '密碼至少要 6 個字元'; return; }
  const code = $('au-code').value.trim();
  if (authMode === 'up' && code.replace(/[^A-Za-z0-9]/g, '').length < 6) { msg.textContent = '請輸入邀請碼（向 GM 索取）'; return; }
  authBusy = true; $('au-go').disabled = true; msg.textContent = '請稍等…';
  try {
    let res;
    if (authMode === 'up') {
      if (!(await rpc('check_invite', { p_code: code }))) throw new Error('bad_invite');
      pendingInvite = code;
      res = await sb.auth.signUp({ email: emailOf(u), password: pw });
      if (res.error) throw res.error;
      if (!res.data.session) {
        res = await sb.auth.signInWithPassword({ email: emailOf(u), password: pw });
        if (res.error) throw new Error('註冊成功但無法登入：請到 Supabase 的 Authentication 設定關閉 Confirm email');
      }
    } else {
      res = await sb.auth.signInWithPassword({ email: emailOf(u), password: pw });
      if (res.error) throw res.error;
    }
    $('au-pass').value = '';
    msg.textContent = '';
    await enter(u, res.data.session && res.data.session.user.id);
  } catch (err) { msg.textContent = authErr(err); }
  authBusy = false; $('au-go').disabled = false;
});
