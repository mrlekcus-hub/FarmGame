'use strict';
/* 角色外觀與像素圖 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 角色（外觀可自訂） ---------- */
const SKINS = ['#ffe0c4', '#f6c9a0', '#e3ab7f', '#bd8560', '#8f5f43'];
const HAIRS = ['#8a5a44', '#4a3a3a', '#f2d27a', '#ff9bb3', '#8fc8f4', '#b79bf0', '#e9e4de', '#2f2a33', '#d96a6a', '#7bd1b0', '#ffb86b'];
const OUTFITS = ['#7fb2f0', '#ff9bb3', '#8fe09a', '#ffd27a', '#c9a8f5', '#ff8c7a', '#f4f0e8', '#5a6a9a', '#e65f7a', '#6fcf97', '#ffd1e0', '#4a4a58'];
const FITS = ['T 恤', '吊帶褲', '洋裝', '外套', '圍裙', '連帽衫', '水手服', '針織毛衣', '晚宴長裙', '雨衣', '和服浴衣', '旗袍', '牛仔背心', '條紋海軍衫', '廚師服', '魔法長袍', '蓬蓬公主裙', '格紋襯衫', '熊熊連身睡衣', '冒險家披風'];
const FIT_IC = { 6: '🎀', 7: '🧶', 8: '👗', 9: '☔', 10: '👘', 11: '🏮', 12: '🤠', 13: '⚓', 14: '👨‍🍳', 15: '🧙', 16: '👑', 17: '🧣', 18: '🧸', 19: '🦸' };
/* 付費服裝是「一個顏色一個顏色」買的：背包 fc:款式:顏色 = 買過這個顏色 */
const fcHave = (i, c) => have('fc:' + i + ':' + c) > 0;
const fitAny = i => { for (let c = 0; c < OUTFITS.length; c++) if (fcHave(i, c)) return true; return false; };
const GENDERS = ['女生', '男生'];
const HATCOL = ['#ffe08a', '#ffb3c6', '#a8e6cf', '#a8d8f0', '#d5b8ff', '#ffffff'];
const STYLES = ['短髮', '雙馬尾', '長髮', '丸子頭', '馬尾', '鮑伯頭', '側邊辮子', '蓬蓬頭', '刺刺短髮', '公主頭', '寸頭', '雙丸子頭', '大波浪', '雙麻花辮', '高馬尾', '雲朵捲髮', '龐克雞冠', '呆毛短髮', '狼尾', '貓耳髮包', '半紮長髮', '外翹鮑伯'];
const HATS = ['草帽', '貓耳', '蝴蝶結', '無', '棒球帽', '毛線帽', '貝雷帽', '牛仔帽', '魔法師帽', '皇冠', '兔耳', '花環'];
const GLASSES = ['無', '圓框眼鏡', '方框眼鏡', '墨鏡', '愛心眼鏡', '貓眼眼鏡', '飛行護目鏡', '星星眼鏡'];
const GLASSCOL = ['#c8c0b8', '#d9a03a', '#4f5f93', '#2f2a33', '#e0527a', '#3aa58c', '#8a5ad0', '#e9e4de'];   // 眼鏡顏色；0 = 原本的顏色
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const FREE_N = { style: 11, fits: 6, hat: 4, glass: 1 };   // 這個編號以前的款式免費，之後的要到小村的店購買
const DEF_CHAR = { name: '小農夫', gender: 0, skin: 0, hair: 0, style: 0, hat: 3, hatc: 0, glass: 0, glassc: 0, outfit: 0, fits: 0 };
function drawBodyOrig(x, y, face, ch, skin, fit, fitO) {
  const m = ch.gender === 1, fs = ch.fits | 0;
  const bx = m ? x + 3 : x + 4, bw = m ? 10 : 8;
  const side = face === 'left' || face === 'right', back = face === 'up', front = face === 'down';
  if (fs === 2) {                                   // 洋裝
    ob(fit, fitO, x + 4, y + 10, 8, 3);
    ob(fit, fitO, x + 3, y + 12, 10, 4);
    r('#ffffff', x + 3, y + 15, 10, 1);
    if (front) { r('#ffffff', x + 6, y + 10, 4, 1); r(shade(fit, 1.2), x + 7, y + 13, 2, 1); }
  } else if (fs === 1) {                            // 吊帶褲
    ob('#fffaf0', '#e6d7c3', bx, y + 10, bw, 5);
    r(fit, bx + 1, y + 12, bw - 2, 3);
    if (!side) { r(fit, bx + 1, y + 10, 2, 3); r(fit, bx + bw - 3, y + 10, 2, 3); }
    if (front) { r('#ffd27a', bx + 1, y + 12, 1, 1); r('#ffd27a', bx + bw - 2, y + 12, 1, 1); }
  } else if (fs === 3) {                            // 外套
    ob(fit, fitO, bx, y + 10, bw, 5);
    r(shade(fit, 1.18), bx, y + 10, bw, 1);
    if (front) { r('#fffaf0', x + 7, y + 11, 2, 4); r(fitO, x + 7, y + 11, 1, 4); r('#ffd27a', x + 8, y + 12, 1, 1); }
  } else if (fs === 4) {                            // 圍裙
    ob('#fff3e0', '#e6cfae', bx, y + 10, bw, 5);
    if (front) { r(fit, x + 5, y + 11, 6, 4); r(fit, x + 6, y + 10, 1, 1); r(fit, x + 9, y + 10, 1, 1); r(shade(fit, 0.8), x + 6, y + 13, 4, 1); }
    else if (back) { r(fit, x + 6, y + 12, 4, 2); r(fit, x + 5, y + 13, 1, 2); r(fit, x + 10, y + 13, 1, 2); }
    else r(fit, x + 6, y + 11, 4, 4);
  } else if (fs === 5) {                            // 連帽衫
    ob(fit, fitO, bx, y + 10, bw, 5);
    r(shade(fit, 0.85), bx + 1, y + 10, bw - 2, 2);
    if (front) { r('#ffffff', x + 6, y + 12, 1, 2); r('#ffffff', x + 9, y + 12, 1, 2); r(shade(fit, 0.88), x + 6, y + 14, 4, 1); }
  } else if (fs === 6) {                            // 水手服
    ob('#ffffff', '#d8d0c4', bx, y + 10, bw, 5);
    if (front) { r(fit, x + 5, y + 10, 6, 2); r('#ff6b8a', x + 7, y + 12, 2, 1); }
    else r(fit, bx, y + 10, bw, 2);
  } else if (fs === 7) {                            // 針織毛衣
    ob(fit, fitO, bx, y + 10, bw, 5);
    r(shade(fit, 1.25), bx + 1, y + 10, bw - 2, 1); r(shade(fit, 1.25), bx, y + 12, bw, 1); r(shade(fit, 0.85), bx, y + 14, bw, 1);
  } else if (fs === 8) {                            // 晚宴長裙
    ob(fit, fitO, x + 4, y + 10, 8, 3);
    ob(fit, fitO, x + 2, y + 12, 12, 4);
    r('#ffd27a', x + 2, y + 15, 12, 1);
    if (front) { r('#ffd27a', x + 6, y + 12, 4, 1); r('#ffffff', x + 4, y + 13, 1, 1); r('#ffffff', x + 11, y + 14, 1, 1); }
  } else {                                          // T 恤
    ob(fit, fitO, bx, y + 10, bw, 5);
    r('#ffffff', x + 6, y + 10, 4, 2);
  }
  if (side) r(skin, x + 7, y + 12, 2, 2);
  else { r(skin, m ? x + 2 : x + 3, y + 12, 1, 2); r(skin, m ? x + 13 : x + 12, y + 12, 1, 2); }
}
function drawBody(x, y, face, ch, skin, fit, fitO) {
  const fs = ch.fits | 0;
  if (fs < 9) return drawBodyOrig(x, y, face, ch, skin, fit, fitO);
  const m = ch.gender === 1, bx = m ? x + 3 : x + 4, bw = m ? 10 : 8;
  const side = face === 'left' || face === 'right', back = face === 'up', front = face === 'down';
  const lt = shade(fit, 1.22), dk = shade(fit, 0.8), dd = shade(fit, 0.62);
  let sl = null;                                   // 長袖顏色（null = 露出手臂）
  if (fs === 9) {                                  // 雨衣
    ob(fit, fitO, bx, y + 10, bw, 6); sl = fit;
    r(lt, bx + 1, y + 10, bw - 2, 1);
    if (front) { r(fitO, x + 7, y + 11, 1, 5); r('#ffffff', x + 5, y + 11, 1, 2); r('#ffffff', x + 10, y + 11, 1, 2); r('#fffaf0', x + 8, y + 12, 1, 1); r('#fffaf0', x + 8, y + 14, 1, 1); r(dk, bx + 1, y + 13, 2, 1); }
    else if (back) { r(dk, bx + 1, y + 10, bw - 2, 3); r(lt, bx + 2, y + 14, bw - 4, 1); }
    else r(dk, bx + 1, y + 13, 3, 1);
  } else if (fs === 10) {                          // 和服浴衣
    ob(fit, fitO, bx, y + 10, bw, 6); sl = fit;
    if (front) { r('#fffaf0', x + 6, y + 10, 4, 1); r('#fffaf0', x + 7, y + 11, 2, 1); r(fitO, x + 8, y + 12, 1, 1); }
    r(dd, bx, y + 12, bw, 2); r('#ffd27a', x + 7, y + 12, 2, 1);
    if (back) { r(dd, x + 5, y + 11, 6, 4); r('#ffd27a', x + 7, y + 12, 2, 1); }
    r('#ffd1e0', bx + 1, y + 14, 1, 1); r('#ffd1e0', bx + bw - 3, y + 15, 1, 1); r('#ffffff', bx + 4, y + 15, 1, 1);
  } else if (fs === 11) {                          // 旗袍
    ob(fit, fitO, x + 4, y + 10, 8, 6);
    r(lt, x + 6, y + 10, 4, 1); r('#ffd27a', x + 4, y + 15, 8, 1);
    if (front) { r('#ffd27a', x + 9, y + 11, 1, 1); r('#ffd27a', x + 10, y + 12, 1, 1); r('#ffffff', x + 6, y + 13, 1, 1); r('#ffffff', x + 7, y + 14, 1, 1); }
    else if (back) r(lt, x + 7, y + 11, 2, 4);
    else r('#ffd27a', x + 4, y + 10, 1, 6);
  } else if (fs === 12) {                          // 牛仔背心
    ob('#fffaf0', '#e6d7c3', bx, y + 10, bw, 5);
    if (front) { r(fit, bx + 1, y + 10, 2, 5); r(fit, bx + bw - 3, y + 10, 2, 5); r(fitO, bx + 3, y + 10, 1, 1); r(fitO, bx + bw - 4, y + 10, 1, 1); r('#ffd27a', bx + 1, y + 12, 1, 1); r(dk, bx + bw - 3, y + 13, 2, 1); }
    else if (back) { r(fit, bx + 1, y + 10, bw - 2, 5); r(dk, bx + 1, y + 14, bw - 2, 1); }
    else { r(fit, bx + 2, y + 10, bw - 4, 5); r(dk, bx + 2, y + 14, bw - 4, 1); }
  } else if (fs === 13) {                          // 條紋海軍衫
    ob('#ffffff', '#d8d0c4', bx, y + 10, bw, 5);
    r(fit, bx + 1, y + 11, bw - 2, 1); r(fit, bx + 1, y + 13, bw - 2, 1);
    if (front) { r('#ffffff', x + 6, y + 10, 4, 1); r(fitO, x + 7, y + 10, 2, 1); }
  } else if (fs === 14) {                          // 廚師服
    ob('#ffffff', '#d8d0c4', bx, y + 10, bw, 5);
    if (front) { r(fit, x + 6, y + 10, 4, 1); r(fit, x + 7, y + 11, 2, 1); r('#d8d0c4', x + 7, y + 12, 1, 2); r('#8a93a3', x + 6, y + 12, 1, 1); r('#8a93a3', x + 9, y + 12, 1, 1); r('#8a93a3', x + 6, y + 13, 1, 1); r('#8a93a3', x + 9, y + 13, 1, 1); }
    else r(fit, bx, y + 10, bw, 1);
  } else if (fs === 15) {                          // 魔法長袍
    ob(fit, fitO, x + 3, y + 10, 10, 6); sl = dk;
    r(lt, x + 5, y + 10, 6, 1); r('#ffd27a', x + 3, y + 15, 10, 1);
    if (front) { r('#ffd27a', x + 7, y + 11, 2, 4); r(fitO, x + 7, y + 12, 2, 1); r('#ffe28a', x + 5, y + 13, 1, 1); r('#ffe28a', x + 10, y + 12, 1, 1); }
    else if (back) { r('#ffe28a', x + 7, y + 12, 2, 2); r('#ffe28a', x + 7, y + 11, 1, 1); r('#ffe28a', x + 8, y + 14, 1, 1); }
    else r('#ffe28a', x + 6, y + 13, 1, 1);
  } else if (fs === 16) {                          // 蓬蓬公主裙
    ob(fit, fitO, x + 4, y + 10, 8, 3);
    ob(fit, fitO, x + 1, y + 12, 14, 4);
    r('#ffffff', x + 1, y + 15, 14, 1); r('#ffffff', x + 4, y + 12, 8, 1);
    r(lt, x + 3, y + 14, 1, 1); r(lt, x + 7, y + 14, 2, 1); r(lt, x + 12, y + 14, 1, 1);
    if (front) { r('#ffffff', x + 6, y + 10, 4, 1); r('#ffffff', x + 7, y + 11, 2, 1); }
    else if (back) { r('#ffffff', x + 5, y + 11, 6, 1); r('#ffffff', x + 4, y + 12, 2, 2); r('#ffffff', x + 10, y + 12, 2, 2); }
  } else if (fs === 17) {                          // 格紋襯衫
    ob(fit, fitO, bx, y + 10, bw, 5); sl = fit;
    r(dk, bx + 2, y + 11, 1, 3); r(dk, bx + bw - 3, y + 11, 1, 3); r(dk, bx + 1, y + 12, bw - 2, 1);
    r(lt, bx + 4, y + 11, 1, 3);
    if (front) { r('#ffffff', x + 6, y + 10, 1, 1); r('#ffffff', x + 9, y + 10, 1, 1); r(fitO, x + 7, y + 11, 2, 1); r('#fffaf0', x + 7, y + 13, 1, 1); }
  } else if (fs === 18) {                          // 熊熊連身睡衣
    ob(fit, fitO, bx, y + 10, bw, 6); sl = fit;
    r(lt, bx + 1, y + 10, bw - 2, 1);
    if (front) { r(lt, x + 6, y + 12, 4, 3); r(shade(fit, 1.4), x + 7, y + 13, 2, 1); r('#ffffff', x + 7, y + 10, 1, 1); }
    else if (back) { r(lt, x + 7, y + 13, 2, 2); }
    else r(lt, bx + bw - 3, y + 13, 3, 2);
    r(lt, bx + 1, y + 15, 2, 1); r(lt, bx + bw - 3, y + 15, 2, 1);
  } else if (fs === 19) {                          // 冒險家披風
    ob('#fffaf0', '#e6d7c3', bx + 1, y + 10, bw - 2, 5);
    if (front) { r(fit, bx - 1, y + 10, 3, 6); r(fit, bx + bw - 2, y + 10, 3, 6); r(fitO, bx + 2, y + 10, 1, 1); r(fit, bx + 1, y + 10, bw - 2, 1); r('#ffd27a', x + 7, y + 10, 2, 1); }
    else if (back) { ob(fit, fitO, bx - 1, y + 10, bw + 2, 6); r(dk, bx + 3, y + 12, bw - 6, 3); }
    else { r(fit, face === 'left' ? bx + bw - 2 : bx - 1, y + 10, 3, 6); r(fitO, face === 'left' ? bx + bw : bx - 1, y + 11, 1, 5); }
  }
  const lx = m ? x + 2 : x + 3, rx = m ? x + 13 : x + 12;
  if (side) { r(sl || skin, x + 7, y + 12, 2, sl ? 1 : 2); if (sl) r(skin, x + 7, y + 13, 2, 1); }
  else if (sl) { r(sl, lx, y + 12, 1, 1); r(skin, lx, y + 13, 1, 1); r(sl, rx, y + 12, 1, 1); r(skin, rx, y + 13, 1, 1); }
  else { r(skin, lx, y + 12, 1, 2); r(skin, rx, y + 12, 1, 2); }
}
/* ---------- 新髮型（14～21）：頭後面的部分、頭頂的部分 ---------- */
function hairBackNew(st_, face, x, y, hair, hairO) {
  const up = face === 'up', L = face === 'left', R = face === 'right', side = L || R;
  if (st_ === 15) {                                   // 雲朵捲髮：兩側的蓬蓬
    ob(hair, hairO, x, y + 2, 5, 7); ob(hair, hairO, x + 11, y + 2, 5, 7);
    if (up) ob(hair, hairO, x + 1, y + 2, 14, 10);
    if (side) ob(hair, hairO, L ? x + 6 : x, y + 2, 10, 9);
  }
  if (st_ === 18) {                                   // 狼尾：後頸一小撮長尾
    if (up) ob(hair, hairO, x + 3, y + 8, 10, 7);
    else if (side) ob(hair, hairO, L ? x + 9 : x + 2, y + 7, 5, 8);
    else ob(hair, hairO, x + 4, y + 10, 8, 5);
  }
  if (st_ === 20 && !up) ob(hair, hairO, x + 1, y + 5, 14, 8);   // 半紮長髮：和長髮一樣垂在後面
  if (st_ === 21 && !up) ob(hair, hairO, x + 1, y + 5, 14, 6);
}
function hairTopNew(st_, face, x, y, hair, hairO, skin) {
  const up = face === 'up', L = face === 'left', R = face === 'right', side = L || R, hi = shade(hair, 1.25);
  if (st_ === 14) {                                   // 高馬尾
    if (up) { ob(hair, hairO, x + 6, y + 3, 4, 12); r(hi, x + 7, y + 5, 1, 4); r('#ff8fa8', x + 5, y + 3, 6, 2); }
    else if (side) {
      const t = L ? x + 11 : x + 1;
      ob(hair, hairO, t, y - 3, 4, 6); ob(hair, hairO, L ? t + 1 : t - 1, y + 2, 4, 8);
      r('#ff8fa8', L ? x + 10 : x + 2, y + 2, 3, 2); r(hi, L ? t + 1 : t + 2, y - 2, 1, 2);
    } else {
      ob(hair, hairO, x + 5, y - 3, 6, 5); r(hi, x + 6, y - 2, 2, 1);
      r('#ff8fa8', x + 6, y + 2, 4, 1);
    }
  }
  if (st_ === 15) {                                   // 雲朵捲髮：頭頂三顆圓圓的捲
    ob(hair, hairO, x + 1, y, 6, 5); ob(hair, hairO, x + 5, y - 3, 6, 5); ob(hair, hairO, x + 9, y, 6, 5);
    r(hi, x + 6, y - 2, 2, 1); r(hi, x + 2, y + 1, 2, 1); r(hi, x + 10, y + 1, 2, 1);
    if (!up) r(hair, x + 3, y + 4, 10, 2);
    if (face === 'down') { r(hairO, x + 4, y + 5, 2, 1); r(hairO, x + 10, y + 5, 2, 1); }
  }
  if (st_ === 16) {                                   // 龐克雞冠：兩邊剃光，中間一排尖刺
    if (!up) {
      r(skin, x + 3, y + 4, 10, 2);
      if (face === 'down') { r(skin, x + 3, y + 6, 1, 3); r(skin, x + 12, y + 6, 1, 3); }
      else if (L) r(skin, x + 9, y + 6, 4, 5);
      else r(skin, x + 3, y + 6, 4, 5);
    }
    if (face === 'down' || up) {
      r(hair, x + 7, y - 4, 2, 2); r(hair, x + 6, y - 2, 4, 6); r(hairO, x + 6, y - 2, 1, 6); r(hi, x + 8, y - 3, 1, 4);
      if (up) r(hair, x + 6, y + 4, 4, 5);
    } else {
      for (let i = 0; i < 4; i++) { const bx = x + 4 + i * 2, hh = 4 - (i === 0 || i === 3 ? 1 : 0); r(hair, bx, y + 3 - hh, 2, hh); r(hairO, bx, y + 3 - hh, 1, hh); }
      r(hair, x + 4, y + 3, 8, 2); r(hairO, x + 4, y + 5, 8, 1);
    }
  }
  if (st_ === 17) {                                   // 呆毛短髮：頭頂一根翹翹的呆毛
    r(hairO, x + 7, y - 1, 1, 4); r(hair, x + 8, y - 2, 1, 5); r(hair, x + 9, y - 3, 2, 1); r(hair, x + 11, y - 2, 1, 1); r(hi, x + 9, y - 3, 1, 1);
    if (face === 'down') { r(hair, x + 2, y + 6, 2, 4); r(hair, x + 12, y + 6, 2, 4); r(hair, x + 3, y + 6, 2, 1); r(hair, x + 11, y + 6, 2, 1); }
  }
  if (st_ === 18) {                                   // 狼尾：頭頂亂亂的短毛、兩鬢留長
    r(hair, x + 3, y + 2, 2, 2); r(hair, x + 6, y + 1, 3, 3); r(hair, x + 10, y + 2, 3, 2); r(hair, x + 12, y + 1, 1, 1);
    if (face === 'down') { r(hair, x + 2, y + 6, 2, 6); r(hair, x + 12, y + 6, 2, 6); r(hairO, x + 2, y + 11, 2, 1); r(hairO, x + 12, y + 11, 2, 1); }
  }
  if (st_ === 19) {                                   // 貓耳髮包：頭髮盤成兩個三角耳朵
    for (let i = 0; i < 6; i++) {          // 兩個三角形的貓耳，尖端朝外
      const w = Math.min(i + 1, 5), yy = y - 2 + i;
      r(hair, x + 2, yy, w, 1); r(hair, x + 14 - w, yy, w, 1);
      if (i >= 3) { r('#ffc2d2', x + 3, yy, Math.min(i - 2, 2), 1); r('#ffc2d2', x + 13 - Math.min(i - 2, 2), yy, Math.min(i - 2, 2), 1); }
    }
    r(hairO, x + 2, y + 3, 5, 1); r(hairO, x + 9, y + 3, 5, 1);
  }
  if (st_ === 20) {                                   // 半紮長髮：頭頂一顆小丸子配蝴蝶結
    ob(hair, hairO, x + 6, y - 2, 4, 4); r(hi, x + 7, y - 1, 1, 1);
    r('#ff8fa8', x + 5, y + 1, 1, 2); r('#ff8fa8', x + 10, y + 1, 1, 2); r('#ffffff', x + 7, y + 2, 2, 1);
    if (up) ob(hair, hairO, x + 2, y + 9, 12, 5);
  }
  if (st_ === 21) {                                   // 外翹鮑伯：髮尾往外翹
    if (!up) { r(hair, x, y + 9, 2, 2); r(hair, x + 14, y + 9, 2, 2); r(hairO, x, y + 11, 2, 1); r(hairO, x + 14, y + 11, 2, 1); }
    else { ob(hair, hairO, x + 1, y + 7, 14, 5); r(hair, x, y + 9, 2, 2); r(hair, x + 14, y + 9, 2, 2); }
    r(hi, x + 4, y + 4, 3, 1);
  }
}
/* ---------- 新帽子（4～11） ---------- */
function hatNew(h, face, x, y, hc, hco) {
  const up = face === 'up', L = face === 'left', R = face === 'right', side = L || R, hi = shade(hc, 1.2);
  if (h === 4) {                                      // 棒球帽
    ob(hc, hco, x + 3, y, 10, 5); r(hi, x + 5, y + 1, 3, 1); r(hco, x + 7, y - 1, 2, 1);
    if (face === 'down') { ob(hco, shade(hco, 0.8), x + 3, y + 4, 10, 2); r('#ffffff', x + 7, y + 1, 2, 2); }
    else if (L) ob(hco, shade(hco, 0.8), x - 1, y + 4, 8, 2);
    else if (R) ob(hco, shade(hco, 0.8), x + 9, y + 4, 8, 2);
    else { r(hco, x + 6, y + 4, 4, 1); r('#ffffff', x + 6, y + 5, 4, 1); }
  } else if (h === 5) {                               // 毛線帽（白色絨球＋反摺邊）
    ob(hc, hco, x + 2, y, 12, 5); r(hi, x + 4, y + 1, 4, 1);
    ob(hi, hco, x + 2, y + 3, 12, 2); for (let i = 0; i < 6; i++) r(hco, x + 3 + i * 2, y + 4, 1, 1);
    ob('#ffffff', '#d8d0c4', x + 6, y - 4, 4, 4);
  } else if (h === 6) {                               // 貝雷帽（歪一邊的扁圓帽）
    ob(hc, hco, x + 1, y + 1, 13, 4); ob(hc, hco, x + 3, y - 1, 11, 3); r(hco, x + 12, y - 2, 1, 1); r(hi, x + 5, y, 4, 1);
    r(hco, x + 3, y + 4, 10, 1);
  } else if (h === 7) {                               // 牛仔帽（寬邊翹起）
    ob(hc, hco, x + 4, y - 2, 8, 5); r(hco, x + 7, y - 2, 2, 2); r(hi, x + 5, y - 1, 1, 3);
    ob(hc, hco, x, y + 2, 16, 3); r(hc, x, y + 1, 2, 1); r(hc, x + 14, y + 1, 2, 1); r(hco, x, y + 1, 1, 1); r(hco, x + 15, y + 1, 1, 1);
    r('#8a5a44', x + 5, y + 2, 6, 1); r('#ffd27a', x + 7, y + 2, 2, 1);
  } else if (h === 8) {                               // 魔法師帽（尖尖、彎彎、有星星）
    ob(hc, hco, x, y + 2, 16, 3);
    ob(hc, hco, x + 3, y - 1, 10, 4); ob(hc, hco, x + 5, y - 3, 6, 3); ob(hc, hco, x + 7, y - 4, 4, 2); r(hc, x + 10, y - 4, 2, 1); r(hco, x + 11, y - 4, 1, 1);
    r('#ffd27a', x + 3, y + 2, 10, 1);
    if (face === 'down') { r('#ffe28a', x + 7, y, 2, 1); r('#ffe28a', x + 7, y - 1, 1, 3); r('#ffffff', x + 7, y, 1, 1); }
    else r('#ffe28a', x + 9, y, 1, 1);
  } else if (h === 9) {                               // 皇冠（金色，寶石用選的顏色）
    const gd = '#ffd84a', gdo = '#c9962a';
    if (side) { ob(gd, gdo, x + 4, y, 8, 4); r(gd, x + 4, y - 2, 1, 2); r(gd, x + 7, y - 3, 2, 3); r(gd, x + 11, y - 2, 1, 2); r(hc, x + 7, y + 1, 2, 2); }
    else { ob(gd, gdo, x + 3, y, 10, 4); r(gd, x + 3, y - 2, 2, 2); r(gd, x + 7, y - 3, 2, 3); r(gd, x + 11, y - 2, 2, 2); r(gdo, x + 3, y - 3, 1, 1); r(gdo, x + 12, y - 3, 1, 1); if (!up) { r(hc, x + 7, y + 1, 2, 2); r(hc, x + 4, y + 2, 1, 1); r(hc, x + 11, y + 2, 1, 1); } }
    r('#ffffff', x + 4, y + 1, 1, 1);
  } else if (h === 10) {                              // 兔耳（長長的，一隻微微垂下）
    if (side) { ob(hc, hco, L ? x + 7 : x + 6, y - 5, 3, 9); r('#ffc2d2', L ? x + 8 : x + 7, y - 3, 1, 5); ob(hc, hco, L ? x + 9 : x + 4, y - 3, 3, 7); r('#ffc2d2', L ? x + 10 : x + 5, y - 1, 1, 3); }
    else { ob(hc, hco, x + 3, y - 5, 4, 9); r('#ffc2d2', x + 4, y - 3, 2, 6); ob(hc, hco, x + 9, y - 4, 4, 8); r('#ffc2d2', x + 10, y - 2, 2, 5); }
    if (up) r(hc, x + 4, y + 2, 8, 1);
  } else if (h === 11) {                              // 花環
    const gr = '#6fcf97', gro = '#4aa56f';
    r(gro, x + 3, y + 3, 10, 2); r(gr, x + 3, y + 3, 10, 1);
    [[x + 3, '#ffffff'], [x + 6, hc], [x + 9, '#ffe08a'], [x + 12, hc]].forEach(([fx, c]) => { r(c, fx, y + 2, 2, 2); r('#fff3a8', fx, y + 2, 1, 1); r(shade(c, 0.85), fx + 1, y + 3, 1, 1); });
    r(gr, x + 5, y + 2, 1, 1); r(gr, x + 8, y + 2, 1, 1); r(gr, x + 11, y + 2, 1, 1);
  }
}
/* ---------- 眼鏡（只畫在臉的正面與側面；背面看不到） ---------- */
function glassNew(gl, face, x, y, gcol) {
  if (!gl || face === 'up') return;
  const L = face === 'left', R = face === 'right', side = L || R;
  const ring = (col, ax) => { r(col, ax + 1, y + 6, 2, 1); r(col, ax + 1, y + 9, 2, 1); r(col, ax, y + 7, 1, 2); r(col, ax + 3, y + 7, 1, 2); };
  const box = (col, ax) => { r(col, ax, y + 6, 4, 1); r(col, ax, y + 9, 4, 1); r(col, ax, y + 7, 1, 2); r(col, ax + 3, y + 7, 1, 2); };
  const arm = col => { if (L) r(col, x + 7, y + 7, 5, 1); if (R) r(col, x + 4, y + 7, 5, 1); };
  const ax1 = L ? x + 3 : x + 9;
  if (gl === 1) {                                     // 圓框
    const c = gcol || '#d9a03a';
    if (side) { ring(c, ax1); arm(c); }
    else { ring(c, x + 4); ring(c, x + 8); }
  } else if (gl === 2) {                              // 方框
    const c = gcol || '#4f5f93';
    if (side) { box(c, ax1); arm(c); } else { box(c, x + 4); box(c, x + 8); }
  } else if (gl === 3) {                              // 墨鏡
    const c = gcol || '#2f2a33';
    if (side) { r(c, ax1, y + 6, 4, 3); r(c, ax1 + 1, y + 9, 2, 1); arm(c); r('#6d6a7a', ax1 + 1, y + 7, 1, 1); }
    else { r(c, x + 4, y + 6, 8, 3); r(c, x + 5, y + 9, 2, 1); r(c, x + 9, y + 9, 2, 1); r('#6d6a7a', x + 5, y + 7, 1, 1); r('#6d6a7a', x + 9, y + 7, 1, 1); }
  } else if (gl === 4) {                              // 愛心眼鏡（半透明粉紅）
    const f = gcol ? hexA(gcol, 0.82) : 'rgba(255,92,130,.82)', o = gcol ? shade(gcol, 0.7) : '#c23a63';
    const heart = hx => { r(f, hx, y + 6, 2, 1); r(f, hx + 3, y + 6, 2, 1); r(f, hx, y + 7, 5, 2); r(f, hx + 1, y + 9, 3, 1); r(f, hx + 2, y + 10, 1, 1); r('#ffffff', hx + 1, y + 6, 1, 1); };
    if (side) { heart(L ? x + 2 : x + 8); arm(o); } else { heart(x + 3); heart(x + 8); r(o, x + 8, y + 7, 1, 1); }
  } else if (gl === 5) {                              // 貓眼（外側上揚）
    const c = gcol || '#c0405a';
    if (side) { box(c, ax1); r(c, L ? ax1 - 1 : ax1 + 4, y + 5, 1, 1); arm(c); }
    else { box(c, x + 4); box(c, x + 8); r(c, x + 3, y + 5, 1, 2); r(c, x + 12, y + 5, 1, 2); }
  } else if (gl === 6) {                              // 飛行護目鏡（戴在頭上）
    const gd = gcol || '#c9962a', st = '#6b4a3a', lens = '#9fd8f0';
    r(st, x + 2, y + 4, 12, 1);
    const one = ax => { r(gd, ax, y + 1, 5, 1); r(gd, ax, y + 5, 5, 1); r(gd, ax, y + 2, 1, 3); r(gd, ax + 4, y + 2, 1, 3); r(lens, ax + 1, y + 2, 3, 3); r('#ffffff', ax + 1, y + 2, 1, 1); };
    if (side) one(L ? x + 3 : x + 8); else { one(x + 3); one(x + 8); r(gd, x + 7, y + 3, 2, 1); }
  } else if (gl === 7) {                              // 星星眼鏡（黃色）
    const f = gcol ? hexA(gcol, 0.92) : 'rgba(255,216,74,.92)', o = gcol ? shade(gcol, 0.8) : '#d9a21a';
    const star = hx => { r(f, hx + 2, y + 5, 1, 1); r(f, hx + 1, y + 6, 3, 1); r(f, hx, y + 7, 5, 1); r(f, hx + 1, y + 8, 3, 1); r(f, hx + 1, y + 9, 1, 1); r(f, hx + 3, y + 9, 1, 1); r('#ffffff', hx + 2, y + 6, 1, 1); };
    if (side) { star(L ? x + 2 : x + 8); arm(o); } else { star(x + 3); star(x + 8); r(o, x + 8, y + 7, 1, 1); }
  }
}
function drawPlayer(px, py, face, moving, phase, ch) {
  ch = ch || DEF_CHAR;
  const skin = SKINS[ch.skin] || SKINS[0], skinO = shade(skin, 0.82);
  const hair = HAIRS[ch.hair] || HAIRS[0], hairO = shade(hair, 0.78);
  const fit = OUTFITS[ch.outfit] || OUTFITS[0], fitO = shade(fit, 0.8);
  const hc = HATCOL[ch.hatc] || HATCOL[0], hco = shade(hc, 0.82);
  const band = hc === '#ffb3c6' ? '#ffffff' : '#ff8fa8';
  const yb = py - 2, x = px, y = yb + (moving && phase ? -1 : 0);
  const side = face === 'left' || face === 'right', st_ = ch.style | 0, male = ch.gender === 1;
  const legc = male && ![2, 8, 10, 11, 15, 16].includes(ch.fits | 0) ? '#6d7fa8' : '#8a5a44';
  r('rgba(107,72,72,.22)', px + 3, py + 13, 10, 2);
  r(legc, px + 5, yb + 13, 2, 3 - (moving && phase ? 1 : 0));
  r(legc, px + 9, yb + 13, 2, 3 - (moving && !phase ? 1 : 0));
  r('#8a5a44', px + 5, yb + 15, 2, 1); r('#8a5a44', px + 9, yb + 15, 2, 1);
  drawBody(x, y, face, ch, skin, fit, fitO);
  /* 頭後面的頭髮（先畫，頭會蓋在上面） */
  hairBackNew(st_, face, x, y, hair, hairO);
  if (st_ === 7) ob(hair, hairO, x, y, 16, 10);
  if (st_ === 11) { ob(hair, hairO, x + 1, y - 1, 5, 5); ob(hair, hairO, x + 10, y - 1, 5, 5); }
  if (st_ === 12 && face !== 'up') { ob(hair, hairO, x, y + 4, 16, 10); r(hairO, x + 2, y + 9, 1, 3); r(hairO, x + 13, y + 9, 1, 3); }
  if (st_ === 13) {
    (face === 'down' || face === 'up' ? [x, x + 13] : face === 'left' ? [x + 12] : [x + 1]).forEach(b_ => {
      ob(hair, hairO, b_, y + 5, 3, 9); r(hairO, b_, y + 8, 3, 1); r(hairO, b_, y + 11, 3, 1); r('#ff8fa8', b_, y + 13, 3, 1);
    });
  }
  if (st_ === 1) {
    if (face === 'down' || face === 'up' || face === 'right') { ob(hair, hairO, x, y + 5, 3, 7); r('#ff8fa8', x, y + 6, 3, 1); }
    if (face === 'down' || face === 'up' || face === 'left') { ob(hair, hairO, x + 13, y + 5, 3, 7); r('#ff8fa8', x + 13, y + 6, 3, 1); }
  } else if ((st_ === 2 || st_ === 9) && face !== 'up') {
    ob(hair, hairO, x + 1, y + 5, 14, 8);
  } else if (st_ === 5 && face !== 'up') {
    ob(hair, hairO, x + 1, y + 5, 14, 6);
  } else if (st_ === 4) {
    if (face === 'down') { ob(hair, hairO, x + 12, y + 4, 4, 9); r('#ff8fa8', x + 12, y + 5, 4, 1); }
    else if (face === 'left') ob(hair, hairO, x + 11, y + 5, 4, 8);
    else if (face === 'right') ob(hair, hairO, x + 1, y + 5, 4, 8);
  } else if (st_ === 6) {
    const bxp = face === 'down' ? x : (face === 'left' ? x + 12 : (face === 'right' ? x + 1 : -99));
    if (bxp > -99) {
      ob(hair, hairO, bxp, y + 5, 3, 9);
      r(hairO, bxp, y + 8, 3, 1); r(hairO, bxp, y + 11, 3, 1); r('#ff8fa8', bxp, y + 13, 3, 1);
    }
  }
  /* 頭 */
  if (face === 'up') {
    ob(hair, hairO, x + 2, y + 3, 12, 9);
    if (st_ === 2 || st_ === 9) ob(hair, hairO, x + 2, y + 9, 12, 5);
    if (st_ === 5) ob(hair, hairO, x + 1, y + 7, 14, 5);
    if (st_ === 12) { ob(hair, hairO, x + 1, y + 9, 14, 6); r(hairO, x + 4, y + 12, 1, 3); r(hairO, x + 11, y + 12, 1, 3); }
    if (st_ === 4) { ob(hair, hairO, x + 6, y + 9, 4, 7); r('#ff8fa8', x + 6, y + 10, 4, 1); }
    if (st_ === 6) { ob(hair, hairO, x + 6, y + 9, 4, 7); r(hairO, x + 6, y + 12, 4, 1); r('#ff8fa8', x + 6, y + 15, 4, 1); }
  } else {
    ob(skin, skinO, x + 2, y + 3, 12, 9);
    if (face === 'down') {
      r(hair, x + 3, y + 4, 10, 2); r(hair, x + 3, y + 6, 1, 3); r(hair, x + 12, y + 6, 1, 3);
      if (st_ === 9) { r(hair, x + 3, y + 6, 2, 5); r(hair, x + 11, y + 6, 2, 5); r(hair, x + 3, y + 6, 10, 1); }
      if (st_ === 10) { r(skin, x + 3, y + 5, 10, 1); r(skin, x + 3, y + 6, 1, 3); r(skin, x + 12, y + 6, 1, 3); }
      r('#4a2c2c', x + 5, y + 7, 2, 2); r('#4a2c2c', x + 9, y + 7, 2, 2);
      r('#ffffff', x + 5, y + 7, 1, 1); r('#ffffff', x + 9, y + 7, 1, 1);
      if (male) { r(hairO, x + 5, y + 6, 2, 1); r(hairO, x + 9, y + 6, 2, 1); }
      else { r('#4a2c2c', x + 4, y + 7, 1, 1); r('#4a2c2c', x + 11, y + 7, 1, 1); }
      r('#ffa0b0', x + 3, y + 9, 2, 1); r('#ffa0b0', x + 11, y + 9, 2, 1);
      r('#c46a6a', x + 7, y + 10, 2, 1);
    } else if (face === 'left') {
      r(hair, x + 3, y + 4, 10, 2); r(hair, x + 9, y + 6, 4, 5);
      if (st_ === 9) r(hair, x + 3, y + 4, 10, 3);
      r('#4a2c2c', x + 4, y + 7, 2, 2); r('#ffffff', x + 4, y + 7, 1, 1);
      if (male) r(hairO, x + 4, y + 6, 2, 1);
      r('#ffa0b0', x + 3, y + 9, 2, 1); r('#c46a6a', x + 6, y + 10, 2, 1);
    } else {
      r(hair, x + 3, y + 4, 10, 2); r(hair, x + 3, y + 6, 4, 5);
      if (st_ === 9) r(hair, x + 3, y + 4, 10, 3);
      r('#4a2c2c', x + 10, y + 7, 2, 2); r('#ffffff', x + 10, y + 7, 1, 1);
      if (male) r(hairO, x + 10, y + 6, 2, 1);
      r('#ffa0b0', x + 11, y + 9, 2, 1); r('#c46a6a', x + 8, y + 10, 2, 1);
    }
  }
  /* 頭頂的造型：丸子頭、刺刺髮 */
  if (st_ === 3) { ob(hair, hairO, x + 5, y - 3, 6, 5); r(shade(hair, 1.25), x + 6, y - 2, 2, 1); }
  if (st_ === 8) {
    r(hair, x + 3, y + 1, 2, 3); r(hair, x + 7, y, 2, 4); r(hair, x + 11, y + 1, 2, 3);
    r(hairO, x + 3, y + 3, 2, 1); r(hairO, x + 7, y + 3, 2, 1); r(hairO, x + 11, y + 3, 2, 1);
    r(shade(hair, 1.25), x + 7, y, 1, 1);
  }
  hairTopNew(st_, face, x, y, hair, hairO, skin);
  /* 帽子與髮飾 */
  if (ch.hat === 0) {
    ob(hc, hco, x + 4, y - 1, 8, 5);
    ob(hc, hco, x, y + 2, 16, 3);
    r(band, x + 5, y + 2, 6, 1);
    r(band, x + 11, y, 2, 2); r('#ffffff', x + 12, y, 1, 1);
  } else if (ch.hat === 1) {
    r(hco, x + 4, y, 1, 1); r(hco, x + 3, y + 1, 3, 1); r(hco, x + 2, y + 2, 5, 2);
    r(hc, x + 4, y + 1, 1, 1); r(hc, x + 3, y + 2, 3, 2); r('#ffc2d2', x + 4, y + 2, 1, 2);
    r(hco, x + 11, y, 1, 1); r(hco, x + 10, y + 1, 3, 1); r(hco, x + 9, y + 2, 5, 2);
    r(hc, x + 11, y + 1, 1, 1); r(hc, x + 10, y + 2, 3, 2); r('#ffc2d2', x + 11, y + 2, 1, 2);
    r(hc, x + 4, y + 3, 8, 1);
  } else if (ch.hat === 2) {
    ob(hc, hco, x + 8, y + 1, 4, 5); ob(hc, hco, x + 12, y + 1, 4, 5);
    r(hco, x + 11, y + 3, 2, 2); r('#ffffff', x + 9, y + 2, 1, 1);
  } else if (ch.hat >= 4) hatNew(ch.hat, face, x, y, hc, hco);
  glassNew(ch.glass | 0, face, x, y, (ch.glassc | 0) > 0 ? GLASSCOL[ch.glassc | 0] : null);
}
