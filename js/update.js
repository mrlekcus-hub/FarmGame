'use strict';
/* 偵測新版本 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 玩家登入時、開啟頁面時、從別的分頁／視窗切回來時，各檢查一次 index.html 裡的 <meta name="build">；
   跟自己載入時的不一樣，就出現「有新版本」的按鈕，點一下重新整理。不會自動重新整理，也不會定時輪詢。
   版本號由 tools/stamp.py 在上傳前自動寫進 index.html（見 README），不用手動改。 */
const UPD_GAP = 60000, UPD_GAP_FORCE = 15000;   // 一般檢查最少隔 60 秒；登入／開頁面最少隔 15 秒，避免狂抓
let updLast = 0, updBusy = false, updShown = false;
const updMine = () => { const m = document.querySelector('meta[name="build"]'); return m ? m.content : ''; };
async function updCheck(force) {
  const mine = updMine();
  if (!mine || updShown || updBusy) return;
  const now = Date.now();
  if (now - updLast < (force ? UPD_GAP_FORCE : UPD_GAP)) return;
  updBusy = true; updLast = now;
  try {
    const r = await fetch(location.pathname + '?_=' + now, { cache: 'no-store' });
    if (!r.ok) return;
    const m = /<meta\s+name="build"\s+content="([^"]*)"/.exec(await r.text());
    if (m && m[1] && m[1] !== mine) updShow();
  } catch (e) { /* 離線或讀不到就略過，下次再檢查 */ }
  finally { updBusy = false; }
}
function updShow() {
  if (updShown) return;
  updShown = true;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = '🔄 有新版本了，點一下更新';
  b.style.cssText = 'position:fixed;z-index:96;left:50%;transform:translateX(-50%);top:calc(48px + env(safe-area-inset-top,0px));' +
    'font:700 13px/1.4 var(--f-display,sans-serif);color:#fff;background:var(--pink,#f08aa8);border:3px solid var(--pink-deep,#d9648a);' +
    'border-radius:999px;padding:7px 16px;box-shadow:0 3px 0 var(--pink-deep,#d9648a);cursor:pointer;max-width:92vw;white-space:nowrap';
  b.addEventListener('click', () => location.reload());
  document.body.appendChild(b);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updCheck(false); });
window.addEventListener('focus', () => updCheck(false));
window.addEventListener('pageshow', e => { if (e.persisted) updCheck(true); });   // 從上一頁／快取回來
updCheck(true);   // 開啟頁面時先檢查一次（登入時 enter() 會再檢查）
