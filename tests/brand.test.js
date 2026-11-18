// @ts-check
//! 左下角的账号那一行（web/brand.js 的 `account`）：听网页的头像（`host.avatar.watch`），这个包停用、重来时退订，
//! 不把旧的那一行留在网页的监听表里。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, settle } from './dom.js';

installDom();
const { account } = await import('../web/brand.js');

/** 假的网页：头像的监听表同网页 `served.js` 的（`watch` 交回退订）；`ctx.effect` 同网页内核，停用时照反序撤回 */
function fakePage() {
  /** @type {Set<() => void>} */
  const watchers = new Set();
  /** @type {string|null} */
  let img = null;
  const avatar = {
    get: () => img,
    watch: (/** @type {() => void} */ fn) => { watchers.add(fn); return () => watchers.delete(fn); },
    set: (/** @type {string|null} */ v) => { img = v; for (const fn of watchers) fn(); },
  };
  /** 起一次这个包：交回它的上下文和停用它的办法 */
  const start = () => {
    /** @type {(() => void)[]} */
    const undo = [];
    const ctx = {
      host: { avatar },
      core: { request: async () => ({ items: { 'profile.name': { value: 'Ada' } } }) },
      effect: (/** @type {() => any} */ fn) => { const u = fn(); undo.push(() => { if (typeof u === 'function') u(); }); },
    };
    return { ctx, stop: () => { for (const u of undo.splice(0).reverse()) u(); } };
  };
  return { watchers, avatar, start };
}

test('停用、重来几次以后网页的头像监听表里只剩现在这一行', async () => {
  const page = fakePage();
  for (let i = 0; i < 3; i++) {
    const run = page.start();
    const me = account(run.ctx);
    await me.load();
    run.stop();
  }
  assert.equal(page.watchers.size, 0);
  const run = page.start();
  account(run.ctx);
  assert.equal(page.watchers.size, 1);
});

test('还开着的时候换头像照旧换上', async () => {
  const page = fakePage();
  const run = page.start();
  const me = account(run.ctx);
  await me.load();
  await settle();
  page.avatar.set('data:image/png;base64,AAAA');
  const pic = /** @type {any} */ (me.el).all().find((/** @type {any} */ e) => e.tagName === 'IMG');
  assert.equal(pic?.src, 'data:image/png;base64,AAAA');
});
