// @ts-check
//! 左下角的账号那一行（web/brand.js 的 `account`）：听网页的头像（`host.avatar.watch`），这个包停用、重来时退订，
//! 不把旧的那一行留在网页的监听表里；没设名字时写的「你」照界面语言取（manifest.json 的 text）。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDom, settle, textOf } from './dom.js';

installDom();
const { account } = await import('../web/brand.js');

const manifest = JSON.parse(readFileSync(new URL('../web/manifest.json', import.meta.url), 'utf8'));

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
      text: textOf(manifest, 'zh'),
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

/** 没设名字（或读不到配置）时的账号那一行：交回名字那一格和首字母那一格的字 @param {string} lang @param {() => Promise<any>} request */
async function unnamed(lang, request) {
  const me = account({ core: { request }, text: textOf(manifest, lang) });
  await me.load();
  await settle();
  const all = /** @type {any} */ (me.el).all();
  const of = (/** @type {string} */ cls) => all.find((/** @type {any} */ e) => e.className === cls)?.textContent;
  return { name: of('cs-account-name'), mark: of('cs-account-mark') };
}

const noName = async () => ({ items: { 'profile.name': { value: '' } } });
const broken = async () => { throw new Error('core down'); };

test('没设名字时照界面语言写：英文 You、日文あなた、中文你', async () => {
  assert.deepEqual(await unnamed('en', noName), { name: 'You', mark: 'Y' });
  assert.deepEqual(await unnamed('ja', noName), { name: 'あなた', mark: 'あ' });
  assert.deepEqual(await unnamed('zh', noName), { name: '你', mark: '你' });
});

test('读不到配置时也照界面语言写，英文界面不露中文', async () => {
  const got = await unnamed('en', broken);
  assert.deepEqual(got, { name: 'You', mark: 'Y' });
  assert.doesNotMatch(`${got.name}${got.mark}`, /[\u4e00-\u9fff]/);
});
