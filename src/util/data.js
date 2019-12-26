
const METADATA = 'metadata.xml';
const SHAPES = 'shapes.svg';
const PANZOOMS = 'panzooms.xml';
const CURSOR = 'cursor.xml';
const TEXT = 'presentation_text.json';
const CHAT = 'slides_new.xml';
const SCREENSHARE = 'deskshare.xml';
const CAPTIONS = 'captions.json';

const FILES = [
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  TEXT,
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

const getType = filename => TYPE[filename.split('.').pop()];

export default {
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  TEXT,
  CHAT,
  SCREENSHARE,
  CAPTIONS,
  MEDIAS,
  getType
};
