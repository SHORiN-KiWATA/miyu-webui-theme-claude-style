// @ts-check
//! 测试用的假页面：只有 web/ 里的卡片、左栏用得到的那几样（建元素、挂孩子、改字、类名、属性、点一下），装在 `globalThis.document` 上。
//! 跑法：`node --test tests/`（照网页仓库 web-demo/tests 的写法，不用装别的）。

class FakeElement {
  /** @param {string} tag */
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    /** @type {(FakeElement|string)[]} */
    this.children = [];
    /** @type {FakeElement|null} */
    this.parentNode = null;
    /** @type {Record<string, string>} */
    this.attrs = {};
    /** @type {Record<string, ((e: any) => void)[]>} */
    this.listeners = {};
    this.className = '';
    this.style = {};
    this.dataset = {};
    const el = this;
    this.classList = {
      /** @param {string} c */
      contains: (c) => el.className.split(/\s+/).includes(c),
      /** @param {string} c @param {boolean} [on] */
      toggle(c, on) {
        const has = el.className.split(/\s+/).filter(Boolean);
        const want = on ?? !has.includes(c);
        el.className = (want ? [...new Set([...has, c])] : has.filter((x) => x !== c)).join(' ');
        return want;
      },
    };
  }

  /** @param {string} k @param {any} v */
  setAttribute(k, v) { this.attrs[k] = String(v); }
  /** @param {string} k */
  getAttribute(k) { return this.attrs[k] ?? null; }
  /** @param {string} type @param {(e: any) => void} fn */
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  click() { for (const fn of this.listeners.click ?? []) fn({ type: 'click', target: this }); }

  /** @param {...(FakeElement|string)} kids */
  append(...kids) {
    for (const k of kids) {
      if (k instanceof FakeElement) k.parentNode = this;
      this.children.push(k);
    }
  }
  /** @param {...(FakeElement|string)} kids */
  replaceChildren(...kids) {
    this.children = [];
    this.append(...kids);
  }

  get textContent() { return this.children.map((k) => (typeof k === 'string' ? k : k.textContent)).join(''); }
  set textContent(v) { this.replaceChildren(String(v)); }

  /** 这一棵里所有的元素（连自己） @returns {FakeElement[]} */
  all() { return [this, ...this.children.flatMap((k) => (typeof k === 'string' ? [] : k.all()))]; }
}

/** 装上假页面，交回它 */
export function installDom() {
  const doc = { createElement: (/** @type {string} */ tag) => new FakeElement(tag) };
  /** @type {any} */ (globalThis).document = doc;
  return doc;
}

/** 一棵里给人看的字：正文、`title`、`aria-label` @param {FakeElement} root */
export function shownText(root) {
  return root.all().flatMap((e) => [e.textContent, e.attrs.title ?? '', e.attrs['aria-label'] ?? '']).join('\n');
}

/** 等手上的异步做完（几轮微任务加一轮宏任务） */
export const settle = () => new Promise((done) => setImmediate(done));
