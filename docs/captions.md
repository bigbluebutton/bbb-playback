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
  "auto-translated". Picking one shows the original lines at once and swaps
  each line for its translation as it arrives, starting from where the viewer
  is watching.
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
lines already translated:

| Translator | Where it runs | Browsers | Speed to the first line |
|---|---|---|---|
| Chrome's built-in translator | The viewer's device | Desktop Chrome | About a second (a short language download the first time) |
| LibreTranslate server (optional) | Your server | All | About a second |
| Open translation models | The viewer's device | All | Chrome, Edge, Firefox: a few seconds, plus the model download the first time (about a minute on a typical connection); Safari: 2 to 4 minutes |

The open models are downloaded once (about 110 MB per language, 230 MB when
a pair goes through English) and kept in the browser cache. Safari is slow
with them because its engine needs minutes to prepare a model on every
visit. **For Safari, iPhone and iPad viewers, install the server.**

Languages offered (set in `captions.translate.languages`):

- With the server: all 18 configured languages, on every device.
- Without it, on phones and tablets: Arabic, Chinese, Dutch, English,
  French, German, Hindi, Indonesian, Italian, Portuguese, Russian, Spanish
  and Ukrainian.
- Without it, on computers: all of them (Persian, Japanese, Korean, Turkish
  and Urdu use a larger, 630 MB model).

Captions never leave the viewer's device unless the server is used, and the
server runs on your own machine.

## Setting it up

1. **Deploy the player** on the BigBlueButton server, from the repository:

   ```sh
   ./deploy.sh
   ```

   It builds the player, copies it to `/var/bigbluebutton/playback/presentation/2.3`
   and installs the nginx routes.

2. **Install the translation server** (recommended; needed for a fast
   experience in Safari):

   ```sh
   sudo ./translate/install.sh
   ```

   It needs Docker with the Compose plugin, about 4 GB of free RAM and 10 GB
   of disk. It starts LibreTranslate, waits for its language models to
   download, adds the `/playback/translate` route to nginx and checks it.
   See [translate/README.md](../translate/README.md) for languages and for
   running it on another machine.

3. **Check it** from any computer:

   ```sh
   curl -s https://<your server>/playback/translate/languages
   ```

   It should print a list of languages. Then open a recording with captions
   in Safari and pick a translated language: the first line should change
   within a second or two.

Viewers' browsers download the in-browser models from `cdn.jsdelivr.net`
(the translation library) and `huggingface.co` (the models). If those are
blocked for your viewers, install the server, or set `captions.translate.local`
in `src/config.js` to a mirror (see the README's Configuration section).

## Files

| Path | What it does |
|---|---|
| `src/components/webcams/index.js` | Creates the video player; turns off the browser's own caption rendering (`nativeTextTracks: false`), which hid the CC button in Safari |
| `src/components/webcams/captions/index.js` | Sets up the CC menu: translation, then the remembered language |
| `src/components/webcams/captions/translation.js` | Adds the translated languages and translates the picked one, line by line, with fallback between translators |
| `src/components/webcams/captions/preference.js` | Remembers and restores the caption language |
| `src/utils/captions/translators.js` | The translators (Chrome's, the server) and their order |
| `src/utils/captions/local.js` | The in-browser translator: which models for which languages and devices, and the background worker |
| `public/translation-worker.js` | The background worker that runs the open models |
| `src/utils/captions/cache.js` | Saved translations (Cache API) |
| `src/utils/captions/vtt.js` | Reads caption files and orders lines from where the viewer is |
| `src/components/webcams/index.scss` | Caption placement and style |
| `src/locales/messages/*.json` | Notices and labels in 19 languages (`player.captions.*`) |
| `translate/` | The LibreTranslate server: `install.sh`, `docker-compose.yml`, `translate.nginx` |

## Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| No CC button | The recording has no captions, or the server still runs an old player | Check the recording has `captions.json` and `caption_*.vtt`; deploy the player again |
| The CC menu lists only the recording's languages | Old player, or the browser blocks the model hosts and the server is missing | Deploy the player; install the server |
| Translation is slow to start in Safari | Safari prepares in-browser models for minutes | Install the server |
| "Couldn't translate captions into …" | Every translator failed (no network, blocked hosts, server down) | Check `https://<server>/playback/translate/languages`; with `?debug` in the recording URL, the browser console says which translator failed and why |
| `/playback/translate/languages` shows a web page | The nginx route is not installed | Run `sudo ./translate/install.sh` |
| `/playback/translate/languages` answers 502 | The server is not running | `cd translate && sudo docker compose up -d`, then `sudo docker compose logs -f` |
| Some languages are missing on phones | Without the server, phones only get languages with small models | Install the server |

Translations are saved per browser. To start one over, clear the site's data
in the browser, or open the recording in a private window.

## Testing

Unit tests cover the translation flow (translator order and fallback,
notices, pausing and resuming a language), the in-browser translator and its
worker, the server client, the remembered language and the caption files:

```sh
npm test
```

Browser tests open a small Arabic-captioned recording
(`e2e/fixtures`) through a local server (`e2e/server.js`) with a stand-in
translation server, and check the CC button, recording and translated
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
