import { test, expect } from '@playwright/test';

test('loading stays in place while code arrives; JSON and CSS load early and once', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let releaseCode!: () => void;
  let releaseData!: () => void;
  const code = new Promise<void>((resolve) => {
    releaseCode = resolve;
  });
  const data = new Promise<void>((resolve) => {
    releaseData = resolve;
  });
  const requests: string[] = [];
  const stylesheets: string[] = [];
  page.on('request', (request) => {
    if (/\/assets\/render-.*\.css$/.test(request.url()))
      stylesheets.push(request.url());
  });
  await page.route('**/assets/render-*.js', async (route) => {
    await code;
    await route.continue();
  });
  await page.route('**/assets/*.json', async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    await data;
    await route.continue();
  });
  try {
    await page.goto('/?islands=dm&detail=dm.05', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('status')).toContainText('Loading Caribbean');
    await expect(
      page.getByRole('heading', { name: 'Contested Worlds' }),
    ).toBeVisible();
    await expect(page.locator('.period-chart')).toHaveCount(0);
    await expect.poll(() => new Set(requests).size).toBe(2);
    await expect.poll(() => stylesheets.length).toBe(1);
    // A collapsing loading-screen margin used to move the whole body on mount.
    expect((await page.locator('body').boundingBox())?.y).toBe(0);
    expect(
      await page
        .locator('#boot-status')
        .evaluate(
          (element) => getComputedStyle(element, '::before').animationName,
        ),
    ).toBe('none');
    releaseCode();
    releaseData();
    await expect(
      page.getByRole('region', { name: 'Interactive history atlas' }),
    ).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#period-metadata')).toContainText(
      'French administration established',
    );
    await expect(page.locator('#boot-screen')).toHaveCount(0);
    expect((await page.locator('body').boundingBox())?.y).toBe(0);
    expect(requests.length, 'Each JSON asset should load exactly once').toBe(2);
    expect(stylesheets.length, 'Reuse the early CSS preload').toBe(1);
  } finally {
    releaseCode();
    releaseData();
  }
});

for (const name of ['caribbean', 'coastlines']) {
  test(`${name} load failures offer a retry and preserve the shared view`, async ({
    page,
  }) => {
    let fail = true;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(`**/assets/${name}-*.json`, (route) =>
      fail
        ? route.fulfill({ status: 503, body: 'Temporarily unavailable' })
        : route.continue(),
    );
    await page.goto('/?islands=dm&detail=dm.05');
    await expect(page.getByRole('status')).toContainText('could not load');
    await expect(page.locator('#boot-screen')).toHaveAttribute(
      'data-failed',
      'true',
    );
    fail = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('#period-metadata')).toContainText(
      'French administration established',
    );
    await expect(page).toHaveURL(/islands=dm&detail=dm\.05/);
    expect(errors).toEqual([]);
  });
}
