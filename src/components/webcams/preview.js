import { getTitle } from 'utils/chapters';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import { getThumbnailItems } from 'components/thumbnails/utils';
import { formatTime } from 'utils/format';

// Last slide shown at or before a time
const getSlideAt = (time) => {
  const thumbnails = getThumbnailItems();
  let found = null;
  let number = 0;

  thumbnails.forEach((item, index) => {
    if (item.timestamp <= time) {
      found = item;
      number = index + 1;
    }
  });

  return found ? { item: found, number } : null;
};

// Hovering the timeline shows the slide at that moment, like a storyboard
const attachTimelinePreview = (videojsPlayer, { slideLabel }) => {
  const progress = videojsPlayer?.controlBar?.progressControl;
  const seekBar = progress?.seekBar;
  if (!progress || !seekBar) return;

  const preview = document.createElement('div');
  preview.className = 'timeline-preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = `
    <div class="timeline-preview-image"><img alt="" decoding="async" /></div>
    <div class="timeline-preview-title" dir="auto"></div>
    <div class="timeline-preview-meta">
      <span class="timeline-preview-slide"></span>
      <span class="timeline-preview-time"></span>
    </div>`;
  document.body.appendChild(preview);

  const image = preview.querySelector('img');
  const imageBox = preview.querySelector('.timeline-preview-image');
  const slide = preview.querySelector('.timeline-preview-slide');
  const label = preview.querySelector('.timeline-preview-time');
  const title = preview.querySelector('.timeline-preview-title');
  let frame = null;
  let currentSrc = null;

  const update = (clientX) => {
    frame = null;
    const duration = videojsPlayer.duration();
    const rect = seekBar.el().getBoundingClientRect();
    if (!Number.isFinite(duration) || duration <= 0 || rect.width <= 0) return;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = ratio * duration;
    const found = getSlideAt(time);

    label.textContent = formatTime(time);
    slide.textContent = found ? slideLabel(found.number) : '';
    title.textContent = found ? getTitle(found.item.alt) || '' : '';

    const src = found && found.item.src !== ID.SCREENSHARE ? buildFileURL(found.item.src) : null;
    imageBox.classList.toggle('screenshare', Boolean(found) && !src);
    imageBox.classList.toggle('hidden', !found);
    if (src !== currentSrc) {
      currentSrc = src;
      if (src) {
        image.src = src;
      } else {
        image.removeAttribute('src');
      }
    }

    // Centered on the pointer, kept inside the window
    const width = preview.offsetWidth;
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, clientX - width / 2));
    preview.style.left = `${left}px`;
    preview.style.bottom = `${window.innerHeight - rect.top + 14}px`;
    preview.classList.add('visible');
  };

  const handleMove = (event) => {
    if (frame) cancelAnimationFrame(frame);
    const { clientX } = event;
    frame = requestAnimationFrame(() => update(clientX));
  };

  const hide = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    preview.classList.remove('visible');
  };

  const element = progress.el();
  element.addEventListener('mousemove', handleMove);
  element.addEventListener('mouseleave', hide);

  videojsPlayer.on('dispose', () => {
    hide();
    element.removeEventListener('mousemove', handleMove);
    element.removeEventListener('mouseleave', hide);
    preview.remove();
  });
};

export {
  attachTimelinePreview,
  getSlideAt,
};
