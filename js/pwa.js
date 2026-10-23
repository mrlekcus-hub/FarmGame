'use strict';
/* 安裝成 App（PWA） —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 安裝成 App（PWA）：Android／電腦 Chrome 直接跳安裝視窗，iPhone／iPad 與其他瀏覽器顯示步驟 ---------- */
let installEvt = null;
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const appHint = $('app-hint'), appBtn = $('appinst');
function syncAppRow() {
  $('st-app-row').hidden = isStandalone();      // 已經是 App 在跑，就不用再顯示
  if (isStandalone()) appHint.hidden = true;
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
window.addEventListener('appinstalled', () => {
  installEvt = null; appHint.hidden = true; syncAppRow();
  toast('已安裝！到主畫面或桌面找「雷克斯農場」', 3500);
});
function installSteps() {
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua)) return 'iPhone／iPad 只有 Safari 能安裝：請用 Safari 開啟這個網址，點下方的分享鈕（方框加向上箭頭），選「加入主畫面」，再按「加入」。';
    return '點 Safari 下方（或右上）的分享鈕（方框加向上箭頭），往下滑選「加入主畫面」，再按「加入」。之後從主畫面圖示打開就是全螢幕 App。';
  }
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'Mac 的 Safari：選單列「檔案」→「加入 Dock」。';
  if (/Android/.test(ua)) return '點瀏覽器右上角「⋮」選單，選「安裝應用程式」或「加到主畫面」。';
  return '在網址列右側找安裝圖示（或瀏覽器選單裡的「安裝雷克斯農場」／「建立捷徑」並勾選「以視窗開啟」）。';
}
appBtn.addEventListener('click', async () => {
  if (installEvt) {
    try {
      installEvt.prompt();
      const r = await installEvt.userChoice;
      installEvt = null;
      if (r && r.outcome === 'accepted') { appHint.hidden = true; return; }
    } catch (e) { /* 改顯示步驟 */ }
  }
  appHint.textContent = installSteps(); appHint.hidden = false;
});
syncAppRow();
