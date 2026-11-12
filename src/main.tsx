import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// When running in standalone Capacitor native APK (https://localhost or capacitor://localhost),
// route all relative /api/* requests to the live backend server
if (typeof window !== 'undefined') {
  const isCapacitorOrLocal =
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isCapacitorOrLocal) {
    const originalFetch = window.fetch.bind(window);
    const backendBase =
      (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_APP_URL || import.meta.env?.APP_URL)) ||
      'https://ais-pre-cgdga3yv2d33dg4wlq3ahi-300326017780.asia-east1.run.app';

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return originalFetch(`${backendBase}${input}`, init);
      }
      return originalFetch(input, init);
    };
  }
}

createRoot(document.getElementById('root')!).render(<App />);
