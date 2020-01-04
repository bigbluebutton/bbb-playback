
const METADATA = 'metadata.xml';
const SHAPES = 'shapes.svg';
const PANZOOMS = 'panzooms.xml';
const CURSOR = 'cursor.xml';
const ALTERNATES = 'presentation_text.json';
const CHAT = 'slides_new.xml';
const SCREENSHARE = 'deskshare.xml';
const CAPTIONS = 'captions.json';

const FILES = [
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  ALTERNATES,
  CHAT,
  SCREENSHARE,
  CAPTIONS
];

const MEDIAS = [
  'webm',
  'mp4'
];

const TYPE = {
  xml: 'text',
  svg: 'text',
  json: 'json'
};

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
  GONE: 410
};

const getType = filename => TYPE[filename.split('.').pop()];

const getFile = filename => filename.split('.').shift();

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
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  ALTERNATES,
  CHAT,
  SCREENSHARE,
  CAPTIONS,
  FILES,
  MEDIAS,
  ERROR,
  getType,
  getFile,
  getRecordId
};
