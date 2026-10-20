// Custom browser commands registered in vite.config.ts.
declare module 'vitest/browser' {
  interface BrowserCommands {
    setColorScheme: (colorScheme: 'light' | 'dark' | null) => Promise<void>;
  }
}

export {};
