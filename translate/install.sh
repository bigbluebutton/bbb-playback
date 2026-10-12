#!/bin/bash

# Installs the caption translation server on this BigBlueButton server:
# starts LibreTranslate (Docker) and serves it to the player at
# /playback/translate. Run it from the repository: sudo ./translate/install.sh

set -e

cd "$(dirname "$0")"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo $0" >&2
  exit 1
fi

if ! command -v docker > /dev/null || ! docker compose version > /dev/null 2>&1; then
  echo "Docker with the Compose plugin is needed: https://docs.docker.com/engine/install/ubuntu/" >&2
  exit 1
fi

echo "Starting the translation server. The first start downloads the language models (a few minutes)…"
docker compose up -d

printf "Waiting for it to be ready"
READY=false
for _ in $(seq 1 120); do
  if curl -sf http://127.0.0.1:5000/languages > /dev/null; then
    READY=true
    break
  fi
  printf "."
  sleep 10
done
echo

if [ "$READY" != true ]; then
  echo "Not ready after 20 minutes. See what it is doing: cd $(pwd) && docker compose logs" >&2
  exit 1
fi

NGINX_FILES=/usr/share/bigbluebutton/nginx
cp translate.nginx $NGINX_FILES/translate.nginx
nginx -t
systemctl reload nginx

SERVER_URL=$(grep -h '^bigbluebutton.web.serverURL=' \
  /usr/share/bbb-web/WEB-INF/classes/bigbluebutton.properties \
  /etc/bigbluebutton/bbb-web.properties 2> /dev/null | tail -n 1 | cut -d= -f2)

if [ -n "$SERVER_URL" ]; then
  if curl -sf "$SERVER_URL/playback/translate/languages" | grep -q '"code"'; then
    echo "Done: $SERVER_URL/playback/translate is translating captions."
  else
    echo "The server runs, but $SERVER_URL/playback/translate/languages does not answer yet." >&2
    echo "Check that $NGINX_FILES/*.nginx is included by the BigBlueButton nginx site." >&2
    exit 1
  fi
else
  echo "Done. Check it at https://<this server>/playback/translate/languages"
fi
