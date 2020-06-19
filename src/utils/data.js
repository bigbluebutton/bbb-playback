import config from 'config';
import qs from 'qs';
import stringHash from 'string-hash';

const MEDIA = 'media';
const CONTENT = 'content';

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

const getCurrentDataActive = (data, time) => {
  let actives = [];

  if (data) {
    for (let i = 0; i < data.length; i++) {
      const {
        clear,
        timestamp,
      } = data[i];
      actives[i] = isActive(time, timestamp, clear);
    }
  }

  return {
    actives,
  }
};

const getFileName = file => file.split('.').shift();

const getFileType = file => config.files.type[file.split('.').pop()];

const getLayout = location => {
  if (location) {
    const { search } = location;
    if (search) {
      const { layout } = qs.parse(search, { ignoreQueryPrefix: true });

      if (layout)  return layout;
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
      if (recordId.match(regex)) {

        return recordId;
      }
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

const getAvatarColor = name => {
  const { avatar } = config.colors;

  return avatar[stringHash(name) % avatar.length];
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

const getTimestampAsMilliseconds = timestamp => timestamp * 1000;

const isActive = (time, timestamp, clear = -1) => {
  const cleared = clear !== -1 && clear <= time;
  const visible = timestamp <= time;

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

export {
  getAvatarColor,
  getCurrentDataIndex,
  getCurrentDataActive,
  getFileName,
  getFileType,
  getLayout,
  getRecordId,
  getScrollTop,
  getSectionFromLayout,
  getSwapFromLayout,
  getTimestampAsMilliseconds,
  isActive,
  isEnabled,
};
