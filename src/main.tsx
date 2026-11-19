import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { SsesProvider } from './context/SsesContext';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('No se encontró el contenedor raíz #root en index.html.');
}

if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // Service Worker registration degrades gracefully if unavailable
    });
  });
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <SsesProvider>
        <App />
      </SsesProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);
