import React, { useRef, useState } from 'react';
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
import {
  getLayout,
  getRecordId,
  getTime,
} from 'utils/params';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'loader.wrapper.aria',
    description: 'Aria label for the loader wrapper',
  },
});

const initError = (recordId) => recordId ? null : ERROR.BAD_REQUEST;

const Loader = ({ match }) => {
  const intl = useIntl();
  const layout = useRef(getLayout());
  const recordId = useRef(getRecordId(match));
  const time = useRef(getTime());

  const [error, setError] = useState(initError(recordId.current));
  const [loaded, setLoaded] = useState(false);

  if (error) return <Error code={error} />;

  storage.fetch(recordId.current, setLoaded, setError);

  if (loaded) {
    return (
      <Player
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
      <div className="loader-top" />
      <div className="loader-middle">
        <Dots />
      </div>
      <div className="loader-bottom">
        <Data data={storage.data} />
      </div>
    </div>
  );
};

export default Loader;
