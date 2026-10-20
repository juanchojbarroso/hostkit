import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright';
import type { BrowserCommand } from 'vitest/node';

// Emulates the OS colour scheme, so tests can check the ADR-0013 precedence.
const setColorScheme: BrowserCommand<['light' | 'dark' | null]> = async (
  { page },
  colorScheme,
) => {
  await page.emulateMedia({ colorScheme });
};

export default defineConfig({
  // Legacy decorators until Oxc lowers standard ones (ADR-0011).
  oxc: { decorator: { legacy: true } },
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      commands: { setColorScheme },
    },
  },
});
