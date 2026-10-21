import { expect, test } from '@playwright/test';

// Palette value from @hostkit-ui/tokens, written out by hand.
const BLUE_700 = 'rgb(29, 78, 216)';

test('the share button renders with the hostkit brand colours', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('hk-button#share');
  await expect(button).toHaveText('Share list');
  await expect(button).toHaveCSS('background-color', BLUE_700);
});

test('variant set as an HTML attribute reaches the element property', async ({ page }) => {
  await page.goto('/');
  const copy = page.locator('hk-button#copy');
  await expect(copy).toHaveAttribute('variant', 'secondary');
  expect(await copy.evaluate((el: HTMLElement & { variant: string }) => el.variant)).toBe(
    'secondary',
  );
});

test('clicking the share button runs the page listener', async ({ page }) => {
  await page.goto('/');
  await page.locator('hk-button#share').click();
  await page.locator('hk-button#share').click();
  await expect(page.locator('#shares')).toHaveText('2');
});

test('the disabled copy button never fires its listener', async ({ page }) => {
  await page.goto('/');
  const copy = page.locator('hk-button#copy');
  await copy.click({ force: true });
  await copy.click({ force: true, position: { x: 1, y: 1 } });
  await copy.evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#shares')).toHaveText('0');
});

test('two widgets loading button.js and all.js share one hk-button and one Lit', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/two-widgets.html');

  await expect(page.locator('hk-button#first')).toHaveCSS('background-color', BLUE_700);
  await expect(page.locator('hk-button#second')).toHaveAttribute('variant', 'secondary');
  const litCopies = await page.evaluate(
    () => (globalThis as unknown as { litElementVersions?: unknown[] }).litElementVersions?.length,
  );
  expect(errors).toEqual([]);
  expect(litCopies).toBe(1);
});
