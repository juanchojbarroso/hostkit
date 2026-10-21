// Lets vue-tsc check bindings on <hk-button>. Vue sets them on the element
// as properties (ADR-0015); hostkit doesn't ship Vue types yet.
import type { DefineComponent } from 'vue';
import type { HkButton } from '@hostkit-ui/components/button.js';

type ElementProps<E extends HTMLElement, P extends keyof E> = Partial<Pick<E, P>>;

declare module 'vue' {
  interface GlobalComponents {
    'hk-button': DefineComponent<ElementProps<HkButton, 'variant' | 'disabled'>>;
  }
}
