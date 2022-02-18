import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import videojs from 'video.js/core.es.js';
import { player as config } from 'config';
import {
  EVENTS,
  ID,
} from 'utils/constants';
import { buildFileURL } from 'utils/data';
import logger from 'utils/logger';
import {
  getFrequency,
  getTime,
} from 'utils/params';
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
  if (storage.fallback) {
    return [
      {
        src: buildFileURL('audio/audio.webm'),
        type: 'audio/webm',
      },
    ];
  }

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

const dispatchTimeUpdate = (time) => {
  const event = new CustomEvent(EVENTS.TIME_UPDATE, { detail: { time }});
  document.dispatchEvent(event);
};

const Webcams = () => {
  const intl = useIntl();
  const sources = useRef(buildSources());
  const tracks = useRef(buildTracks());
  const element = useRef();
  const interval = useRef();

  useEffect(() => {
    if (!player.webcams) {
      const video = element.current;
      if (!video) return;

      player.webcams = videojs(video, buildOptions(sources, tracks), () => {
        player.webcams.on('play', () => {
          const frequency = getFrequency();
          interval.current = setInterval(() => {
            const currentTime = player.webcams.currentTime();
            dispatchTimeUpdate(currentTime);
          }, 1000 / (frequency ? frequency : config.rps));
        });

        player.webcams.on('pause', () => clearInterval(interval.current));

        player.webcams.on('seeked', () => {
          const currentTime = player.webcams.currentTime();
          dispatchTimeUpdate(currentTime);
        });

        const time = getTime();
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
  }, []);

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

// Avoid re-render
const areEqual = () => true;

export default React.memo(Webcams, areEqual);
