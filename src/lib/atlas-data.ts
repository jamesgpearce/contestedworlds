import historyUrl from './caribbean.json?url';
import coastlinesUrl from './coastlines.json?url';

const readJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok)
    throw new Error(`Could not load ${url}: ${response.status}`);
  return response.json();
};

// Both files have content hashes and use normal HTTP caching and decompression.
export const atlasData = Promise.all([
  readJson<typeof import('./caribbean.json')>(historyUrl),
  readJson<typeof import('./coastlines.json')>(coastlinesUrl),
]);
