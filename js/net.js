'use strict';
/* 與伺服器溝通 —— 雷克斯農場。所有檔案共用同一個全域範圍，載入順序見 index.html。 */
/* ---------- 與伺服器溝通 ---------- */
const ERR = {
  level_locked: '等級還不夠，還沒解鎖', gift_self: '不能送給自己', bad_gift: '這個東西不能送', gift_limit: '今天送出的禮物已經 3 份了，明天再送吧', claim_first: '先領取附的禮物才能刪除', gift_empty: '背包裡已經沒有這個了',
  quest_not_done: '任務還沒完成', quest_claimed: '這個獎勵已經領過了', bad_quest: '沒有這個任務',
  not_authenticated: '登入已過期，請重新登入', no_profile: '還沒建立角色',
  not_farmable: '這裡不能耕種', too_many_plots: '田地數量到上限了', has_crop: '上面還有作物',
  not_tilled: '這裡還沒翻土', occupied: '這裡已經有作物', no_seed: '沒有這種種子了',
  voy_closed: '碼頭暫時關閉中，請晚一點再來', voy_unbuilt: '出海碼頭還沒蓋好，到廣場岸邊的告示牌一起捐材料吧', build_done: '碼頭已經完工了', build_full: '這項材料這個階段已經收滿了', build_lack: '背包裡沒有這個材料', bad_qty: '數量不對', tree_wait: '這棵樹還沒長回來', bad_tree: '沒有這棵樹', not_ready: '還沒長好', nothing_to_harvest: '這裡沒有作物', not_enough_coins: '金幣不夠',
  nothing_to_sell: '沒有東西可以賣', bad_qty: '數量不對', bad_crop: '沒有這種作物',
  bad_name: '名字要 1 到 8 個字', bad_look: '造型資料不對', bad_username: '帳號格式不對', username_taken: '這個帳號已經有人用了',
  bad_invite: '邀請碼無效或已被使用', not_gm: '只有 GM 可以這樣做', nothing_to_revoke: '這組邀請碼已經被使用或不存在',
  village_full: '這個村莊已經滿 8 人了', bad_village_code: '村莊邀請碼要 6 個字元', bad_mode: '操作不對', look_locked: '這個造型還沒買', look_not_today: '這個款式今天沒有上架', fit_not_today: '這件衣服今天沒有上架，明天再來看看', bad_color: '沒有這個顏色', use_buy_fit: '這件衣服要在裁縫鋪按顏色購買', too_fast: '別急，再等一下', max_rod: '已經是最高級的釣竿了', no_user: '找不到這位玩家', bond_locked: '友情等級還不夠，這個動作還沒解鎖', no_pending: '對方的邀請已經過期了', bad_act: '沒有這個動作', friend_self: '不能加自己為好友', already_friends: '已經是好友了', already_sent: '已經送出過申請了，等對方回覆吧', too_many_requests: '送出的申請太多了，先等對方回覆吧', friend_full: '你的好友已經滿了', target_full: '對方的好友已經滿了', no_request: '這個申請已經不存在了', bad_fish: '沒有這種魚', bad_bug: '沒有這種蟲', bug_gone: '這隻已經飛走了', nothing_to_claim: '現在沒有可以領的獎勵', not_friend: '只能拜訪好友的家', bad_slot: '這個格子不能用', bad_msg: '信的內容要 1～200 字', mail_limit: '今天寄太多了，明天再寄吧（一天最多 30 張）', no_item: '找不到這個家具', bad_item: '這個家具不能這樣用', cannot_place: '這裡放不下', house_full: '家裡的家具太多了',
  no_kitchen: '家裡要先擺一台廚房灶台才能做料理', host_no_kitchen: '這個家沒有廚房灶台', visitor_limit: '你已經在這張桌上放了一份，先收回才能再放', not_enough_items: '材料不夠', bad_recipe: '沒有這道料理', not_edible: '這道菜不能吃，拿去賣或交委託吧', no_dish: '背包裡沒有這道料理了',
  order_done: '這張委託已經完成了', bad_order: '沒有這張委託', max_tool: '已經是最高等級了', bad_tool: '沒有這種工具',
  no_hay: '沒有乾草了，到村裡的牧場小屋買', nothing_to_feed: '動物都吃飽了', nothing_to_collect: '現在沒有可以收的', barn_full: '穀倉住滿了（玩家升級會變大）', rock_busy: '這顆礦石還在恢復', sold_out: '今天已經買過或賣滿了', not_on_sale: '這件家具今天沒有上架', merchant_away: '旅行商人今天不在', already_fert: '已經施過肥了', story_end: '故事暫時告一段落，之後還會有新章節', yard_full: '庭院已經擺滿 60 件了', cannot_sell: '這個不能賣', visit_closed: '現在不方便拜訪', block_full: '黑名單最多 20 人', table_full: '桌上放不下了（一格最多 10 份）', eat_limit: '今天吃了太多份了，明天再來吧', buff_full: '這個效果已經滿 60 分鐘了，晚點再吃', hw_closed: '萬聖節活動已經結束了', hw_nokey: '沒有這個東西', item_cap: '這種東西已經有 999 個了，先賣掉或用掉一些吧',
  bad_kind: '種類不對', already_owned: '這個花紋已經買過了', not_owned: '這個花紋還沒買', bad_line: '牆和門只能畫成橫線或直線', bad_pos: '座標不對', tier_locked: '這個階段的擴建任務還沒開放', max_tier: '房子已經是最大的了',
  no_coins: '金幣不足', daily_max: '今天的出海次數用完了', already_aboard: '你已經在一趟出海裡了', voyage_full: '船上已經滿 8 人了', voyage_closed: '這個出海團已經出發或取消了', kicked: '船長請你下船了', not_host: '只有船長可以這樣做', crew_unready: '還有人沒按準備', not_member: '你不在這趟出海裡', not_sailing: '現在沒有在航行', cooldown: '等一下再拋竿', catch_cap: '這趟已經釣到上限了', no_cast: '魚線已經失效，再拋一次', reel_early: '太快了，這條魚不算'
};
const errText = e => {
  const m = String((e && (e.message || e.msg)) || e || '');
  for (const k in ERR) if (m.includes(k)) return ERR[k];
  if (/fetch|network|Failed|timeout/i.test(m)) return '連線不穩，請稍後再試';
  return '發生錯誤：' + clean(m, 60);
};
async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args || {});
  if (error) throw error;
  return data;
}
let chain = Promise.resolve(), pending = 0, resyncWanted = false;
function enqueue(fn) {
  pending++;
  const p = chain.then(fn);
  chain = p.catch(() => {}).then(() => {
    pending--;
    if (pending === 0 && resyncWanted) { resyncWanted = false; resync(); }
  });
  return p;
}
function loadTrees() {
  rpc('tree_list').then(r => { treesAt = r || {}; }).catch(() => {});
}
function loadRocks() {
  rpc('rock_list').then(r => { rocksAt = r || {}; }).catch(() => {});
}
function applyState(d) {
  offset = (+d.now_ms || Date.now()) - Date.now();
  cropCfg = {};
  (d.crops || []).forEach(c => { cropCfg[c.key] = c; if (CROPS[c.key]) { CROPS[c.key].buy = c.seed; CROPS[c.key].sell = c.sell; } });
  cfg = { ...cfg, ...(d.cfg || {}) };
  if (d.profile) {
    me = { username: d.profile.username, name: d.profile.name, look: d.profile.look || {}, coins: +d.profile.coins || 0, gm: !!d.profile.gm, rod: +d.profile.rod || 1 };
  } else me = null;
  coverSave();
  fishCat = d.fish || []; fishLog = d.fishlog || {}; rods = d.rods || [];
  bugCat = d.bugs || []; bugLog = d.buglog || {};
  soldToday = d.soldtoday || {}; soldDay = d.sell_day | 0;
  recipes = d.recipes || []; buffs = d.buffs || {}; toolLv = { hoe: 1, can: 1, ...(d.tools || {}) }; toolCost = d.toolcost || {};
  bugTaken = new Set(d.bugtaken || []); dexClaims = d.dexclaims || {};
  itemMeta = {}; (d.items || []).forEach(m => { itemMeta[m.key] = m; });
  Object.keys(MINE_FALLBACK).forEach(k => { if (!itemMeta[k]) itemMeta[k] = { key: k, price: 0, buy: 0, ...MINE_FALLBACK[k] }; });
  Object.keys(ITEM_FALLBACK).forEach(k => { if (!itemMeta[k]) itemMeta[k] = { key: k, price: 0, buy: 0, ...ITEM_FALLBACK[k] }; });   // 乾草、蛋、奶、毛、肥料：伺服器沒給就用內建名稱   // 伺服器的物品表沒有礦物時，用內建的中文名稱和圖示（背包才看得到）
  featNeed = { ...featNeed, ...(d.featneed || {}) };
  featNeed.mine = Math.max(featNeed.mine | 0, 4); featNeed.cave = Math.max(featNeed.cave | 0, 4);   // 山洞、採礦至少玩家 Lv.4（伺服器舊值較低也以這裡為準）
  fishRec = d.fishrec || {}; if (Array.isArray(d.ycat) && d.ycat.length) ycat = d.ycat; storyDone = d.story | 0;
  yardMap = new Map(); (d.yard || []).forEach(q => yardMap.set(pk(q.x, q.y), q.k));
  forPool = d.forage || []; forTaken = new Set(d.foragetaken || []); fgSlot = -1; rocksAt = d.rocks || {};
  loadTrees();
  if (!d.rocks) loadRocks();   // get_state 沒回傳礦石冷卻時，另外向伺服器讀（rock_list）
  inv = d.inv || {};
  plots = new Map();
  (d.plots || []).forEach(j => plots.set(pk(j.x, j.y), fromServer(j)));
  if (!Array.isArray(d.ycat)) loadYard();   // 伺服器的 get_state 沒回傳庭院目錄／已擺放的裝飾時，另外向 yard_state 讀
}
let yardLoading = null;
function loadYard() {
  if (yardLoading) return yardLoading;
  yardLoading = rpc('yard_state').then(d => {
    if (Array.isArray(d.ycat)) ycat = d.ycat;
    yardMap = new Map(); (d.yard || []).forEach(q => yardMap.set(pk(q.x, q.y), q.k));
    if (shopOpen) renderShop();
  }).catch(e => { console.warn('yard_state', e); }).finally(() => { yardLoading = null; });
  return yardLoading;
}
async function resync() {
  if (pending > 0) { resyncWanted = true; return; }
  try { applyState(await rpc('get_state')); refreshHud(); if (me) loadFriends(); }
  catch (e) { toast(errText(e)); }
}
/* 樂觀更新：畫面先動，伺服器稍後確認；失敗就以伺服器為準重新同步 */
function act2(name, args, onOk, onErr) {
  enqueue(async () => {
    const r = await rpc(name, args);
    if (r && r.plot !== undefined && 'p_x' in args) {
      if (r.plot) plots.set(pk(args.p_x, args.p_y), fromServer(r.plot)); else plots.delete(pk(args.p_x, args.p_y));
    }
    if (r && r.inv) Object.assign(inv, r.inv);
    if (r && typeof r.coins === 'number') me.coins = r.coins;
    if (onOk) onOk(r);
    refreshHud();
    return r;
  }).catch(e => { if (!(onErr && onErr(e))) toast(errText(e)); resyncWanted = true; if (pending === 0) { resyncWanted = false; resync(); } });
}
const have = k => inv[k] | 0;
