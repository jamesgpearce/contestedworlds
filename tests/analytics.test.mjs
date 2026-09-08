import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(
  new URL('../src/lib/analytics.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
}).outputText;
const { analyticsEnabled, analyticsCommands, deferAnalytics } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const id = 'G-EYQ3SGDHPC',
  url = 'https://contestedworlds.com/';
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
test('Analytics only loads on its configured production host and respects privacy signals', () => {
  assert.equal(
    analyticsEnabled(id, url, { hostname: 'contestedworlds.com' }, {}),
    true,
  );
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'fork.github.io'])
    assert.equal(analyticsEnabled(id, url, { hostname }, {}), false);
  for (const privacy of [{ doNotTrack: '1' }, { globalPrivacyControl: true }])
    assert.equal(
      analyticsEnabled(id, url, { hostname: 'contestedworlds.com' }, privacy),
      false,
    );
  assert.equal(
    analyticsEnabled('', url, { hostname: 'contestedworlds.com' }, {}),
    false,
  );
  assert.equal(
    analyticsEnabled('off', url, { hostname: 'contestedworlds.com' }, {}),
    false,
  );
});
test('The tag queues one canonical page view and disables advertising features', () => {
  const commands = analyticsCommands(id, url, 'Contested Worlds');
  const config = commands.find(([type]) => type === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const visits = commands.filter(
    ([type, name]) => type === 'event' && name === 'page_view',
  );
  assert.equal(visits.length, 1);
  assert.equal(visits[0][2].page_location, url);
  assert.equal(new URL(visits[0][2].page_location).search, '');
});

const scheduler = (readyState = 'loading', supportsIdle = true) => {
  vi.useFakeTimers();
  const window = new EventTarget();
  let idle;
  Object.assign(window, {
    setTimeout,
    clearTimeout,
    ...(supportsIdle && {
      requestIdleCallback: vi.fn((callback, options) => {
        assert.ok(options.timeout > 0 && options.timeout <= 2000);
        idle = callback;
        return 1;
      }),
      cancelIdleCallback: vi.fn(() => {
        idle = undefined;
      }),
    }),
  });
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', { readyState });
  return { window, runIdle: () => idle?.() };
};

test('Analytics waits for page load, a short grace period, and idle time', () => {
  const { window, runIdle } = scheduler();
  const start = vi.fn();
  deferAnalytics(start);
  vi.advanceTimersByTime(5000);
  assert.equal(start.mock.calls.length, 0);
  assert.equal(window.requestIdleCallback.mock.calls.length, 0);
  window.dispatchEvent(new Event('load'));
  vi.advanceTimersByTime(1499);
  assert.equal(window.requestIdleCallback.mock.calls.length, 0);
  vi.advanceTimersByTime(1);
  assert.equal(start.mock.calls.length, 0);
  assert.equal(window.requestIdleCallback.mock.calls.length, 1);
  runIdle();
  assert.equal(start.mock.calls.length, 1);
  window.dispatchEvent(new Event('load'));
  vi.advanceTimersByTime(5000);
  assert.equal(start.mock.calls.length, 1);
});

test('A loaded page still starts Analytics when idle callbacks are unavailable', () => {
  scheduler('complete', false);
  const start = vi.fn();
  deferAnalytics(start);
  vi.advanceTimersByTime(1499);
  assert.equal(start.mock.calls.length, 0);
  vi.advanceTimersByTime(1);
  assert.equal(start.mock.calls.length, 1);
});

for (const stage of ['load', 'grace period', 'idle']) {
  test(`Analytics cleanup cancels work waiting for ${stage}`, () => {
    const { window, runIdle } = scheduler();
    const start = vi.fn();
    const cancel = deferAnalytics(start);
    if (stage !== 'load') window.dispatchEvent(new Event('load'));
    if (stage === 'idle') vi.advanceTimersByTime(1500);
    cancel();
    window.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(5000);
    runIdle();
    assert.equal(start.mock.calls.length, 0);
  });
}
