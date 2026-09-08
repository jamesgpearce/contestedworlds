import {
  test as base,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page, context }, use) => {
      const errors: string[] = [];
      const monitor = (tab: Page) => {
        tab.on('pageerror', (error) => errors.push(error.message));
        tab.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
      };
      monitor(page);
      context.on('page', monitor);
      await use();
      context.off('page', monitor);
      expect(errors, 'No browser runtime or console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function openAtlas(page: Page, query = '') {
  await page.goto(`/${query}`);
  await expect(
    page.getByRole('region', { name: 'Interactive history atlas' }),
  ).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('[data-period-id]').first()).toBeVisible();
}

export function card(page: Page) {
  return page.locator('#period-metadata');
}

export async function expectInViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      const viewport = page.viewportSize()!;
      return (
        !!box &&
        box.x >= -1 &&
        box.y >= -1 &&
        box.x + box.width <= viewport.width + 1 &&
        box.y + box.height <= viewport.height + 1
      );
    })
    .toBe(true);
}

export async function expectNoOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}
