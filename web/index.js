// @ts-check
//! 「Claude 风格」：一套配色方案（挂进 `theme.palettes`）加一个主题（挂进 `skin.packs`），两样分开选、能随便搭。
//! 移植自 Nwflower/dsh-claude-style（MIT）：色值照它的 docs/STYLE.md；形状照它「Shapes」一节——圆角 4/8/16、弹层 12、
//! 1px 细线代替阴影、分隔线 0.5px、面是平的不磨砂；回答用衬线字（中文落到无衬线），界面用 Inter。
//! 不带 Anthropic 的字体（没公开发行），不用它的 Sodium 引擎（PolyForm Shield）。

import { home } from './home.js';
import { mascot } from './crab.js';
import { brand, account } from './brand.js';
import { perm } from './perm.js';

/** 弹层、卡片、输入框的细线 */
const HAIR = '1px solid var(--line)';

export const tokens = {
  // 正文一列收窄（原版约 740px）
  '--chat-w': '620px',
  // 形状：不磨砂；界面的字 Inter，回答的字衬线（中文照页面原来的无衬线），名字也是衬线
  '--blur': '0',
  '--font-ui': '"Claude Style Inter", var(--sans)',
  // 回答连中文也用衬线（照 claude.ai 对话页）
  '--font-read': '"Claude Style Noto Serif", var(--serif)',
  '--brand-font': '"Claude Style Noto Serif", var(--serif)',
  // 大块的区域：左栏右边一道细线（照官网）；分隔线 0.5px
  '--side-edge': 'inset -1px 0 0 var(--line)',
  '--divider': '0.5px solid var(--line)',
  '--focus-ring': '2px solid color-mix(in srgb, var(--text) 45%, transparent)',
  '--scrollbar-color': 'color-mix(in srgb, var(--text) 18%, transparent) transparent',
  '--scrollbar-width': 'thin',
  // 回答；收尾那一行照原版用界面的无衬线小字
  '--turn-end-font': 'calc(12px * var(--text-scale))/1.6 var(--font-ui)',
  '--turn-end-fg': 'var(--text-faint)',
  '--md-size': 'calc(14px * var(--text-scale))',
  '--md-line': '1.75',
  '--md-h2-size': 'calc(15px * var(--text-scale))',
  '--md-h3-size': 'calc(14px * var(--text-scale))',
  '--md-h4-size': 'calc(14px * var(--text-scale))',
  '--md-h-weight': '700',
  '--md-code-bg': 'color-mix(in srgb, var(--text) 5%, transparent)',
  '--md-code-fg': 'var(--t-md-code)',
  '--md-code-radius': '4px',
  '--md-link': 'var(--link)',
  '--md-link-line': 'color-mix(in srgb, var(--link) 60%, transparent)',
  '--md-quote-border': '3px solid var(--line-strong)',
  '--md-quote-bg': 'var(--surface-2)',
  '--md-quote-radius': '0 4px 4px 0',
  '--md-quote-fg': 'var(--text-soft)',
  '--md-hr': 'var(--line)',
  '--md-th-bg': 'var(--surface-2)',
  '--md-th-line': 'var(--line)',
  '--md-td-line': '0.5px solid var(--line)',
  // 时间线：同思考摘要一样的灰字，不加粗、不用等宽字（claude.ai 点开思考、工具时是一段灰的说明）
  '--timeline-font': '400 calc(13px * var(--text-scale))/1.55 var(--font-ui)',
  '--timeline-fg': 'var(--text-soft)',
  '--timeline-think': 'var(--text-soft)',
  '--timeline-hi': 'var(--text)',
  '--timeline-rail': 'var(--line)',
  '--timeline-body-bg': 'var(--surface-1)',
  '--timeline-body-radius': '8px',
  '--timeline-body-line': '0.5px solid var(--line)',
  // 材质：平的面、细线，影只留给浮起来的
  '--composer-radius': '10px',
  '--composer-border': HAIR,
  '--composer-pad-top': '9px',
  '--composer-pad-x': '14px',
  '--composer-font': 'calc(15px * var(--text-scale))/1.5 var(--font-ui)',
  '--send-bg': 'transparent',
  '--send-fg': 'var(--text-soft)',
  '--send-radius': '6px',
  '--send-hover': 'color-mix(in srgb, var(--text) 6%, transparent)',
  '--send-bg-disabled': 'transparent',
  '--send-fg-disabled': 'var(--text-faint)',
  '--bubble-bg': 'var(--surface-2)',
  '--bubble-radius': '12px',
  '--bubble-pad': '8px 13px',
  '--bubble-elev': 'none',
  '--card-border': HAIR,
  '--card-radius': '12px',
  '--card-elev': 'none',
  '--card-elev-hover': 'none',
  '--card-hover': 'var(--surface-2)',
  '--codeblock-border': HAIR,
  '--codeblock-bg': 'var(--surface-1)',
  '--codeblock-radius': '12px',
  '--codeblock-elev': 'none',
  '--float-bg': 'var(--surface-1)',
  '--float-border': HAIR,
  '--float-radius': '12px',
  '--float-blur': '0',
  '--modal-bg': 'var(--surface)',
  '--modal-border': HAIR,
  '--modal-radius': '16px',
  '--modal-blur': '0',
  '--veil-blur': '0',
  '--item-radius': '8px',
  '--item-hover': 'color-mix(in srgb, var(--text) 6%, transparent)',
  '--item-active': 'var(--sidebar-active)',
  '--item-elev-active': 'none',
  '--ghost-radius': '8px',
  '--ghost-hover': 'color-mix(in srgb, var(--text) 6%, transparent)',
  '--btn-border': HAIR,
  '--btn-radius': '8px',
  '--btn-elev': 'none',
  '--btn-primary-bg': 'var(--accent)',
  '--btn-primary-fg': 'var(--on-primary)',
  '--btn-primary-radius': '8px',
  '--btn-primary-hover': 'color-mix(in srgb, var(--accent) 88%, var(--text))',
  '--field-border': HAIR,
  '--field-radius': '8px',
  '--field-elev': 'none',
  '--field-elev-focus': '0 0 0 1px color-mix(in srgb, var(--text) 30%, transparent)',
  '--chip-radius': '999px',
  '--seg-radius': '8px',
  '--seg-thumb-radius': '6px',
  '--seg-thumb-elev': 'inset 0 0 0 1px var(--line-strong)',
  '--knob-elev': '0 1px 2px color-mix(in srgb, var(--text) 20%, transparent)',
  // 动效：Claude 那条快进慢停的曲线
  '--ease-out': 'cubic-bezier(0.165, 0.85, 0.45, 1)',
};

/** @param {any} ctx */
export function apply(ctx) {
  // 配色是数据（palette.json，键同出厂的默认配色）。跟着主题走（2026-11-02 项目主人定）：选了这个主题才出现在配色方案里、
  // 并顺带选上，人还能换成自动、跟随壁纸；换回别的主题这一套就收掉
  /** @type {any} */
  let palette = null;
  /** @type {(() => void)|null} */
  let unPalette = null;
  const syncPalette = () => {
    const on = ctx.skin?.current?.() === 'claude' && palette;
    if (!!unPalette === !!on) return;
    if (unPalette) { unPalette(); unPalette = null; return; }
    unPalette = ctx.slots.mount('theme.palettes', { id: 'claude', name: ctx.text('palette'), order: 20,
      render: (/** @type {'light'|'dark'} */ scheme) => palette[scheme] });
  };
  fetch(new URL('palette.json', import.meta.url)).then((r) => r.json()).then((got) => {
    palette = got;
    syncPalette();
  }).catch((err) => console.warn('Claude 风格：读不到配色', err));
  ctx.on('skin.changed', syncPalette);
  ctx.effect(() => () => unPalette?.());
  // 选这个皮肤时顺带把配色切到「Claude」（之后人照样能改）
  ctx.slots.mount('skin.packs', { id: 'claude', name: ctx.text('name'), order: 20, tokens, palette: 'claude', character: 'clawd',
    css: new URL('skin.css', import.meta.url).href });
  // 首页、左上角这些直接挂的东西只在选了这个皮肤时挂：装了没选不动别的
  const page = home(ctx);
  // 螃蟹挂进网页的「吉祥物」（随便搭）；选这个主题时顺带选上它（skin.packs 的 character）
  mascot(ctx);
  const mark = brand();
  const me = account(ctx);
  const level = perm(() => document.querySelector('.footer-level'));
  ctx.on('view.changed', () => queueMicrotask(level.draw));
  /** @type {(() => void)[]} */
  let mounted = [];
  const sync = () => {
    const on = ctx.skin?.current?.() === 'claude';
    if (on === mounted.length > 0) return;
    for (const undo of mounted) undo();
    mounted = on ? [
      ctx.slots.mount('stage.home', { id: 'claude-home', order: 0, render: () => page.el }),
      ctx.slots.mount('sidebar.brand', { id: 'claude-brand', render: () => mark }),
      ctx.slots.mount('sidebar.actions', { id: 'claude-account', order: -10, render: () => me.el }),
      ctx.slots.mount('composer.footer', { id: 'claude-perm', order: -10, render: () => level.el }),
    ] : [];
    if (on) { page.load(); me.load(); level.draw(); }
  };
  sync();
  ctx.on('skin.changed', sync);
  ctx.effect(() => () => { for (const undo of mounted) undo(); });
}
