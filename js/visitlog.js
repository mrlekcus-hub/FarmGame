/* ---------- 拜訪記錄：朋友來家裡做了什麼，屋主離線也看得到（伺服器 visit_log_* ） ---------- */

/* 訪客端：在朋友家做事時，記一筆給屋主。失敗就算了，不影響遊戲。 */
let vlQ = Promise.resolve();
function visitLog(kind, detail) {
  if (!visiting || !me || !sb) return;
  const args = { p_owner: visiting.uid, p_kind: kind, p_detail: String(detail || '').slice(0, 24), p_name: clean(me.name, 8) };
  vlQ = vlQ.then(() => rpc('visit_log_add', args)).catch(() => { /* 伺服器還沒裝就略過 */ });
}
const vlName = k => (defOf(k) || {}).name || '';

/* 在這些動作成功時自動記錄（包一層，不用改原本的函數） */
const _vlTakeSeat = takeSeat;
takeSeat = function (it, x, y) {
  const was = pose; _vlTakeSeat(it, x, y);
  if (visiting && !was && pose && pose.id === it.id) visitLog(TOILET_KEYS.includes(it.k) ? 'toilet' : pose.type === 'lie' ? 'lie' : 'sit', vlName(it.k));
};
const _vlBathAct = bathAct;
bathAct = function (it, x, y) {
  const was = pose; _vlBathAct(it, x, y);
  if (visiting && BATH_ACT[it.k] && ((pose && pose !== was && pose.id === it.id) || bathOn(it.id) >= 0)) visitLog('bath', vlName(it.k));
};
const _vlPiano = openPiano;
openPiano = function () { const was = pnOpen; _vlPiano(); if (visiting && !was && pnOpen) visitLog('piano', '鋼琴'); };
const _vlMaker = openMaker;
openMaker = function (first) { const was = makerOpen; _vlMaker(first); if (visiting && !was && makerOpen) visitLog('mirror', '鏡子'); };
const _vlTv = setTvCh;
setTvCh = function (id, c, send) { _vlTv(id, c, send); if (send && visiting) { const ch = TV_CH[c | 0]; if (ch) visitLog('tv', ch.n); } };

/* 屋主端：讀記錄、顯示 */
const VL_TXT = {
  cook: d => '用灶台煮了' + d, dish_put: d => '在餐桌放了' + d, dish_take: d => '從餐桌拿走' + d, dish_eat: d => '吃了餐桌上的' + d,
  sit: d => '坐了' + (d || '椅子'), lie: d => '躺了' + (d || '床'), bath: d => '用了' + d, toilet: d => '用了' + (d || '馬桶'),
  touch: d => '碰了' + d, piano: () => '彈了鋼琴', tv: d => '看電視（' + d + '）', mirror: () => '照了鏡子', other: d => d
};
const vlTime = s => { const t = new Date(s); return isNaN(t) ? '' : String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); };
const vlDay = s => { const t = new Date(s); return isNaN(t) ? '' : (t.getMonth() + 1) + '/' + t.getDate(); };
function vlDot(n) { const el = $('st-vlog-dot'); if (!el) return; el.hidden = !(n > 0); el.textContent = n > 99 ? '99+' : String(n); }
async function vlLoad() {
  try { const d = await rpc('visit_log_get'); vlDot(d && d.new_visitors | 0); return d; } catch (e) { return null; }
}
/* 把一筆筆記錄整理成「某人幾點來、做了哪些事、幾點走」 */
function vlSessions(logs) {
  const asc = logs.slice().sort((a, b) => (new Date(a.at) - new Date(b.at)) || (a.id - b.id));
  const cur = new Map(), out = [];
  const begin = l => { const s = { name: l.name || '朋友', start: l.at, end: null, acts: [] }; cur.set(l.visitor, s); out.push(s); return s; };
  asc.forEach(l => {
    if (l.kind === 'enter') { begin(l); return; }
    let s = cur.get(l.visitor);
    if (!s) s = begin(l);          // 進屋那筆已經過期，就從第一個動作開始算
    if (l.kind === 'leave') { s.end = l.last_at; cur.delete(l.visitor); return; }
    s.acts.push(l);
  });
  return out.reverse();
}
function vlRender(d) {
  const el = $('st-vlog'), ss = vlSessions((d && d.logs) || []);
  if (!ss.length) { el.innerHTML = '<small class="empty">最近 3 天沒有朋友來拜訪。</small>'; return; }
  el.innerHTML = ss.map(s => '<div class="vlog-s"><div class="vlog-h"><b>' + esc(s.name) + '</b><small>' + vlDay(s.start) + ' ' + vlTime(s.start) + (s.end ? ' – ' + vlTime(s.end) : '') + '</small></div>' +
    (s.acts.length ? s.acts.map(a => '<div class="vlog-a"><small>' + vlTime(a.at) + '</small><span>' + esc((VL_TXT[a.kind] || VL_TXT.other)(a.detail || '') + (a.n > 1 ? ' ×' + a.n : '')) + '</span></div>').join('') : '<div class="vlog-a"><span class="empty">只是來逛逛</span></div>') + '</div>').join('') +
    '<button type="button" class="btn ghost small" id="st-vlog-clear" style="margin-top:8px">清空記錄</button>';
}
$('st-vlog-btn').addEventListener('click', async () => {
  const el = $('st-vlog'); el.hidden = !el.hidden;
  if (el.hidden) return;
  el.innerHTML = '<small class="empty">讀取中…</small>';
  const d = await vlLoad();
  if (!d) { el.innerHTML = '<small class="empty">讀不到記錄（伺服器還沒裝好訪客記錄）。</small>'; return; }
  vlRender(d);
  if (d.new_visitors) { try { await rpc('visit_log_seen'); } catch (e) { /* 略過 */ } vlDot(0); }
});
$('st-vlog').addEventListener('click', async e => {
  const b = e.target.closest('#st-vlog-clear'); if (!b) return;
  if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '確定清空？再按一次'; return; }
  try { await rpc('visit_log_clear'); vlRender({ logs: [] }); vlDot(0); } catch (er) { toast(errText(er)); }
});
/* 登入時：有朋友在你不在的時候來過就提醒一下 */
async function vlCheck() {
  const d = await vlLoad();
  if (d && d.new_visitors > 0) toast('🏠 有 ' + d.new_visitors + ' 位朋友拜訪過你的家，到設定看「訪客記錄」', 5000);
}
