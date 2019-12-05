# bbb-playback

```
location /playback/presentation/3.0 {
  root /var/bigbluebutton;
  try_files $uri /playback/presentation/3.0/index.html;
}
```