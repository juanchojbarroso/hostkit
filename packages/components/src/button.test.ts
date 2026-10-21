import { afterEach, beforeEach, expect, test } from 'vitest';
import { commands, userEvent } from 'vitest/browser';
import axe from 'axe-core';
import tokensUrl from '@hostkit-ui/tokens/tokens.css?url';
import './button.js';
import type { HkButton } from './button.js';

// Palette values from @hostkit-ui/tokens, written out by hand so the tests
// don't recompute what the CSS does.
const BLUE_700 = 'rgb(29, 78, 216)';
const BLUE_300 = 'rgb(147, 197, 253)';

// Every test starts from a light OS preference. Without emulation, WebKit
// follows the machine's own appearance, so a dark Mac fails the light tests.
beforeEach(async () => {
  await commands.setColorScheme('light');
});

afterEach(async () => {
  document.body.replaceChildren();
  document.head.querySelector('link[data-tokens]')?.remove();
  document.documentElement.removeAttribute('data-theme');
});

async function loadTokens() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = tokensUrl;
  link.dataset.tokens = '';
  const loaded = new Promise((resolve) => link.addEventListener('load', resolve));
  document.head.append(link);
  await loaded;
}

// querySelector, but a missing element fails the test here, not later.
function query<E extends Element>(selector: string): E {
  const el = document.querySelector<E>(selector);
  if (!el) throw new Error(`No element matches ${selector}`);
  return el;
}

async function render(markup: string) {
  document.body.innerHTML = markup;
  const el = query<HkButton>('hk-button');
  await el.updateComplete;
  return el;
}

const background = (el: Element) => getComputedStyle(el).backgroundColor;

test('variant defaults to primary and reflects a property change', async () => {
  const el = await render('<hk-button>Save</hk-button>');
  expect(el.variant).toBe('secondary');
  expect(el.getAttribute('variant')).toBe('primary');

  el.variant = 'secondary';
  await el.updateComplete;
  expect(el.getAttribute('variant')).toBe('secondary');
});

test('an enabled button fires click when the user clicks it', async () => {
  const el = await render('<hk-button>Save</hk-button>');
  let clicks = 0;
  el.addEventListener('click', () => clicks++);

  await userEvent.click(el);
  expect(clicks).toBe(1);
});

test('a disabled button fires no click, wherever it is clicked', async () => {
  // A clickable parent, like a list row: it must not receive the click
  // either, the same as with a native disabled <button>.
  document.body.innerHTML = '<div id="row"><hk-button disabled>Save</hk-button></div>';
  const el = query<HkButton>('hk-button');
  await el.updateComplete;
  expect(el.disabled).toBe(true);
  let clicks = 0;
  el.addEventListener('click', () => clicks++);
  query('#row').addEventListener('click', () => clicks++);

  // The centre (the label) and the top padding. Not the very corner:
  // outside the border-radius curve is the row, not the button, and
  // Firefox hit-tests it that way.
  await userEvent.click(el, { force: true });
  await userEvent.click(el, { force: true, position: { x: 8, y: 2 } });
  // A script calling click() on the element.
  el.click();
  expect(clicks).toBe(0);
});

test('a disabled button leaves the tab order, and comes back when re-enabled', async () => {
  document.body.innerHTML = '<input id="before" /><hk-button>Save</hk-button><input id="after" />';
  const el = query<HkButton>('hk-button');
  await el.updateComplete;
  const before = query<HTMLInputElement>('#before');

  before.focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(el);

  el.disabled = true;
  await el.updateComplete;
  before.focus();
  await userEvent.tab();
  expect(document.activeElement?.id).toBe('after');

  el.disabled = false;
  await el.updateComplete;
  before.focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(el);
});

test('with the tokens loaded, the light theme is the default', async () => {
  await loadTokens();
  const el = await render('<hk-button>Save</hk-button>');
  expect(background(el)).toBe(BLUE_700);
});

test('data-theme="dark" on the root switches to the dark values', async () => {
  await loadTokens();
  document.documentElement.dataset.theme = 'dark';
  const el = await render('<hk-button>Save</hk-button>');
  expect(background(el)).toBe(BLUE_300);
});

test('with no data-theme, a dark OS preference applies the dark values', async () => {
  await loadTokens();
  await commands.setColorScheme('dark');
  const el = await render('<hk-button>Save</hk-button>');
  expect(background(el)).toBe(BLUE_300);
});

test('data-theme="light" overrides a dark OS preference', async () => {
  await loadTokens();
  await commands.setColorScheme('dark');
  document.documentElement.dataset.theme = 'light';
  const el = await render('<hk-button>Save</hk-button>');
  expect(background(el)).toBe(BLUE_700);
});

async function violations(el: Element) {
  const results = await axe.run(el);
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

test.each([
  ['light', 'primary'],
  ['light', 'secondary'],
  ['dark', 'primary'],
  ['dark', 'secondary'],
] as const)('axe passes in the %s theme, %s variant', async (theme, variant) => {
  await loadTokens();
  document.documentElement.dataset.theme = theme;
  const el = await render(`<hk-button variant="${variant}">Save</hk-button>`);
  expect(await violations(el)).toEqual([]);
});

test('without the tokens stylesheet, it falls back to system colours and axe passes', async () => {
  const el = await render('<hk-button>Save</hk-button>');
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'ButtonFace';
  document.body.append(probe);
  expect(background(el)).toBe(background(probe));
  expect(await violations(el)).toEqual([]);
});
