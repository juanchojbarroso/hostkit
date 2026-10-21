import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // hostkit elements are native custom elements, not Vue
          // components (ADR-0015). Without this, Vue tries to resolve
          // them as components first.
          isCustomElement: (tag) => tag.startsWith('hk-'),
        },
      },
    }),
  ],
});
