import {
  card,
  expect,
  expectInViewport,
  expectNoOverflow,
  openAtlas,
  test,
} from './fixtures';

test('resizing remeasures the chart and keeps pinned details within the viewport', async ({
  page,
}) => {
  await openAtlas(page, '?islands=dm&detail=dm.05');
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page
          .locator('.period-chart')
          .evaluate((chart) =>
            Math.abs(
              Number(chart.getAttribute('width')) -
                chart.closest('.period-atlas')!.clientWidth,
            ),
          ),
      )
      .toBeLessThanOrEqual(1);
    await expectInViewport(page, card(page));
    await expectNoOverflow(page);
    await expect(card(page)).toContainText('French administration established');
  }
});

test('shared filters restore through reload and browser back/forward', async ({
  page,
}) => {
  await openAtlas(page, '?islands=cu,lc&g=i&a=t&m=s&y=1600-1800&c=0&q=0');
  const historyLength = await page.evaluate(() => history.length);
  await expect(
    page.getByRole('tab', { name: 'By Island', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.period-chart')).toHaveAccessibleName(
    /2 selected island histories.*Linear time/,
  );
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByRole('tab', { name: 'Sovereign title', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Start year')).toHaveValue('1600');
  await expect(page.getByLabel('End year')).toHaveValue('1800');
  await expect(page.getByLabel('Claim markers')).not.toBeChecked();
  await expect(page.getByLabel('Qualified changes')).not.toBeChecked();
  await page.getByLabel('Claim markers').check();
  await expect(page.locator('[data-claim-id]').first()).toBeAttached();
  await page.keyboard.press('Escape');
  const saved = page.url();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.reload();
  await expect(page.locator('.period-chart')).toHaveAccessibleName(
    /2 selected island histories.*Linear time/,
  );
  await expect(page.locator('[data-claim-id]').first()).toBeVisible();

  // The app replaces history entries. Seed another same-document entry to
  // exercise real popstate delivery, rather than a mocked history adapter.
  await page.evaluate(() => {
    history.pushState(null, '', '?islands=dm');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(
    page.getByRole('button', { name: 'Choose islands: Dominica', exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(saved);
  await expect(page.locator('.period-chart')).toHaveAccessibleName(
    /2 selected island histories.*Linear time/,
  );
  await page.goForward();
  await expect(
    page.getByRole('button', { name: 'Choose islands: Dominica', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByLabel('Start year')).toHaveValue('1450');
  await expect(
    page.getByRole('tab', { name: 'Events', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('pinned periods and claims restore, step and clear when filtered out', async ({
  page,
}) => {
  await openAtlas(page, '?islands=dm&detail=dm.05');
  await expect(card(page)).toHaveAttribute('data-pinned', 'true');
  await expect(card(page)).toContainText('French administration established');
  await expect(page.locator('#island-background')).toHaveAttribute('open', '');
  await card(page)
    .getByRole('button', { name: 'Next period for Dominica' })
    .click();
  await expect(card(page)).toContainText('Britain captures Dominica');
  await expect(page).toHaveURL(/detail=dm\.07/);
  await page.reload();
  await expect(card(page)).toContainText('Britain captures Dominica');
  await card(page)
    .getByRole('button', { name: 'Previous period for Dominica' })
    .click();
  await expect(card(page)).toContainText('French administration established');
  await card(page)
    .getByRole('button', { name: 'Close period details' })
    .click();
  await expect(card(page)).toBeHidden();
  await expect(page).not.toHaveURL(/detail=/);

  await page
    .getByRole('button', {
      name: /Dominica\. Claim only\..*Spain claims Dominica/,
    })
    .click();
  await expect(card(page)).toContainText('Claim by Spain');
  await expect(page).toHaveURL(/detail=dm\.01/);
  await page.reload();
  await expect(card(page)).toContainText('Claim by Spain');
  await page.getByRole('button', { name: 'Options', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Claim markers').focus();
  await expect(page).toHaveURL(/detail=dm\.01/);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-claim-id]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/detail=/);
  await page.keyboard.press('Escape');
  await expect(card(page)).toBeHidden();
});

test('SVG hover is transient; click pins until outside dismissal', async ({
  page,
}) => {
  await openAtlas(page, '?islands=dm');
  const period = page.getByRole('button', {
    name: /Dominica\..*French administration established/,
  });
  await period.hover();
  await expect(card(page)).toContainText('French administration established');
  await expect(card(page)).toHaveAttribute('data-pinned', 'false');
  await expect(page).not.toHaveURL(/detail=/);
  await page.getByRole('heading', { level: 1 }).hover();
  await expect(card(page)).toBeHidden();
  await period.click();
  await expect(card(page)).toHaveAttribute('data-pinned', 'true');
  await page.getByRole('heading', { level: 1 }).hover();
  await expect(card(page)).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(card(page)).toBeHidden();
  await expect(page).not.toHaveURL(/detail=/);
});

test('menus support keyboard selection, Escape focus return and outside dismissal', async ({
  page,
}) => {
  await openAtlas(page, '?islands=cu,lc');
  const picker = page.getByRole('button', { name: /^Choose islands:/ });
  await picker.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('menuitem', { name: 'Select all 36 islands' }),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'No islands selected' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(picker).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(picker).toHaveAccessibleName('Choose islands: All 36 islands');
  await page.keyboard.press('Escape');
  const options = page.getByRole('button', { name: 'Options', exact: true });
  await options.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('tab', { name: 'Administration', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Sovereign title', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('tab', { name: 'Sovereign title', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(options).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Chart options' }),
  ).toBeHidden();
  await options.click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(
    page.getByRole('heading', { name: 'Chart options' }),
  ).toBeHidden();
});

test('keyboard users reach the chronology and inspect, step and close records', async ({
  page,
  browserName,
}) => {
  await openAtlas(page, '?islands=dm');
  await page.getByRole('button', { name: 'Options', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#island-background > summary')).toBeFocused();
  const record = page.getByRole('link', { name: /Spain claims Dominica/ });
  // Safari on macOS uses Option-Tab to include links in keyboard navigation.
  // https://support.apple.com/guide/safari/cpsh003/mac
  const nextLink =
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab';
  // Tab through the background's citations to its first dated record.
  for (let step = 0; step < 12; step++) {
    await page.keyboard.press(nextLink);
    if (await record.evaluate((link) => link === document.activeElement)) break;
  }
  await expect(record).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card(page)).toHaveAttribute('data-pinned', 'true');
  await expect(card(page)).toContainText('Claim by Spain');
  await card(page)
    .getByRole('button', { name: 'Next period for Dominica' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(card(page)).toContainText('French settlement expands');
  await page.keyboard.press('Enter');
  await expect(card(page)).toContainText('French administration established');
  await card(page)
    .getByRole('button', { name: 'Close period details' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(card(page)).toBeHidden();
  await expect(page).not.toHaveURL(/detail=/);
});

test('native year inputs validate and apply a custom range', async ({
  page,
}) => {
  await openAtlas(page, '?islands=cu,lc');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Start year').fill('1900');
  await page.getByLabel('Start year').press('Enter');
  await page.getByLabel('End year').fill('1800');
  await page.getByLabel('End year').press('Enter');
  await expect(page.getByRole('alert')).toHaveText(
    'The start year must not be after the end year.',
  );
  await expect(page.getByLabel('End year')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel('Start year').fill('1600');
  await page.getByLabel('Start year').press('Enter');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page).toHaveURL(/y=1600-1800/);
  await expect(
    page.getByRole('combobox', { name: 'Time period', exact: true }),
  ).toHaveValue('custom');
  await page.reload();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByLabel('Start year')).toHaveValue('1600');
  await expect(page.getByLabel('End year')).toHaveValue('1800');
  await page
    .getByRole('combobox', { name: 'Time period', exact: true })
    .selectOption('all');
  await expect(page.getByLabel('Start year')).toHaveValue('1450');
  await expect(page).not.toHaveURL(/[?&]y=/);
});

test('appearance follows the system, preserves an override and synchronizes tabs', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openAtlas(page, '?islands=dm');
  const root = page.locator('html');
  const appearance = page.getByRole('button', { name: /^Appearance:/ });
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await appearance.click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(appearance).toHaveAccessibleName(
    'Appearance: Light. Switch to Dark',
  );
  const other = await context.newPage();
  await openAtlas(other, '?islands=dm');
  await appearance.click();
  await expect(other.locator('html')).toHaveAttribute('data-theme', 'dark');
  await other.close();
  await appearance.click();
  await expect(appearance).toHaveAccessibleName(
    'Appearance: Auto. Switch to Light',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(root).toHaveAttribute('data-theme', 'dark');
});

test('regrouping preserves records and reduced motion reaches final geometry immediately', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openAtlas(page, '?islands=cu,lc&g=i');
  const geometry = () =>
    page.locator('[data-period-id]').evaluateAll((marks) =>
      marks.map((mark) => ({
        id: mark.getAttribute('data-period-id'),
        transform: mark.getAttribute('transform'),
        height: mark
          .querySelector('[data-period-body]')
          ?.getAttribute('height'),
      })),
    );
  const islandRows = await geometry();
  await page.getByRole('tab', { name: 'By Power', exact: true }).click();
  const powerRows = await geometry();
  expect(powerRows.map(({ id }) => id)).toEqual(islandRows.map(({ id }) => id));
  expect(powerRows).not.toEqual(islandRows);
  await page.getByRole('tab', { name: 'By Island', exact: true }).click();
  expect(await geometry()).toEqual(islandRows);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('tab', { name: 'By Power', exact: true }).click();
  await expect.poll(geometry).toEqual(powerRows);
  await expectNoOverflow(page);
});
