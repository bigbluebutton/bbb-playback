import config from 'config';
import {
  hasIndex,
  hasPresentation,
  hasProperty,
  isCurrent,
  isDefined,
  isEmpty,
  isEnabled,
  isVisible,
  wasCleared,
} from './validators';
import {
  ID,
  LAYOUT,
  MEDIA_ROOT_URL,
  NUMBERS,
  ROUTER,
} from 'utils/constants';
import hash from 'utils/hash';
import logger from 'utils/logger';
import { getMediaPath } from 'utils/params';

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
  const questions = getData(data, ID.QUESTIONS);
  const externalVideos = getData(data, ID.EXTERNAL_VIDEOS);
  const screenshare = getData(data, ID.SCREENSHARE);
  const shapes = getData(data, ID.SHAPES);
  const slides = shapes.slides;

  const content = {
    captions: !isEmpty(captions),
    chat: !isEmpty(chat),
    notes: !isEmpty(notes),
    polls: !isEmpty(polls),
    questions: !isEmpty(questions),
    externalVideos: !isEmpty(externalVideos),
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
    case ID.QUESTIONS:
    case ID.EXTERNAL_VIDEOS:
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

const getLoadedData = data => {
  const captions = getData(data, ID.CAPTIONS);
  const chat = getData(data, ID.CHAT);
  const notes = getData(data, ID.NOTES);
  const polls = getData(data, ID.POLLS);
  const externalVideos = getData(data, ID.EXTERNAL_VIDEOS);
  const screenshare = getData(data, ID.SCREENSHARE);
  const shapes = getData(data, ID.SHAPES);

  const loadedData = {
    captions: isDefined(captions),
    chat: isDefined(chat),
    notes: isDefined(notes),
    polls: isDefined(polls),
    externalVideos: isDefined(externalVideos),
    presentation: isDefined(shapes),
    screenshare: isDefined(screenshare),
  };

  return loadedData;
};

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

const getMessageType = (item) => {
  if (typeof item.message === 'string') return ID.USERS;
  if (typeof item.question === 'string') return ID.POLLS;
  if (typeof item.text === 'string') return ID.QUESTIONS;
  if (typeof item.url === 'string') return ID.EXTERNAL_VIDEOS;

  return 'undefined';
};

const getTimestampAsMilliseconds = timestamp => timestamp * 1000;

export {
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
  getLoadedData,
  getMessageType,
  getPercentage,
  getPollLabel,
  getSectionFromLayout,
  getSwapFromLayout,
  getTimestampAsMilliseconds,
};
