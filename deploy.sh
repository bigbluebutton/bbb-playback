#!/bin/bash

set -e

BBB_PLAYBACK_HOMEPAGE=playback/presentation/2.3
BBB_PLAYBACK=/var/bigbluebutton/$BBB_PLAYBACK_HOMEPAGE

export REACT_APP_BBB_PLAYBACK_BUILD=$(git rev-parse --short HEAD)

npm run-script build
sudo rm -rf $BBB_PLAYBACK
sudo cp -r ./build $BBB_PLAYBACK
sudo chown --recursive bigbluebutton:bigbluebutton $BBB_PLAYBACK

BBB_NGINX_FILES_PATH=/etc/bigbluebutton/nginx
if [ ! -f $BBB_NGINX_FILES_PATH/playback.nginx ]; then
  sudo cp ./playback.nginx $BBB_NGINX_FILES_PATH
  sudo systemctl reload nginx
fi
