// @ts-check
//! 输入框上的像素螃蟹（照 dsh-claude-style 的 composer crab）：站在输入框右上沿，照会话这一刻在做什么播一段动画。
//! 帧图在 mascot/：一张一个动画，一行 8 帧，每帧照 SHEETS 的 `box`（[x, y, 宽, 高]，单位是格）裁好，一格画 2px；
//! 同名的 `-ink.png` 是要照字色画的那一层（电脑、气泡、字、音符），用遮罩铺 `--text-faint`。
//! 不在看、少动效的照 `still` 停在一帧；页面藏起来时不走。Clawd 是 Anthropic 的角色形象，帧图出自原版仓库，不属于 MIT。
//! 挂进网页的 `mascot.characters`（设置页「主题」一组的「吉祥物」里选，和哪个主题都能搭），播放器是 sprite.js。

import { character } from './sprite.js';

/** 动画表（帧数、每帧的裁切框 box、少动效时停的 still） @type {Record<string, {frames: number, box: number[], still: number, loop?: boolean}>} */
const SHEETS = {
  'idle': { frames: 24, box: [24, 20, 24, 16], still: 0 },
  'idle-look': { frames: 31, box: [24, 20, 24, 16], still: 0 },
  'idle-wave': { frames: 12, box: [24, 15, 24, 21], still: 0 },
  'idle-laptop': { frames: 43, box: [14, 13, 34, 23], still: 0 },
  'thinking': { frames: 32, box: [14, 4, 34, 32], still: 18 },
  'typing': { frames: 6, box: [15, 22, 28, 14], still: 0 },
  'conducting': { frames: 24, box: [24, 12, 27, 24], still: 0 },
  'building': { frames: 6, box: [15, 19, 28, 17], still: 0 },
  'error': { frames: 24, box: [23, 11, 26, 25], still: 4 },
  'happy': { frames: 32, box: [18, 6, 34, 30], still: 3 },
  'notification': { frames: 16, box: [24, 8, 24, 28], still: 0 },
  'compacting': { frames: 20, box: [21, 20, 30, 16], still: 3 },
  'sleeping': { frames: 32, box: [23, 3, 29, 33], still: 0 },
  'waking': { frames: 12, box: [24, 4, 24, 32], still: 11 },
  'poke-left': { frames: 10, box: [24, 20, 27, 16], still: 0 },
  'poke-right': { frames: 10, box: [21, 20, 27, 16], still: 0 },
  'tickle': { frames: 16, box: [23, 18, 26, 18], still: 0 },
};
/** 放一遍就回去的 */
for (const n of ['idle-look', 'idle-wave', 'idle-laptop', 'happy', 'error', 'waking', 'poke-left', 'poke-right', 'tickle']) if (SHEETS[n]) SHEETS[n].loop = false;

/** @param {any} ctx */
export function mascot(ctx) {
  const render = character({
    id: 'clawd', grid: [52, 36], cell: 2, ms: 80, ink: true,
    base: new URL('mascot/', import.meta.url), sheets: SHEETS,
    map: { idle: 'idle', thinking: 'thinking', writing: 'typing', tool: 'building', subagent: 'conducting', waiting: 'notification', compacting: 'compacting', done: 'happy', error: 'error', interrupted: 'error' },
    extras: ['idle-look', 'idle-wave', 'idle-laptop'],
    react: { left: 'poke-left', right: 'poke-right', tickle: 'tickle' },
    right: 12,
  });
  ctx.slots.mount('mascot.characters', { id: 'clawd', name: ctx.text('mascot'), render });
}
