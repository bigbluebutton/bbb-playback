import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import videojs from 'video.js/core.es.js';
import { video as config } from 'config';
import {
  ID,
  buildFileURL,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.video.wrapper.aria',
    description: 'Aria label for the video wrapper',
  },
});

const buildSources = (media, metadata) => {
  return [
    {
      src: buildFileURL(metadata.id, 'video/webcams.mp4'),
      type: 'video/mp4',
    }, {
      src: buildFileURL(metadata.id, 'video/webcams.webm'),
      type: 'video/webm',
    },
  ].filter(source => media.find(m => source.type.includes(m)));
};

const buildTracks = (captions, metadata) => {
  return captions.map(lang => {
    const {
      locale,
      localeName,
    } = lang;

    return {
      kind: 'captions',
      src: buildFileURL(metadata.id, `caption_${locale}.vtt`),
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
  captions: PropTypes.array,
  media: PropTypes.array,
  metadata: PropTypes.object,
  onPlayerReady: PropTypes.func,
  onTimeUpdate: PropTypes.func,
  time: PropTypes.number,
};

const defaultProps = {
  captions: [],
  media: [],
  metadata: {},
  onPlayerReady: () => {},
  onTimeUpdate: () => {},
  time: 0,
};

const Video = ({
  captions,
  media,
  metadata,
  onPlayerReady,
  onTimeUpdate,
  time,
}) => {
  const intl = useIntl();
  const sources = useRef(buildSources(media, metadata));
  const tracks = useRef(buildTracks(captions, metadata));
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
        if (onPlayerReady) onPlayerReady(ID.VIDEO, player.current);
      });
    }

    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  });

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="video-wrapper"
      id={ID.VIDEO}
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

Video.propTypes = propTypes;
Video.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(Video, areEqual);
