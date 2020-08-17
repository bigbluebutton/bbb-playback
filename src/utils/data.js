import config from 'config';
import qs from 'qs';
import stringHash from 'string-hash';
import logger from './logger';

const LAYOUT = {
  CONTENT: 'content',
  DISABLED: 'disabled',
  MEDIA: 'media',
};

const LOCAL = process.env.REACT_APP_NO_ROUTER;

const ID = {
  ABOUT: 'about',
  ALTERNATES: 'alternates',
  CAPTIONS: 'captions',
  CHAT: 'chat',
  CURSOR: 'cursor',
  ERROR: 'error',
  LOADER: 'loader',
  METADATA: 'metadata',
  NOTES: 'notes',
  PANZOOMS: 'panzooms',
  PLAYER: 'player',
  PRESENTATION: 'presentation',
  SCREENSHARE: 'screenshare',
  SEARCH: 'search',
  SHAPES: 'shapes',
  TALKERS: 'talkers',
  THUMBNAILS: 'thumbnails',
  VIDEO: 'video',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three',
  'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen',
];

const buildFileURL = (recordId, file) => {
  if (LOCAL) return file;

  return `/presentation/${recordId}/${file}`;
};

const getAvatarStyle = name => {
  const index = stringHash(name) % NUMBERS.length;

  return `avatar-${NUMBERS[index]}`;
};

const getActiveContent = (screenshare, time) => {
  const {
    SCREENSHARE,
    PRESENTATION,
  } = ID;

  const content = isEnabled(screenshare, time) ? SCREENSHARE : PRESENTATION;

  return content;
};

const getControlFromLayout = layout => {
  const { DISABLED } = LAYOUT;
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

const getData = (data, id) => {
  const file = config.files.data[id];

  switch (id) {
    case ID.ALTERNATES:
    case ID.CAPTIONS:
    case ID.CHAT:
    case ID.CURSOR:
    case ID.NOTES:
    case ID.PANZOOMS:
    case ID.SCREENSHARE:
    case ID.TALKERS:
      if (!file || data[getFileName(file)] === null) {
        return [];
      }

      return data[getFileName(file)];
    case ID.METADATA:
      if (!file || data[getFileName(file)] === null) {
        logger.error('missing', id);
        return {};
      }

      return data[getFileName(file)];
    case ID.SHAPES:
      if (!file || data[getFileName(file)] === null) {
        return {
          canvases: [],
          slides: [],
          thumbnails: [],
        };
      }

      return data[getFileName(file)];
    default:
      logger.debug('unhandled', id);
      return [];
  }
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
  const {
    CONTENT,
    MEDIA,
  } = LAYOUT;

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
  const {
    CONTENT,
    MEDIA,
  } = LAYOUT;

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

const getScrollLeft = (firstNode, currentNode, align) => {
  if (!currentNode) return 0;

  const {
    clientWidth,
    offsetLeft,
    parentNode,
  } = currentNode;

  if (!firstNode || !parentNode) return 0;

  const spacing = firstNode.offsetLeft;
  const parentWidth = parentNode.clientWidth;

  let horizontalOffset = 0;
  switch (align) {
    case 'left':
      horizontalOffset = offsetLeft - spacing;
      break;
    case 'center':
      horizontalOffset = parseInt(offsetLeft + (clientWidth - spacing - parentWidth) / 2, 10);
      break;
    case 'right':
      horizontalOffset = offsetLeft + clientWidth - parentWidth;
      break;
    default:
      logger.debug('unhandled', align);
  }

  return horizontalOffset;
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
    case 'middle':
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

const getStyle = () => {
  const params = new URLSearchParams(window.location.search);
  const { styles } = config;
  const { url } = styles;

  let style = styles.default ? `${url}/${styles.default}.css` : null;
  if (params && params.has('s')) {
    const { valid } = styles;
    const value = params.get('s');
    if (valid.includes(value)) {
      style = `${url}/${value}.css`;
    }
  }

  return style;
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

const isContentVisible = (layout, swap) => {
  const {
    CONTENT,
    MEDIA,
  } = LAYOUT;

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

const isEqual = (first, second, type) => {
  let equal = false;

  switch (type) {
    case 'array':
      if (first.length === second.length) {
        equal = first.every((value, index) => value === second[index])
      }

      return equal;
    default:
      return equal;
  }
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
  if (player.video) {
    const min = 0;
    const max = player.video.duration();
    const time = player.video.currentTime() + seconds;

    if (time < min) {
      player.video.currentTime(min);
    } else if (time > max) {
      player.video.currentTime(max);
    } else {
      player.video.currentTime(time);
    }
  }
};

const skip = (player, data, change) => {
  const min = 0;
  const max = data.length - 1;
  const time = player.video.currentTime();

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
    player.video.currentTime(timestamp);
  }
};

const wasCleared = (time, clear) => clear !== -1 && clear <= time;

export {
  LAYOUT,
  LOCAL,
  ID,
  buildFileURL,
  getAvatarStyle,
  getActiveContent,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getData,
  getDraws,
  getFileName,
  getFileType,
  getLayout,
  getRecordId,
  getScrollLeft,
  getScrollTop,
  getSectionFromLayout,
  getSwapFromLayout,
  getStyle,
  getTime,
  getTimestampAsMilliseconds,
  hasPresentation,
  hasProperty,
  isActive,
  isContentVisible,
  isEmpty,
  isEnabled,
  isEqual,
  isValid,
  parseTimeToSeconds,
  search,
  seek,
  skip,
};
