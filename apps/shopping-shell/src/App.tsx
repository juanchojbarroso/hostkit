import { useState } from 'react';
import type { ButtonVariant } from '@hostkit-ui/components/button.js';

// Phase 0: the Shopping Notes shell renders only hk-button.
export function App() {
  const [lists, setLists] = useState(0);
  const [variant, setVariant] = useState<ButtonVariant>('primary');

  return (
    <main>
      <h1>Shopping Notes</h1>
      <hk-button id="new-list" variant={variant} onClick={() => setLists((n) => n + 1)}>
        New list
      </hk-button>
      <hk-button id="archive" disabled onClick={() => setLists(-1)}>
        Archive
      </hk-button>
      <p>
        Lists created: <output id="lists">{lists}</output>
      </p>
      <button
        type="button"
        id="toggle-variant"
        onClick={() => setVariant((v) => (v === 'primary' ? 'secondary' : 'primary'))}
      >
        Toggle variant
      </button>
    </main>
  );
}
