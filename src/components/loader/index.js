import React, {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams } from "react-router-dom";
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Data from './data';
import Dots from './dots';
import Error from 'components/error';
import ErrorBoundary from 'components/error/boundary';
import {
  ERROR,
  ID,
} from 'utils/constants';
import storage from 'utils/data/storage';
import layout from 'utils/layout';
import logger from 'utils/logger';
import { loadVideojsLanguage } from 'utils/videojsLanguage';
import {
  getLayout,
  parseRecordId,
} from 'utils/params';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'loader.wrapper.aria',
    description: 'Aria label for the loader wrapper',
  },
});

// The player chunk (video.js and friends) is downloaded while the recording
// data is being fetched instead of after it
const importPlayer = () => import('components/player');
const Player = lazy(importPlayer);

const initError = (recordId) => recordId ? null : ERROR.BAD_REQUEST;

const Loader = () => {
  const intl = useIntl();
  const params = useParams();
  const recordId = useRef(parseRecordId(params));
  const counter = useRef(0);

  const [error, setError] = useState(initError(recordId.current));
  const [, setUpdate] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!recordId.current) return;

    const onError = (error) => {
      logger.error('loader', 'error', error);
      setError(error);
    };

    const onUpdate = (data) => {
      logger.debug('loader', 'update', data);
      counter.current += 1;
      setUpdate(counter.current);
    };

    const onLoaded = () => {
      logger.debug('loader', 'loaded');
      setLoaded(true);
    };

    importPlayer().catch(error => logger.error('loader', 'player', error));
    loadVideojsLanguage(intl.locale);
    storage.fetch(recordId.current, onUpdate, onLoaded, onError);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loaded) return;

    const { name } = storage.metadata || {};
    if (name) document.title = name;
  }, [loaded]);

  if (error) return <Error code={error} />;

  const loader = (
    <main
      aria-busy="true"
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="loader-wrapper"
      id={ID.LOADER}
    >
      <div className="loader-top" />
      <div className="loader-middle">
        <Dots />
      </div>
      <div className="loader-bottom">
        <Data data={storage.built} />
      </div>
    </main>
  );

  if (loaded) {
    layout.mode = getLayout();

    return (
      <ErrorBoundary>
        <Suspense fallback={loader}>
          <Player />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return loader;
};

export default Loader;
