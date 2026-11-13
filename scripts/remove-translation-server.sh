#!/bin/bash

# Removes the caption translation server (LibreTranslate) and its gateway
# from a BigBlueButton server where an earlier version of this player
# installed them (translate/install.sh). The player translates captions in
# the viewer's browser and no longer uses them. Frees about 4 GB of memory
# and 3 GB of disk (the language models).
# Run it from the repository: sudo ./scripts/remove-translation-server.sh

set -e

SERVICE=bbb-playback-translate
NGINX_ROUTE=/usr/share/bigbluebutton/nginx/translate.nginx

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo $0" >&2
  exit 1
fi

# The /playback/translate route first, so nothing reaches the server
if [ -f $NGINX_ROUTE ]; then
  rm $NGINX_ROUTE
  nginx -t
  systemctl reload nginx
  echo "Removed the /playback/translate route from nginx."
fi

# The gateway and, without Docker, LibreTranslate itself
for unit in $SERVICE-gateway $SERVICE; do
  if [ -f /etc/systemd/system/$unit.service ]; then
    systemctl disable --now $unit > /dev/null 2>&1 || true
    rm /etc/systemd/system/$unit.service
    echo "Removed the $unit service."
  fi
done
systemctl daemon-reload

# With Docker: the container, its language models and its image
if command -v docker > /dev/null; then
  if docker ps -a --format '{{.Names}}' | grep -qx $SERVICE; then
    docker rm -f $SERVICE > /dev/null
    echo "Removed the $SERVICE container."
  fi
  if docker volume ls -q | grep -qx translate_models; then
    docker volume rm translate_models > /dev/null
    echo "Removed the language models (translate_models volume)."
  fi
  docker image ls -q libretranslate/libretranslate | xargs -r docker image rm > /dev/null 2>&1 || true
fi

# The Python environment, the gateway and the user they ran as
rm -rf /opt/$SERVICE
if id -u $SERVICE > /dev/null 2>&1; then
  userdel $SERVICE
fi

echo "The caption translation server is removed."
