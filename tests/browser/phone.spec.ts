import {
  card,
  expect,
  expectInViewport,
  expectNoOverflow,
  openAtlas,
  test,
} from './fixtures';

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`touch controls and details fit ${viewport.width}px in light and dark`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openAtlas(page);
    await expectNoOverflow(page);
    const picker = page.getByRole('button', { name: /^Choose islands:/ });
    await picker.tap();
    await expectInViewport(page, page.getByRole('menu'));
    await page.getByRole('menuitem', { name: 'Clear selection' }).tap();
    await page
      .getByRole('menuitemcheckbox', { name: 'Dominica', exact: true })
      .tap();
    await picker.tap();
    await expectNoOverflow(page);

    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        colorScheme,
      );
      const options = page.getByRole('button', {
        name: 'Options',
        exact: true,
      });
      await options.tap();
      await expectInViewport(page, page.locator('.chart-options-panel'));
      const qualified = page.getByLabel('Qualified changes');
      const wasChecked = await qualified.isChecked();
      await qualified.tap();
      await expect(qualified).toBeChecked({ checked: !wasChecked });
      await expectNoOverflow(page);
      await options.tap();
      const period = page.getByRole('button', {
        name: /Dominica\..*French administration established/,
      });
      await period.tap();
      await expect(card(page)).toHaveAttribute('data-pinned', 'true');
      await expectInViewport(page, card(page));
      await expectNoOverflow(page);
      await card(page)
        .getByRole('button', { name: 'Next period for Dominica' })
        .tap();
      await expect(card(page)).toContainText('Britain captures Dominica');
      await expectInViewport(page, card(page));
      await card(page)
        .getByRole('button', { name: 'Close period details' })
        .tap();
      await expect(card(page)).toBeHidden();
      await expect(page).not.toHaveURL(/detail=/);
    }
  });
}
