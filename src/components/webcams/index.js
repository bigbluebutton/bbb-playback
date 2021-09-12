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
import storage from 'utils/data/storage';
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
  onPlayerReady: PropTypes.func,
  onTimeUpdate: PropTypes.func,
  time: PropTypes.number,
};

const defaultProps = {
  onPlayerReady: () => {},
  onTimeUpdate: () => {},
  time: 0,
};

const Webcams = ({
  onPlayerReady,
  onTimeUpdate,
  time,
}) => {
  const intl = useIntl();
  const sources = useRef(buildSources());
  const tracks = useRef(buildTracks());
  const player = useRef();
  const element = useRef();

  useEffect(() => {
    if (!player.current) {
      player.current = videojs(element.current, buildOptions(sources, tracks), () => {
        // Set clock tick
        if (onTimeUpdate) {
          player.current.on('play', () => {
            setInterval(() => {
              const currentTime = player.current.currentTime();
              onTimeUpdate(currentTime);
            }, 1000 / config.rps);
          });

          player.current.on('pause', () => clearInterval());
        }

        // Set starting point
        if (time) {
          player.current.on('loadedmetadata', () => {
            const duration = player.current.duration();
            if (time < duration) {
              player.current.currentTime(time);
            }
          });
        }

        // Set ready
        if (onPlayerReady) onPlayerReady(ID.WEBCAMS, player.current);
      });
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [ onTimeUpdate, time, onPlayerReady ]);

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
          ref={node => element.current = node}
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
