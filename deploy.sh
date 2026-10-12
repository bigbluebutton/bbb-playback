#!/bin/bash

set -e

BBB_PLAYBACK_HOMEPAGE=playback/presentation/2.3
BBB_PLAYBACK=/var/bigbluebutton/$BBB_PLAYBACK_HOMEPAGE

export REACT_APP_BBB_PLAYBACK_BUILD=$(git rev-parse --short HEAD)

npm run-script build
sudo rm -rf $BBB_PLAYBACK
sudo mkdir -p $BBB_PLAYBACK
grep \"version\"\: package.json | sed -e 's|.*\ \"||g' -e 's|\".*||g' > bbb-playback-version
sudo cp -r ./build/* bbb-playback-version $BBB_PLAYBACK
sudo chown --recursive bigbluebutton:bigbluebutton $BBB_PLAYBACK

BBB_NGINX_FILES_PATH=/usr/share/bigbluebutton/nginx
RELOAD_NGINX=false
if [ ! -f $BBB_NGINX_FILES_PATH/playback.nginx ]; then
  sudo cp ./playback.nginx $BBB_NGINX_FILES_PATH
  RELOAD_NGINX=true
fi

# Route to the caption translation server (translate/docker-compose.yml)
if ! cmp -s ./translate/translate.nginx $BBB_NGINX_FILES_PATH/translate.nginx; then
  sudo cp ./translate/translate.nginx $BBB_NGINX_FILES_PATH
  RELOAD_NGINX=true
fi

if [ "$RELOAD_NGINX" = true ]; then
  sudo nginx -t
  sudo systemctl reload nginx
fi
