import { getCurrentDataIndex } from './data';
import { hasWebcams } from './data/validators';

const search = (text, thumbnails) => {
  const result = [];

  const value = text.toLowerCase();
  thumbnails.forEach((thumbnail, index) => {
    const { alt } = thumbnail;

    if (alt.toLowerCase().indexOf(value) !== -1) {
      result.push(index);
    }
  });

  return result;
};

const seek = (player, seconds) => {
  if (!hasWebcams(player)) return null;

  const min = 0;
  const max = player.webcams.duration();
  const time = player.webcams.currentTime() + seconds;

  if (time < min) {
    player.webcams.currentTime(min);
  } else if (time > max) {
    player.webcams.currentTime(max);
  } else {
    player.webcams.currentTime(time);
  }
};

const skip = (player, data, change) => {
  if (!hasWebcams(player)) return null;

  const min = 0;
  const max = data.length - 1;
  const time = player.webcams.currentTime();

  const current = getCurrentDataIndex(data, time);
  if (current === -1) return null;

  const index = current + change;

  let timestamp;
  if (index < min) {
    timestamp = data[min].timestamp;
  } else if (index > max) {
    timestamp = data[max].timestamp;
  } else {
    timestamp = data[index].timestamp;
  }

  if (typeof timestamp !== 'undefined') {
    player.webcams.currentTime(timestamp);
  }
};

export {
  search,
  seek,
  skip,
};
