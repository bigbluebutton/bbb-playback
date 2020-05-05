# bbb-playback

Clone this repository, install the dependencies and deploy
```
git clone https://github.com/pedrobmarin/bbb-playback.git
cd bbb-playback
npm install
./deploy
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
