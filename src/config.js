const chat = {
  align: 'bottom',
  scroll: true,
};

const controls = {
  about: true,
  fullscreen: true,
  search: true,
  section: true,
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
  videos: 'external_videos.json',
};

const locale = { default: 'en' };

const medias = [
  'mp4',
  'webm',
]

const player = {
  rps: 10,
  rates: [ 0.5, 1, 1.25, 1.5, 1.75, 2 ],
};

const search = {
  length: {
    min: 3,
    max: 32,
  },
};

const shortcuts = {
  enabled: true,
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
