import logger from './logger';

const STATUSES = [
  'canplay',
  'seeking',
  'waiting',
];

const EVENTS = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'interruptbegin',
  'interruptend',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'mozaudioavailable',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  //'timeupdate',
  'volumechange',
  'waiting',
];

// Safely call play() on a media element, catching the AbortError that
// occurs when pause() is called before the play() promise resolves.
// See: https://developer.chrome.com/blog/play-request-was-interrupted
const safePlay = (mediaElement) => {
  const playPromise = mediaElement.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      if (error.name !== 'AbortError') {
        logger.error('play error', error);
      }
    });
  }
};

export default class Synchronizer {
  constructor(primary, secondary) {
    this.primary = primary;
    this.secondary = secondary;
    this.listeners = [];

    this.status = {
      primary: 'waiting',
      secondary: 'waiting',
    }

    this.synching = false;

    this.init();
  }

  _on(target, event, callback) {
    target.on(event, callback);
    this.listeners.push({ target, event, callback });
  }

  destroy() {
    this.listeners.forEach(({ target, event, callback }) => {
      target.off(event, callback);
    });
    this.listeners = [];

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  init() {
    STATUSES.forEach(status => {
      this._on(this.primary, status, () => this.status.primary = status);
      this._on(this.secondary, status, () => this.status.secondary = status);
    });

    this._on(this.primary, 'play', () => {
      if (!this.secondary?.isDisposed?.()) safePlay(this.secondary)
    });
    this._on(this.primary, 'pause', () => {
      if (!this.secondary?.isDisposed?.()) this.secondary?.pause();
    });

    this._on(this.primary, 'seeking', () => {
      if (this.primary.isDisposed?.()) return;
      const currentTime = this.primary.currentTime();
      if (!this.secondary?.isDisposed?.()) this.secondary?.currentTime(currentTime);
    });

    this._on(this.primary, 'ratechange', () => {
      if (this.primary.isDisposed?.()) return;
      const playbackRate = this.primary.playbackRate();
      if (!this.secondary?.isDisposed?.()) this.secondary?.playbackRate(playbackRate);
    });

    this._on(this.primary, 'waiting', () => {
      if (!this.synching && this.status.secondary === 'canplay') {
        this.synching = true;
        if (!this.primary.isDisposed?.()) this.primary.pause();
      }
    });

    this._on(this.primary, 'canplay', () => {
      if (this.synching) {
        this.synching = false;
        if (!this.primary.isDisposed?.()) safePlay(this.primary);
      }
    });

    this._on(this.secondary, 'waiting', () => {
      if (!this.synching && this.status.primary === 'canplay') {
        this.synching = true;
        if (!this.primary.isDisposed?.()) this.primary.pause();
      }
    });

    this._on(this.secondary, 'canplay', () => {
      if (this.synching) {
        this.synching = false;
        if (!this.primary.isDisposed?.()) safePlay(this.primary);
      }
    });

    // IMPORTANT: Blink holds the secondary media down while the document
    // page is not visible
    // Force medias to sync on visibility change and document is visible
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        if (this.primary.isDisposed?.()) return;
        const currentTime = this.primary.currentTime();
        if (!this.secondary?.isDisposed?.()) this.secondary?.currentTime(currentTime);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    EVENTS.forEach(event => {
      this._on(this.primary, event, () => logger.debug(`primary ${event} ${this.status.primary}`));
      this._on(this.secondary, event, () => logger.debug(`secondary ${event} ${this.status.secondary}`));
    });
  }
}
