// Playing the recording when the browser cannot play its video file, as
// Safari often cannot play BigBlueButton's WebM
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';
const VIDEO = '**/video/webcams.webm';

// Only Chromium lets a test refuse the browser's own media requests while
// still serving the same file to the page
test.skip(({ browserName }) => browserName !== 'chromium', 'needs media request interception');

const start = async (page, hasTouch) => {
  const button = page.locator('#webcams .vjs-big-play-button');
  await (hasTouch ? button.tap() : button.click());
};

const currentTime = (page) => page.locator('#webcams .vjs-current-time-display');

test('the video plays with the browser’s own player', async ({ page, hasTouch }) => {
  await page.goto(RECORDING);
  await start(page, hasTouch);

  await expect(currentTime(page)).not.toHaveText('0:00', { timeout: 15000 });
  await expect(page.locator('#webcams ogvjs')).toHaveCount(0);
});

test('a WebM the browser cannot play plays through the page decoder', async ({ page, hasTouch }) => {
  await page.route(VIDEO, (route) => (route.request().resourceType() === 'media'
    ? route.abort('failed')
    : route.continue()));
  await page.goto(RECORDING);

  await expect(page.locator('#webcams ogvjs')).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator('#webcams .vjs-error-display')).toBeHidden();
  await start(page, hasTouch);
  await expect(currentTime(page)).not.toHaveText('0:00', { timeout: 15000 });
});

test('a recording that cannot play anywhere explains why', async ({ page }) => {
  test.setTimeout(90000);
  // The file is there, but nothing can load it
  await page.route(VIDEO, (route) => (route.request().method() === 'HEAD' ? route.continue() : route.abort('failed')));
  await page.goto(RECORDING);

  await expect(page.locator('#webcams .vjs-error-display .vjs-modal-dialog-content'))
    .toHaveText(/can't play in this browser/, { timeout: 45000 });
});
