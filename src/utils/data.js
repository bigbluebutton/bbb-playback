import config from 'config';
import stringHash from 'string-hash';

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

const getFileType = file => config.files.type[file.split('.').pop()];

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

const getAvatarColor = name => {
  const {
    avatar,
    inactive,
  } = config.colors;

  if (name) {
    return avatar[stringHash(name) % avatar.length];
  } else {
    return inactive;
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
  getAvatarColor,
  getCurrentDataIndex,
  getFileName,
  getFileType,
  getRecordId,
  getScrollTop,
  getTimeAsString,
  isActive,
  isEnabled,
};
