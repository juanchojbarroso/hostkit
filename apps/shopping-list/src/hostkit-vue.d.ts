// Lets vue-tsc check bindings on <hk-button>. Types only: at runtime,
// isCustomElement (vite.config.ts) keeps Vue from treating it as a
// component, and Vue sets the bindings as element properties.
// hostkit doesn't ship Vue types yet.
import type { DefineComponent } from 'vue';
import type { HkButton } from '@hostkit-ui/components/button.js';

type ElementProps<E extends HTMLElement, P extends keyof E> = Partial<Pick<E, P>>;

declare module 'vue' {
  interface GlobalComponents {
    'hk-button': DefineComponent<ElementProps<HkButton, 'variant' | 'disabled'>>;
  }
}
