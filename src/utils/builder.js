import { parseFromString } from './data/xml2json';
import { files as config } from 'config';
import { getFileType, caseInsensitiveReducer } from './data';
import {
  hasProperty,
  isEmpty,
} from './data/validators';
import {
  ID,
  ROLES,
  SHAPES,
} from './constants';
import logger from './logger';

const convertToArray = (object) => {
  if (Array.isArray(object)) {
    return object
  } else {
    let objectArray = [];
    objectArray.push(object);
    return objectArray;
  }
}

const getAttr = data => {
  if (!data) return {};

  const attr = data['$'];
  if (!attr) return {};

  return attr;
};

const getId = data => {
  if (!data) return -1;

  const id = data.match(/\d+$/);
  if (!id || id.length === 0) return -1;

  return parseInt(id, 10);
};

const getNumbers = data => {
  if (!data) return [];

  const trimmed = data.trim().replace(/  +/g, ' ');
  if (trimmed.length === 0) return [];

  const split = trimmed.split(' ');
  const numbers = split.map(v => parseFloat(v));

  return numbers;
};

const buildAlternates = result => {
  if (!result) return [];

  let data = [];
  for (const presentation in result) {
    if (hasProperty(result, presentation)) {
      const slides = result[presentation];

      for (const slide in slides) {
        if (hasProperty(slides, slide)) {
          const text = slides[slide];

          data.push({
            src: `presentation/${presentation}/${slide}.png`,
            text,
          });
        }
      }
    }
  }

  return data;
};

// TODO
const buildCaptions = result => {
  if (!result) return [];

  let data = [];
  data = result;

  return data;
};

// TODO
const buildPolls = result => {
  if (!result) return [];

  const data = result.map(r => {
    const answers = r.answers.reduce(caseInsensitiveReducer, []);
    return {
      ...r,
      answers,
    };
  });

  return data;
};

const buildVideos = result => {
  if (!result) return [];

  const data = result.map(r => {
    return {
      timestamp: r.timestamp,
      url: r.external_video_url,
    };
  });

  return data;
};

const buildMetadata = result => {
  let data = {};
  const { recording } = result;

  if (hasProperty(recording, 'meeting')) {
    const id = recording.meeting._id;
    const meta = recording.meta;
    const end = parseInt(recording.end_time, 10);
    const name = meta.meetingName ? meta.meetingName : recording.meeting._name;
    const participants = parseInt(recording.participants, 10);
    const start = parseInt(recording.start_time, 10);

    data = {
      end,
      id,
      name,
      participants,
      start,
    };
  }

  return data;
};

const buildNotes = result => {
  if (!result) return '';

  // Extract the notes' body
  const regex = /<body>\n.*\n<\/body>/g;
  const match = result.match(regex);

  let data = '';
  if (!isEmpty(match)) {
    data = match.shift();
  }

  return data;
};

const buildStyle = data => {
  const items = data.split(';');
  let style = {};

  items.forEach(item => {
    const trimmed = item.trim();

    if (trimmed.length === 0) return;

    const split = trimmed.split(':').map(i => i.trim());

    // Remove visibility
    if (split[0] === 'visibility') return;

    style[split[0]] = split[1];
  });

  return style;
};

const buildSlides = image => {
  let slides = [];

  if (image) {
    convertToArray(image).forEach(img => {
      const src = img['_xlink:href']

      // Skip the logo
      if (!src) return;

      // Get the number from the id name
      const slideId = getId(img._id);
      const timestamps = getNumbers(img._in);

      timestamps.forEach(timestamp => {
        slides.push({
          id: slideId,
          height: parseInt(img._height),
          src,
          timestamp,
          width: parseInt(img._width),
        });
      });
    });

    slides = slides.sort((a, b) => a.timestamp - b.timestamp);
  }

  return slides;
};

const buildThumbnails = slides => {
  const prefix = 'slide-';
  const url = 'thumbnails/thumb-';

  return slides.reduce((result, slide) => {
    const {
      id,
      src,
      timestamp,
    } = slide;

    if (src.includes(ID.DESKSHARE)) {
      result.push({
        id,
        src: ID.SCREENSHARE,
        timestamp,
      });
    } else {
      result.push({
        id,
        src: src.replace(prefix, url),
        timestamp,
      });
    }

    return result;
  }, []);
};

const parseText = data => {
  let text = data.p['#text'];
  if (text)
    text = text.replaceAll('<br xmlns="http://www.w3.org/1999/xhtml" />', '\r');
  else
    text = '';
  return text;
};

const buildCanvases = (group, slides) => {
  let canvases = [];

  if (group) {
    canvases = convertToArray(group).map(canvas => {
      const canvasId = getId(canvas._id);
      let data = convertToArray(canvas.g).map(g => {
        const timestamp = parseFloat(g._timestamp);
        const clear = parseFloat(g._undo);
        const style = buildStyle(g._style);
        const drawId = getId(g._shape);

        let shape = {};
        if (g.image) {
          shape.type = SHAPES.POLL;
          const image = g.image;
          // TODO: Better adapt for old versions
          // Versions prior to 2.3 included a rect structure along with an image
          if (g.rect) {
            const rect = g.rect;
            shape.data = Object.assign({ rect }, { image });
          } else {
            shape.data = Object.assign({ image });
          }
        } else if (g.polyline) {
          shape.type = SHAPES.POLYLINE;
          shape.data = Object.assign({}, g.polyline);
        } else if (g.line) {
          shape.type = SHAPES.LINE;
          shape.data = Object.assign({}, g.line);
        } else if (g.polygon) {
          shape.type = SHAPES.POLYGON;
          shape.data = Object.assign({}, g.polygon);
        } else if (g.circle) {
          shape.type = SHAPES.CIRCLE;
          shape.data = Object.assign({}, g.circle);
        } else if (g.path) {
          shape.type = SHAPES.PATH;
          shape.data = Object.assign({}, g.path);
        } else if (g.switch) {
          shape.type = SHAPES.TEXT;
          const foreignObject = g.switch.foreignObject;
          const text = parseText(foreignObject);
          shape.data = Object.assign({ text }, foreignObject);
        }

        return {
          clear,
          id: drawId,
          shape,
          style,
          timestamp,
        };
      });

      return {
        data,
        id: canvasId,
      };
    });
  }

  slides.forEach((slide, index) => {
    const found = canvases.find(canvas => canvas.id === slide.id);
    if (found) {
      canvases[index].timestamp = slide.timestamp;
    } else {
      const canvas = {
        data: [],
        id: slide.id,
        timestamp: slide.timestamp,
      };

      canvases.splice(index, 0, canvas);
    }
  });

  return canvases;
};

const buildShapes = result => {
  let data = {};
  const { svg } = result;

  if (svg) {
    const {
      image,
      g,
    } = svg;

    data.slides = buildSlides(image);
    data.thumbnails = buildThumbnails(data.slides);
    data.canvases = buildCanvases(g, data.slides);
  }

  return data;
};

const buildTldraw = result => {
  if (!result) return [];

  let bbb_version = null;
  if (result['bbb_version']) {
    bbb_version = result['bbb_version'];
    delete result['bbb_version'];
  }

  let tldraw = [];
  tldraw = Object.keys(result).map(i => {
    let data = result[i].shapes.map(shape => {
      return {
        clear: shape.undo,
        id: shape.id,
        shape: shape.shape_data,
        timestamp: shape.timestamp,
      }
    })

    return {
      data,
      timestamp: result[i].timestamp,
      id: i,
      bbb_version: bbb_version,
    };
  })

  return tldraw;
}

const buildPanzooms = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    const tldraw = recording._tldraw === 'true';
    data = convertToArray(recording.event).map(panzoom => {
      const viewbox = getNumbers(panzoom.viewBox);
      return {
        timestamp: parseFloat(panzoom._timestamp),
        x: viewbox.shift(),
        y: viewbox.shift(),
        width: viewbox.shift(),
        height: viewbox.shift(),
      };
    });
    data.tldraw = tldraw;
  }

  return data;
};

const buildCursor = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    data = convertToArray(recording.event).map(cursor => {
      const position = getNumbers(cursor.cursor);

      return {
        timestamp: parseFloat(cursor._timestamp),
        x: position.shift(),
        y: position.shift(),
      };
    });
    data.tldraw = recording._tldraw === 'true';
  }

  return data;
};

const clearHyperlink = message => {
  const regex = /<a href="(.*)" rel="nofollow"><u>\1<\/u><\/a>/g;

  return message.replace(regex, '$1');
};

const decodeXML = message => {
  return message
    .replace(/&(quot|#34);/g, '"')
    .replace(/&(amp|#38);/g, '&')
    .replace(/&(apos|#39);/g, "'")
    .replace(/&(lt|#60);/g, '<')
    .replace(/&(gt|#62);/g, '>');
};

const getInitials = name => {
  let initials;

  if (name) {
    initials = name
      .slice(0, 2)
      .toLowerCase()
      .trim();
  }

  return initials;
};

const buildChat = result => {
  const { popcorn } = result;
  let data = [];

  if (hasProperty(popcorn, 'chattimeline')) {
    const { chattimeline } = popcorn;
    data = convertToArray(chattimeline).map(chat => {
      const clear = chat._out ? parseFloat(chat._out) : -1;
      const message = decodeXML(clearHyperlink(chat._message));
      const initials = getInitials(chat._name);
      const emphasized = chat._chatEmphasizedText === 'true';
      const moderator = chat._senderRole === ROLES.MODERATOR;

      // Normalize reactions to always be an array
      const reactionsList = chat.reactions ? convertToArray(chat.reactions.reaction) : [];
      const reactions = reactionsList.map((messageReaction) => ({
          emoji: messageReaction._emoji,
          count: messageReaction._count,
        }),
      );
      return {
        clear,
        id: chat._id,
        emphasized,
        hyperlink: message !== chat._message,
        initials,
        name: chat._name,
        message,
        moderator,
        reactions,
        replyToMessageId: chat._replyToMessageId,
        lastEditedTimestamp: chat._lastEditedTimestamp,
        timestamp: parseFloat(chat._in),
      };
    });
  }

  return data;
};

const buildScreenshare = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    data = convertToArray(recording.event).map(screenshare => {

      return {
        timestamp: parseFloat(screenshare._start_timestamp),
        clear: parseFloat(screenshare._stop_timestamp),
      };
    });
  }

  return data;
};

const build = (filename, value) => {
  return new Promise((resolve, reject) => {
    let data;
    const fileType = getFileType(filename);

    if (fileType === 'json') {
      switch (filename) {
        case config.alternates:
          data = buildAlternates(value);
          break;
        case config.captions:
          data = buildCaptions(value);
          break;
        case config.polls:
          data = buildPolls(value);
          break;
        case config.videos:
          data = buildVideos(value);
          break;
        case config.tldraw:
          data = buildTldraw(value);
          break;
        default:
          logger.debug('unhandled', 'json', filename);
          reject(filename);
      }
      resolve(data);
    } else if (fileType === 'html') {
      switch (filename) {
        case config.notes:
          data = buildNotes(value);
          break;
        default:
          logger.debug('unhandled', 'html', filename);
          reject(filename);
      }
      resolve(data);
    } else {
      if (!value) {
        logger.warn('missing', filename);

        return resolve(null);
      }

      // Parse XML data
      const result = parseFromString(value);

      if (!result) {
        reject(filename);
      } else {
        switch (filename) {
          case config.chat:
            data = buildChat(result);
            break;
          case config.cursor:
            data = buildCursor(result);
            break;
          case config.metadata:
            data = buildMetadata(result);
            break;
          case config.panzooms:
            data = buildPanzooms(result);
            break;
          case config.screenshare:
            data = buildScreenshare(result);
            break;
          case config.shapes:
            data = buildShapes(result);
            break;
          default:
            logger.debug('unhandled', 'xml', filename);
            reject(filename);
        }
        resolve(data);
      }
    }
  });
};

const addAlternatesToThumbnails = (thumbnails, alternates) => {
  const prefix = 'thumbnails/thumb-';
  const url = 'slide-';

  return thumbnails.map(thumbnail => {
    const { src } = thumbnail;
    thumbnail.alt = '';

    const found = alternates.find(alt => src.replace(prefix, url) === alt.src);
    if (found) thumbnail.alt = found.text;

    return thumbnail;
  });
};

const mergeMessages = (chat, polls, videos) => {
  return [
    ...chat,
    ...polls,
    ...videos,
  ].sort((a, b) => a.timestamp - b.timestamp);
};

export {
  addAlternatesToThumbnails,
  build,
  buildStyle,
  decodeXML,
  getAttr,
  getId,
  getNumbers,
  mergeMessages,
};
