'use strict';
/* 偵測新版本並強制更新 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* 玩家登入時、開啟頁面時、從別的分頁／視窗切回來時，各檢查一次 index.html 裡的 <meta name="build">；
   跟自己載入時的不一樣，就跳出擋住畫面的「更新中」視窗：等伺服器上還沒送完的動作（net.js 的 pending）送完，
   倒數 UPD_COUNT 秒後自動重新整理。玩家可按「立即更新」跳過倒數，但沒有辦法關掉視窗繼續玩舊版。
   遊戲是伺服器權威（每個動作都是 RPC），所以不需要另外存檔；只要確定送出去的動作都回來了就能重新整理。
   App 開著不關時，每 2 分鐘在畫面可見的情況下再檢查一次（用 ETag 重新驗證，沒變就是 HTTP 304，幾乎不耗流量）。
   版本號由 tools/stamp.py 在上傳前自動寫進 index.html（見 README），不用手動改。 */
const UPD_GAP = 30000, UPD_GAP_FORCE = 10000;   // 一般檢查最少隔 30 秒；登入／開頁面最少隔 10 秒，避免狂抓
const UPD_EVERY = 2 * 60 * 1000;                // 開著不關時的定時檢查
const UPD_COUNT = 8;                            // 倒數秒數
const UPD_WAIT_MAX = 15000;                     // 最多等伺服器動作送完這麼久，之後不等了直接更新
let updLast = 0, updBusy = false, updShown = false;
const updMine = () => { const m = document.querySelector('meta[name="build"]'); return m ? m.content : ''; };

async function updCheck(force) {
  const mine = updMine();
  if (!mine || updShown || updBusy) return;
  const now = Date.now();
  if (now - updLast < (force ? UPD_GAP_FORCE : UPD_GAP)) return;
  updBusy = true; updLast = now;
  try {
    // 用固定網址＋no-cache：每次都向伺服器確認，沒變就是 304；GitHub Pages 的 10 分鐘快取擋不住
    const r = await fetch(location.pathname, { cache: 'no-cache' });
    if (!r.ok) { updLast = 0; return; }
    const m = /<meta\s+name="build"\s+content="([^"]*)"/.exec(await r.text());
    if (m && m[1] && m[1] !== mine) updShow();
  } catch (e) { updLast = 0; setTimeout(() => updCheck(false), 4000); }   // 剛從背景回來網路常常還沒通：不要吃掉間隔，4 秒後再試一次
  finally { updBusy = false; }
}

/* 重新整理。用新網址繞過瀏覽器對 index.html 的快取；js／css 檔名帶 ?v=雜湊，沒改的檔案照用快取。 */
function updGo() { location.replace(location.pathname + '?r=' + Date.now()); }

/* 防無限重新整理：剛更新完（60 秒內）又偵測到不同版本，代表 CDN 還沒同步，改成只顯示按鈕讓玩家自己點 */
function updLooping() {
  try {
    const t = +sessionStorage.getItem('upd-reload') || 0;
    if (Date.now() - t < 60000) return true;
    sessionStorage.setItem('upd-reload', String(Date.now()));
  } catch (e) { /* 無痕模式等讀不到：當作沒在循環 */ }
  return false;
}

function updShow() {
  if (updShown) return;
  updShown = true;
  const st = document.createElement('style');
  st.textContent =
    '#upd{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(40,30,35,.72);padding:16px;touch-action:none}' +
    '#upd .box{background:var(--cream,#fcf9ed);color:var(--ink,#4a3a40);border:4px solid var(--pink-deep,#d9648a);border-radius:18px;padding:22px 24px;max-width:340px;width:100%;text-align:center;' +
    'font:700 15px/1.6 var(--f-display,sans-serif);box-shadow:0 6px 0 var(--pink-deep,#d9648a)}' +
    '#upd .ic{font-size:34px;display:block;animation:updspin 1.6s linear infinite}' +
    '#upd .sub{font-weight:400;font-size:13px;opacity:.8;margin:6px 0 14px}' +
    '#upd button{font:inherit;color:#fff;background:var(--pink,#f08aa8);border:3px solid var(--pink-deep,#d9648a);border-radius:999px;padding:9px 22px;cursor:pointer;box-shadow:0 3px 0 var(--pink-deep,#d9648a)}' +
    '@keyframes updspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(st);

  const ov = document.createElement('div');
  ov.id = 'upd';
  ov.setAttribute('role', 'alertdialog');
  ov.innerHTML = '<div class="box"><span class="ic">🔄</span><div class="t"></div><div class="sub"></div><button type="button">立即更新</button></div>';
  const t = ov.querySelector('.t'), sub = ov.querySelector('.sub'), btn = ov.querySelector('button');
  document.body.appendChild(ov);

  const loop = updLooping();
  if (loop) {   // 只給按鈕，不自動重新整理
    t.textContent = '有新版本了';
    sub.textContent = '請點下面的按鈕更新';
    btn.addEventListener('click', updGo);
    return;
  }

  t.textContent = '農場有新版本了！';
  btn.addEventListener('click', updGo);
  const t0 = Date.now();
  let left = UPD_COUNT, counting = false;
  const tick = () => {
    const waited = Date.now() - t0;
    const busy = typeof pending === 'number' && pending > 0 && waited < UPD_WAIT_MAX;   // 還有動作在送給伺服器：先等它送完
    if (busy) { sub.textContent = '正在儲存你的進度…'; setTimeout(tick, 300); return; }
    if (!counting) { counting = true; setInterval(() => { left--; if (left <= 0) updGo(); else sub.textContent = left + ' 秒後自動更新'; }, 1000); }
    sub.textContent = left + ' 秒後自動更新';
  };
  sub.textContent = '正在儲存你的進度…';
  tick();
}

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updCheck(false); });
window.addEventListener('focus', () => updCheck(false));
window.addEventListener('pageshow', e => { if (e.persisted) updCheck(true); });   // 從上一頁／快取回來
window.addEventListener('online', () => updCheck(false));
setInterval(() => { if (document.visibilityState === 'visible') updCheck(false); }, UPD_EVERY);
updCheck(true);   // 開啟頁面時先檢查一次（登入時 login-cover.js 會再檢查）
