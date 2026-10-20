# Captions and translation

This guide covers the CC button of the presentation player: what viewers
get, how translation works, how to set it up on a BigBlueButton server, and
how to check and troubleshoot it.

## What viewers get

- **The same CC button in every browser**: Chrome, Edge, Firefox and Safari,
  on computers, iPhone, iPad and Android. The player draws the captions
  itself instead of leaving them to the browser, so they look and behave the
  same everywhere, including right-to-left languages.
- **The recording's captions** in every language they were recorded in.
- **Translated captions**: the CC menu also lists other languages, marked
  "auto-translated". Picking one shows each line as soon as its translation
  arrives, starting from where the viewer is watching. Translation happens
  in the viewer's browser: nothing to install on the server, and captions
  never leave the viewer's device.
- **Clear notices** while a translation starts: "Translating captions into
  Spanish…", the download progress when the browser needs a translation
  model, "Getting Spanish captions ready…" while it prepares, and "Spanish
  captions are ready" once the first translated line is on screen. Turning
  translated captions off closes the notice.
- **A remembered choice**: the language picked last time, original or
  translated, is turned on again on the next visit.
- **Instant return**: translations are saved in the viewer's browser, so
  coming back to a language or a recording does not translate again.

On phones the captions sit on the video; on larger screens they sit over
the slides, clear of the side panel.

## How translation works

The player uses the first of these translators that handles the language,
and moves on to the next one if a translator stalls or fails, keeping the
lines already translated. Both run on the viewer's device:

| Translator | Browsers | Speed to the first line |
|---|---|---|
| Chrome's built-in translator | Desktop Chrome | About a second (a short language download the first time) |
| Open translation models | All | Chrome, Edge, Firefox: a few seconds, plus the model download the first time (about a minute on a typical connection); Safari: 2 to 4 minutes |

The open models are downloaded once (about 110 MB per language, 230 MB when
a pair goes through English) and kept in the browser cache. Safari is slower
with them because its engine needs a minute or two to prepare a model on
every visit; the player says so while it waits.

Languages offered (set in `captions.translate.languages`):

- On phones and tablets: Arabic, Chinese, Dutch, English, French, German,
  Hindi, Indonesian, Italian, Portuguese, Russian, Spanish and Ukrainian.
- On computers: all 18 configured languages (Persian, Japanese, Korean,
  Turkish and Urdu use a larger, 630 MB model).
- In desktop Chrome, also whatever its built-in translator offers.

### Switching languages

A picked language shows each line as soon as its translation is ready,
starting from where the viewer is, and "…" for lines still on their way. It
never shows the original language in their place.

While a language gets ready (until its first lines are translated), the
other translations wait, greyed out in the CC menu with a spinner on the
language being prepared. Switching meanwhile would start and stop work in
the background and slow everything down. Captions off and the recording's
own captions stay available, and turning captions off frees the menu at
once.

Once a language is ready, switching is free: the language left behind
pauses after the line it is on and keeps what it has translated, so
picking it again carries on from there. It never changes what is on
screen. If the language on screen cannot be translated, the captions go
back to the original with a notice saying so.

## Setting it up

Deploy the player on the BigBlueButton server, from the repository:

```sh
./deploy.sh
```

It builds the player, copies it to `/var/bigbluebutton/playback/presentation/2.3`
and installs the nginx routes. Translation needs nothing else on the server.

Viewers' browsers download the in-browser models from `cdn.jsdelivr.net`
(the translation library) and `huggingface.co` (the models). If those are
blocked for your viewers, set `captions.translate.local` in `src/config.js`
to a mirror (see the README's Configuration section).

Servers where an earlier version of this player installed its translation
server (LibreTranslate) can remove it, freeing about 4 GB of memory and
3 GB of disk:

```sh
sudo ./scripts/remove-translation-server.sh
```

## Files

| Path | What it does |
|---|---|
| `src/components/webcams/index.js` | Creates the video player; turns off the browser's own caption rendering (`nativeTextTracks: false`), which hid the CC button in Safari |
| `src/components/webcams/captions/index.js` | Sets up the CC menu: translation, then the remembered language |
| `src/components/webcams/captions/translation.js` | Adds the translated languages and translates the picked one, line by line, with fallback between translators |
| `src/components/webcams/captions/preference.js` | Remembers and restores the caption language |
| `src/utils/captions/translators.js` | The translators (Chrome's, the in-browser models) and their order |
| `src/utils/captions/local.js` | The in-browser translator: which models for which languages and devices, and the background worker |
| `public/translation-worker.js` | The background worker that runs the open models |
| `src/utils/captions/cache.js` | Saved translations (Cache API) |
| `src/utils/captions/vtt.js` | Reads caption files and orders lines from where the viewer is |
| `src/components/webcams/index.scss` | Caption placement and style |
| `src/locales/messages/*.json` | Notices and labels in 19 languages (`player.captions.*`) |
| `scripts/remove-translation-server.sh` | Removes the translation server earlier versions installed |

## Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| No CC button | The recording has no captions, or the server still runs an old player | Check the recording has `captions.json` and `caption_*.vtt`; deploy the player again |
| The CC menu lists only the recording's languages | Old player, or the browser blocks the model hosts | Deploy the player; check that viewers reach `cdn.jsdelivr.net` and `huggingface.co`, or set a mirror |
| Translation is slow to start in Safari | Safari prepares in-browser models for a minute or two on each visit | Expected; the notice says so. Chrome, Edge and Firefox start in seconds |
| "Couldn't translate captions into …" | Every translator failed (no network, blocked hosts, not enough memory) | With `?debug` in the recording URL, the browser console says which translator failed and why |
| Some languages are missing on phones | Phones only get languages with small models | Expected; computers get all of them |

Translations are saved per browser. To start one over, clear the site's data
in the browser, or open the recording in a private window.

## Testing

Unit tests cover the translation flow (translator order and fallback,
notices, pausing and resuming a language), the in-browser translator and its
worker, the remembered language and the caption files:

```sh
npm test
```

Browser tests open a small Arabic-captioned recording
(`e2e/fixtures`) through a local server (`e2e/server.js`), with a stand-in
for Chrome's translator (`e2e/fake-translator.js`), and check the CC button,
recording and translated
captions, switching languages, the remembered language, caption placement
and a right-to-left interface:

```sh
npm run build
npx playwright install chromium   # once
npm run test:e2e
```

Locally they run in Chromium as desktop Chrome, desktop Safari (its user
agent), iPhone, iPad and Android. CI (`.github/workflows/ci.yml`) also runs
them in the real Safari (WebKit, desktop and iPhone) and Firefox engines;
locally, set `E2E_ALL_BROWSERS=1` after
`npx playwright install webkit firefox`.
