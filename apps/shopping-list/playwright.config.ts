import { defineConfig, devices } from '@playwright/test';
import { devPort, previewPort } from './tests/servers.js';

// Chromium locally, all three engines in CI (ADR-0007).
const browsers = process.env.CI
  ? (['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'] as const)
  : (['Desktop Chrome'] as const);

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: `http://localhost:${previewPort}` },
  projects: browsers.map((name) => ({ name, use: { ...devices[name] } })),
  webServer: [
    {
      // The production build, not the dev server: tree-shaking and
      // dependency deduplication only happen here.
      command: `vite preview --port ${previewPort} --strictPort`,
      url: `http://localhost:${previewPort}`,
      reuseExistingServer: false,
    },
    {
      // Only for Vue's dev-only warnings (see tests/servers.ts).
      command: `vite --port ${devPort} --strictPort`,
      url: `http://localhost:${devPort}`,
      reuseExistingServer: false,
    },
  ],
});
