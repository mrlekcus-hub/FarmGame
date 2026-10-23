'use strict';
/* 核心：格子大小、畫布、全域常數 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
const T = 16, BW = 20, BH = 14, S = 3;
let W = BW, H = BH;   // 目前場景的格數：農場、屋內、廣場是 20×14，雷克斯小村是 32×22
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
cv.width = BW * T * S; cv.height = BH * T * S;
const idx = (x, y) => y * W + x;
const INK = '#7a4a4a';
