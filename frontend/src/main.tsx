import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { useAuthStore } from './features/auth/stores/authStore';
import { SESSION_EXPIRED_EVENT } from './shared/lib/sessionEvents';
import './styles/globals.css';

useAuthStore.getState().hydrate();

if (typeof window !== 'undefined') {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    useAuthStore.getState().logout();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
