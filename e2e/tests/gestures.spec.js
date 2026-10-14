// Tapping or clicking the slides plays and pauses the recording, and a
// double tap on either side seeks, like the video itself
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';

const slides = (page) => page.locator('.top-content');

// Phones show the video first; the side section button brings the slides
const open = async (page, hasTouch) => {
  await page.goto(RECORDING);
  await expect(page.locator('#webcams .video-js')).toHaveClass(/vjs-paused/);
  if (!(await slides(page).isVisible())) {
    const button = page.getByRole('button', { name: 'Side section' });
    await (hasTouch ? button.tap() : button.click());
  }
  await expect(slides(page)).toBeVisible();
};
const video = (page) => page.locator('#webcams .video-js');

const touch = async (page, x, y) => {
  await page.touchscreen.tap(x, y);
};

const tapAt = async (page, locator, ratio, hasTouch) => {
  const box = await locator.boundingBox();
  const x = box.x + box.width * ratio;
  // Above the middle, where the video's play button sits before playback
  const y = box.y + box.height / 3;
  if (hasTouch) {
    await touch(page, x, y);
  } else {
    await page.mouse.click(x, y);
  }
};

test('tapping the slides plays and pauses the recording', async ({ page, hasTouch }) => {
  await open(page, hasTouch);

  await tapAt(page, slides(page), 0.5, hasTouch);
  await expect(video(page)).toHaveClass(/vjs-playing/);
  await expect(page.locator('.tap-toggle-play')).toHaveCount(1);

  // The ripple fades before the next tap
  await page.waitForTimeout(700);
  await tapAt(page, slides(page), 0.5, hasTouch);
  await expect(video(page)).toHaveClass(/vjs-paused/);
  await expect(page.locator('.tap-toggle-pause')).toHaveCount(1);
});

test('tapping the slide controls does not play', async ({ page, hasTouch }) => {
  await open(page, hasTouch);
  const button = page.locator('.content .fullscreen-button button').first();
  if (await button.count() === 0) test.skip(true, 'no fullscreen button in this layout');

  await (hasTouch ? button.tap() : button.click());
  await page.waitForTimeout(500);
  await expect(video(page)).toHaveClass(/vjs-paused/);
});

test('double tapping the right of the slides seeks without playing', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'double tap is a touch gesture');
  await open(page, hasTouch);

  const box = await slides(page).boundingBox();
  const x = box.x + box.width * 0.8;
  const y = box.y + box.height / 2;
  // Both taps must land within 300ms, which a busy test machine can miss:
  // tried again like a person would
  await expect(async () => {
    await touch(page, x, y);
    await touch(page, x, y);
    await expect(page.locator('.tap-seek-forward')).toHaveCount(1, { timeout: 500 });
  }).toPass({ timeout: 15000 });
  await expect(page.locator('#webcams .vjs-current-time-display')).not.toHaveText('0:00');
  await page.waitForTimeout(500);
  await expect(video(page)).toHaveClass(/vjs-paused/);
});

test('tapping the video on a touch screen plays and pauses it', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'video.js handles mouse clicks on the video');
  await page.goto(RECORDING);
  // Starts playing first: before that the big play button covers the video
  await page.locator('#webcams .vjs-big-play-button').tap();
  await expect(video(page)).toHaveClass(/vjs-playing/);

  const area = page.locator('#webcams video');
  const box = await area.boundingBox();
  await touch(page, box.x + box.width / 2, box.y + box.height / 3);
  await expect(video(page)).toHaveClass(/vjs-paused/);
});
