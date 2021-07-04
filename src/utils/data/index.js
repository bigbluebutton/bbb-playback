import config from 'config';
import {
  hasIndex,
  hasPresentation,
  hasProperty,
  isCurrent,
  isEmpty,
  isEnabled,
  isVisible,
  wasCleared,
} from './validators';
import hash from 'utils/hash';
import logger from 'utils/logger';
import { getMediaPath } from 'utils/params';

const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;

const ID = {
  ABOUT: 'about',
  ALTERNATES: 'alternates',
  CAPTIONS: 'captions',
  CHAT: 'chat',
  CURSOR: 'cursor',
  DESKSHARE: 'deskshare',
  ERROR: 'error',
  LEFT: 'left',
  LOADER: 'loader',
  METADATA: 'metadata',
  NOTES: 'notes',
  PANZOOMS: 'panzooms',
  PLAYER: 'player',
  POLLS: 'polls',
  PRESENTATION: 'presentation',
  SCREENSHARE: 'screenshare',
  SEARCH: 'search',
  SETTINGS: 'settings',
  SHAPES: 'shapes',
  SWAP: 'swap',
  THUMBNAILS: 'thumbnails',
  TOP: 'top',
  USERS: 'users',
  VIDEO: 'video',
};

const LAYOUT = {
  CONTENT: 'content',
  DISABLED: 'disabled',
  MEDIA: 'media',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three',
  'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen',
];

const SHAPES = {
  CIRCLE: 'circle',
  LINE: 'line',
  PATH: 'path',
  POLL: 'poll',
  POLYGON: 'polygon',
  POLYLINE: 'polyline',
  TEXT: 'text',
};

const getRouter = () => {
  if (typeof process.env.REACT_APP_NO_ROUTER !== 'undefined') {
    if (process.env.REACT_APP_NO_ROUTER) return false;
  }

  return true;
};

const ROUTER = getRouter();

const MEDIA_ROOT_URL = process.env.REACT_APP_MEDIA_ROOT_URL;

const buildFileURL = (recordId, file) => {
  if (!ROUTER) return file;

  const mediaPath = getMediaPath();

  const rootUrl = MEDIA_ROOT_URL ? MEDIA_ROOT_URL : '/presentation';

  let fileUrl = `${recordId}/${file}`;
  if (mediaPath) fileUrl = `${mediaPath}/${fileUrl}`;

  return `${rootUrl}/${fileUrl}`;
};

const getAvatarStyle = name => {
  const index = hash(name) % NUMBERS.length;

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

const FULL_BLOCK = '█';
const LEFT_HALF_BLOCK = '▌';
const RIGHT_HALF_BLOCK = '▐';
const EMPTY_BLOCK = '-';

const getBar = (percentage) => {
  const p = parseInt(percentage);

  let bar;
  if (p === 0) {
    bar = EMPTY_BLOCK;
  } else {
    const full = p / 10;
    const half = (p % 10) > 2;

    bar = FULL_BLOCK.repeat(full);

    if (half) {
      // Add true fallback for the tests
      const ltr = document.dir ? document.dir === 'ltr' : true;
      bar = bar.concat(ltr ? LEFT_HALF_BLOCK : RIGHT_HALF_BLOCK);
    }
  }

  return bar;
};

const getContentFromData = data => {
  const captions = getData(data, ID.CAPTIONS);
  const chat = getData(data, ID.CHAT);
  const notes = getData(data, ID.NOTES);
  const polls = getData(data, ID.POLLS);
  const screenshare = getData(data, ID.SCREENSHARE);
  const shapes = getData(data, ID.SHAPES);
  const slides = shapes.slides;

  const content = {
    captions: !isEmpty(captions),
    chat: !isEmpty(chat),
    notes: !isEmpty(notes),
    polls: !isEmpty(polls),
    presentation: hasPresentation(slides),
    screenshare: !isEmpty(screenshare),
  };

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
    case ID.POLLS:
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

const getFileType = file => file.split('.').pop();

const getPercentage = (value, total) => {
  if (total === 0) return 0;

  return ((value / total) * 100).toFixed(1);
};

const POLL_TYPES = {
  YN: 'YN',
  YNA: 'YNA',
  TF: 'TF',
};

const POLL_KEYS = [
  'Yes',
  'No',
  'Abstention',
  'True',
  'False',
];

const getPollLabel = (key, type) => {
  if (!POLL_TYPES[type]) return null;

  if (!POLL_KEYS.includes(key)) return null;

  return key.toLowerCase();
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

  const ltr = document.dir === 'ltr';
  const spacing = ltr ? firstNode.offsetLeft : 0;
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

const getMessageType = (item) => {
  if (typeof item.message === 'string') return ID.USERS;
  if (typeof item.question === 'string') return ID.POLLS;

  return 'undefined';
};

const getTimestampAsMilliseconds = timestamp => timestamp * 1000;

const handleOnEnterPress = (event, action) => {
  if (event && event.key === 'Enter') {
    if (typeof action === 'function') action();
  }
};

const handleAutoScroll = (fNode, cNode, direction, align) => {
  // Auto-scroll can start after getting the first and current nodes
  if (fNode && cNode) {
    const { parentNode: pNode } = cNode;

    switch (direction) {
      case ID.LEFT:
        pNode.scrollLeft = getScrollLeft(fNode, cNode, align);
        break;
      case ID.TOP:
        pNode.scrollTop = getScrollTop(fNode, cNode, align);
        break;
      default:
        logger.debug('unhandled', direction);
    }
  }
};

export {
  BUILD,
  ID,
  LAYOUT,
  ROUTER,
  SHAPES,
  buildFileURL,
  getAvatarStyle,
  getActiveContent,
  getBar,
  getContentFromData,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getData,
  getDraws,
  getFileName,
  getFileType,
  getMessageType,
  getPercentage,
  getPollLabel,
  getScrollLeft,
  getScrollTop,
  getSectionFromLayout,
  getSwapFromLayout,
  getTimestampAsMilliseconds,
  handleAutoScroll,
  handleOnEnterPress,
};
