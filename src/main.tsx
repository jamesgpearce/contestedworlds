import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import { Analytics } from './components/analytics';
import { initializeTheme } from './lib/theme';
import './app/globals.css';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
    <Analytics />
  </StrictMode>,
);
