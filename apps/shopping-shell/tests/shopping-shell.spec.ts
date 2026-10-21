import { expect, test } from '@playwright/test';

test('the production build upgrades hk-button and runs exactly one copy of Lit', async ({
  page,
}) => {
  await page.goto('/');
  const button = page.locator('hk-button#new-list');
  await expect(button).toHaveText('New list');
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

type HkButton = HTMLElement & { variant: string; disabled: boolean };

test('a React prop sets the element property, and the attribute reflects', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('hk-button#new-list');
  expect(await button.evaluate((el: HkButton) => el.variant)).toBe('primary');
  await expect(button).toHaveAttribute('variant', 'primary');

  // React re-renders with new state; the change must reach the element.
  await page.locator('#toggle-variant').click();
  expect(await button.evaluate((el: HkButton) => el.variant)).toBe('secondary');
  await expect(button).toHaveAttribute('variant', 'secondary');
});

test('disabled passed as a React prop is a property, not a string attribute', async ({ page }) => {
  await page.goto('/');
  const archive = page.locator('hk-button#archive');
  expect(await archive.evaluate((el: HkButton) => el.disabled)).toBe(true);
  await expect(archive).toHaveAttribute('disabled', '');
});

test('onClick runs when the user clicks the button', async ({ page }) => {
  await page.goto('/');
  await page.locator('hk-button#new-list').click();
  await page.locator('hk-button#new-list').click();
  await expect(page.locator('#lists')).toHaveText('2');
});

test('a disabled button never calls its onClick', async ({ page }) => {
  await page.goto('/');
  const archive = page.locator('hk-button#archive');
  await archive.click({ force: true });
  await archive.click({ force: true, position: { x: 1, y: 1 } });
  await archive.evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#lists')).toHaveText('0');
});
