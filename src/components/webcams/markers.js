import bookmarks from 'utils/bookmarks';
import storage from 'utils/data/storage';

const CLASS_NAME = 'vjs-slide-markers';

const getSlideChanges = () => {
  const slides = storage.slides || [];
  const timestamps = slides
    .map(slide => slide.timestamp)
    .filter(timestamp => Number.isFinite(timestamp) && timestamp > 0);

  return [...new Set(timestamps)].sort((a, b) => a - b);
};

// Thin ticks on the progress bar where the presenter changed slides
const renderSlideMarkers = (videojsPlayer) => {
  const seekBar = videojsPlayer?.controlBar?.progressControl?.seekBar;
  const duration = videojsPlayer.duration();
  if (!seekBar || !Number.isFinite(duration) || duration <= 0) return;

  const element = seekBar.el();
  const previous = element.querySelector(`.${CLASS_NAME}`);
  if (previous) previous.remove();

  const container = document.createElement('div');
  container.className = CLASS_NAME;
  container.setAttribute('aria-hidden', 'true');

  getSlideChanges().forEach(timestamp => {
    if (timestamp >= duration) return;

    const marker = document.createElement('span');
    marker.className = 'vjs-slide-marker';
    marker.style.left = `${(timestamp / duration) * 100}%`;
    container.appendChild(marker);
  });

  element.appendChild(container);
};

const BOOKMARKS_CLASS_NAME = 'vjs-bookmark-markers';

// Viewer bookmarks on the progress bar
const renderBookmarkMarkers = (videojsPlayer) => {
  const seekBar = videojsPlayer?.controlBar?.progressControl?.seekBar;
  const duration = videojsPlayer.duration();
  if (!seekBar || !storage.metadata || !Number.isFinite(duration) || duration <= 0) return;

  const element = seekBar.el();
  const previous = element.querySelector(`.${BOOKMARKS_CLASS_NAME}`);
  if (previous) previous.remove();

  const container = document.createElement('div');
  container.className = BOOKMARKS_CLASS_NAME;
  container.setAttribute('aria-hidden', 'true');

  bookmarks.list(storage.metadata.id).forEach(({ time }) => {
    if (time > duration) return;

    const marker = document.createElement('span');
    marker.className = 'vjs-bookmark-marker';
    marker.style.left = `${(time / duration) * 100}%`;
    container.appendChild(marker);
  });

  element.appendChild(container);
};

export {
  getSlideChanges,
  renderBookmarkMarkers,
  renderSlideMarkers,
};
