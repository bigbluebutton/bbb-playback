// A video.js playback engine ("tech") that plays WebM with ogv.js, a VP8/VP9,
// Opus and Vorbis decoder that runs in the page. Used for browsers that
// cannot play a recording's WebM themselves, Safari above all. Adapted from
// videojs-ogvjs (MIT, Derk-Jan Hartman) for video.js 7.
//
// ogv.js itself (about 120 kB) and its decoders (public/ogv, copied by
// scripts/copy-ogv.js) are only downloaded when this engine is needed.

const TECH = 'Ogvjs';

let library = null;

const loadOgv = () => {
  if (!library) {
    library = import('ogv').then((module) => {
      const ogv = module.default || module;
      ogv.OGVLoader.base = `${process.env.PUBLIC_URL}/ogv`;

      return ogv;
    }, (error) => {
      library = null;
      throw error;
    });
  }

  return library;
};

const WEBM = /^(video|audio)\/webm/;

const createTech = (videojs, { OGVCompat, OGVPlayer }) => {
  const Tech = videojs.getComponent('Tech');

  class Ogvjs extends Tech {
    constructor(options, ready) {
      super(options, ready);

      this.el_.src = options.source.src;
      if (options.preload) this.el_.preload = options.preload;
      this.triggerReady();
    }

    createEl() {
      const el = new OGVPlayer();
      el.className += ' vjs-tech';

      return el;
    }

    dispose() {
      // Stops the decoder workers
      if (this.el_ && typeof this.el_.stop === 'function') this.el_.stop();
      super.dispose();
    }

    play() { this.el_.play(); }
    pause() { this.el_.pause(); }
    paused() { return this.el_.paused; }
    currentTime() { return this.el_.currentTime || 0; }

    setCurrentTime(seconds) {
      try {
        this.el_.currentTime = seconds;
      } catch (error) {
        // Not ready to seek yet; video.js asks again once it is
      }
    }

    duration() { return this.el_.duration || 0; }
    buffered() { return this.el_.buffered; }
    seekable() { return this.el_.seekable; }
    played() { return this.el_.played; }
    seeking() { return this.el_.seeking; }
    ended() { return this.el_.ended; }
    error() { return this.el_.error; }
    networkState() { return this.el_.networkState; }
    readyState() { return this.el_.readyState; }
    videoWidth() { return this.el_.videoWidth; }
    videoHeight() { return this.el_.videoHeight; }

    volume() { return typeof this.el_.volume === 'number' ? this.el_.volume : 1; }
    setVolume(value) { this.el_.volume = value; }
    muted() { return Boolean(this.el_.muted); }
    setMuted(muted) { this.el_.muted = Boolean(muted); }
    defaultMuted() { return false; }

    playbackRate() { return this.el_.playbackRate || 1; }
    setPlaybackRate(value) { this.el_.playbackRate = value; }

    src(source) {
      if (typeof source === 'undefined') return this.el_.src;
      this.setSrc(source);

      return undefined;
    }

    setSrc(source) { this.el_.src = source; }
    currentSrc() { return this.el_.currentSrc || this.el_.src; }
    load() { this.el_.load(); }

    preload() { return this.el_.preload || 'auto'; }
    setPreload(value) { this.el_.preload = value; }
    autoplay() { return false; }
    setAutoplay() {}
    controls() { return false; }
    setControls() {}
    loop() { return false; }
    setLoop() {}
    poster() { return ''; }
    setPoster() {}

    // No native fullscreen: video.js uses its full-window mode instead
    supportsFullScreen() { return false; }
  }

  Ogvjs.isSupported = () => OGVCompat.supported('OGVPlayer');
  Ogvjs.canPlayType = (type) => (WEBM.test(type || '') ? 'maybe' : '');
  Ogvjs.canPlaySource = (source) => Ogvjs.canPlayType(source.type);
  Ogvjs.supportsNativeTextTracks = () => false;

  Ogvjs.prototype.featuresVolumeControl = true;
  Ogvjs.prototype.featuresPlaybackRate = true;
  Ogvjs.prototype.featuresProgressEvents = true;
  Ogvjs.prototype.featuresTimeupdateEvents = true;
  Ogvjs.prototype.featuresNativeTextTracks = false;

  return Ogvjs;
};

// Registers the engine on this video.js instance (the webcams and the
// screenshare players import different video.js builds). Resolves to its
// techOrder name, or rejects where ogv.js cannot run
const registerOgvTech = (videojs) => loadOgv().then((ogv) => {
  if (!videojs.getTech(TECH)) {
    const Ogvjs = createTech(videojs, ogv);
    if (!Ogvjs.isSupported()) throw new Error('ogv.js is not supported');
    videojs.registerTech(TECH, Ogvjs);
  }

  return 'ogvjs';
});

const isWebM = (source) => WEBM.test(source.type || '');

export {
  isWebM,
  registerOgvTech,
};
