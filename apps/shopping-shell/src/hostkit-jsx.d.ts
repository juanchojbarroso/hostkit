// Lets TSX accept <hk-button>. React 19 passes these props to the element
// as properties (ADR-0015); hostkit doesn't ship JSX types yet.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { HkButton } from '@hostkit-ui/components/button.js';

type ElementProps<E extends HTMLElement, P extends keyof E> = DetailedHTMLProps<
  HTMLAttributes<E>,
  E
> &
  Partial<Pick<E, P>>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hk-button': ElementProps<HkButton, 'variant' | 'disabled'>;
    }
  }
}
