import { getCurrentDataIndex } from 'utils/data';
import storage from 'utils/data/storage';
import player from 'utils/player';

const play = () => {
  if (!player.primary) return;

  if (player.primary.paused()) {
    const playPromise = player.primary.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error.name !== 'AbortError') {
          throw error;
        }
      });
    }
  } else {
    player.primary.pause();
  }
};

const search = (text, thumbnails) => {
  const result = [];

  const value = text.toLowerCase();
  thumbnails.forEach((thumbnail, index) => {
    const { alt } = thumbnail;

    if (typeof alt === 'string' && alt.toLowerCase().indexOf(value) !== -1) {
      result.push(index);
    }
  });

  return result;
};

const seek = (seconds) => {
  if (!player.primary) return;

  const min = 0;
  const max = player.primary.duration();
  const time = player.primary.currentTime() + seconds;

  if (time < min) {
    player.primary.currentTime(min);
  } else if (time > max) {
    player.primary.currentTime(max);
  } else {
    player.primary.currentTime(time);
  }
};

const skip = (change) => {
  if (!player.primary) return null;

  const min = 0;
  const max = storage.slides.length - 1;
  const time = player.primary.currentTime();

  const current = getCurrentDataIndex(storage.slides, time);
  if (current === -1) return null;

  const index = current + change;

  let timestamp;
  if (index < min) {
    timestamp = storage.slides[min].timestamp;
  } else if (index > max) {
    timestamp = storage.slides[max].timestamp;
  } else {
    timestamp = storage.slides[index].timestamp;
  }

  if (typeof timestamp !== 'undefined') {
    player.primary.currentTime(timestamp);
  }
};

// Next speed up (+1) or down (-1) among the configured rates
const getNextRate = (rates, current, direction) => {
  const sorted = [...rates].sort((a, b) => a - b);
  if (sorted.length === 0) return current;

  if (direction > 0) {
    const next = sorted.find(rate => rate > current + 0.001);

    return next === undefined ? sorted[sorted.length - 1] : next;
  }

  const previous = [...sorted].reverse().find(rate => rate < current - 0.001);

  return previous === undefined ? sorted[0] : previous;
};

export {
  getNextRate,
  play,
  search,
  seek,
  skip,
};
