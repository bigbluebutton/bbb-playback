import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import videojs from 'video.js/core.es.js';
import { useCurrentContent } from 'components/utils/hooks';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import logger from 'utils/logger';
import storage from 'utils/data/storage';
import player from 'utils/player';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.screenshare.wrapper.aria',
    description: 'Aria label for the screenshare wrapper',
  },
});

const buildSources = () => {
  return [
    {
      src: buildFileURL('deskshare/deskshare.mp4'),
      type: 'video/mp4',
    }, {
      src: buildFileURL('deskshare/deskshare.webm'),
      type: 'video/webm',
    },
  ].filter(source => storage.media.find(m => source.type.includes(m)));
};

const buildOptions = (sources) => {
  return {
    controls: false,
    fill: true,
    sources: sources.current,
  };
};

const Screenshare = () => {
  const intl = useIntl();
  const currentContent = useCurrentContent();
  const sources = useRef(buildSources());
  const element = useRef();

  useEffect(() => {
    if (!player.screenshare) {
      const video = element.current;
      if (!video) return;

      player.screenshare = videojs(video, buildOptions(sources), () => {});
      logger.debug(ID.SCREENSHARE, 'mounted');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (player.screenshare) {
        player.screenshare.dispose();
        player.screenshare = null;
        logger.debug(ID.SCREENSHARE, 'unmounted');
      }
    };
  }, []);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('screenshare-wrapper', { inactive: currentContent !== ID.SCREENSHARE })}
      id={ID.SCREENSHARE}
    >
      <div data-vjs-player>
        <video
          className="video-js"
          playsInline
          preload="auto"
          ref={element}
        />
      </div>
    </div>
  );
};

const areEqual = () => true;

export default React.memo(Screenshare, areEqual);
