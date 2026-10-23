'use strict';
/* 工具：文字、時間、數學的小函式 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (x, y, s = 0) => {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const shade = (h, f) => {
  const n = parseInt(h.slice(1), 16);
  return '#' + [16, 8, 0].map(i => Math.max(0, Math.min(255, Math.round(((n >> i) & 255) * f))).toString(16).padStart(2, '0')).join('');
};
const pk = (x, y) => x + ',' + y;
const lkShuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtLeft = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' 小時 ' + (m % 60) + ' 分' : m + ' 分'; };
function fmtDur(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return '不到 1 分鐘';
  if (s < 3600) return Math.ceil(s / 60) + ' 分鐘';
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h + ' 小時' + (m ? ' ' + m + ' 分' : '');
}
const fmtDay = ms => { const d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fmtTime = ms => { const d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const clean = (s, n) => {
  let o = '';
  for (const ch of String(s == null ? '' : s)) {
    const c = ch.codePointAt(0);
    if (c < 32 || (c >= 127 && c <= 159) || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202f) || (c >= 0x2060 && c <= 0x206f) || c === 0xfeff) continue;
    o += ch;
    if (o.length >= n) break;
  }
  return o;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rgbS = (c, a) => a == null ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')';
