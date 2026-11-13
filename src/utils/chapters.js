import { ID } from './constants';

const MAX_TITLE = 64;

// First line or sentence of the slide text, short enough for a list
const getTitle = (text) => {
  if (!text || typeof text !== 'string') return null;

  const first = text
    .split(/\r?\n|\r/)
    .map(line => line.trim())
    .find(line => line.length > 0);
  if (!first) return null;

  const sentence = first.split(/(?<=[.!?؟])\s/)[0];
  if (sentence.length <= MAX_TITLE) return sentence;

  const cut = sentence.slice(0, MAX_TITLE);
  const space = cut.lastIndexOf(' ');

  return `${space > MAX_TITLE / 2 ? cut.slice(0, space) : cut}…`;
};

// One chapter per slide change, ending where the next one starts
const buildChapters = (thumbnails = [], duration = 0) => {
  const sorted = [...thumbnails]
    .filter(item => Number.isFinite(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  return sorted.map((item, index) => {
    const next = sorted[index + 1];
    const end = next ? next.timestamp : Math.max(duration, item.timestamp);

    return {
      end,
      number: index + 1,
      screenshare: item.src === ID.SCREENSHARE,
      src: item.src,
      start: item.timestamp,
      timestamp: item.timestamp,
      title: getTitle(item.alt),
    };
  }).filter(chapter => chapter.end > chapter.start || chapter.number === sorted.length);
};

const getChapterAt = (chapters, time) => {
  let found = null;
  chapters.forEach(chapter => {
    if (chapter.start <= time) found = chapter;
  });

  return found;
};

export {
  buildChapters,
  getChapterAt,
  getTitle,
};
