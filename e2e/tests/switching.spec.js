// Switching caption languages from the CC menu: whatever the language left
// behind is still doing (translating, failing, its notice) must not disturb
// the language just picked
const { expect, test } = require('@playwright/test');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';
const FIRST_LINE = 'مرحبا بكم جميعا في درس اليوم.';
const CC = 'button.vjs-subs-caps-button';
const TRANSLATE = '**/playback/translate/translate';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    delete window.Translator;
  });
});

const press = async (locator, hasTouch) => (hasTouch ? locator.tap() : locator.click());

const pick = async (page, text, hasTouch) => {
  const item = page.locator('.vjs-subs-caps-button .vjs-menu-item', { hasText: text }).first();
  if (!(await item.isVisible())) await press(page.locator(CC), hasTouch);
  await press(item, hasTouch);
};

const open = async (page) => {
  await page.goto(RECORDING);
  await expect(page.locator(CC)).toBeVisible();
};

const captions = (page) => page.locator('.vjs-text-track-display');
const notice = (page) => page.locator('.toast-message');
// No notice about these languages, whether another one shows or none
const noNoticeAbout = (page, text) => expect(page.locator('.toast-message', { hasText: text })).toHaveCount(0);

const target = (route) => {
  try {
    return JSON.parse(route.request().postData() || '{}').target;
  } catch (error) {
    return null;
  }
};

// Delays (or fails) the server's answers for one language only
const holdLanguage = async (page, language, { delay = 4000, fail = false } = {}) => {
  await page.route(TRANSLATE, async (route) => {
    if (target(route) !== language) return route.fallback();

    await new Promise(resolve => setTimeout(resolve, delay));
    if (fail) return route.fulfill({ status: 500, body: '{"error":"down"}' }).catch(() => {});

    return route.fallback().catch(() => {});
  });
};

test('a language that is ready replaces the notice of the one left behind', async ({ page, hasTouch }) => {
  await open(page);
  await pick(page, 'French', hasTouch);
  await expect(notice(page)).toHaveText('French captions are ready');
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);

  await holdLanguage(page, 'es');
  await pick(page, 'Spanish', hasTouch);
  await expect(notice(page)).toHaveText('Translating captions into Spanish…');

  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
  await noNoticeAbout(page, 'Spanish');
});

test('a language left behind that fails does not take over', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 2500, fail: true });
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(notice(page)).toHaveText('Translating captions into Spanish…');

  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);

  // The Spanish request fails meanwhile
  await page.waitForTimeout(3500);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
  await noNoticeAbout(page, 'Spanish');
  await expect(page.locator('.vjs-subs-caps-button .vjs-menu-item.vjs-selected', { hasText: 'French' })).toHaveCount(1);
});

test('going back to a language mid-translation picks up where it was', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 1500 });
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await pick(page, 'French', hasTouch);
  await pick(page, 'Spanish', hasTouch);

  await expect(captions(page)).toContainText(`[es] ${FIRST_LINE}`, { timeout: 15000 });
  await expect(captions(page)).not.toContainText('[fr]');
  await noNoticeAbout(page, 'French');
});

test('switching quickly back and forth ends on the last language picked', async ({ page, hasTouch }) => {
  await open(page);
  for (const language of ['Spanish', 'French', 'English', 'Spanish', 'French']) {
    await pick(page, language, hasTouch);
  }

  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
  await expect(captions(page).locator('.vjs-text-track-cue')).toHaveCount(1);
  await page.waitForTimeout(1500);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
  await noNoticeAbout(page, /Spanish|English/);
});

test('a language that fails on screen says so and goes back to the original', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 500, fail: true });
  // And the in-browser models, tried after the server
  await page.route(/cdn\.jsdelivr\.net|huggingface\.co/, route => route.abort());
  await open(page);
  await pick(page, 'Spanish', hasTouch);

  await expect(notice(page)).toHaveText(/Spanish/);
  await expect(notice(page)).toContainText("Couldn't translate", { timeout: 15000 });
  await expect(captions(page)).toContainText(FIRST_LINE);
  await expect(captions(page)).not.toContainText('[es]');
});
