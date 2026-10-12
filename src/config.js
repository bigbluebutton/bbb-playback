const captions = {
  // Offer the recording captions in other languages, translated on demand,
  // by the first of these that handles the language: Chrome's built-in
  // on-device translator, the LibreTranslate server at `url` (optional, see
  // translate/), and open models run in the viewer's browser (`local`)
  translate: {
    enabled: true,
    key: null,
    // Start downloading the viewer's language pack on their first click
    preload: true,
    languages: ['ar', 'de', 'en', 'es', 'fa', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr', 'uk', 'ur', 'zh'],
    url: '/playback/translate',
    // Works in every browser with nothing to install. Models download once
    // from `models` (about 110 MB per language, cached by the browser)
    local: {
      enabled: true,
      library: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
      models: 'https://huggingface.co/',
    },
  },
};

const chat = {
  align: 'bottom',
  scroll: true,
};

const controls = {
  about: true,
  fullscreen: true,
  search: true,
  section: true,
  share: true,
  swap: true,
  theme: true,
};

const date = { enabled: true };

const files = {
  alternates: 'presentation_text.json',
  captions: 'captions.json',
  chat: 'slides_new.xml',
  cursor: 'cursor.xml',
  metadata: 'metadata.xml',
  notes: 'notes.html',
  panzooms: 'panzooms.xml',
  polls: 'polls.json',
  screenshare: 'deskshare.xml',
  shapes: 'shapes.svg',
  tldraw: 'tldraw.json',
  videos: 'external_videos.json',
  layout: 'layout.xml',
};

const locale = { default: 'en' };

const medias = [
  'mp4',
  'webm',
];

const player = {
  rps: 10,
  rates: [0.5, 1, 1.25, 1.5, 1.75, 2],
};

const search = {
  length: {
    min: 3,
    max: 32,
  },
};

const shortcuts = {
  enabled: true,
  // Single key controls: Space/K, J/L, arrows, F and M
  plain: true,
  fullscreen: 'K',
  play: 'Enter',
  section: 'L',
  seek: {
    backward: 'ArrowLeft',
    forward: 'ArrowRight',
    seconds: 15,
  },
  skip: {
    next: 'ArrowUp',
    previous: 'ArrowDown',
  },
  swap: 'M',
};

const styles = {
  default: null,
  url: 'HOST',
  valid: [],
};

const thumbnails = {
  align: 'center',
  scroll: true,
};

export {
  captions,
  chat,
  controls,
  date,
  files,
  locale,
  medias,
  player,
  search,
  shortcuts,
  styles,
  thumbnails,
};
