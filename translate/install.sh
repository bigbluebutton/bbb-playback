#!/bin/bash

# Installs the caption translation server on this BigBlueButton server:
# LibreTranslate, served to the player at /playback/translate. With Docker
# it runs as a container (docker-compose.yml); without it, as a system
# service in a Python environment (bbb-playback-translate). In front of it
# runs the gateway (gateway.py, bbb-playback-translate-gateway), which holds
# each viewer to one language at a time while it gets ready and limits the
# requests running at once.
# Run it from the repository: sudo ./translate/install.sh

set -e

cd "$(dirname "$0")"

VERSION=1.9.6
LANGUAGES=en,ar,de,es,fa,fr,hi,id,it,ja,ko,nl,pt,ru,tr,uk,ur,zh
SERVICE=bbb-playback-translate
HOME_DIR=/opt/$SERVICE

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo $0" >&2
  exit 1
fi

if ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 8))' 2> /dev/null; then
  echo "Python 3.8 or later is needed (python3)." >&2
  exit 1
fi

# The services run as this user, never as root
id -u $SERVICE > /dev/null 2>&1 || useradd --system --home-dir $HOME_DIR --shell /usr/sbin/nologin $SERVICE
mkdir -p $HOME_DIR
chown $SERVICE: $HOME_DIR

install_service() {
  echo "Docker is not installed: installing LibreTranslate as the $SERVICE service."
  apt-get install -y -qq python3-venv python3-pip > /dev/null

  sudo -H -u $SERVICE python3 -m venv $HOME_DIR/venv
  sudo -H -u $SERVICE $HOME_DIR/venv/bin/pip install -q --upgrade pip
  sudo -H -u $SERVICE $HOME_DIR/venv/bin/pip install -q "libretranslate==$VERSION"

  cat > /etc/systemd/system/$SERVICE.service <<UNIT
[Unit]
Description=Caption translation for the BigBlueButton presentation player (LibreTranslate)
After=network-online.target

[Service]
User=$SERVICE
WorkingDirectory=$HOME_DIR
ExecStart=$HOME_DIR/venv/bin/libretranslate --host 127.0.0.1 --port 5000 --load-only $LANGUAGES --update-models --disable-web-ui --batch-limit 32 --char-limit 2000 --threads 4
Restart=on-failure
Nice=5

[Install]
WantedBy=multi-user.target
UNIT

  systemctl daemon-reload
  systemctl enable --now $SERVICE
  LOGS="journalctl -u $SERVICE -f"
}

if command -v docker > /dev/null && docker compose version > /dev/null 2>&1; then
  echo "Starting the translation server (Docker)."
  docker compose up -d
  LOGS="cd $(pwd) && docker compose logs -f"
else
  install_service
fi

echo "The first start downloads the language models, which takes a few minutes."
printf "Waiting for it to be ready"
READY=false
for _ in $(seq 1 240); do
  if curl -sf http://127.0.0.1:5000/languages > /dev/null; then
    READY=true
    break
  fi
  printf "."
  sleep 10
done
echo

if [ "$READY" != true ]; then
  echo "Not ready after 40 minutes. See what it is doing: $LOGS" >&2
  exit 1
fi

# The gateway between nginx and LibreTranslate
./install-gateway.sh

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
