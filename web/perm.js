// @ts-check
//! 框下面左边的「Read / Yolo」两段（照原版首页那一排）：对应 Miyu 的只读、开放权限（2026-11-10 项目主人：核心去掉了工作区那一级，
//! 原来的 Edit 一段跟着去掉）。
//! 自己不发协议：点了哪一段，就照网页原来那个权限按钮（`.footer-level`，点一下换下一级）点到那一级为止，拒绝的提示、新会话
//! 先记着等第一句话这些照网页原来的走。原来的按钮藏着（style.css），级别照它身上的 `level-<级别>` 读。

const SEGS = [['read_only', 'Read'], ['full', 'Yolo']];
const LEVELS = SEGS.map(([k]) => k);

/** 网页原来那个按钮这时是哪一级 @param {Element|null} button */
export function levelIn(button) {
  return LEVELS.find((k) => button?.classList.contains(`level-${k}`)) ?? null;
}

/** @param {() => Element|null} find 找网页原来的权限按钮 */
export function perm(find) {
  const el = document.createElement('span');
  el.className = 'cs-perm';
  el.setAttribute('role', 'radiogroup');
  const buttons = SEGS.map(([k, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.level = k;
    b.textContent = label;
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => go(k));
    return b;
  });
  el.append(...buttons);

  const draw = () => {
    const now = levelIn(find());
    for (const b of buttons) {
      const on = b.dataset.level === now;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    }
  };
  /** 等原来的按钮换级别（最多 1.5 秒） @param {Element} button @param {string|null} from */
  const changed = (button, from) => new Promise((done) => {
    const watch = new MutationObserver(() => { if (levelIn(button) !== from) { watch.disconnect(); done(true); } });
    watch.observe(button, { subtree: true, attributes: true, childList: true });
    setTimeout(() => { watch.disconnect(); done(false); }, 1500);
  });
  let busy = false;
  /** @param {string} want */
  const go = async (want) => {
    if (busy) return;
    busy = true;
    try {
      for (let i = 0; i < LEVELS.length; i++) {
        const button = find();
        const now = levelIn(button);
        if (!button || now === want) break;
        /** @type {HTMLElement} */ (button).click();
        if (!(await changed(button, now))) break;
      }
    } finally {
      busy = false;
      draw();
    }
  };
  return { el, draw };
}
