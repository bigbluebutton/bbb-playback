import { styles } from 'config';
import { ROUTER } from './constants';
import logger from './logger';

const getFrequency = () => {
  const param = getSearchParam('f');

  if (param) return parseFloat(param);

  return null;
};

const getLayout = () => {
  const param = getSearchParam('l');

  if (param) return param;

  return null;
};

const getMediaPath = () => {
  const param = getSearchParam('p');

  let mediaPath = '';
  if (param) mediaPath = param;

  return mediaPath;
};

const getSearchParam = (name) => {
  const params = new URLSearchParams(window.location.search);

  if (params && params.has(name)) {
    const param = params.get(name);

    return param;
  }

  return null;
};

const getStyle = () => {
  const param = getSearchParam('s');
  const { url } = styles;

  let style = styles.default ? `${url}/${styles.default}.css` : null;
  if (param) {
    const { valid } = styles;
    if (valid.includes(param)) {
      style = `${url}/${param}.css`;
    }
  }

  return style;
};

const getTime = () => {
  const param = getSearchParam('t');

  if (param) return parseTimeToSeconds(param);

  return null;
};

const parseRecordId = params => {
  if (!ROUTER) return 'local';

  if (params) {
    const { recordId } = params;
    if (recordId) {
      const regex = /^[a-z0-9]{40}-[0-9]{13}$/;

      if (recordId.match(regex)) return recordId;
    }
  }

  logger.error('missing', 'recordId');

  return null;
};

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
  getFrequency,
  getLayout,
  getMediaPath,
  getStyle,
  getSearchParam,
  getTime,
  parseRecordId,
  parseTimeToSeconds,
};
