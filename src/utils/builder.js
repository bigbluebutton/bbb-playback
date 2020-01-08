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

const buildAlternates = result => {
  let data = [];

  for (const presentation in result) {
    if (result.hasOwnProperty(presentation)) {
      const slides = result[presentation];

      for (const slide in slides) {
        if (slides.hasOwnProperty(slide)) {
          const text = slides[slide];

          data.push({
            xlink: `presentation/${presentation}/${slide}.png`,
            text: text,
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
    const meeting = recording.meeting.shift()['$']

    const {
      id,
      name,
    } = meeting;

    data = { id, name };
  }

  return data;
};

const buildStyle = data => {
  const items = data.split(';');
  let style = {};

  items.forEach(item => {
    const split = item.split(':').map(i => i.trim());

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
      const slide = img['$'];
      // Get the number from the id name
      const id = parseInt(slide['id'].match(/\d/g).join(''), 10);
      const xlink = slide['xlink:href'];

      // Skip the logo
      if (!xlink) return;

      const timestamps = slide['in']
        .split(' ')
        .map(v => parseFloat(v));

      timestamps.forEach(timestamp => {
        slides.push({
          timestamp,
          id,
          xlink,
        });
      });
    });

    slides = slides.sort((a, b) => a.timestamp - b.timestamp);
  }

  return slides;
};

const buildCanvases = group => {
  let canvases = [];

  if (group) {
    canvases = group.map(canvas => {
      // Get the number from the id name
      const id = parseInt(canvas['$'].id.match(/\d/g).join(''), 10);

      let draws = canvas.g.map(g => {
        const draw = g['$'];
        const timestamp = parseFloat(draw.timestamp);
        const style = buildStyle(draw.style);

        let shape = {};
        if (g.polyline) {
          shape.type = 'polyline';
          shape.data = Object.assign({}, g.polyline.shift()['$']);
        } else if (g.line) {
          shape.type = 'line';
          shape.data = Object.assign({}, g.line.shift()['$']);
        } else if (g.polygon) {
          shape.type = 'polygon';
          shape.data = Object.assign({}, g.polygon.shift()['$']);
        } else {
          console.warn('Unhandled', g);
          return null;
        }

        return {
          shape,
          style,
          timestamp,
        };
      });

      return {
        draws,
        id,
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
    data.canvases = buildCanvases(g);
  }

  return data;
};

const buildPanzooms = result => {
  let data = [];
  const { recording } = result;

  if (recording && recording.event) {
    data = recording.event.map(panzoom => {
      const viewbox = panzoom['viewBox']
        .shift()
        .split(' ')
        .map(v => parseFloat(v));

      return {
        timestamp: parseFloat(panzoom['$'].timestamp),
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
      const position = cursor['cursor']
        .shift()
        .split(' ')
        .map(v => parseFloat(v));

      return {
        timestamp: parseFloat(cursor['$'].timestamp),
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
      const attr = chat['$'];

      return {
        timestamp: parseFloat(attr.in),
        name: attr.name,
        message: attr.message,
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
      const attr = screenshare['$'];

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

export {
  build,
};
