import React, { useRef, useState } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import config from 'config';
import Error from './error';
import Player from './player';
import { build } from 'utils/builder';
import { ID } from 'utils/constants';
import {
  buildFileURL,
  getFileName,
  getFileType,
} from 'utils/data';
import {
  getLayout,
  getRecordId,
  getTime,
} from 'utils/params';
import logger from 'utils/logger';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'loader.wrapper.aria',
    description: 'Aria label for the loader wrapper',
  },
});

const initError = (recordId) => recordId ? null : config.error['NOT_FOUND'];

const Loader = ({ match }) => {
  const intl = useIntl();
  const counter = useRef(0);
  const data = useRef({});
  const layout = useRef(getLayout());
  const recordId = useRef(getRecordId(match));
  const started = useRef(false);
  const time = useRef(getTime());

  const [error, setError] = useState(initError(recordId));
  const [loaded, setLoaded] = useState(false);

  const fetchFile = (file) => {
    const url = buildFileURL(recordId.current, file);
    fetch(url).then(response => {
      if (response.ok) {
        logger.debug(ID.LOADER, file, response);
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
            setError(config.error['BAD_REQUEST']);
            return null;
        }
      } else {
        logger.warn('loader', file, response);
        return null;
      }
    }).then(value => {
      build(file, value).then(content => {
        if (content) logger.debug(ID.LOADER, 'builded', file);
        data.current[getFileName(file)] = content;
        update();
      }).catch(error => setError(config.error['BAD_REQUEST']));
    }).catch(error => setError(config.error['NOT_FOUND']));
  };

  const fetchMedia = () => {
    const fetches = config.medias.map(type => {
      const url = buildFileURL(recordId.current, `video/webcams.${type}`);
      return fetch(url, { method: 'HEAD' });
    });

    Promise.all(fetches).then(responses => {
      const media = [];
      responses.forEach(response => {
        const { ok, url } = response;
        if (ok) {
          logger.debug(ID.LOADER, 'media', response);
          media.push(config.medias.find(type => url.endsWith(type)));
        }
      });

      if (media.length > 0) {
        data.current.media = media;
        update();
      } else {
        // TODO: Handle audio medias
        setError(config.error['NOT_FOUND']);
      }
    });
  };

  const update = () => {
    counter.current = counter.current + 1;
    // TODO: Better control
    if (counter.current > Object.keys(config.files.data).length) {
      if (!loaded) setLoaded(true);
    }
  };

  if (!started.current) {
    started.current = true;

    if (recordId.current) {
      for (const file in config.files.data) {
        fetchFile(config.files.data[file]);
      }

      fetchMedia();
    }
  }

  if (error) return <Error code={error} />;

  if (loaded) {
    return (
      <Player
        data={data.current}
        intl={intl}
        layout={layout.current}
        time={time.current}
      />
    );
  }

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="loader-wrapper"
      id={ID.LOADER}
    >
      <div className="loading-dots">
        <div className="first" />
        <div className="second" />
        <div className="third" />
      </div>
    </div>
  );
};

export default Loader;
