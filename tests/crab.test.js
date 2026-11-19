// @ts-check
//! 螃蟹的动画表（web/crab.js 的 SHEETS）和 web/mascot/ 里的帧图对得上：帧图一行 8 帧、一格 1px，所以宽是 8 × 裁切框的宽，
//! 高是行数 × 裁切框的高；裁切框不出 52 × 36 格的画布、脚踩在最底下一行；mascot/ 里每一张帧图都在动画表里用到。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const { SHEETS } = await import('../web/crab.js');
const dir = new URL('../web/mascot/', import.meta.url);

/** PNG 的宽高（IHDR 里的两个数） @param {string} name */
const size = (name) => {
  const b = readFileSync(new URL(name, dir));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

test('每一段的帧图（连字色层）宽高和帧数、裁切框对得上', () => {
  for (const [name, s] of Object.entries(SHEETS)) {
    const [, , w, h] = s.box;
    for (const file of [`${name}.png`, `${name}-ink.png`]) {
      assert.deepEqual(size(file), { w: 8 * w, h: Math.ceil(s.frames / 8) * h }, file);
    }
  }
});

test('裁切框在 52 × 36 格的画布里，脚踩在最底下一行', () => {
  for (const [name, s] of Object.entries(SHEETS)) {
    const [x, y, w, h] = s.box;
    assert.ok(x >= 0 && x + w <= 52, `${name} 横着出了画布`);
    assert.equal(y + h, 36, `${name} 没踩在底下`);
  }
});

test('mascot/ 里每一张帧图都在动画表里用到', () => {
  const unused = readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => f.replace(/(-ink)?\.png$/, '')).filter((n) => !SHEETS[n]);
  assert.deepEqual([...new Set(unused)], []);
});
