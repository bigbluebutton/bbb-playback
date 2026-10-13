# bbb-playback

Clone this repository, install the dependencies and deploy
```
git clone https://github.com/bigbluebutton/bbb-playback.git
cd bbb-playback
npm install
./deploy.sh
```

You will be able to play your recordings using the following URL
```
https://<domain>/playback/presentation/2.3/<recordId>
```

## Captions and translation

The CC button works the same in Chrome, Edge, Firefox and Safari, on
computers, phones and tablets. Besides the recording's own captions it
offers them translated into 18 languages, remembers the viewer's choice and
explains what it is doing while a translation starts.

Translation works without any setup, in the viewer's browser. For a fast
start in every browser, and in Safari especially, install the translation
server on the BigBlueButton server:
```
sudo ./translate/install.sh
```

How it works, setup, troubleshooting and tests: [docs/captions.md](docs/captions.md).

## Tests

```
npm test                 # unit tests
npm run build
npm run test:e2e         # browser tests (npx playwright install chromium, once)
```

## Development proxy

The development proxy allows you to test the playback player locally against
recordings hosted on a remote BigBlueButton or Scalelite server (e.g. a
production instance). This is useful when you want to develop or debug the player
using real session data without having to download the recording files. It works
with any publicly accessible recording that is not behind authentication.

The proxy forwards all `/presentation` requests from the local dev server to the
remote host, avoiding browser CORS restrictions.

Start the dev server with the proxy enabled:
```
npm run start:proxy
```

The script will prompt you for the remote host URL:
```
Remote host URL (e.g. https://scalelite.example.com):
```

Then open the recording in your browser:
```
http://localhost:<port>/playback/presentation/2.3/<recordId>
```

When no URL is provided, the dev server starts normally without any proxy.

> **Note:** The proxy uses `secure: false` so it works with self-signed
> certificates commonly found on development and staging servers. This setting
> only affects the local development proxy and has **no impact** on production
> builds.

## URL query strings

- frequency:
  - `f=<value>`: renders per second (e.g., 5)

- layout:
  - `l=content`: focus on content
  - `l=disabled`: disabled interactive elements
  - `l=media`: focus on media
  - `l=swapped`: content/media swapped

- style: custom style
  - `s=<name>`

- time:
  - `t=HhMmSs` (e.g., 1h10m5s)
  - `t=MmSs`
  - `t=Ss`

- path:
  - `p=path/to/recordings`

- locale:
  - `locale=locale-CODE` (e.g., pt-BR)

- log:
  - `debug`

## Configuration

- captions:
  - `translate`: offer the recording captions in more languages in the CC menu,
    translated when the viewer selects one
    - `enabled`: [`true`|`false`]
    - `languages`: languages to offer, besides the viewer's own language
    - `url`: an optional LibreTranslate server, the fastest option on every
      device. Defaults to `/playback/translate`; see
      [translate/](translate/README.md) to install it
    - `local`: translation in the viewer's browser with open models, used
      when neither Chrome's built-in translator nor the server handles a
      language. Works in every browser with nothing to install; models
      download once from `models` (about 110 MB per language) and stay in the
      browser cache. Phones and tablets get the languages with small models
      (ar, de, en, es, fr, hi, id, it, nl, pt, ru, uk, zh); computers get all
      of them
      - `enabled`: [`true`|`false`]
      - `library`: transformers.js build to load
      - `models`: where models download from (a mirror can be set here)
    - `key`: optional LibreTranslate API key sent to `url`
    - `preload`: with the browser translator, start downloading the viewer's
      language pack on their first click [`true`|`false`]

    Translations are saved in the viewer's browser (Cache API), so switching
    back to a language or coming back to the recording is instant. See
    [docs/captions.md](docs/captions.md) for how the translators are chosen.

- chat:
  - `scroll`: automatic scroll [`true`|`false`]
  - `align`: scroll align [`top`|`middle`|`bottom`]

- controls:
  - `about`
  - `fullscreen`
  - `search`
  - `section`
  - `share`: copy a link that opens the recording at the current time
  - `swap`
  - `theme`: light/dark theme; follows the system preference until the viewer picks one
  - `thumbnails`

- locale:
  - `default`: fallback [`en`]

- player: primary media configuration
  - `rps`: renders per second
  - `rates`: speed rates

- shortcuts: alt + shift
  - `plain`: also enable single key controls [`true`|`false`]
    - `Space`/`K`: play/pause, `←`/`J`: seek backwards, `→`/`L`: seek forwards,
      `F`: toggle fullscreen, `M`: mute, `<`/`>`: slower/faster, `B`: bookmark
      the current moment, `?`: show shortcuts
  - `fullscreen`: `K`
  - `play/pause`: `Enter`
  - `section`: `L`
  - `seek`:
    - `backward`: `ArrowLeft`
    - `forward`: `ArrowRight`
    - `seconds`: 15
  - `skip`:
    - `next`: `ArrowUp`
    - `previous`: `ArrowDown`
  - `swap`: `M`

- styles: custom styles
  - `default`: default style
  - `url`: styles host
  - `valid`: valid style names

- thumbnails:
  - `scroll`: automatic scroll [`true`|`false`]
  - `align`: scroll align [`left`|`center`|`right`]

## Viewer features

- Bookmarks: viewers can bookmark moments with a note (`B` or the header
  button). They are listed in the Bookmarks panel, marked on the timeline and
  kept in the viewer's browser, per recording
- Transcript: when a recording has captions, the Transcript panel shows them as
  a searchable list that follows playback; clicking a line plays from there
- Timeline preview: hovering the progress bar shows the slide at that moment
- Search: live results with the matching slide text; clicking one plays it
- Chapters: one per slide, titled from the slide text, with how much of each
  one the viewer has watched
- Watch progress: the header shows the share of the recording watched across
  visits (kept in the viewer's browser), with a message once it is complete
- Downloads: bookmarks and notes as Markdown with links to each moment, and
  the transcript as text
- Touch: double-tap the left or right side of the slide or video to seek
- Captions: the CC menu offers the recording's captions and translations into
  18 languages, and remembers the viewer's language (see
  [docs/captions.md](docs/captions.md))

## Standalone recordings

bbb-playback can be used to create a self-contained recording - a single directory that contains all of the recording media files as well as the playback html and javascript code. To do this, use the following build command:
```
PUBLIC_URL=. REACT_APP_NO_ROUTER=1 npm run-script build
```
And then copy all of the files from the bbb-playback `build` directory and the files from `/var/bigbluebutton/published/presentation/<recordid>` together into a single directory.

## External recordings

bbb-playback can play recordings hosted somewhere other than the default location. To do this, build the bbb-playback with the following options:
```
REACT_APP_MEDIA_ROOT_URL=/different/relative/path/to/presentation/files npm run-script build
```
You can also play medias from an external server. Note that you will need to have the `Access-Control-Allow-Origin` header returned on the medias for that to work.
```
REACT_APP_MEDIA_ROOT_URL=https://my-media-server.example.com npm run-script build
```

## Playing old recordings

At `/etc/bigbluebutton/nginx/presentation.nginx`:

 - v2.0, v2.1 and v2.2
```
location /playback/presentation/2.0/playback.html {
  return 301 /playback/presentation/2.3/$arg_meetingId?$query_string;
}
```
 - [experimental] v0.9, v1.0 and v1.1
```
location /playback/presentation/0.9.0/playback.html {
  return 301 /playback/presentation/2.3/$arg_meetingId?$query_string;
}
```

Reload nginx service
```
sudo systemctl reload nginx
```
