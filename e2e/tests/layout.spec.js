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
