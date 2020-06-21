import config from 'config';
import qs from 'qs';
import stringHash from 'string-hash';

const MEDIA = 'media';
const CONTENT = 'content';

const getAvatarColor = name => {
  const { avatar } = config.colors;

  return avatar[stringHash(name) % avatar.length];
};

const getCurrentDataIndex = (data, time) => {
  const array = Array.isArray(data);
  if (!array) return -1;

  const empty = data.length === 0;
  if (empty) return -1;

  // TODO: This could use a better search algorithm
  let currentDataIndex = -1;
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (item.hasOwnProperty('timestamp')) {
      const { timestamp } = item;
      if (isVisible(time, timestamp)) {
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

const getCurrentDataInterval = (data, time) => {
  const currentDataInterval = [];

  if (!data) return currentDataInterval;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (item.hasOwnProperty('timestamp') && item.hasOwnProperty('clear')) {
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
  if (match) {
    const { params } = match;
    if (params && params.recordId) {
      const { recordId } = params;
      const regex = /^[a-z0-9]{40}-[0-9]{13}$/;

      if (recordId.match(regex)) return recordId;
    }
  }

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

const isActive = (time, timestamp, clear = -1) => {
  const cleared = wasCleared(time, clear);
  const visible = isVisible(time, timestamp);

  return visible && !cleared;
};

const isEnabled = (data, time) => {
  const array = Array.isArray(data);
  if (!array) return false;

  const empty = data.length === 0;
  if (empty) return false;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    if (item.hasOwnProperty('timestamp') && item.hasOwnProperty('clear')) {
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

const isVisible = (time, timestamp) => timestamp <= time;

const wasCleared = (time, clear) => clear !== -1 && clear <= time;

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

export {
  getAvatarColor,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getFileName,
  getFileType,
  getLayout,
  getRecordId,
  getScrollTop,
  getSectionFromLayout,
  getSwapFromLayout,
  getTime,
  getTimestampAsMilliseconds,
  isActive,
  isEnabled,
  parseTimeToSeconds,
};
