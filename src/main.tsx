import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Service worker registration is progressive enhancement
    });
  });
}

const SideStage = lazy(() => import('./components/SideStage'));
const isSideStage = new URLSearchParams(window.location.search).has('side-stage');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSideStage ? (
      <Suspense fallback={<p className="p-6" role="status">Loading Side Stage…</p>}>
        <SideStage />
      </Suspense>
    ) : <App />}
  </StrictMode>
);
