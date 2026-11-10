// @ts-check
//! 左栏的两处（照 claude.ai 官网）：左上角「Claude」字标顶替人格的头像和名字（挂载位 `sidebar.brand`），左下角的账号那一行：
//! 圆头像（设置「访问」页设了头像的照它画，没设的写名字首字母）、「关于你」里的名字、一个下拉的记号，点了打开设置的「用户身份」（挂载位 `sidebar.actions`）。字标的 SVG 出自 dsh-claude-style。

/** @param {string} cls @param {string} [label] */
const span = (cls, label) => {
  const e = document.createElement('span');
  e.className = cls;
  if (label) e.setAttribute('aria-label', label);
  return e;
};

/** 左上角的字标 */
export function brand() {
  const el = document.createElement('div');
  el.className = 'cs-brand';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Claude');
  el.append(span('cs-brand-word'));
  return el;
}

/** 左下角的账号那一行 @param {any} ctx */
export function account(ctx) {
  const name = span('cs-account-name');
  const initial = span('cs-account-mark');
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'cs-account';
  el.append(initial, name, span('cs-account-chevron'));
  el.addEventListener('click', () => ctx.settings?.open?.('user'));
  // 你的头像（网页的 `host.avatar`：设置里换了、移除了叫一声）；走桥的没有，照旧写首字母
  const me = ctx.host?.avatar ?? null;
  let letter = '';
  const face = () => {
    const img = me?.get?.() ?? null;
    initial.classList.toggle('is-pic', !!img);
    if (img) {
      const pic = document.createElement('img');
      pic.src = img;
      pic.alt = '';
      initial.replaceChildren(pic);
    } else initial.textContent = letter;
  };
  me?.watch?.(face);
  const load = () => ctx.core.request('config.get', { keys: ['profile.name'] }).then((/** @type {any} */ got) => {
    const who = got?.items?.['profile.name']?.value;
    name.textContent = typeof who === 'string' && who.trim() ? who.trim() : '你';
    letter = [...name.textContent][0]?.toUpperCase() ?? '';
    face();
  }).catch(() => { name.textContent = '你'; letter = '你'; face(); });
  return { el, load };
}
