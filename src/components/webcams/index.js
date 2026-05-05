import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import videojs from 'video.js/dist/video.es.js';
import 'videojs-seek-buttons'
import { player as config, shortcuts } from 'config';
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
import progress from 'utils/progress';
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
    plugins: {
      seekButtons: {
        forward: shortcuts.seek.seconds,
        back: shortcuts.seek.seconds,
      }
    }
  };
};

const dispatchTimeUpdate = (time) => {
  const event = new CustomEvent(EVENTS.TIME_UPDATE, { detail: { time } });
  document.dispatchEvent(event);
};

const Webcams = () => {
  const intl = useIntl();
  const sources = useRef(buildSources());
  const tracks = useRef(buildTracks());
  const element = useRef();
  const interval = useRef();
  const lastProgressSave = useRef(0);

  useEffect(() => {
    if (!player.webcams) {
      const video = element.current;
      if (!video) return;

      player.webcams = videojs(video, buildOptions(sources, tracks), () => {
        const recordId = storage.metadata.id;

        player.webcams.on('play', () => {
          if (interval.current) clearInterval(interval.current);
          const frequency = getFrequency();
          interval.current = setInterval(() => {
            if (player.webcams && !player.webcams.isDisposed()) {
              const currentTime = player.webcams.currentTime();
              dispatchTimeUpdate(currentTime);
              const now = Date.now();
              if (now - lastProgressSave.current >= progress.SAVE_INTERVAL) {
                progress.save(recordId, currentTime);
                lastProgressSave.current = now;
              }
            }
          }, 1000 / (frequency ? frequency : config.rps));
        });

        player.webcams.on('pause', () => {
          clearInterval(interval.current);
          progress.save(recordId, player.webcams.currentTime());
        });

        player.webcams.on('seeked', () => {
          const currentTime = player.webcams.currentTime();
          dispatchTimeUpdate(currentTime);
          progress.save(recordId, currentTime);
        });

        player.webcams.on('ended', () => progress.clear(recordId));

        // Restore position: URL time param takes priority, then localStorage
        player.webcams.on('loadedmetadata', () => {
          const duration = player.webcams.duration();
          const urlTime = getTime();
          if (urlTime !== null && urlTime < duration) {
            player.webcams.currentTime(urlTime);
          } else {
            const savedTime = progress.load(recordId);
            if (savedTime && savedTime < duration) {
              player.webcams.currentTime(savedTime);
            }
          }
        });
      });
      logger.debug(ID.WEBCAMS, 'mounted');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (interval.current) clearInterval(interval.current);
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
