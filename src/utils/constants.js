const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;
const MEDIA_ROOT_URL = process.env.REACT_APP_MEDIA_ROOT_URL;
const NO_ROUTER = process.env.REACT_APP_NO_ROUTER;

const ID = {
  ABOUT: 'about',
  ALTERNATES: 'alternates',
  CAPTIONS: 'captions',
  CHAT: 'chat',
  CURSOR: 'cursor',
  DESKSHARE: 'deskshare',
  ERROR: 'error',
  LEFT: 'left',
  LOADER: 'loader',
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
  SWAP: 'swap',
  THUMBNAILS: 'thumbnails',
  TOP: 'top',
  USERS: 'users',
  VIDEO: 'video',
};

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
  ID,
  LAYOUT,
  MEDIA_ROOT_URL,
  NUMBERS,
  ROUTER,
  SHAPES,
};
