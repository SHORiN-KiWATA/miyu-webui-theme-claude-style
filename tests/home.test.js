// @ts-check
//! 首页的用量卡片（web/home.js）：问核心的用量照这台电脑的时区分天；「会话数」跟着选的时间段走、聊天平台上的会话也算；
//! 字照界面语言取（manifest.json 的 text）。

process.env.TZ = 'Asia/Tokyo';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDom, shownText, settle, textOf as sharedTextOf } from './dom.js';

installDom();
const { home } = await import('../web/home.js');

const manifest = JSON.parse(readFileSync(new URL('../web/manifest.json', import.meta.url), 'utf8'));
const DAY = 86400000;
const NOW = Date.now();

const textOf = (/** @type {string} */ lang) => sharedTextOf(manifest, lang);

/** 四个会话：s4 是聊天平台上的，核心的 `session.list` 只列本机的、不列它；`at` 是它最后一次用模型 */
const SESSIONS = [
  { session: 's1', at: NOW - 2 * DAY },
  { session: 's2', at: NOW - 20 * DAY },
  { session: 's3', at: NOW - 100 * DAY },
  { session: 's4', at: NOW - 1 * DAY, venue: true },
];

/** 假的核心：记下问了什么；`usage.query` 照 `from` 挑会话 @param {string} [lang] */
function fakeCtx(lang = 'zh') {
  /** @type {{method: string, params: any}[]} */
  const calls = [];
  const request = async (/** @type {string} */ method, /** @type {any} */ params) => {
    calls.push({ method, params });
    const from = params?.from ? Date.parse(params.from) : -Infinity;
    if (method === 'usage.query') {
      const group = params?.group?.[0];
      if (group === 'day') return { rows: [{ day: '2026-11-17', requests: 5, usage: { uncached: 1000, output: 500 } }] };
      if (group === 'model') return { rows: [{ model: 'deepseek/deepseek-flash', usage: { uncached: 1000, output: 500 } }] };
      if (group === 'session') return { rows: [...SESSIONS.filter((s) => s.at >= from).map((s) => ({ session: s.session, requests: 1, usage: { output: 1 } })), { session: null, requests: 1, usage: { output: 1 } }] };
    }
    if (method === 'session.list') return { sessions: SESSIONS.filter((s) => !s.venue).map((s) => ({ session: s.session, last_active: new Date(s.at).toISOString() })) };
    if (method === 'config.get') return { items: { 'profile.name': { value: 'Ada' } } };
    return null;
  };
  return { calls, ctx: { core: { request }, text: textOf(lang) } };
}

/** 卡片上第一格（会话数）写的数 @param {any} root */
const sessionTile = (root) => root.all().filter((/** @type {any} */ e) => e.className === 'cs-tile')[0].children[1].textContent;
/** 点时间段的第几颗 @param {any} root @param {number} i */
const pickRange = async (root, i) => {
  const tabs = root.all().filter((/** @type {any} */ e) => e.className === 'cs-tabs')[1];
  tabs.children[i].click();
  await settle();
};

test('问用量时带上这台电脑的时区（东九区写 +09:00），核心照它分天', async () => {
  const { calls, ctx } = fakeCtx();
  const page = home(ctx);
  await settle();
  const usage = calls.filter((c) => c.method === 'usage.query');
  assert.ok(usage.length > 0);
  for (const c of usage) assert.equal(c.params.offset, '+09:00', JSON.stringify(c.params));
  assert.ok(page.el);
});

test('「会话数」跟着时间段走：全部 4 个（连聊天平台上的），30 天 3 个，7 天 2 个', async () => {
  const { ctx } = fakeCtx();
  const page = home(ctx);
  await settle();
  assert.equal(sessionTile(page.el), '4');
  await pickRange(page.el, 1);
  assert.equal(sessionTile(page.el), '3');
  await pickRange(page.el, 2);
  assert.equal(sessionTile(page.el), '2');
});

test('英文界面上卡片里没有中文', async () => {
  const { ctx } = fakeCtx('en');
  const page = home(ctx);
  await settle();
  const cjk = [...new Set(shownText(/** @type {any} */ (page.el)).match(/[㐀-鿿＀-￯]+/gu) ?? [])];
  assert.deepEqual(cjk, []);
});
