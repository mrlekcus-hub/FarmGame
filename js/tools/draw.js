'use strict';
/* 工具：像素繪圖（g 是目前的畫布，r／rr／ob 畫方塊與外框） —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
let g = ctx;
const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
/* 圓角塊與帶描邊的圓角塊：可愛風的基本形狀 */
const rr = (col, x, y, w, h) => { r(col, x + 1, y, w - 2, h); r(col, x, y + 1, w, h - 2); };
const ob = (col, out, x, y, w, h) => { rr(out, x, y, w, h); rr(col, x + 1, y + 1, w - 2, h - 2); };
