// The about dialog: what the recording contains and the shortcuts
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';

test('the about dialog labels the recording content and closes', async ({ page, hasTouch }) => {
  await page.goto(`${RECORDING}?locale=en`);
  await expect(page.locator('#player')).toBeVisible();
  await page.keyboard.press('?');

  const dialog = page.locator('.about-modal');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.about-header .title')).not.toBeEmpty();
  await expect(dialog.locator('.body-data .item', { hasText: 'Participants' })).toContainText('2');
  await expect(dialog.locator('.body-data .item', { hasText: 'Slides' })).not.toHaveClass(/unavailable/);
  await expect(dialog.locator('.body-data .item', { hasText: 'Polls' })).toHaveClass(/unavailable/);
  await expect(dialog.locator('.key[title="ArrowLeft"]')).toHaveText('←');

  // Fits the screen, with the close button on the header
  const box = await dialog.boundingBox();
  expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
  const close = dialog.locator('.modal-control button');
  await (hasTouch ? close.tap() : close.click());
  await expect(dialog).toHaveCount(0);
});
