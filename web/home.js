// @ts-check
//! 首页（空会话）：问候「✳ What's up next, 名字?」和一张用量卡片，照 dsh-claude-style 的首页。挂进 `stage.home`。
//! 卡片的数照核心的 `usage.query`（按天分组）和 `session.list`：会话数、请求数、Token 总量、活跃天数、最常用模型，下面一张按天的热力图。
//! 只在选了这个主题时露（style.css 照根上的 `data-skin` 管）。

const RANGES = [['all', '全部'], ['30', '30 天'], ['7', '7 天']];
const DAY = 86400000;

/** @param {string} tag @param {Record<string, any>} [attrs] @param {...(Node|string|null)} kids */
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const k of kids) if (k != null) e.append(k);
  return e;
}

/** 1234567 → 1.2M @param {number} n */
export function short(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US');
}

/** @param {{uncached?: number, cache_read?: number, cache_write?: number, output?: number}} u */
const tokens = (u) => (u?.uncached ?? 0) + (u?.cache_read ?? 0) + (u?.cache_write ?? 0) + (u?.output ?? 0);

/** 照分天的行算卡片上的几个数和热力图的格 @param {any[]} dayRows @param {any[]} modelRows @param {number} days 热力图几天 @param {number} now */
export function summarize(dayRows, modelRows, days, now) {
  const byDay = new Map(dayRows.map((r) => [r.day, tokens(r.usage)]));
  const top = [...modelRows].sort((a, b) => tokens(b.usage) - tokens(a.usage))[0];
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    cells.push({ key, value: byDay.get(key) ?? 0 });
  }
  const peak = Math.max(1, ...cells.map((c) => c.value));
  return {
    requests: dayRows.reduce((s, r) => s + (r.requests ?? 0), 0),
    total: dayRows.reduce((s, r) => s + tokens(r.usage), 0),
    active: dayRows.filter((r) => tokens(r.usage) > 0).length,
    busiest: dayRows.reduce((b, r) => (tokens(r.usage) > tokens(b?.usage) ? r : b), null)?.day?.slice(5) ?? '—',
    model: top ? String(top.model ?? '').split('/').pop() : '—',
    cells: cells.map((c) => ({ ...c, level: c.value === 0 ? 0 : Math.min(4, 1 + Math.floor((c.value / peak) * 4)) })),
  };
}

/** @param {any} ctx */
export function home(ctx) {
  const name = el('span');
  const greet = el('div', { class: 'cs-greet' }, el('span', { class: 'cs-spark', 'aria-hidden': 'true' }), el('span', {}, 'What’s up next', name, '?'));
  const stats = el('div', { class: 'cs-stats' });
  const grid = el('div', { class: 'cs-heat' });
  const note = el('div', { class: 'cs-note' });
  const tabs = el('div', { class: 'cs-tabs' });
  let range = 'all';
  const card = el('div', { class: 'cs-card' }, el('div', { class: 'cs-card-head' }, el('div', { class: 'cs-tabs' }, el('span', { class: 'is-on' }, '概览')), tabs), stats, grid, note);
  const root = el('div', { class: 'cs-home' }, greet, card);

  const drawTabs = () => {
    tabs.replaceChildren(...RANGES.map(([k, label]) => el('button', { type: 'button', class: k === range ? 'is-on' : '', onclick: () => { range = k; load(); } }, label)));
  };
  let round = 0;
  const load = async () => {
    drawTabs();
    const mine = ++round;
    const now = Date.now();
    const from = range === 'all' ? null : new Date(now - Number(range) * DAY).toISOString();
    const [days, models, list, profile] = await Promise.all([
      ctx.core.request('usage.query', { group: ['day'], from }).catch(() => null),
      ctx.core.request('usage.query', { group: ['model'], from }).catch(() => null),
      ctx.core.request('session.list', {}).catch(() => null),
      ctx.core.request('config.get', { keys: ['profile.name'] }).catch(() => null),
    ]);
    if (mine !== round) return;
    const who = profile?.items?.['profile.name']?.value;
    name.textContent = typeof who === 'string' && who.trim() ? `, ${who.trim()}` : '';
    const s = summarize(days?.rows ?? [], models?.rows ?? [], 7 * 27, now);
    const count = Array.isArray(list?.sessions) ? list.sessions.length : 0;
    const tile = (/** @type {string} */ label, /** @type {string} */ value) => el('div', { class: 'cs-tile' }, el('span', {}, label), el('strong', {}, value));
    stats.replaceChildren(tile('会话数', short(count)), tile('请求数', short(s.requests)), tile('Token 总量', short(s.total)),
      tile('活跃天数', String(s.active)), tile('用得最多的一天', s.busiest), tile('最常用模型', s.model));
    grid.replaceChildren(...s.cells.map((c) => el('i', { class: `l${c.level}`, title: `${c.key}：${short(c.value)} token` })));
    const books = s.total / 140000;
    note.textContent = !s.total ? '还没有用量。' : books < 1 ? `你的 Token 用量还不到一本《了不起的盖茨比》。` : `你的 Token 用量相当于 ${short(Math.round(books))} 本《了不起的盖茨比》。`;
  };
  load();
  return { el: root, load };
}
