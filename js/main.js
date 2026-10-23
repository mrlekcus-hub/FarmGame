'use strict';
/* 啟動 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 啟動 ---------- */
async function boot() {
  refreshHud();
  requestAnimationFrame(frame);
  const lib = window.supabase;
  if (!lib || /YOUR-PROJECT/.test(SUPABASE_URL) || /YOUR-PUBLISHABLE/.test(SUPABASE_KEY)) {
    authEl.hidden = true;
    setBoot(lib ? '還沒設定連線' : '無法載入連線元件', lib ? '請把 index.html 最上面的 SUPABASE_URL 與 SUPABASE_KEY 換成你自己專案的值。' : '請檢查網路後重新整理頁面。');
    return;
  }
  sb = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
  setMode('in');
  setBoot('載入中…');
  let sess = null;
  try { sess = (await sb.auth.getSession()).data.session; } catch (e) { /* 當作沒登入 */ }
  if (sess && sess.user && sess.user.email) {
    await enter(sess.user.email.split('@')[0], sess.user.id);
  } else { bootEl.hidden = true; showAuth(); }
  setInterval(() => { if (ready && !document.hidden) { resync(); touchSeen(); mailPoll(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ready) resync(); });
}
boot();
