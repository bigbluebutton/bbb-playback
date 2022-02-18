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

- chat:
  - `scroll`: automatic scroll [`true`|`false`]
  - `align`: scroll align [`top`|`middle`|`bottom`]

- controls:
  - `about`
  - `fullscreen`
  - `search`
  - `section`
  - `swap`
  - `thumbnails`

- locale:
  - `default`: fallback [`en`]

- player: primary media configuration
  - `rps`: renders per second
  - `rates`: speed rates

- shortcuts: alt + shift
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
