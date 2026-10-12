# Caption translation server

The player's CC menu offers the recording captions in more languages,
translated while the viewer watches. It uses the first of these that handles
the language:

1. Chrome's built-in translator, on the viewer's device (desktop Chrome)
2. This server: [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate),
   free and open source, running on your own machine
3. Open translation models run in the viewer's browser, downloaded once
   (about 110 MB per language) and kept in the browser cache

Without this server every browser still translates, through option 3. The
server is still worth installing: viewers do not download any models, the
first line shows in about a second, and phones and tablets get every language
(on their own they get Arabic, Chinese, Dutch, English, French, German, Hindi,
Indonesian, Italian, Portuguese, Russian, Spanish and Ukrainian).

## Install on the BigBlueButton server

It matters most for Safari (Mac, iPhone, iPad): Safari's engine needs a
minute or two to prepare the in-browser models on every visit, while with
this server the first translated line shows in about a second.

Requirements: Docker with the Compose plugin, about 4 GB of free RAM and
10 GB of disk for the language models. On the BigBlueButton server, from the
repository:

```sh
sudo ./translate/install.sh
```

It starts the server, waits for the language models to download (a few
minutes the first time), adds the `/playback/translate` route to nginx and
checks it from outside. No player setting needs to change:
`captions.translate.url` in `src/config.js` already points there.

To see what it is doing: `cd translate && sudo docker compose logs -f`.

## Languages

`LT_LOAD_ONLY` in `docker-compose.yml` lists the languages the server loads.
Keep it in line with `captions.translate.languages` in `src/config.js`, and
include the language the recordings are captioned in. Each language adds about
200 MB of RAM. Run `sudo docker compose up -d` again after a change.

## Running it on another machine

Point `captions.translate.url` at that machine (for example
`https://translate.example.com`), make sure it is served over HTTPS, and set
`LT_API_KEYS` there if it is reachable from the internet. Put the key in
`captions.translate.key`.
