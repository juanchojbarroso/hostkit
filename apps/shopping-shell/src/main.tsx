import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@hostkit-ui/tokens/tokens.css';
import '@hostkit-ui/components/button.js';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
