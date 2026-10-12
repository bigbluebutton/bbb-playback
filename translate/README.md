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

Requirements: Docker with the Compose plugin, about 4 GB of free RAM and
10 GB of disk for the language models.

```sh
cd bbb-playback/translate
sudo docker compose up -d
```

The first start downloads the language models, which takes a few minutes.
Follow it with `sudo docker compose logs -f` and wait for the health check:

```sh
sudo docker compose ps        # STATUS shows "healthy"
curl -s http://127.0.0.1:5000/languages | head -c 200
```

Then run `./deploy.sh` from the repository root. It installs
`translate.nginx`, which serves the two endpoints the player needs at
`https://<your server>/playback/translate/`, and reloads nginx. Check it from
outside:

```sh
curl -s https://<your server>/playback/translate/languages | head -c 200
```

No player setting needs to change: `captions.translate.url` in `src/config.js`
already points at `/playback/translate`.

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
