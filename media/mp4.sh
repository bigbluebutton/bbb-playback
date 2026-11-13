#!/bin/bash

# Gives presentation recordings an MP4 copy of their video, which Safari,
# iPhone and iPad play natively. BigBlueButton only makes WebM by default;
# the player can play WebM in Safari too (decoding it in the page), but MP4
# plays smoother and uses less battery.
#
# Run it as root on the server that stores the recordings
# (/var/bigbluebutton/published/presentation):
#
#   sudo ./media/mp4.sh                  turn MP4 on for new recordings and
#                                        convert every existing recording
#   sudo ./media/mp4.sh <recording id>   convert one recording
#   sudo ./media/mp4.sh --check          only list what would be done
#
# Existing MP4 files are left alone, so it can run again at any time.

set -e

PUBLISHED=${BBB_PUBLISHED:-/var/bigbluebutton/published/presentation}
SETTINGS=${BBB_PRESENTATION_SETTINGS:-/usr/local/bigbluebutton/core/scripts/presentation.yml}
CHECK=false
ONLY=""

for arg in "$@"; do
  case "$arg" in
    --check) CHECK=true ;;
    -h|--help) sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) ONLY="$arg" ;;
  esac
done

if [ "$CHECK" != true ] && [ "$(id -u)" -ne 0 ]; then
  echo "Run it as root: sudo $0 $*" >&2
  exit 1
fi

if ! command -v ffmpeg > /dev/null; then
  echo "ffmpeg is needed (BigBlueButton servers have it): apt-get install ffmpeg" >&2
  exit 1
fi

if [ ! -d "$PUBLISHED" ]; then
  echo "No recordings in $PUBLISHED: run it on the server that stores them." >&2
  exit 1
fi

# New recordings: add mp4 to video_formats in presentation.yml
enable_mp4() {
  if [ ! -f "$SETTINGS" ]; then
    echo "Skipping new recordings: $SETTINGS not found."
    return
  fi
  if grep -Eq '^\s*-\s*mp4\s*$' "$SETTINGS"; then
    echo "New recordings already get MP4."
    return
  fi
  if [ "$CHECK" = true ]; then
    echo "Would turn MP4 on for new recordings in $SETTINGS."
    return
  fi

  cp "$SETTINGS" "$SETTINGS.before-mp4"
  if grep -Eq '^\s*#\s*-\s*mp4\s*$' "$SETTINGS"; then
    sed -i -E 's/^(\s*)#\s*(-\s*mp4)\s*$/\1\2/' "$SETTINGS"
  else
    sed -i -E '/^\s*video_formats:/,/^\S/{s/^(\s*)-\s*webm\s*$/\1- webm\n\1- mp4/}' "$SETTINGS"
  fi

  if grep -Eq '^\s*-\s*mp4\s*$' "$SETTINGS"; then
    echo "New recordings now get MP4 (previous settings: $SETTINGS.before-mp4)."
  else
    cp "$SETTINGS.before-mp4" "$SETTINGS"
    echo "Could not find video_formats in $SETTINGS; add '- mp4' under it by hand." >&2
  fi
}

# One WebM file to MP4 (H.264 and AAC), at low priority so meetings are not
# disturbed. The file is written aside and moved in place once complete
convert() {
  local webm="$1"
  local mp4="${webm%.webm}.mp4"

  if [ -s "$mp4" ]; then
    return
  fi
  if [ "$CHECK" = true ]; then
    echo "Would convert $webm"
    return
  fi

  echo "Converting $webm"
  if nice -n 19 ionice -c 3 ffmpeg -nostdin -loglevel error -y -i "$webm" \
    -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p \
    -c:a aac -b:a 96k -movflags +faststart \
    "$mp4.part.mp4"; then
    mv "$mp4.part.mp4" "$mp4"
    chown --reference="$webm" "$mp4"
    chmod --reference="$webm" "$mp4"
  else
    rm -f "$mp4.part.mp4"
    echo "Failed: $webm" >&2
    FAILED=$((FAILED + 1))
  fi
}

FAILED=0

if [ -z "$ONLY" ]; then
  enable_mp4
  RECORDINGS=("$PUBLISHED"/*/)
else
  RECORDINGS=("$PUBLISHED/$ONLY/")
  if [ ! -d "${RECORDINGS[0]}" ]; then
    echo "No recording $ONLY in $PUBLISHED" >&2
    exit 1
  fi
fi

for recording in "${RECORDINGS[@]}"; do
  for webm in "$recording"video/webcams.webm "$recording"deskshare/deskshare.webm; do
    if [ -f "$webm" ]; then
      convert "$webm"
    fi
  done
done

if [ "$FAILED" -gt 0 ]; then
  echo "$FAILED file(s) could not be converted." >&2
  exit 1
fi
echo "Done."
