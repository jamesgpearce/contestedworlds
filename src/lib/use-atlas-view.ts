'use client';
import { useSyncExternalStore } from 'react';
import {
  createAtlasUrlStore,
  defaultAtlasView,
  type AtlasView,
} from './atlas-url';

const serverSnapshot = defaultAtlasView();
let store: ReturnType<typeof createAtlasUrlStore> | undefined;
const getStore = () => (store ??= createAtlasUrlStore(window));
const subscribe = (notify: () => void) => getStore().subscribe(notify);
const getSnapshot = () => getStore().getSnapshot();
// Static HTML cannot know a shared URL's query. Keep its defaults provisional
// until the browser supplies the real snapshot, including on hydration.
const getServerSnapshot = (): AtlasView | null => null;
const update: ReturnType<typeof createAtlasUrlStore>['update'] = (change) =>
  getStore().update(change);

export function useAtlasView() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return [snapshot ?? serverSnapshot, update, snapshot !== null] as const;
}
