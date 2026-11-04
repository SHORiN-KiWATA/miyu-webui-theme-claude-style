// @ts-check
//! 左栏的两处（照 claude.ai 官网）：左上角「Claude」字标顶替人格的头像和名字（挂载位 `sidebar.brand`），左下角的账号那一行：
//! 名字首字母的圆头像、「关于你」里的名字、一个下拉的记号，点了打开设置的「用户身份」（挂载位 `sidebar.actions`）。字标的 SVG 出自 dsh-claude-style。

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
  const load = () => ctx.core.request('config.get', { keys: ['profile.name'] }).then((/** @type {any} */ got) => {
    const who = got?.items?.['profile.name']?.value;
    name.textContent = typeof who === 'string' && who.trim() ? who.trim() : '你';
    initial.textContent = [...name.textContent][0]?.toUpperCase() ?? '';
  }).catch(() => { name.textContent = '你'; initial.textContent = '你'; });
  return { el, load };
}
