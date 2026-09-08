export { clsx as cn } from 'clsx';

// Capture scrolling containers as well as document scrolling.
export const onViewportChange = (update: () => void) => {
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  };
};
