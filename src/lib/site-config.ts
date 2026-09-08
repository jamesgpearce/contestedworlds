import config from '../../site.config.json';
/** Public build settings; GitHub Pages supplies these for root and project sites. */
export const basePath = import.meta.env.VITE_BASE_PATH || '';
export const siteUrl = import.meta.env.VITE_SITE_URL || config.url;
export const siteTitle = 'Contested Worlds — The Caribbean';
export const siteDescription =
  'Explore Caribbean islands through conquest, treaties, occupation and independence. An interactive atlas with cited histories and an open dataset.';
export const assetPath = (path: string) => `${basePath}${path}`;
export const absoluteAssetUrl = (path: string) =>
  new URL(assetPath(path), siteUrl).href;

export const analyticsId = import.meta.env.VITE_GA_ID ?? config.analyticsId;
export const repository = config.repository;
