# Recording video in Safari, iPhone and iPad

BigBlueButton saves recording video as WebM. Chrome, Edge and Firefox play
it, but Safari often cannot: it showed "The media could not be loaded,
either because the server or network failed or because the format is not
supported."

The player now handles this in two ways:

1. **In the browser, nothing to install.** It plays the first video that
   works: the recording's MP4, then its WebM, then the WebM decoded in the
   page with [ogv.js](https://github.com/bvibber/ogv.js) (VP8/VP9 and
   Opus/Vorbis, about 0.8 MB, downloaded only by browsers that need it).
   If none works, it says so in the viewer's language. This uses more
   processor and battery than native playback, and long, high-resolution
   screen sharing can stutter on older phones.
2. **On the server, MP4 copies.** Safari plays MP4 natively: smooth, and
   light on the battery. `mp4.sh` makes them:

   ```sh
   sudo ./media/mp4.sh --check   # what it would do
   sudo ./media/mp4.sh           # MP4 for new recordings, and convert the existing ones
   sudo ./media/mp4.sh <id>      # convert one recording
   ```

   Run it on the server that stores the recordings
   (`/var/bigbluebutton/published/presentation`). It:

   - adds `mp4` to `video_formats` in
     `/usr/local/bigbluebutton/core/scripts/presentation.yml`, so new
     recordings get an MP4 (the previous file is kept as
     `presentation.yml.before-mp4`);
   - converts each recording's `video/webcams.webm` and
     `deskshare/deskshare.webm` to H.264/AAC MP4 next to it, at low priority,
     skipping files that already have one.

   Converting takes roughly a tenth to a third of each recording's length,
   and an MP4 takes about as much disk as its WebM. It can run again at any
   time, for example from cron after recordings are published.

The player finds the MP4 files by itself; nothing else needs to change.
