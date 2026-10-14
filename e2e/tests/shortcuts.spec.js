// The quick keys listed in the about dialog, in the real player: with
// nothing focused, with a button focused (as after clicking one), and with
// an Arabic keyboard layout, where K types "ن"
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';

test.skip(({ hasTouch }) => hasTouch, 'keyboard shortcuts');

const video = (page) => page.locator('#webcams .video-js');
const time = (page) => page.locator('#webcams .vjs-current-time-display');
const notice = (page) => page.locator('.toast-message');
const isMuted = (page) => page.locator('#webcams video').evaluate(element => element.muted);

const open = async (page) => {
  await page.goto(`${RECORDING}?locale=en`);
  await expect(video(page)).toHaveClass(/vjs-paused/);
  // Starts at the beginning, wherever the last test left off
  await page.evaluate(() => localStorage.clear());
};

// Presses a key the way a keyboard with another layout reports it
const pressAs = (page, key, code, shiftKey = false) => page.evaluate(([k, c, s]) => {
  const target = document.activeElement || document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, code: c, key: k, shiftKey: s }));
}, [key, code, shiftKey]);

const situations = {
  'nothing focused': async () => {},
  'a button focused': async (page) => {
    await page.getByRole('button', { name: 'Bookmarks' }).focus();
  },
};

for (const [situation, prepare] of Object.entries(situations)) {
  test(`every quick key works with ${situation}`, async ({ page }) => {
    await open(page);
    await prepare(page);

    await page.keyboard.press('k');
    await expect(video(page)).toHaveClass(/vjs-playing/);
    await page.keyboard.press('k');
    await expect(video(page)).toHaveClass(/vjs-paused/);

    await page.keyboard.press('l');
    await expect(time(page)).toHaveText('0:15');
    await page.keyboard.press('j');
    await expect(time(page)).toHaveText('0:00');
    await page.keyboard.press('ArrowRight');
    await expect(time(page)).toHaveText('0:15');
    await page.keyboard.press('ArrowLeft');
    await expect(time(page)).toHaveText('0:00');

    const muted = await isMuted(page);
    await page.keyboard.press('m');
    await expect.poll(() => isMuted(page)).toBe(!muted);

    await page.keyboard.press('Shift+Period');
    await expect(notice(page)).toContainText('1.25');
    await page.keyboard.press('Shift+Comma');
    await expect(notice(page)).toContainText('1');

    await page.keyboard.press('b');
    await expect(notice(page)).toContainText('Bookmark added');

    await page.keyboard.press('f');
    await expect(page.locator('.player-wrapper')).toHaveClass(/fullscreen-content/);
    await page.keyboard.press('f');
    await expect(page.locator('.player-wrapper')).not.toHaveClass(/fullscreen-content/);

    await page.keyboard.press('Shift+Slash');
    await expect(page.locator('.about-modal')).toBeVisible();
  });
}

test('the quick keys work on an Arabic keyboard layout', async ({ page }) => {
  await open(page);

  await pressAs(page, 'ن', 'KeyK');
  await expect(video(page)).toHaveClass(/vjs-playing/);
  await pressAs(page, 'ن', 'KeyK');
  await expect(video(page)).toHaveClass(/vjs-paused/);

  await pressAs(page, 'م', 'KeyL');
  await expect(time(page)).toHaveText('0:15');
  await pressAs(page, 'ت', 'KeyJ');
  await expect(time(page)).toHaveText('0:00');

  const muted = await isMuted(page);
  await pressAs(page, 'ة', 'KeyM');
  await expect.poll(() => isMuted(page)).toBe(!muted);

  await pressAs(page, 'ب', 'KeyF');
  await expect(page.locator('.player-wrapper')).toHaveClass(/fullscreen-content/);
  await pressAs(page, 'ب', 'KeyF');

  await pressAs(page, 'لا', 'KeyB');
  await expect(notice(page)).toContainText('Bookmark added');

  await pressAs(page, '؟', 'Slash', true);
  await expect(page.locator('.about-modal')).toBeVisible();
});

test('the quick keys work while the shortcuts list is open', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Shift+Slash');
  await expect(page.locator('.about-modal')).toBeVisible();

  // Focus is on the dialog's close button
  await page.keyboard.press('k');
  await expect(video(page)).toHaveClass(/vjs-playing/);
  await page.keyboard.press('k');
  await expect(video(page)).toHaveClass(/vjs-paused/);
  await page.keyboard.press('l');
  await expect(time(page)).toHaveText('0:15');
});
