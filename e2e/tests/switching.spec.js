// Switching caption languages from the CC menu: whatever the language left
// behind is still doing (translating, failing, its notice) must not disturb
// the language just picked
const { expect, test } = require('@playwright/test');
const { IN_BROWSER_MODELS, useFakeTranslator } = require('../fake-translator');

const RECORDING = '/playback/presentation/2.3/e2e0000000000000000000000000000000000000-1700000000000';
const FIRST_LINE = 'مرحبا بكم جميعا في درس اليوم.';
const CC = 'button.vjs-subs-caps-button';

test.beforeEach(async ({ page }) => {
  await useFakeTranslator(page);
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

// Slows down (or fails) the translation of one language only, before the
// page loads or while it runs
const holdLanguage = async (page, language, { delay = 4000, fail = false } = {}) => {
  const hold = ([code, wait, broken]) => {
    window.fakeTranslator.delay[code] = wait;
    if (broken) window.fakeTranslator.fail[code] = true;
  };
  if (page.url() === 'about:blank') {
    await page.addInitScript(hold, [language, delay, fail]);
  } else {
    await page.evaluate(hold, [language, delay, fail]);
  }
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

const menuItem = (page, text) => page.locator('.vjs-subs-caps-button .vjs-menu-item', { hasText: text }).first();

test('while a language gets ready the other translations wait', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 3000 });
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(notice(page)).toHaveText('Translating captions into Spanish…');

  // Lines on their way show "…", never the original Arabic
  await expect(captions(page)).toContainText('…');
  await expect(captions(page)).not.toContainText(FIRST_LINE);

  if (!(await menuItem(page, 'French').isVisible())) await press(page.locator(CC), hasTouch);
  await expect(menuItem(page, 'Spanish')).toHaveClass(/vjs-caption-preparing/);
  for (const other of ['French', 'English']) {
    await expect(menuItem(page, other)).toHaveAttribute('aria-disabled', 'true');
    await expect(menuItem(page, other)).toHaveAttribute('title', 'Available once Spanish captions are ready');
  }
  // Off and the recording's own captions stay available
  await expect(menuItem(page, 'captions off')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(menuItem(page, 'العربية')).not.toHaveAttribute('aria-disabled', 'true');

  // A click on a waiting language changes nothing
  await menuItem(page, 'French').click({ force: true });
  await expect(menuItem(page, 'Spanish')).toHaveClass(/vjs-selected/);

  // Ready: the others can be picked again
  await expect(captions(page)).toContainText(`[es] ${FIRST_LINE}`);
  await expect(menuItem(page, 'French')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(menuItem(page, 'Spanish')).not.toHaveClass(/vjs-caption-preparing/);
});

test('turning captions off while a language gets ready frees the menu', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 4000 });
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(notice(page)).toHaveText('Translating captions into Spanish…');

  await pick(page, 'captions off', hasTouch);
  await expect(notice(page)).toHaveCount(0);
  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
  await noNoticeAbout(page, 'Spanish');
});

test('a language left behind that fails does not take over', async ({ page, hasTouch }) => {
  await holdLanguage(page, 'es', { delay: 2500, fail: true });
  await page.route(IN_BROWSER_MODELS, route => route.abort());
  await open(page);
  await pick(page, 'Spanish', hasTouch);
  await expect(notice(page)).toHaveText('Translating captions into Spanish…');

  // Back to the recording's own captions, then the Spanish request fails
  await pick(page, 'العربية', hasTouch);
  await page.waitForTimeout(4000);
  await expect(captions(page)).toContainText(FIRST_LINE);
  await noNoticeAbout(page, 'Spanish');

  // French still works
  await pick(page, 'French', hasTouch);
  await expect(captions(page)).toContainText(`[fr] ${FIRST_LINE}`);
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
  await page.route(IN_BROWSER_MODELS, route => route.abort());
  await open(page);
  await pick(page, 'Spanish', hasTouch);

  await expect(notice(page)).toHaveText(/Spanish/);
  await expect(notice(page)).toContainText("Couldn't translate", { timeout: 15000 });
  await expect(captions(page)).toContainText(FIRST_LINE);
  await expect(captions(page)).not.toContainText('[es]');
});
