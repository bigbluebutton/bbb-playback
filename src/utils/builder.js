import { parseStringPromise } from 'xml2js';
import {
  ALTERNATES,
  CAPTIONS,
  CHAT,
  CURSOR,
  METADATA,
  PANZOOMS,
  SCREENSHARE,
  SHAPES,
  getFileType,
} from './data';

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
  let data = [];

  for (const presentation in result) {
    if (result.hasOwnProperty(presentation)) {
      const slides = result[presentation];

      for (const slide in slides) {
        if (slides.hasOwnProperty(slide)) {
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

const buildCaptions = result => {
  // TODO: Restructure JSON data
  return result;
};

const buildMetadata = result => {
  let data = {};
  const { recording } = result;

  if (recording && recording.meeting) {
    const attr = getAttr(recording.meeting.shift());

    const {
      id,
      name,
    } = attr;

    const epoch = parseInt(recording.start_time.shift(), 10);

    data = {
      id,
      name,
      epoch,
    };
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
      // Get the number from the id name
      const slideId = getId(attr.id);
      const src = attr['xlink:href'];

      // Skip the logo
      if (!src) return;

      const timestamps = getNumbers(attr.in);

      timestamps.forEach(timestamp => {
        slides.push({
          id: slideId,
          src,
          timestamp,
        });
      });
    });

    slides = slides.sort((a, b) => a.timestamp - b.timestamp);
  }

  return slides;
};

const buildThumbnails = slides => {
  const screenshare = 'deskshare';
  const prefix = 'slide-';
  const url = 'thumbnails/thumb-';

  return slides.reduce((result, slide) => {
    const {
      src,
      timestamp,
    } = slide;

    // TODO: Screenshare thumbnail
    if (!src.includes(screenshare)) {
      result.push({
        src: src.replace(prefix, url),
        timestamp,
      });
    }

    return result;
  }, []);
};

const buildCanvases = group => {
  let canvases = [];

  if (group) {
    canvases = group.map(canvas => {
      const canvasAttr = getAttr(canvas);
      // Get the number from the id name
      const canvasId = getId(canvasAttr.id);

      let draws = canvas.g.map(g => {
        const drawAttr = getAttr(g);
        const timestamp = parseFloat(drawAttr.timestamp);
        const clear = parseFloat(drawAttr.undo);
        const style = buildStyle(drawAttr.style);
        const drawId = getId(drawAttr.shape);

        let shape = {};
        if (g.polyline) {
          shape.type = 'polyline';
          shape.data = Object.assign({}, getAttr(g.polyline.shift()));
        } else if (g.line) {
          shape.type = 'line';
          shape.data = Object.assign({}, getAttr(g.line.shift()));
        } else if (g.polygon) {
          shape.type = 'polygon';
          shape.data = Object.assign({}, getAttr(g.polygon.shift()));
        } else if (g.circle) {
          shape.type = 'circle';
          shape.data = Object.assign({}, getAttr(g.circle.shift()));
        } else if (g.path) {
          shape.type = 'path';
          shape.data = Object.assign({}, getAttr(g.path.shift()));
        } else if (g.switch) {
          shape.type = 'switch';
          const foreignObject = g.switch.shift()['foreignObject'].shift();
          const p = foreignObject.p.shift()['_'];
          shape.data = Object.assign({ p: p ? p : '' }, getAttr(foreignObject));
        } else if (g.rect && g.image) {
          shape.type = 'poll';
          const rect = getAttr(g.rect.shift());
          const image = getAttr(g.image.shift());
          shape.data = Object.assign({ rect }, { image });
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
        draws,
        id: canvasId,
      };
    });
  }

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
    data.canvases = buildCanvases(g);
  }

  return data;
};

const buildPanzooms = result => {
  let data = [];
  const { recording } = result;

  if (recording && recording.event) {
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

  if (recording && recording.event) {
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

const buildChat = result => {
  const { popcorn } = result;
  let data = [];

  if (popcorn && popcorn.chattimeline) {
    const { chattimeline } = popcorn;
    data = chattimeline.map(chat => {
      const attr = getAttr(chat);
      const clear = attr.out ? parseFloat(attr.out) : -1;

      return {
        clear,
        name: attr.name,
        message: attr.message,
        timestamp: parseFloat(attr.in),
      };
    });
  }

  return data;
};

const buildScreenshare = result => {
  let data = [];
  const { recording } = result;

  if (recording && recording.event) {
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

const build = (filename, value) => {
  return new Promise((resolve, reject) => {
    let data;
    const fileType = getFileType(filename);

    if (fileType === 'json') {
      switch (filename) {
        case ALTERNATES:
          data = buildAlternates(value);
          break;
        case CAPTIONS:
          data = buildCaptions(value);
          break;
        default:
          reject(filename);
      }
      resolve(data);
    } else {
      // Parse XML data
      parseStringPromise(value).then(result => {
        switch (filename) {
          case CHAT:
            data = buildChat(result);
            break;
          case CURSOR:
            data = buildCursor(result);
            break;
          case METADATA:
            data = buildMetadata(result);
            break;
          case PANZOOMS:
            data = buildPanzooms(result);
            break;
          case SCREENSHARE:
            data = buildScreenshare(result);
            break;
          case SHAPES:
            data = buildShapes(result);
            break;
          default:
            reject(filename);
        }
        resolve(data);
      }).catch(error => reject(error));
    }
  });
};

const addAlternatesToSlides = (slides, alternates) => {
  return slides.map(slide => {
    const { src } = slide;
    slide.alt = '';

    const found = alternates.find(alt => src === alt.src);
    if (found) slide.alt = found.text;

    return slide;
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

export {
  addAlternatesToSlides,
  addAlternatesToThumbnails,
  build,
  buildStyle,
  getAttr,
  getId,
  getNumbers,
};
