
const ALTERNATES = 'presentation_text.json';
const CAPTIONS = 'captions.json';
const CHAT = 'slides_new.xml';
const CURSOR = 'cursor.xml';
const METADATA = 'metadata.xml';
const PANZOOMS = 'panzooms.xml';
const SCREENSHARE = 'deskshare.xml';
const SHAPES = 'shapes.svg';

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

const getCurrentDataIndex = (data, time) => {
  if (data.length === 0) return null;

  let index = 0;
  let lastIndex = index;
  while (index < data.length && data[index].timestamp < time) {
    lastIndex = index;
    index++;
  }

  return lastIndex;
};

const getFileIndex = filename => filename.split('.').shift();

const getFileType = filename => TYPE[filename.split('.').pop()];

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

export {
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
  getFileIndex,
  getFileType,
  getRecordId,
};
