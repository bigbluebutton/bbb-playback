// Top bar: search and theme as icons, the bookmark as a named action, and
// copy link and swap in a More menu with their names
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';

const press = (locator, hasTouch) => (hasTouch ? locator.tap() : locator.click());

const openMenu = async (page, hasTouch) => {
  await press(page.getByRole('button', { name: 'More options' }), hasTouch);
  const menu = page.getByRole('menu', { name: 'More options' });
  await expect(menu).toBeVisible();

  return menu;
};

test('the bookmark is a named action button', async ({ page, hasTouch }) => {
  await page.goto(`${RECORDING}?locale=en`);
  const bookmark = page.getByRole('button', { name: 'Bookmark', exact: true });
  await expect(bookmark).toBeVisible();
  if (page.viewportSize().width >= 480) {
    await expect(bookmark).toContainText('Bookmark');
  }

  await press(bookmark, hasTouch);
  await expect(page.locator('.toast-message')).toContainText('Bookmark added');
});

test('the More menu names its actions and runs them', async ({ page, hasTouch }) => {
  await page.goto(`${RECORDING}?locale=en`);
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

  let menu = await openMenu(page, hasTouch);
  await expect(menu.getByRole('menuitem')).toHaveText(['Copy link at current time', 'Swap content']);
  // On screen
  const box = await menu.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);

  await press(menu.getByRole('menuitem', { name: 'Copy link at current time' }), hasTouch);
  await expect(menu).toBeHidden();
  await expect(page.locator('.toast-message')).toContainText(/Link copied|Couldn't copy/);

  const content = page.locator('.content');
  const swapped = /swapped-content/.test(await content.getAttribute('class'));
  menu = await openMenu(page, hasTouch);
  await press(menu.getByRole('menuitem', { name: 'Swap content' }), hasTouch);
  await expect(menu).toBeHidden();
  if (swapped) {
    await expect(content).not.toHaveClass(/swapped-content/);
  } else {
    await expect(content).toHaveClass(/swapped-content/);
  }
});

test('the More menu closes with a click outside, which does nothing else', async ({ page, hasTouch }) => {
  await page.goto(`${RECORDING}?locale=en`);
  const menu = await openMenu(page, hasTouch);

  const viewport = page.viewportSize();
  const x = 8;
  const y = Math.round(viewport.height / 2);
  if (hasTouch) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
  await expect(menu).toBeHidden();
  await page.waitForTimeout(500);
  await expect(page.locator('#webcams .video-js')).toHaveClass(/vjs-paused/);
});

test('the More menu works with the keyboard', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'keyboard');
  await page.goto(`${RECORDING}?locale=en`);
  const button = page.getByRole('button', { name: 'More options' });
  await button.focus();
  await page.keyboard.press('Enter');

  const menu = page.getByRole('menu', { name: 'More options' });
  await expect(menu.getByRole('menuitem', { name: 'Copy link at current time' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Swap content' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Copy link at current time' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});
