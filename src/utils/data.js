import stringHash from 'string-hash';

const AUTO_SCROLL = true;

const ALTERNATES = 'presentation_text.json';
const CAPTIONS = 'captions.json';
const CHAT = 'slides_new.xml';
const CURSOR = 'cursor.xml';
const METADATA = 'metadata.xml';
const PANZOOMS = 'panzooms.xml';
const SCREENSHARE = 'deskshare.xml';
const SHAPES = 'shapes.svg';

const COLORS = [
  '#7b1fa2', '#6a1b9a', '#4a148c', '#5e35b1',
  '#512da8', '#4527a0', '#311b92', '#3949ab',
  '#303f9f', '#283593', '#1a237e', '#1976d2',
  '#1565c0', '#0d47a1', '#0277bd', '#01579b',
];

const INACTIVE = '#a7b3bd';

const ERROR = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
};

const FILES = [
  ALTERNATES,
  CAPTIONS,
  CHAT,
  CURSOR,
  METADATA,
  PANZOOMS,
  SCREENSHARE,
  SHAPES,
];

const MEDIAS = [
  'mp4',
  'webm',
];

const TYPE = {
  json: 'json',
  svg: 'text',
  xml: 'text',
};

const isEnabled = (data, time) => {
  const array = Array.isArray(data);
  if (!array) return false;

  const empty = data.length === 0;
  if (empty) return false;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (item.hasOwnProperty('timestamp') && item.hasOwnProperty('clear')) {
      // Check if it was activated and did not ended
      if (isActive(time, item.timestamp, item.clear)) {
        return true;
      }

      // Check if we are searching over the present time value
      if (!isActive(time, item.timestamp)) {
        return false;
      }
    } else {
      // Invalid item
      return false;
    }
  }

  return false;
};

const getCurrentDataIndex = (data, time) => {
  const array = Array.isArray(data);
  if (!array) return -1;

  const empty = data.length === 0;
  if (empty) return -1;

  let currentDataIndex = -1;
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (item.hasOwnProperty('timestamp')) {
      if (isActive(time, item.timestamp)) {
        currentDataIndex = index;
      } else {
        // Timestamp has gone further the current time
        break;
      }
    } else {
      // Invalid item
      return -1;
    }
  }

  return currentDataIndex;
};

const getFileName = file => file.split('.').shift();

const getFileType = file => TYPE[file.split('.').pop()];

const getRecordId = match => {
  if (match) {
    const { params } = match;
    if (params && params.recordId) {
      const { recordId } = params;
      const regex = /^[a-z0-9]{40}-[0-9]{13}$/;
      if (recordId.match(regex)) {

        return recordId;
      }
    }
  }

  return null;
};

const getUserColor = name => {
  if (name) {
    return COLORS[stringHash(name) % COLORS.length];
  } else {
    return INACTIVE;
  }
};

const getTimeAsString = seconds => {
  let sec = parseInt(seconds, 10);

  if (sec < 0) return null;

  let hr = Math.floor(sec / 3600);
  let min = Math.floor((sec - (hr * 3600)) / 60);
  sec = sec - (hr * 3600) - (min * 60);

  if (hr < 10) hr = `0${hr}`;
  if (min < 10) min = `0${min}`;
  if (sec < 10) sec = `0${sec}`;

  return `${hr}:${min}:${sec}`;
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
  }

  return verticalOffset;
};

const isActive = (time, timestamp, clear = -1) => {
  const cleared = clear !== -1 && clear <= time;
  const visible = timestamp <= time;

  return visible && !cleared;
};

export {
  AUTO_SCROLL,
  ALTERNATES,
  CAPTIONS,
  CHAT,
  CURSOR,
  ERROR,
  FILES,
  MEDIAS,
  METADATA,
  PANZOOMS,
  SCREENSHARE,
  SHAPES,
  getCurrentDataIndex,
  getFileName,
  getFileType,
  getRecordId,
  getScrollTop,
  getTimeAsString,
  getUserColor,
  isActive,
  isEnabled,
};
