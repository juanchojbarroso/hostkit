import { expect, test } from '@playwright/test';
import type { HkButton } from '@hostkit-ui/components/button.js';
import { devServer } from './servers.js';

test('Vue resolves hk-button as a custom element, not a component', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.goto(devServer);
  await expect(page.locator('hk-button#add-item')).toHaveText('Add item');
  // Guard against a silent pass: a production-mode Vue logs no warnings at
  // all. Vue's development build defines this global; production doesn't.
  expect(await page.evaluate(() => '__VUE_HMR_RUNTIME__' in globalThis)).toBe(true);
  expect(warnings.filter((text) => text.includes('Failed to resolve component'))).toEqual([]);
});

test('the production build upgrades hk-button and runs exactly one copy of Lit', async ({
  page,
}) => {
  await page.goto('/');
  const button = page.locator('hk-button#add-item');
  await expect(button).toHaveText('Add item');
  // Upgraded: a defined custom element, not an unknown tag that tree-shaking left behind.
  expect(await button.evaluate((el) => customElements.get('hk-button') === el.constructor)).toBe(
    true,
  );
  // Every running copy of Lit adds its version to these arrays.
  const copies = await page.evaluate(() => {
    const g = globalThis as unknown as Record<string, unknown[] | undefined>;
    return {
      litElement: g.litElementVersions?.length,
      reactiveElement: g.reactiveElementVersions?.length,
      litHtml: g.litHtmlVersions?.length,
    };
  });
  expect(copies).toEqual({ litElement: 1, reactiveElement: 1, litHtml: 1 });
});

test('a bound variant sets the element property, and the attribute reflects', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('hk-button#add-item');
  expect(await button.evaluate((el: HkButton) => el.variant)).toBe('primary');
  await expect(button).toHaveAttribute('variant', 'primary');

  // Vue re-renders with new reactive state; the change must reach the element.
  await page.locator('#toggle-variant').click();
  expect(await button.evaluate((el: HkButton) => el.variant)).toBe('secondary');
  await expect(button).toHaveAttribute('variant', 'secondary');
});

test('@click runs when the user clicks the button', async ({ page }) => {
  await page.goto('/');
  await page.locator('hk-button#add-item').click();
  await page.locator('hk-button#add-item').click();
  await expect(page.locator('#items')).toHaveText('2');
});

test('a disabled button never runs its @click', async ({ page }) => {
  await page.goto('/');
  const archive = page.locator('hk-button#archive');
  await archive.click({ force: true });
  await archive.click({ force: true, position: { x: 1, y: 1 } });
  await archive.evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#items')).toHaveText('0');
});

test('a bound disabled is a property: false enables the button, true disables it again', async ({
  page,
}) => {
  await page.goto('/');
  const archive = page.locator('hk-button#archive');
  expect(await archive.evaluate((el: HkButton) => el.disabled)).toBe(true);
  await expect(archive).toHaveAttribute('disabled', '');

  // As a string attribute, false would be disabled="false": still disabled.
  await page.locator('#toggle-archive-lock').click();
  expect(await archive.evaluate((el: HkButton) => el.disabled)).toBe(false);
  await expect(archive).not.toHaveAttribute('disabled');
  await archive.click();
  await expect(page.locator('#items')).toHaveText('-1');

  await page.locator('#toggle-archive-lock').click();
  expect(await archive.evaluate((el: HkButton) => el.disabled)).toBe(true);
  await expect(archive).toHaveAttribute('disabled', '');
});
