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

const EVENT_PREFIX = 'bbbplayback';

const EVENTS = {
  TIME_UPDATE: `${EVENT_PREFIX}timeupdate`,
};

const ID = {
  ABOUT: 'about',
  ALTERNATES: 'alternates',
  CANVASES: 'canvases',
  CAPTIONS: 'captions',
  CHAT: 'chat',
  CURSOR: 'cursor',
  DESKSHARE: 'deskshare',
  ERROR: 'error',
  LOADER: 'loader',
  MEDIA: 'media',
  MESSAGES: 'messages',
  METADATA: 'metadata',
  NOTES: 'notes',
  PANZOOMS: 'panzooms',
  PLAYER: 'player',
  POLLS: 'polls',
  PRESENTATION: 'presentation',
  SCREENSHARE: 'screenshare',
  SEARCH: 'search',
  SETTINGS: 'settings',
  SHAPES: 'shapes',
  SLIDES: 'slides',
  STORAGE: 'storage',
  SWAP: 'swap',
  THUMBNAILS: 'thumbnails',
  USERS: 'users',
  VIDEOS: 'videos',
  WEBCAMS: 'webcams',
};

const CONTENT = [
  ID.PRESENTATION,
  ID.CHAT,
  ID.POLLS,
  ID.VIDEOS,
  ID.NOTES,
  ID.SCREENSHARE,
  ID.CAPTIONS,
];

const LAYOUT = {
  CONTENT: 'content',
  DISABLED: 'disabled',
  MEDIA: 'media',
  SWAPPED: 'swapped',
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

const ROLES = {
  MODERATOR: 'MODERATOR',
  VIEWER: 'VIEWER',
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

const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
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
  EVENTS,
  ID,
  LAYOUT,
  MEDIA_ROOT_URL,
  NUMBERS,
  POSITIONS,
  ROLES,
  ROUTER,
  SHAPES,
  THEME,
};
