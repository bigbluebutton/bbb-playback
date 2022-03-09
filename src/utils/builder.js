import { parseStringPromise } from 'xml2js';
import { files as config } from 'config';
import { getFileType } from './data';
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

const getAttr = data => {
  if (!data) return {};

  const attr = data['$'];
  if (!attr) return {};

  return attr;
};

const getChildren = data => {
  if (!data) return [];

  const children = data['$$'];
  if (!children) return [];

  return children;
};

const getId = data => {
  if (!data) return -1;

  const id = data.match(/\d+$/);
  if (!id || id.length === 0) return -1;

  return parseInt(id.shift(), 10);
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

  let data = [];
  data = result;

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
    const attr = getAttr(recording.meeting.shift());
    const { id } = attr;
    const meta = recording.meta.shift();
    const end = parseInt(recording.end_time.shift(), 10);
    const name = meta.name ? meta.name.shift() : attr.name;
    const participants = parseInt(recording.participants.shift(), 10);
    const start = parseInt(recording.start_time.shift(), 10);

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
    image.forEach(img => {
      const attr = getAttr(img);
      const src = attr['xlink:href'];

      // Skip the logo
      if (!src) return;

      // Get the number from the id name
      const slideId = getId(attr.id);
      const timestamps = getNumbers(attr.in);

      timestamps.forEach(timestamp => {
        slides.push({
          id: slideId,
          height: parseInt(attr.height),
          src,
          timestamp,
          width: parseInt(attr.width),
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
  let text = '';

  const children = getChildren(data);
  if (!isEmpty(children)) {
    const child = children.shift();
    const grandchildren = getChildren(child);
    if (!isEmpty(grandchildren)) {
      text = grandchildren.map(grandchild => {
        const name = grandchild['#name'];
        if (name === 'br') return '\r';

        return grandchild['_'];
      }).join('');
    }
  }

  return text;
};

const buildCanvases = (group, slides) => {
  let canvases = [];

  if (group) {
    canvases = group.map(canvas => {
      const canvasAttr = getAttr(canvas);
      const canvasId = getId(canvasAttr.id);

      let data = canvas.g.map(g => {
        const drawAttr = getAttr(g);
        const timestamp = parseFloat(drawAttr.timestamp);
        const clear = parseFloat(drawAttr.undo);
        const style = buildStyle(drawAttr.style);
        const drawId = getId(drawAttr.shape);

        let shape = {};
        if (g.image) {
          shape.type = SHAPES.POLL;
          const image = getAttr(g.image.shift());
          // TODO: Better adapt for old versions
          // Versions prior to 2.3 included a rect structure along with an image
          if (g.rect) {
            const rect = getAttr(g.rect.shift());
            shape.data = Object.assign({ rect }, { image });
          } else {
            shape.data = Object.assign({ image });
          }
        } else if (g.polyline) {
          shape.type = SHAPES.POLYLINE;
          shape.data = Object.assign({}, getAttr(g.polyline.shift()));
        } else if (g.line) {
          shape.type = SHAPES.LINE;
          shape.data = Object.assign({}, getAttr(g.line.shift()));
        } else if (g.polygon) {
          shape.type = SHAPES.POLYGON;
          shape.data = Object.assign({}, getAttr(g.polygon.shift()));
        } else if (g.circle) {
          shape.type = SHAPES.CIRCLE;
          shape.data = Object.assign({}, getAttr(g.circle.shift()));
        } else if (g.path) {
          shape.type = SHAPES.PATH;
          shape.data = Object.assign({}, getAttr(g.path.shift()));
        } else if (g.switch) {
          shape.type = SHAPES.TEXT;
          const foreignObject = g.switch.shift()['foreignObject'].shift();
          const text = parseText(foreignObject);
          shape.data = Object.assign({ text }, getAttr(foreignObject));
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

const buildPanzooms = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    data = recording.event.map(panzoom => {
      const attr = getAttr(panzoom);
      const viewbox = getNumbers(panzoom.viewBox.shift());

      return {
        timestamp: parseFloat(attr.timestamp),
        x: viewbox.shift(),
        y: viewbox.shift(),
        width: viewbox.shift(),
        height: viewbox.shift(),
      };
    });
  }

  return data;
};

const buildCursor = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    data = recording.event.map(cursor => {
      const attr = getAttr(cursor);
      const position = getNumbers(cursor.cursor.shift());

      return {
        timestamp: parseFloat(attr.timestamp),
        x: position.shift(),
        y: position.shift(),
      };
    });
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
    data = chattimeline.map(chat => {
      const attr = getAttr(chat);
      const clear = attr.out ? parseFloat(attr.out) : -1;
      const message = decodeXML(clearHyperlink(attr.message));
      const initials = getInitials(attr.name);
      const emphasized = attr.chatEmphasizedText === 'true';
      const moderator = attr.senderRole === ROLES.MODERATOR;

      return {
        clear,
        emphasized,
        hyperlink: message !== attr.message,
        initials,
        name: attr.name,
        message,
        moderator,
        timestamp: parseFloat(attr.in),
      };
    });
  }

  return data;
};

const buildScreenshare = result => {
  let data = [];
  const { recording } = result;

  if (hasProperty(recording, 'event')) {
    data = recording.event.map(screenshare => {
      const attr = getAttr(screenshare);

      return {
        timestamp: parseFloat(attr.start_timestamp),
        clear: parseFloat(attr.stop_timestamp),
      };
    });
  }

  return data;
};

const getOptions = filename => {
  let options = {};

  switch (filename) {
    case config.shapes:
      options = {
        explicitChildren: true,
        preserveChildrenOrder: true,
        charsAsChildren: true,
      };
      break;
    default:
  }

  return options;
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
      const options = getOptions(filename);
      parseStringPromise(value, options).then(result => {
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
      }).catch(error => reject(error));
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
