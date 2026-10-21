import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@hostkit-ui/tokens/tokens.css';
import '@hostkit-ui/components/button.js';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
