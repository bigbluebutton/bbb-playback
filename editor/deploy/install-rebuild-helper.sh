#!/bin/bash
set -euo pipefail
if [[ $EUID -ne 0 ]]; then
  echo 'Run this installer as root (sudo bash editor/deploy/install-rebuild-helper.sh).' >&2
  exit 1
fi
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
for executable in /usr/bin/python3 /usr/bin/sudo /usr/sbin/visudo /usr/bin/bbb-record; do
  if [[ ! -x "$executable" ]]; then
    echo "Required executable is missing: $executable" >&2
    exit 1
  fi
done
/usr/sbin/visudo -cf "$source_dir/bbb-recording-editor.sudoers"
install -o root -g root -m 0755 "$source_dir/bbb-recording-editor-rebuild" /usr/local/sbin/bbb-recording-editor-rebuild
install -o root -g root -m 0440 "$source_dir/bbb-recording-editor.sudoers" /etc/sudoers.d/bbb-recording-editor
install -d -o root -g root -m 0755 /etc/systemd/system/bbb-recording-editor.service.d
install -o root -g root -m 0644 "$source_dir/rebuild.conf" /etc/systemd/system/bbb-recording-editor.service.d/rebuild.conf
/usr/sbin/visudo -cf /etc/sudoers
systemctl daemon-reload
systemctl restart bbb-recording-editor
echo 'Rebuild helper installed. Reload the recording editor in your browser.'
