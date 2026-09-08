'use client';
import { useSyncExternalStore } from 'react';
import { createAtlasUrlStore, defaultAtlasView } from './atlas-url';

const serverSnapshot = defaultAtlasView();
let store: ReturnType<typeof createAtlasUrlStore> | undefined;
const getStore = () => (store ??= createAtlasUrlStore(window));
const subscribe = (notify: () => void) => getStore().subscribe(notify);
const getSnapshot = () => getStore().getSnapshot();
const getServerSnapshot = () => serverSnapshot;
const update: ReturnType<typeof createAtlasUrlStore>['update'] = (change) =>
  getStore().update(change);

export function useAtlasView() {
  return [
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
    update,
  ] as const;
}
