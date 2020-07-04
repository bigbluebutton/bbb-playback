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

export default class Synchronizer {
  constructor(primary, secondary) {
    this.primary = primary;
    this.secondary = secondary;

    this.status = {
      primary: 'waiting',
      secondary: 'waiting',
    }

    this.synching = false;

    this.init();
  }

  init() {
    STATUSES.forEach(status => {
      this.primary.on(status, () => this.status.primary = status);
      this.secondary.on(status, () => this.status.secondary = status);
    });

    this.primary.on('play', () => this.secondary.play());
    this.primary.on('pause', () => this.secondary.pause());

    this.primary.on('seeking', () => {
      const currentTime = this.primary.currentTime();
      this.secondary.currentTime(currentTime);
    });

    this.primary.on('ratechange', () => {
      const playbackRate = this.primary.playbackRate();
      this.secondary.playbackRate(playbackRate);
    });

    this.primary.on('waiting', () => {
      if (!this.synching && this.status.secondary === 'canplay') {
        this.synching = true;
        this.primary.pause();
      }
    });

    this.primary.on('canplay', () => {
      if (this.synching) {
        this.synching = false;
        this.primary.play();
      }
    });

    this.secondary.on('waiting', () => {
      if (!this.synching && this.status.primary === 'canplay') {
        this.synching = true;
        this.primary.pause();
      }
    });

    this.secondary.on('canplay', () => {
      if (this.synching) {
        this.synching = false;
        this.primary.play();
      }
    });

    EVENTS.forEach(event => {
      this.primary.on(event, () => logger.debug(`primary ${event} ${this.status.primary}`));
      this.secondary.on(event, () => logger.debug(`secondary ${event} ${this.status.secondary}`));
    });
  }
}
