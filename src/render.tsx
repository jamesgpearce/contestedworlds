import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import { Analytics } from './components/analytics';
import './app/globals.css';

export const mount = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Home />
      <Analytics />
    </StrictMode>,
  );
