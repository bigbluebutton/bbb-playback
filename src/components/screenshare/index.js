import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import videojs from 'video.js/core.es.js';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';
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

const Screenshare = ({
  active,
  onPlayerReady,
}) => {
  const intl = useIntl();
  const sources = useRef(buildSources());
  const player = useRef();
  const element = useRef();

  useEffect(() => {
    if (!player.current) {
      player.current = videojs(element.current, buildOptions(sources), () => {
        if (onPlayerReady) onPlayerReady(ID.SCREENSHARE, player.current);
      });
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [ onPlayerReady ]);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('screenshare-wrapper', { inactive: !active })}
      id={ID.SCREENSHARE}
    >
      <div data-vjs-player>
        <video
          className="video-js"
          playsInline
          preload="auto"
          ref={node => element.current = node}
        />
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  return prevProps.active === nextProps.active;
};

export default React.memo(Screenshare, areEqual);
