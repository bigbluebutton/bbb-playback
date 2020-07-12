# bbb-playback

Clone this repository, install the dependencies and deploy
```
git clone https://github.com/bigbluebutton/bbb-playback.git
cd bbb-playback
npm install
./deploy.sh
```

Include this at the end of `/etc/bigbluebutton/nginx/presentation.nginx`
```
location /playback/presentation/2.3 {
  root /var/bigbluebutton;
  try_files $uri /playback/presentation/2.3/index.html;
}
```

Reload nginx service
```
sudo systemctl reload nginx
```

You will be able to play your recordings using the following URL
```
https://<domain>/playback/presentation/2.3/<recordId>
```

## URL query strings

- layout:
  - `l=media`
  - `l=content`
  - `l=disabled`

- time:
  - `t=HhMmSs`
  - `t=MmSs`
  - `t=Ss`

- log:
  - `debug`

## configuration

- chat:
  - `scroll`: automatic scroll [`true`|`false`]
  - `align`: scroll align [`top`|`center`|`bottom`]

- controls:
  - `about`
  - `fullscreen`
  - `search`
  - `section`
  - `swap`
  - `thumbnails`

- colors:
  - `avatar`: avatar color set

- monitor: posts server playback's usage data
  - `interval`: post frequency
  - `url`: server post destiny

- thumbnails:
  - `scroll`: automatic scroll [`true`|`false`]
  - `align`: scroll align [`top`|`center`|`bottom`]

- video: primary media configuration
  - `fps`: frames per second
  - `rates`: speed rates
