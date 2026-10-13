// The CC button and caption translation, on every device project. The
// fixture recording has Arabic captions; the test server translates into
// English, Spanish and French by marking each line, e.g. "[es] مرحبا"
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';
const FIRST_LINE = 'مرحبا بكم جميعا في درس اليوم.';
const CC = 'button.vjs-subs-caps-button';

// Chrome's built-in translator differs between builds and machines; the
// tests use the translation server, as every other browser does
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    delete window.Translator;
  });
});

const press = async (locator, isMobile) => (isMobile ? locator.tap() : locator.click());

const open = async (page, query = '') => {
  await page.goto(`${RECORDING}${query}`);
  await expect(page.locator('#player')).toBeVisible();
  await expect(page.locator(CC)).toBeVisible();
};

const menuItem = (page, text) => page.locator('.vjs-subs-caps-button .vjs-menu-item', { hasText: text });

const pick = async (page, text, hasTouch) => {
  const item = menuItem(page, text).first();
  if (!(await item.isVisible())) await press(page.locator(CC), hasTouch);
  await press(item, hasTouch);
};

const captions = (page) => page.locator('.vjs-text-track-display');

test('the CC button lists the recording captions and the translations', async ({ page, hasTouch }) => {
  await open(page);
  await press(page.locator(CC), hasTouch);

  await expect(menuItem(page, 'العربية')).toBeVisible();
  await expect(menuItem(page, 'Spanish · auto-translated')).toBeVisible();
  await expect(menuItem(page, 'French · auto-translated')).toBeVisible();
  await expect(menuItem(page, 'English · auto-translated')).toBeVisible();
});

test('the recording captions show on screen', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'العربية', hasTouch);

  await expect(captions(page)).toContainText(FIRST_LINE);
});

test('a translated language shows translated captions', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'Spanish', hasTouch);

  await expect(captions(page)).toContainText(`[es] ${FIRST_LINE}`);
  await expect(page.locator('.toast-message')).toHaveText('Spanish captions are ready');
});

test('switching languages shows the new one', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(captions(page)).toContainText('[es]');

  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
});

test('the caption language is remembered for the next visit', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText('[fr]');

  await page.reload();
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
});

test('turning captions off closes a translation notice', async ({ page, hasTouch }) => {
  // A slow server keeps the notice up
  await page.route('**/playback/translate/translate', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await route.continue().catch(() => {});
  });
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(page.locator('.toast-message')).toHaveText('Translating captions into Spanish…');

  await pick(page, 'captions off', hasTouch);
  await expect(page.locator('.toast-message')).toHaveCount(0);
});

test('captions sit on the video on phones and over the slides elsewhere', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'العربية', hasTouch);
  await expect(captions(page)).toContainText(FIRST_LINE);

  const line = await page.locator('.vjs-text-track-display div div').first().boundingBox();
  const width = page.viewportSize().width;
  // Phones stack the video above the panels; wider screens put the slides
  // beside the side panel
  const area = await page.locator(width < 480 ? '#webcams' : '.content').boundingBox();
  const center = line.x + line.width / 2;

  expect(center).toBeGreaterThan(area.x);
  expect(center).toBeLessThan(area.x + area.width);
  expect(line.y + line.height).toBeLessThanOrEqual(area.y + area.height + 1);
});

test('the CC menu and captions work in a right-to-left interface', async ({ page, hasTouch }) => {
  await open(page, '?locale=ar');
  await press(page.locator(CC), hasTouch);
  await expect(menuItem(page, 'الإسبانية')).toBeVisible();

  await pick(page, 'الإسبانية', hasTouch);
  await expect(captions(page)).toContainText(`[es] ${FIRST_LINE}`);
});

test('caption settings open as a titled card and close with Done', async ({ page, hasTouch }) => {
  await open(page, '?locale=ar');
  await pick(page, 'إعدادات', hasTouch);

  const dialog = page.locator('.vjs-text-track-settings');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-title', 'إعدادات التعليقات');
  const card = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(card.width).toBeLessThan(viewport.width);

  await press(dialog.locator('.vjs-done-button'), hasTouch);
  await expect(dialog).toBeHidden();
});

test('blank caption lines show no empty box', async ({ page, hasTouch }) => {
  await page.route('**/caption_ar.vtt', (route) => route.fulfill({
    contentType: 'text/vtt',
    body: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n&nbsp;\n\n'
      + '00:00:02.000 --> 00:00:04.000\n<v Bob></v>\n\n'
      + `00:00:04.000 --> 00:00:06.000\n${FIRST_LINE}\n`,
  }));
  await open(page);
  await pick(page, 'العربية', hasTouch);

  const boxes = page.locator('.vjs-text-track-cue > div');
  for (const time of [1, 3]) {
    await page.evaluate((t) => { document.querySelector('#webcams video').currentTime = t; }, time);
    await page.waitForTimeout(500);
    await expect(boxes).toHaveCount(0);
  }
  await page.evaluate(() => { document.querySelector('#webcams video').currentTime = 5; });
  await expect(captions(page)).toContainText(FIRST_LINE);
});

test('empty lines inside a caption leave no sliver of box', async ({ page, hasTouch }) => {
  await page.route('**/caption_ar.vtt', (route) => route.fulfill({
    contentType: 'text/vtt',
    // Spaces and the invisible direction marks common in Arabic captions,
    // on lines of their own and as a caption of their own
    body: `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n \n\u202b\n${FIRST_LINE}\n\u200f\u202c\n\n`
      + '00:00:00.000 --> 00:00:05.000\n\u061c\u2067\u2069\n',
  }));
  await open(page);

  // One box, one line of text: an empty line would add a box fragment
  const lineBoxes = () => page.locator('.vjs-text-track-cue > div').evaluateAll(
    boxes => boxes.map(box => box.getClientRects().length),
  );

  await pick(page, 'العربية', hasTouch);
  await expect(captions(page)).toContainText(FIRST_LINE);
  expect(await lineBoxes()).toEqual([1]);

  await pick(page, 'Spanish', hasTouch);
  await expect(captions(page)).toContainText(`[es] ${FIRST_LINE}`);
  expect(await lineBoxes()).toEqual([1]);
});
