import { parseStringPromise } from 'xml2js';
import {
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  CHAT,
  SCREENSHARE,
  getType
} from './data';

const buildMetadata = result => {
  return {};
};

const buildShapes = result => {
  return {};
};

const buildPanzooms = result => {
  return {};
};

const buildCursor = result => {
  return {};
};

const buildChat = result => {
  const { popcorn } = result;
  let data = [];
  if (popcorn && popcorn.chattimeline) {
    const { chattimeline } = popcorn;
    data = chattimeline.map(chat => {
      const attr = chat['$'];
      return {
        send: parseInt(attr.in, 10),
        clear: attr.out ? parseInt(attr.out, 10) : undefined,
        name: attr.name,
        message: attr.message
      };
    });
  }
  return data;
};

const buildScreenshare = result => {
  return {};
};

const build = (filename, value) => {
  return new Promise((resolve, reject) => {
    const type = getType(filename);

    if (type === 'json') {
      // TODO: Build json data
      resolve(value);
    } else {
      parseStringPromise(value).then(result => {
        let data;
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
