import config from 'config';
import qs from 'qs';
import stringHash from 'string-hash';
import logger from './logger';

const CONTENT = 'content';
const DISABLED = 'disabled';
const MEDIA = 'media';

const LOCAL = process.env.REACT_APP_NO_ROUTER;

const PRESENTATION = 'presentation';
const SCREENSHARE = 'screenshare';

const buildFileURL = (recordId, file) => {
  if (LOCAL) return file;

  return `/presentation/${recordId}/${file}`;
};

const getAvatarColor = name => {
  const { avatar } = config.colors;

  return avatar[stringHash(name) % avatar.length];
};

const getActiveContent = (screenshare, time) => {
  const content = isEnabled(screenshare, time) ? SCREENSHARE : PRESENTATION;

  return content;
};

const getControlFromLayout = layout => {
  let control = true;

  switch (layout) {
    case DISABLED:
      control = false;
      break;
    default:
  }

  return control;
};

const getCurrentDataIndex = (data, time) => {
  if (isEmpty(data)) return -1;

  let start = 0;
  let stop = data.length - 1;
  let middle = Math.floor((start + stop) / 2);

  while (!isCurrent(data, middle, time) && start < stop) {
    const item = data[middle];
    if (!hasProperty(item, 'timestamp')) return -1;

    if (!isVisible(time, item.timestamp)) {
      stop = middle - 1;
    } else {
      start = middle + 1;
    }

    middle = Math.floor((start + stop) / 2);
  }

  const current = isCurrent(data, middle, time);

  return (!current) ? -1 : middle;
};

const getCurrentDataInterval = (data, time) => {
  const currentDataInterval = [];

  if (isEmpty(data)) return currentDataInterval;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (hasProperty(item, 'timestamp') && hasProperty(item, 'clear')) {
      const {
        clear,
        timestamp,
      } = item;

      if (!isVisible(time, timestamp)) break;

      currentDataInterval.push(!wasCleared(time, clear));
    }
  }

  return currentDataInterval;
};

const getDraws = (index, slides, canvases) => {
  if (!hasIndex(index, slides)) return [];

  const slide = slides[index];

  if (isEmpty(canvases)) return [];

  const canvas = canvases.find(canvas => slide.id === canvas.id);

  if (!canvas) return [];

  const { draws } = canvas;

  return draws;
};

const getFileName = file => file.split('.').shift();

const getFileType = file => config.files.type[file.split('.').pop()];

const getLayout = location => {
  if (location) {
    const { search } = location;
    if (search) {
      const { l } = qs.parse(search, { ignoreQueryPrefix: true });

      if (l) return l;
    }
  }

  return null;
};

const getRecordId = match => {
  if (LOCAL) return 'local';

  if (match) {
    const { params } = match;
    if (params && params.recordId) {
      const { recordId } = params;
      const regex = /^[a-z0-9]{40}-[0-9]{13}$/;

      if (recordId.match(regex)) return recordId;
    }
  }

  logger.error('missing', 'recordId');

  return null;
};

const getSectionFromLayout = layout => {
  let section = true;

  switch (layout) {
    case CONTENT:
      section = false;
      break;
    case MEDIA:
      section = false;
      break;
    default:
  }

  return section;
};

const getSwapFromLayout = layout => {
  let swap = false;

  switch (layout) {
    case CONTENT:
      swap = false;
      break;
    case MEDIA:
      swap = true;
      break;
    default:
  }

  return swap;
};

const getScrollTop = (firstNode, currentNode, align) => {
  if (!currentNode) return 0;

  const {
    clientHeight,
    offsetTop,
    parentNode,
  } = currentNode;

  if (!firstNode || !parentNode) return 0;

  const spacing = firstNode.offsetTop;
  const parentHeight = parentNode.clientHeight;

  let verticalOffset = 0;
  switch (align) {
    case 'top':
      verticalOffset = offsetTop - spacing;
      break;
    case 'center':
      verticalOffset = parseInt(offsetTop + (clientHeight - spacing - parentHeight) / 2, 10);
      break;
    case 'bottom':
      verticalOffset = offsetTop + clientHeight - parentHeight;
      break;
    default:
      logger.debug('unhandled', align);
  }

  return verticalOffset;
};

const getTime = location => {
  if (location) {
    const { search } = location;
    if (search) {
      const { t } = qs.parse(search, { ignoreQueryPrefix: true });

      if (t) return parseTimeToSeconds(t);
    }
  }

  return null;
};

const getTimestampAsMilliseconds = timestamp => timestamp * 1000;

const hasIndex = (index, data) => {
  if (index < 0) return false;

  if (isEmpty(data)) return false;

  if (index >= data.length) {
    logger.error('out of bounds', index, data);

    return false;
  }

  return true;
};

const hasPresentation = slides => {
  if (isEmpty(slides)) return false;

  for (let i = 0; i < slides.length; i++) {
    const { src } = slides[i];

    if (src.includes('slide')) return true;
  }

  return false;
};

const hasProperty = (object, property) => {
  if (object && object.hasOwnProperty(property)) {
    if (typeof object[property] !== 'undefined') return true;
  }

  logger.warn('missing', property, object);

  return false;
};

const isActive = (time, timestamp, clear = -1) => {
  const cleared = wasCleared(time, clear);
  const visible = isVisible(time, timestamp);

  return visible && !cleared;
};

const isEmpty = data => {
  const isArray = isValid('array', data);
  const isString = isValid('string', data);
  if (!isArray && !isString) return true;

  const empty = data.length === 0;

  return empty;
};

const isEnabled = (data, time) => {
  if (isEmpty(data)) return false;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (hasProperty(item, 'timestamp') && hasProperty(item, 'clear')) {
      const {
        clear,
        timestamp,
      } = item;

      // Check if it was activated and did not ended
      if (isActive(time, timestamp, clear)) return true;

      // Check if we are searching over the present time value
      if (!isVisible(time, timestamp)) return false;
    } else {
      // Invalid item
      return false;
    }
  }

  return false;
};

const isContentVisible = (layout, swap) => {
  let visible;
  switch (layout) {
    case  CONTENT:
      visible = !swap;
      break;
    case MEDIA:
      visible = swap;
      break;
    default:
      visible = false;
  }

  return visible;
};

const isCurrent = (data, index, time) => {
  if (!hasIndex(index, data)) return false;

  const item = data[index];
  if (!hasProperty(item, 'timestamp')) return false;

  let current = false;
  if (isVisible(time, item.timestamp)) {
    if (index + 1 < data.length) {
      const next = data[index + 1];
      if (hasProperty(next, 'timestamp')) {
        current = !isVisible(time, next.timestamp);
      }
    } else {
      current = true;
    }
  }

  return current;
};

const isValid = (type, data) => {
  let valid = false;

  switch (type) {
    case 'array':
      if (Array.isArray(data)) valid = true;
      break;
    case 'string':
      if (typeof data === type) valid = true;
      break;
    default:
      logger.debug('unhandled', type);
  }

  return valid;
};

const isVisible = (time, timestamp) => timestamp <= time;

const parseTimeToSeconds = time => {
  const patterns = [
    /^(\d+)h(\d+)m(\d+)s$/,
    /^(\d+)m(\d+)s$/,
    /^(\d+)s$/,
  ];

  for (let i = 0; i < patterns.length; i++) {
    if (time.match(patterns[i])) {
      const hours = time.match(/(\d+)h/);
      const minutes = time.match(/(\d+)m/);
      const seconds = time.match(/(\d+)s/);

      let timeToSeconds = 0;

      if (hours) {
        const h = parseInt(hours[1]);
        if (h >= 0) timeToSeconds += h * 3600;
      }

      if (minutes) {
        const m = parseInt(minutes[1]);
        if (m >= 0 && m < 60) {
          timeToSeconds += m * 60;
        } else {
          return null;
        }
      }

      if (seconds) {
        const s = parseInt(seconds[1]);
        if (s >= 0 && s < 60) {
          timeToSeconds += s;
        } else {
          return null;
        }
      }

      return timeToSeconds;
    }
  }

  return null;
};

const search = (text, data) => {
  const result = [];
  const { thumbnails } = data;

  const value = text.toLowerCase();
  thumbnails.forEach(thumbnail => {
    const {
      alt,
      timestamp,
    } = thumbnail;

    if (alt.toLowerCase().indexOf(value) !== -1) {
      result.push(timestamp);
    }
  });

  return result;
};

const wasCleared = (time, clear) => clear !== -1 && clear <= time;

export {
  CONTENT,
  DISABLED,
  MEDIA,
  LOCAL,
  PRESENTATION,
  SCREENSHARE,
  buildFileURL,
  getAvatarColor,
  getActiveContent,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getDraws,
  getFileName,
  getFileType,
  getLayout,
  getRecordId,
  getScrollTop,
  getSectionFromLayout,
  getSwapFromLayout,
  getTime,
  getTimestampAsMilliseconds,
  hasPresentation,
  hasProperty,
  isActive,
  isContentVisible,
  isEmpty,
  isEnabled,
  isValid,
  parseTimeToSeconds,
  search,
};
