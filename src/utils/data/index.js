import {
  ID,
  MEDIA_ROOT_URL,
  NUMBERS,
  ROUTER,
} from 'utils/constants';
import storage from 'utils/data/storage';
import {
  hasProperty,
  isCurrent,
  isEmpty,
  isEnabled,
  isVisible,
  wasCleared,
} from 'utils/data/validators';
import hash from 'utils/hash';
import { getMediaPath } from 'utils/params';

const buildFileURL = (file, recordId = null) => {
  if (!ROUTER) return file;

  const mediaPath = getMediaPath();

  const rootUrl = MEDIA_ROOT_URL ? MEDIA_ROOT_URL : '/presentation';

  const id = recordId ? recordId : storage.metadata.id;
  let fileUrl = `${id}/${file}`;
  if (mediaPath) fileUrl = `${mediaPath}/${fileUrl}`;

  return `${rootUrl}/${fileUrl}`;
};

const getAvatarStyle = name => {
  const index = hash(name) % NUMBERS.length;

  return `avatar-${NUMBERS[index]}`;
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

const getCurrentContent = (time) => {
  const {
    SCREENSHARE,
    PRESENTATION,
  } = ID;

  const content = isEnabled(storage.screenshare, time) ? SCREENSHARE : PRESENTATION;

  return content;
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

const getMessageType = (item) => {
  if (typeof item.message === 'string') return ID.USERS;
  if (typeof item.question === 'string') return ID.POLLS;
  if (typeof item.url === 'string') return ID.VIDEOS;

  return 'undefined';
};

const getTimestampAsMilliseconds = timestamp => timestamp * 1000;

export {
  buildFileURL,
  getAvatarStyle,
  getBar,
  getCurrentContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getFileType,
  getMessageType,
  getPercentage,
  getPollLabel,
  getTimestampAsMilliseconds,
};
