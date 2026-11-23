import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register AutoMusic Pro PWA Service Worker for offline shell & instant updates
registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(<App />);
