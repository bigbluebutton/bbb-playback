import React, { useRef, useState } from 'react';
import { useParams } from "react-router-dom";
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Data from './data';
import Dots from './dots';
import Error from 'components/error';
import Player from 'components/player';
import {
  ERROR,
  ID,
} from 'utils/constants';
import storage from 'utils/data/storage';
import layout from 'utils/layout';
import logger from 'utils/logger';
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

const FEEDBACK = 1 * 1000;

const initError = (recordId) => recordId ? null : ERROR.BAD_REQUEST;

const Loader = ({ match }) => {
  const intl = useIntl();
  const params = useParams();
  const recordId = useRef(parseRecordId(params));
  const counter = useRef(0);

  const [error, setError] = useState(initError(recordId.current));
  const [, setUpdate] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (error) return <Error code={error} />;

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
    setTimeout(() => setLoaded(true), FEEDBACK);
  };

  storage.fetch(recordId.current, onUpdate, onLoaded, onError);

  if (loaded) {
    layout.mode = getLayout();

    return <Player />;
  }

  return (
    <div
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
    </div>
  );
};

export default Loader;
