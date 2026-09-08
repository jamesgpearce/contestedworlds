import { initializeTheme } from './lib/theme';
import { atlasData } from './lib/atlas-data';

initializeTheme();

Promise.all([atlasData, import('./render')])
  .then(([, { mount }]) => mount())
  .catch(() => {
    const screen = document.getElementById('boot-screen')!;
    screen.dataset.failed = 'true';
    document.getElementById('boot-status')!.textContent =
      'The atlas could not load. Check your connection and try again.';
    const retry = document.getElementById('boot-retry')!;
    retry.hidden = false;
    retry.onclick = () => window.location.reload();
  });
