// The play button sits in the middle of the slides, wherever the layout
// puts them (on phones, in the middle of the video)
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';

const center = async (locator) => {
  const box = await locator.boundingBox();

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const expectCentered = async (button, area) => {
  const a = await center(button);
  const b = await center(area);
  expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(2);
};

for (const locale of ['en', 'ar']) {
  test(`the play button is in the middle of the slides (${locale})`, async ({ page }) => {
    await page.goto(`${RECORDING}?locale=${locale}`);
    const button = page.locator('#webcams .vjs-big-play-button');
    await expect(button).toBeVisible();

    const slides = page.locator('.top-content');
    if (page.viewportSize().width < 480 || !(await slides.isVisible())) {
      await expectCentered(button, page.locator('#webcams video'));
      return;
    }

    await expectCentered(button, slides);
  });

  test(`the loading spinner is in the middle of the slides (${locale})`, async ({ page }) => {
    await page.goto(`${RECORDING}?locale=${locale}`);
    await expect(page.locator('#webcams .vjs-big-play-button')).toBeVisible();
    // Shown the way video.js does while it waits for data
    await page.locator('#webcams .video-js').evaluate(element => element.classList.add('vjs-waiting'));
    const spinner = page.locator('#webcams .vjs-loading-spinner');
    await expect(spinner).toBeVisible();

    const slides = page.locator('.top-content');
    const area = page.viewportSize().width < 480 || !(await slides.isVisible())
      ? page.locator('#webcams video')
      : slides;
    await expectCentered(spinner, area);
  });
}

for (const locale of ['en', 'ar', 'de']) {
  test(`the side panel tabs show their names in full (${locale})`, async ({ page }) => {
    await page.goto(`${RECORDING}?locale=${locale}`);
    const labels = page.locator('.application-icon-label');
    await expect(labels.first()).toBeVisible();

    const cut = await labels.evaluateAll(spans => spans
      .filter(span => span.scrollWidth > span.clientWidth + 1 || span.textContent.trim() === '')
      .map(span => span.textContent));
    expect(cut).toEqual([]);
  });
}

test('each side panel tab is a button named by its label', async ({ page }) => {
  await page.goto(`${RECORDING}?locale=en`);
  for (const name of ['Chat', 'Notes', 'Transcript', 'Bookmarks']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

// Word-timed captions, as live captions write them, long enough to scroll
const timed = (seconds) => {
  const clock = (value) => `00:${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}.080`;
  const lines = [];
  for (let index = 0; index < 120; index++) {
    const start = index * 2;
    lines.push(`${clock(start)} --> ${clock(start + seconds)}\n<${clock(start)}><c>السلام</c><${clock(start + 1)}><c> عليكم</c> ${index}`);
  }

  return `WEBVTT\n\n${lines.join('\n\n')}\n`;
};

test('the transcript scrolls and shows the words without their timings', async ({ page, hasTouch }) => {
  await page.route('**/caption_ar.vtt', route => route.fulfill({ body: timed(2), contentType: 'text/vtt' }));
  await page.goto(`${RECORDING}?locale=en`);
  const tab = page.getByRole('button', { name: 'Transcript', exact: true });
  await (hasTouch ? tab.tap() : tab.click());

  const list = page.locator('.transcript-lines');
  await expect(list).toBeVisible();
  await expect(page.locator('.transcript-text').first()).toHaveText('السلام عليكم 0');
  await expect(page.locator('.transcript-lines')).not.toContainText('<');

  // A box of its own, inside the screen, that scrolls
  const size = await list.evaluate(element => ({
    bottom: element.getBoundingClientRect().bottom,
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }));
  expect(size.scroll).toBeGreaterThan(size.client);
  expect(size.bottom).toBeLessThanOrEqual(page.viewportSize().height + 1);

  if (hasTouch) {
    await list.evaluate(element => { element.scrollTop = 500; });
  } else {
    const box = await list.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 500);
  }
  await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  await expect(page.locator('.transcript-text', { hasText: 'السلام عليكم 40' })).toBeVisible();
});
