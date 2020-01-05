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
  getType
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
            text: text
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
    const { id, name } = recording.meeting.shift()['$'];
    data = { id, name };
  }
  return data;
};

const buildShapes = result => {
  let data = {};
  const { svg } = result;
  if (svg) {
    data.slides = [];
    svg.image.forEach(image => {
      const slide = image['$'];
      const id = slide['id'];
      const xlink = slide['xlink:href'];

      const timestamps = slide['in']
        .split(' ')
        .map(v => parseFloat(v));

      timestamps.forEach(timestamp => {
        data.slides.push({
          timestamp,
          id,
          xlink
        });
      });
    });
    data.slides = data.slides.sort((a, b) => a.timestamp - b.timestamp);
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
        height: viewbox.shift()
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
        y: position.shift()
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
        message: attr.message
      };
    });
  }
  return data;
};

const buildScreenshare = result => {
  return result;
};

const build = (filename, value) => {
  return new Promise((resolve, reject) => {
    let data;
    const type = getType(filename);
    if (type === 'json') {
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
          case METADATA:
            data = buildMetadata(result);
            break;
          case SHAPES:
            data = buildShapes(result);
            break;
          case PANZOOMS:
            data = buildPanzooms(result);
            break;
          case CURSOR:
            data = buildCursor(result);
            break;
          case CHAT:
            data = buildChat(result);
            break;
          case SCREENSHARE:
            data = buildScreenshare(result);
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
  build
};
