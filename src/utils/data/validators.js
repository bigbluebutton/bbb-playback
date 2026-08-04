import { LAYOUT } from 'utils/constants';
import logger from 'utils/logger';

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
  if (object && Object.hasOwn(object, property)) {
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
    case CONTENT:
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

const isDefined = data => typeof data !== 'undefined';

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

const isEqual = (first, second, type = 'array') => {
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

const wasCleared = (time, clear) => clear !== -1 && clear <= time;

function getMostRecentEvent(arr, time, property) {
  return arr
    // Object.hasOwn instead of hasProperty: a missing property is expected here.
    // It is how we skip events that did not change this property.
    .filter(item => item.timestamp <= time && (!property || Object.hasOwn(item, property)))
    .reduce(
      (prev, curr) => (prev?.timestamp > curr.timestamp ? prev : curr),
      null
    );
}

// Most recent layout event at or before time. A property filter restricts the
// search to events that set that property, so each layout property resolves from
// its own last change.
const getLayoutEvent = (data, time, property) => {
  if (isEmpty(data)) return null;

  return getMostRecentEvent(data, time, property);
}

// Resolves which content areas the layout should show at a given time, from the
// layout.xml events (layoutSwap) and the deskshare.xml events (screenshare).
//
// layout.xml only exists in recordings processed by BigBlueButton 3.0.2 and later,
// and before 3.0.27 its events carry show_screenshare only, so a property can have
// no event at a given time. Fall back to the behavior those recordings were played
// back with: the presentation is visible, and the screenshare is the content while
// it is being shared.
const getLayoutSwap = (layoutSwap, screenshare, time) => {
  const presentationEvent = getLayoutEvent(layoutSwap, time, 'showPresentation');
  const screenshareEvent = getLayoutEvent(layoutSwap, time, 'showScreenshare');

  return {
    showPresentation: presentationEvent?.showPresentation ?? true,
    showScreenshare: screenshareEvent?.showScreenshare ?? isEnabled(screenshare, time),
  };
};

export {
  hasIndex,
  hasPresentation,
  hasProperty,
  isActive,
  isContentVisible,
  isCurrent,
  isDefined,
  isEmpty,
  isEnabled,
  isEqual,
  isValid,
  isVisible,
  wasCleared,
  getLayoutEvent,
  getLayoutSwap,
};
