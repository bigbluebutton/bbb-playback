#!/bin/bash

# Installs or updates the translation gateway (gateway.py) in front of the
# caption translation server, as the bbb-playback-translate-gateway service:
# it holds each viewer to one language at a time while it gets ready and
# limits the requests running at once. Run by install.sh, and by deploy.sh
# on servers that run the translation server.
# Run it from the repository: sudo ./translate/install-gateway.sh

set -e

cd "$(dirname "$0")"

SERVICE=bbb-playback-translate
GATEWAY=$SERVICE-gateway
HOME_DIR=/opt/$SERVICE
PORT=5050

if [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo $0" >&2
  exit 1
fi

if ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 8))' 2> /dev/null; then
  echo "The translation gateway needs Python 3.8 or later (python3)." >&2
  exit 1
fi

# The services run as this user, never as root
id -u $SERVICE > /dev/null 2>&1 || useradd --system --home-dir $HOME_DIR --shell /usr/sbin/nologin $SERVICE
mkdir -p $HOME_DIR
chown $SERVICE: $HOME_DIR

install -m 0644 -o root -g root gateway.py $HOME_DIR/gateway.py.new
UNIT_FILE=/etc/systemd/system/$GATEWAY.service
cat > $UNIT_FILE.new <<UNIT
[Unit]
Description=Language lock and request limits for caption translation (BigBlueButton presentation player)
After=network-online.target

[Service]
User=$SERVICE
ExecStart=/usr/bin/python3 $HOME_DIR/gateway.py --port $PORT --upstream http://127.0.0.1:5000
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

# Restarted only when something changed, or when it is not running
CHANGED=false
for file in $HOME_DIR/gateway.py $UNIT_FILE; do
  if cmp -s $file.new $file; then
    rm $file.new
  else
    mv $file.new $file
    CHANGED=true
  fi
done

systemctl daemon-reload
systemctl enable $GATEWAY > /dev/null 2>&1
if [ "$CHANGED" = true ] || ! systemctl is-active --quiet $GATEWAY; then
  systemctl restart $GATEWAY
fi

for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:$PORT/languages > /dev/null; then
    echo "The translation gateway is running."
    exit 0
  fi
  sleep 1
done

echo "The translation gateway does not answer. See: journalctl -u $GATEWAY" >&2
exit 1
