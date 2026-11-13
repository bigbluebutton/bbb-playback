import storage from './data/storage';
import player from './player';

// Media duration once known, otherwise the recording metadata
const getDuration = () => {
  const media = player.primary ? player.primary.duration() : NaN;
  if (Number.isFinite(media) && media > 0) return media;

  const { start, end } = storage.metadata || {};
  const duration = (end - start) / 1000;

  return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

export default getDuration;
