import { defineConfig, devices } from '@playwright/test';

const port = 4320;

// Chromium locally, all three engines in CI (ADR-0007).
const browsers = process.env.CI
  ? (['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'] as const)
  : (['Desktop Chrome'] as const);

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: `http://localhost:${port}` },
  projects: browsers.map((name) => ({ name, use: { ...devices[name] } })),
  webServer: {
    // The production build, not the dev server: tree-shaking and
    // dependency deduplication only happen here.
    command: `vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
