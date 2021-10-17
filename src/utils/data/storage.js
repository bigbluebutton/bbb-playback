import {
  files,
  medias,
} from 'config';
import {
  addAlternatesToThumbnails,
  build,
  mergeMessages,
} from 'utils/builder';
import {
  ERROR,
  ID,
} from 'utils/constants';
import {
  buildFileURL,
  getFileType,
} from 'utils/data';
import {
  hasPresentation,
  hasProperty,
  isEmpty,
} from 'utils/data/validators';
import logger from 'utils/logger';

const STATE = {
  WAITING: 'waiting',
  LOADING: 'loading',
  LOADED: 'loaded',
};

let STATUS = STATE.WAITING;

const DATA = {};

let FALLBACK = false;

const hasFetched = () => {
  if (STATUS !== STATE.WAITING) return true;

  logger.debug(ID.STORAGE, STATE.LOADING);
  STATUS = STATE.LOADING;

  return false;
}

const hasLoaded = () => {
  const stored = Object.keys(DATA).length;
  const data = Object.keys(files).length;

  if (stored > data) {
    logger.debug(ID.STORAGE, STATE.LOADED);
    STATUS = STATE.LOADED;

    return true;
  }

  return false;
};

const fetchFile = (data, recordId, onUpdate, onLoaded, onError) => {
  const file = files[data];
  const url = buildFileURL(file, recordId);
  fetch(url).then(response => {
    if (response.ok) {
      logger.debug(ID.STORAGE, file, response);
      const fileType = getFileType(file);
      switch (fileType) {
        case 'json':
          return response.json();
        case 'html':
          return response.text();
        case 'svg':
          return response.text();
        case 'xml':
          return response.text();
        default:
          onError(ERROR.BAD_REQUEST);
          return null;
      }
    } else {
      logger.warn(ID.STORAGE, file, response);
      return null;
    }
  }).then(value => {
    build(file, value).then(content => {
      if (content) logger.debug(ID.STORAGE, 'builded', file);
      DATA[data] = content;
      onUpdate(data);
      if (hasLoaded()) onLoaded();
    }).catch(error => onError(ERROR.BAD_REQUEST));
  }).catch(error => onError(ERROR.NOT_FOUND));
};

const fetchMedia = (recordId, onUpdate, onLoaded, onError) => {
  const fetches = medias.map(type => {
    const url = buildFileURL(`video/webcams.${type}`, recordId);
    return fetch(url, { method: 'HEAD' });
  });

  Promise.all(fetches).then(responses => {
    const media = [];
    responses.forEach(response => {
      const { ok, url } = response;
      if (ok) {
        logger.debug(ID.STORAGE, ID.MEDIA, response);
        media.push(medias.find(type => url.endsWith(type)));
      }
    });

    if (media.length > 0) {
      DATA[ID.MEDIA] = media;
      onUpdate(ID.MEDIA);
      if (hasLoaded()) onLoaded();
    } else {
      tryMediaFallback(recordId, onUpdate, onLoaded, onError);
    }
  });
};

// Try playing old recording formats with audio only
// IMPORTANT: This will only work for webm format
//
// TODO: Add support for mp3 format
const tryMediaFallback = (recordId, onUpdate, onLoaded, onError) => {
  const url = buildFileURL('audio/audio.webm', recordId);
  fetch(url, { method: 'HEAD' }).then(response => {
    const { ok } = response;
    if (ok) {
      logger.debug(ID.STORAGE, ID.MEDIA, response);
      FALLBACK = true;
      DATA[ID.MEDIA] = ['webm'];
      onUpdate(ID.MEDIA);
      if (hasLoaded()) onLoaded();
    } else {
      onError(ERROR.NOT_FOUND);
    }
  });
};

const storage = {
  fetch: (recordId, onUpdate, onLoaded, onError) => {
    if (hasFetched()) return null;

    for (const data in files) {
      fetchFile(data, recordId, onUpdate, onLoaded, onError);
    }

    fetchMedia(recordId, onUpdate, onLoaded, onError);
  },
  get status() {
    return STATUS;
  },
  get data() {
    return DATA;
  },
  get fallback() {
    return FALLBACK;
  },
  get built() {
    return {
      captions: hasProperty(DATA, ID.CAPTIONS),
      chat: hasProperty(DATA, ID.CHAT),
      notes: hasProperty(DATA, ID.NOTES),
      polls: hasProperty(DATA, ID.POLLS),
      videos: hasProperty(DATA, ID.VIDEOS),
      presentation: hasProperty(DATA, ID.SHAPES),
      screenshare: hasProperty(DATA, ID.SCREENSHARE),
    };
  },
  get content() {
    return {
      captions: !isEmpty(this.captions),
      chat: !isEmpty(this.chat),
      notes: !isEmpty(this.notes),
      polls: !isEmpty(this.polls),
      videos: !isEmpty(this.videos),
      presentation: hasPresentation(this.slides),
      screenshare: !isEmpty(this.screenshare),
    };
  },
  get alternates() {
    return DATA[ID.ALTERNATES];
  },
  get captions() {
    return DATA[ID.CAPTIONS];
  },
  get chat() {
    return DATA[ID.CHAT];
  },
  get polls() {
    return DATA[ID.POLLS];
  },
  get videos() {
    return DATA[ID.VIDEOS];
  },
  get cursor() {
    return DATA[ID.CURSOR];
  },
  get media() {
    return DATA[ID.MEDIA];
  },
  get messages() {
    if (!hasProperty(DATA, ID.MESSAGES)) {
      DATA[ID.MESSAGES] = mergeMessages(
        this.chat,
        this.polls,
        this.videos,
      );
    }

    return DATA[ID.MESSAGES];
  },
  get metadata() {
    return DATA[ID.METADATA];
  },
  get notes() {
    return DATA[ID.NOTES];
  },
  get panzooms() {
    return DATA[ID.PANZOOMS];
  },
  get screenshare() {
    return DATA[ID.SCREENSHARE];
  },
  get shapes() {
    return DATA[ID.SHAPES];
  },
  get slides() {
    return this.shapes[ID.SLIDES];
  },
  get canvases() {
    return this.shapes[ID.CANVASES];
  },
  get thumbnails() {
    if (!hasProperty(DATA, ID.THUMBNAILS)) {
      DATA[ID.THUMBNAILS] = addAlternatesToThumbnails(this.shapes[ID.THUMBNAILS], this.alternates);
    }

    return DATA[ID.THUMBNAILS];
  },
};

export default storage;
