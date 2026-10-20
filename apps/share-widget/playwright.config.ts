import { defineConfig, devices } from '@playwright/test';

const port = 4310;

// Chromium locally, all three engines in CI (ADR-0007).
const browsers = process.env.CI
  ? (['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'] as const)
  : (['Desktop Chrome'] as const);

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: `http://localhost:${port}` },
  projects: browsers.map((name) => ({ name, use: { ...devices[name] } })),
  webServer: {
    command: 'node server.mjs',
    url: `http://localhost:${port}`,
    env: { PORT: String(port) },
    // Always start fresh: a server left running may use other HOSTKIT_* settings.
    reuseExistingServer: false,
  },
});
