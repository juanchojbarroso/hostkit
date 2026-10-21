// The two servers Playwright starts (playwright.config.ts). Most tests use
// the production build. Vue strips its warnings from production builds,
// so the one test that listens for "Failed to resolve component" uses
// the dev server.
export const previewPort = 4330;
export const devPort = 4331;
export const devServer = `http://localhost:${devPort}/`;
