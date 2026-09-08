import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'vitest';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/theme.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function environment(stored = null, systemDark = false, blocked = false) {
  const values = new Map(stored ? [['caribbean-atlas-theme', stored]] : []);
  const listeners = new Map();
  let systemListener;
  const media = {
    matches: systemDark,
    addEventListener(_, listener) {
      systemListener = listener;
    },
    removeEventListener() {
      systemListener = undefined;
    },
  };
  const root = {
    dataset: {},
    style: {},
    classList: {
      toggle(_, value) {
        root.dark = value;
      },
    },
  };
  const localStorage = {
    getItem(key) {
      if (blocked) throw new Error('Denied');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (blocked) throw new Error('Denied');
      values.set(key, value);
    },
  };
  const window = {
    localStorage,
    matchMedia: () => media,
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name) {
      listeners.delete(name);
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.(event);
    },
  };
  const context = {
    exports: {},
    document: { documentElement: root },
    window,
    localStorage,
    matchMedia: window.matchMedia,
    Event,
  };
  vm.runInNewContext(javascript, context);
  const api = context.exports;
  api.initializeTheme();
  return {
    api,
    root,
    values,
    system(value) {
      media.matches = value;
      systemListener?.();
    },
    storage(value) {
      window.dispatchEvent({
        type: 'storage',
        key: 'caribbean-atlas-theme',
        newValue: value,
      });
    },
  };
}

test('First paint respects system preference and an explicit saved override', () => {
  assert.equal(environment(null, true).root.dataset.theme, 'dark');
  assert.equal(environment('light', true).root.dataset.theme, 'light');
  assert.equal(environment('dark', false).root.style.colorScheme, 'dark');
  assert.equal(
    environment('invalid', true).root.dataset.themePreference,
    'system',
  );
});
test('A manual choice persists and is used on the next page load', () => {
  const env = environment();
  env.api.setThemePreference('dark');
  assert.equal(env.values.get('caribbean-atlas-theme'), 'dark');
  assert.equal(
    environment(env.values.get('caribbean-atlas-theme')).root.dark,
    true,
  );
});
test('System changes apply in Auto mode, without overriding an explicit choice', () => {
  const env = environment();
  const dispose = env.api.subscribeTheme(() => {});
  env.system(true);
  assert.equal(env.root.dataset.theme, 'dark');
  env.api.setThemePreference('light');
  env.system(true);
  assert.equal(env.root.dataset.theme, 'light');
  env.api.setThemePreference('system');
  assert.equal(env.root.dataset.theme, 'dark');
  dispose();
});
test('Blocked storage keeps the toggle usable, and cross-tab updates synchronize', () => {
  const env = environment(null, false, true);
  env.api.setThemePreference('dark');
  assert.equal(env.root.dataset.theme, 'dark');
  let notifications = 0;
  env.api.subscribeTheme(() => notifications++);
  env.storage('light');
  assert.equal(env.root.dataset.theme, 'light');
  assert.equal(notifications, 1);
});
