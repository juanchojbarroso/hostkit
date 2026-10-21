import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A button for actions. Listen for the native `click` event.
 *
 * Without the `@hostkit-ui/tokens` stylesheet, it falls back to the
 * browser's system colours (`ButtonFace`, `ButtonText`, `Highlight`).
 *
 * @slot - The label.
 * @cssprop --hk-button-bg - Background colour.
 * @cssprop --hk-button-text - Label colour.
 * @cssprop --hk-button-focus-ring - Focus outline colour.
 */
@customElement('hk-button')
export class HkButton extends LitElement {
  static styles = css`
    :host {
      --_bg: var(--hk-color-action-primary, ButtonFace);
      --_text: var(--hk-color-action-primary-text, ButtonText);
      display: inline-block;
      border-radius: 0.375rem;
      background: var(--hk-button-bg, var(--_bg));
      color: var(--hk-button-text, var(--_text));
    }

    :host([variant='secondary']) {
      --_bg: var(--hk-color-action-secondary, ButtonFace);
      --_text: var(--hk-color-action-secondary-text, ButtonText);
    }

    :host([disabled]) {
      opacity: 0.5;
    }

    button {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      padding: 0.5rem 1rem;
      border-radius: inherit;
      text-align: center;
      cursor: pointer;
    }

    button:disabled {
      cursor: default;
    }

    button:focus-visible {
      outline: 2px solid var(--hk-button-focus-ring, var(--hk-color-focus-ring, Highlight));
      outline-offset: 2px;
    }
  `;

  // The union is written here, not as an alias, so the Custom Elements
  // Manifest lists the allowed values for tools and agents.
  /** Visual style. */
  @property({ reflect: true }) variant: 'primary' | 'secondary' = 'primary';

  /**
   * Disables the button. A disabled button fires no `click` on itself or
   * on bubble-phase listeners of its ancestors. Known limitation:
   * capture-phase listeners on ancestors still run, because they run
   * before the element can stop the event.
   */
  @property({ type: Boolean, reflect: true }) disabled = false;

  constructor() {
    super();
    // Registered first and in the capture phase, so it runs before any
    // consumer listener on the host. Clicks on the host's own box, and
    // script calls to click(), don't pass through the native disabled
    // button, so the host has to suppress them itself.
    this.addEventListener(
      'click',
      (event) => {
        if (this.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }

  render() {
    return html`<button type="button" ?disabled=${this.disabled}><slot></slot></button>`;
  }
}

/** The allowed values of `variant`. */
export type ButtonVariant = HkButton['variant'];

declare global {
  interface HTMLElementTagNameMap {
    'hk-button': HkButton;
  }
}
