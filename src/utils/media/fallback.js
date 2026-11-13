import logger from 'utils/logger';
import {
  isWebM,
  registerOgvTech,
} from './ogv';

// Media errors worth another try with another file or engine
const RETRY = [
  2, // network, e.g. a broken file
  3, // decode
  4, // not supported: Safari with WebM it cannot decode, or a missing file
];

// ogv.js reports no error when it cannot load a file, so it gets this long
// to read the file's details before the next option is tried
const OGV_TIMEOUT = 30000;

// The ways a recording's media can be played, best first: each file with the
// browser's own player (MP4 first), then WebM with ogv.js
const getAttempts = (sources) => [
  ...sources.map(source => ({ source, tech: 'html5' })),
  ...sources.filter(isWebM).map(source => ({ source, tech: 'ogvjs' })),
];

// Plays the first of `sources` that works in this browser. Without it,
// video.js gives up on the first file it cannot play, which in Safari is
// usually the recording's WebM. `message` explains a final failure
const playFirstWorking = (videojsPlayer, videojs, sources, { message } = {}) => {
  const attempts = getAttempts(sources);
  let index = -1;
  let finished = false;
  let timer = null;

  const fail = () => {
    clearTimeout(timer);
    finished = true;
    videojsPlayer.removeClass('vjs-media-retry');
    videojsPlayer.error({ code: 4, message });
  };

  const next = () => {
    index += 1;
    const attempt = attempts[index];
    if (!attempt) {
      fail();
      return;
    }

    const ready = attempt.tech === 'ogvjs' ? registerOgvTech(videojs) : Promise.resolve('html5');
    ready.then((tech) => {
      if (videojsPlayer.isDisposed()) return;

      logger.debug('media', 'trying', tech, attempt.source.type);
      videojsPlayer.error(null);
      videojsPlayer.options_.techOrder = [tech];
      videojsPlayer.src(attempt.source);
      clearTimeout(timer);
      if (tech === 'ogvjs') {
        timer = setTimeout(() => {
          if (videojsPlayer.isDisposed() || videojsPlayer.readyState() > 0) return;

          logger.warn('media', 'ogv.js could not load', attempt.source.type);
          videojsPlayer.addClass('vjs-media-retry');
          next();
        }, OGV_TIMEOUT);
      }
    }, (error) => {
      logger.warn('media', attempt.tech, error);
      next();
    });
  };

  videojsPlayer.on('error', () => {
    const error = videojsPlayer.error();
    if (finished || !error || !RETRY.includes(error.code)) return;

    logger.warn('media', 'failed', attempts[index] && attempts[index].source.type, error.code);
    // The error stays hidden while another way is tried
    videojsPlayer.addClass('vjs-media-retry');
    next();
  });

  videojsPlayer.on('loadedmetadata', () => {
    clearTimeout(timer);
    videojsPlayer.removeClass('vjs-media-retry');
  });
  videojsPlayer.on('dispose', () => clearTimeout(timer));

  if (attempts.length === 0) {
    fail();
  } else {
    next();
  }
};

export {
  getAttempts,
  playFirstWorking,
};
