const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;
const MEDIA_ROOT_URL = process.env.REACT_APP_MEDIA_ROOT_URL;
const NO_ROUTER = process.env.REACT_APP_NO_ROUTER;

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

const ID = {
  ABOUT: 'about',
  ALTERNATES: 'alternates',
  CAPTIONS: 'captions',
  CHAT: 'chat',
  CURSOR: 'cursor',
  DESKSHARE: 'deskshare',
  ERROR: 'error',
  LOADER: 'loader',
  METADATA: 'metadata',
  NOTES: 'notes',
  PANZOOMS: 'panzooms',
  PLAYER: 'player',
  POLLS: 'polls',
  EXTERNAL_VIDEOS: 'externalVideos',
  PRESENTATION: 'presentation',
  QUESTIONS: 'questions',
  SCREENSHARE: 'screenshare',
  SEARCH: 'search',
  SETTINGS: 'settings',
  SHAPES: 'shapes',
  SWAP: 'swap',
  THUMBNAILS: 'thumbnails',
  USERS: 'users',
  VIDEO: 'video',
};

const CONTENT = [
  ID.PRESENTATION,
  ID.CHAT,
  ID.POLLS,
  ID.QUESTIONS,
  ID.EXTERNAL_VIDEOS,
  ID.NOTES,
  ID.SCREENSHARE,
  ID.CAPTIONS,
];

const LAYOUT = {
  CONTENT: 'content',
  DISABLED: 'disabled',
  MEDIA: 'media',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three',
  'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen',
];

const POSITIONS = {
  BOTTOM: 'bottom',
  CENTER: 'center',
  LEFT: 'left',
  MIDDLE: 'middle',
  RIGHT: 'right',
  TOP: 'top',
};

const SHAPES = {
  CIRCLE: 'circle',
  LINE: 'line',
  PATH: 'path',
  POLL: 'poll',
  POLYGON: 'polygon',
  POLYLINE: 'polyline',
  TEXT: 'text',
};

const getRouter = () => {
  if (typeof NO_ROUTER !== 'undefined') {
    if (NO_ROUTER) return false;
  }

  return true;
};

const ROUTER = getRouter();

export {
  BUILD,
  CONTENT,
  ERROR,
  ID,
  LAYOUT,
  MEDIA_ROOT_URL,
  NUMBERS,
  POSITIONS,
  ROUTER,
  SHAPES,
};
