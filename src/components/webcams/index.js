import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import videojs from 'video.js/core.es.js';
import { player as config } from 'config';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import logger from 'utils/logger';
import storage from 'utils/data/storage';
import player from 'utils/player';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.webcams.wrapper.aria',
    description: 'Aria label for the webcams wrapper',
  },
});

const buildSources = () => {
  return [
    {
      src: buildFileURL('video/webcams.mp4'),
      type: 'video/mp4',
    }, {
      src: buildFileURL('video/webcams.webm'),
      type: 'video/webm',
    },
  ].filter(source => storage.media.find(m => source.type.includes(m)));
};

const buildTracks = () => {
  return storage.captions.map(lang => {
    const {
      locale,
      localeName,
    } = lang;

    return {
      kind: 'captions',
      src: buildFileURL(`caption_${locale}.vtt`),
      srclang: locale,
      label: localeName,
    };
  });
};

const buildOptions = (sources, tracks) => {
  return {
    controlBar: {
      fullscreenToggle: false,
      pictureInPictureToggle: false,
      volumePanel: {
        inline: false,
        vertical: true,
      },
    },
    controls: true,
    fill: true,
    inactivityTimeout: 0,
    playbackRates: config.rates,
    sources: sources.current,
    tracks: tracks.current,
  };
};

const propTypes = {
  onTimeUpdate: PropTypes.func,
  time: PropTypes.number,
};

const defaultProps = {
  onTimeUpdate: () => {},
  time: 0,
};

const Webcams = ({
  onTimeUpdate,
  time,
}) => {
  const intl = useIntl();
  const sources = useRef(buildSources());
  const tracks = useRef(buildTracks());
  const element = useRef();

  useEffect(() => {
    if (!player.webcams) {
      const video = element.current;
      if (!video) return;

      player.webcams = videojs(video, buildOptions(sources, tracks), () => {
        if (onTimeUpdate) {
          player.webcams.on('play', () => {
            setInterval(() => {
              const currentTime = player.webcams.currentTime();
              onTimeUpdate(currentTime);
            }, 1000 / config.rps);
          });

          player.webcams.on('pause', () => clearInterval());
        }

        if (time) {
          player.webcams.on('loadedmetadata', () => {
            const duration = player.webcams.duration();
            if (time < duration) {
              player.webcams.currentTime(time);
            }
          });
        }
      });
      logger.debug(ID.WEBCAMS, 'mounted');
    }
  }, [ onTimeUpdate, time ]);

  useEffect(() => {
    return () => {
      if (player.webcams) {
        player.webcams.dispose();
        player.webcams = null;
        logger.debug(ID.WEBCAMS, 'unmounted');
      }
    };
  }, []);


  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="webcams-wrapper"
      id={ID.WEBCAMS}
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

Webcams.propTypes = propTypes;
Webcams.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(Webcams, areEqual);
