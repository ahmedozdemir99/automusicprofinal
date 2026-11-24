import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register AutoMusic Pro PWA Service Worker with safe prompt-based updates
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('amp-pwa-update', {
        detail: {
          applyUpdate: () => updateSW(true),
        },
      })
    );
  },
});

createRoot(document.getElementById('root')!).render(<App />);
