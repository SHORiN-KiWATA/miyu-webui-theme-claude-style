// @ts-check
//! 首页（空会话）：问候「✳ What's up next, 名字?」和一张用量卡片，照 dsh-claude-style 的首页。挂进 `stage.home`。
//! 卡片的数都照核心的 `usage.query`，和上面选的时间段同一个范围：会话数（这段时间里用过模型的会话，一次性的、聊天平台上的都算，
//! 同请求数、Token 总量一个口径）、请求数、Token 总量、活跃天数、最常用模型，下面一张按天的热力图。
//! 问的时候带上这台电脑的时区（`offset`）：核心照它分天，热力图的格子也照它排，核心在别的时区（局域网另一台机器）时不错一天。
//! 卡片上的字照界面语言取（manifest.json 的 `text.*.home`）。只在选了这个主题时露（style.css 照根上的 `data-skin` 管）。

const RANGES = ['all', '30', '7'];
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

/** 此刻的时区，写成核心认的 `+09:00`（同网页用量页的写法） @param {Date} d */
export function offsetOf(d) {
  const m = -d.getTimezoneOffset();
  const a = Math.abs(m);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${m < 0 ? '-' : '+'}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
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
  /** 卡片上的一句字，照界面语言 @param {string} key @param {Record<string, unknown>} [fields] */
  const t = (key, fields) => ctx.text(`home.${key}`, fields);
  const name = el('span');
  const greet = el('div', { class: 'cs-greet' }, el('span', { class: 'cs-spark', 'aria-hidden': 'true' }), el('span', {}, 'What’s up next', name, '?'));
  const stats = el('div', { class: 'cs-stats' });
  const grid = el('div', { class: 'cs-heat' });
  const note = el('div', { class: 'cs-note' });
  const tabs = el('div', { class: 'cs-tabs' });
  let range = 'all';
  const card = el('div', { class: 'cs-card' }, el('div', { class: 'cs-card-head' }, el('div', { class: 'cs-tabs' }, el('span', { class: 'is-on' }, t('overview'))), tabs), stats, grid, note);
  const root = el('div', { class: 'cs-home' }, greet, card);

  const drawTabs = () => {
    tabs.replaceChildren(...RANGES.map((k) => el('button', { type: 'button', class: k === range ? 'is-on' : '', onclick: () => { range = k; load(); } }, t(`range.${k}`))));
  };
  let round = 0;
  const load = async () => {
    drawTabs();
    const mine = ++round;
    const now = Date.now();
    const from = range === 'all' ? null : new Date(now - Number(range) * DAY).toISOString();
    const offset = offsetOf(new Date(now));
    const usage = (/** @type {string} */ group) => ctx.core.request('usage.query', { group: [group], from, offset }).catch(() => null);
    const [days, models, sessions, profile] = await Promise.all([
      usage('day'),
      usage('model'),
      usage('session'),
      ctx.core.request('config.get', { keys: ['profile.name'] }).catch(() => null),
    ]);
    if (mine !== round) return;
    const who = profile?.items?.['profile.name']?.value;
    name.textContent = typeof who === 'string' && who.trim() ? `, ${who.trim()}` : '';
    const s = summarize(days?.rows ?? [], models?.rows ?? [], 7 * 27, now);
    // 不属于哪个会话的用量（扩展自己调模型）不算一个会话
    const count = (sessions?.rows ?? []).filter((/** @type {any} */ r) => typeof r?.session === 'string').length;
    const tile = (/** @type {string} */ label, /** @type {string} */ value) => el('div', { class: 'cs-tile' }, el('span', {}, label), el('strong', {}, value));
    stats.replaceChildren(tile(t('sessions'), short(count)), tile(t('requests'), short(s.requests)), tile(t('tokens'), short(s.total)),
      tile(t('active'), String(s.active)), tile(t('busiest'), s.busiest), tile(t('model'), s.model));
    grid.replaceChildren(...s.cells.map((c) => el('i', { class: `l${c.level}`, title: t('cell', { day: c.key, n: short(c.value) }) })));
    const books = s.total / 140000;
    note.textContent = !s.total ? t('empty') : books < 1 ? t('under_a_book') : t('books', { n: short(Math.round(books)) });
  };
  load();
  return { el: root, load };
}
