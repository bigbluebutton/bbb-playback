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
import { formatTime } from 'utils/format';
import { loadVideojsLanguage } from 'utils/videojsLanguage';
import {
  getMediaPreferences,
  saveMediaPreferences,
} from 'utils/preferences';
import progress from 'utils/progress';
import notify from 'utils/toast';
import watched from 'utils/watched';
import storage from 'utils/data/storage';
import player from 'utils/player';
import {
  renderBookmarkMarkers,
  renderSlideMarkers,
} from './markers';
import { attachTimelinePreview } from './preview';
import setupCaptionTranslation from './translation';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.webcams.wrapper.aria',
    description: 'Aria label for the webcams wrapper',
  },
  resumed: {
    id: 'player.resume.message',
    description: 'Message shown when playback resumes where the viewer left off',
  },
  restart: {
    id: 'player.resume.restart',
    description: 'Button to start the recording from the beginning',
  },
  previewSlide: {
    id: 'player.search.modal.slide',
    description: 'Slide label in the timeline preview',
  },
  autoTranslated: {
    id: 'player.captions.auto',
    description: 'Suffix for machine translated caption languages',
  },
  translating: {
    id: 'player.captions.translating',
    description: 'Message shown while captions are being translated',
  },
  translateFailed: {
    id: 'player.captions.failed',
    description: 'Message shown when captions could not be translated',
  },
  downloading: {
    id: 'player.captions.downloading',
    description: 'Message shown while the browser downloads a translation language pack',
  },
  ready: {
    id: 'player.captions.ready',
    description: 'Message shown when translated captions start showing',
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
      pictureInPictureToggle: !storage.fallback && document.pictureInPictureEnabled === true,
      volumePanel: {
        inline: false,
        vertical: true,
      },
    },
    controls: true,
    fill: true,
    html5: {
      // Safari's native text tracks ignore the `tracks` option (no CC
      // button) and skip the player's caption styling, so video.js renders
      // captions itself in every browser
      nativeTextTracks: false,
    },
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

// `seek` marks updates caused by jumping, not by playing
const dispatchTimeUpdate = (time, seek = false) => {
  const event = new CustomEvent(EVENTS.TIME_UPDATE, { detail: { seek, time } });
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
    let cancelled = false;

    // Controls are labelled when created, so the translation comes first
    loadVideojsLanguage(intl.locale).then((language) => {
      if (cancelled || player.webcams) return;

      const video = element.current;
      if (!video) return;

      const options = buildOptions(sources, tracks);
      if (language) {
        videojs.addLanguage(language.code, language.translations);
        options.language = language.code;
      }

      player.webcams = videojs(video, options, () => {
        const recordId = storage.metadata.id;
        watched.load(recordId);

        const preferences = getMediaPreferences(config.rates);
        if (preferences.volume !== null) player.webcams.volume(preferences.volume);
        if (preferences.muted) player.webcams.muted(true);

        player.webcams.on('volumechange', () => {
          saveMediaPreferences({
            muted: player.webcams.muted(),
            volume: player.webcams.volume(),
          });
        });

        player.webcams.on('ratechange', () => {
          saveMediaPreferences({ rate: player.webcams.playbackRate() });
        });

        player.webcams.on('play', () => {
          if (interval.current) clearInterval(interval.current);
          const frequency = getFrequency();
          interval.current = setInterval(() => {
            if (player.webcams && !player.webcams.isDisposed()) {
              const currentTime = player.webcams.currentTime();
              dispatchTimeUpdate(currentTime);
              watched.track(currentTime, player.webcams.playbackRate());
              const now = Date.now();
              if (now - lastProgressSave.current >= progress.SAVE_INTERVAL) {
                progress.save(recordId, currentTime);
                lastProgressSave.current = now;
              }
            }
          }, 1000 / (frequency ? frequency : config.rps));
        });

        player.webcams.on('seeking', () => watched.interrupt());
        player.webcams.on('ended', () => watched.interrupt());

        player.webcams.on('pause', () => {
          watched.interrupt();
          clearInterval(interval.current);
          progress.save(recordId, player.webcams.currentTime());
        });

        player.webcams.on('seeked', () => {
          const currentTime = player.webcams.currentTime();
          dispatchTimeUpdate(currentTime, player.webcams.paused());
          progress.save(recordId, currentTime);
        });

        player.webcams.on('ended', () => progress.clear(recordId));

        // Restore position: URL time param takes priority, then localStorage
        player.webcams.one('loadedmetadata', () => {
          if (preferences.rate !== null) player.webcams.playbackRate(preferences.rate);

          const duration = player.webcams.duration();
          const urlTime = getTime();
          if (urlTime !== null && urlTime < duration) {
            player.webcams.currentTime(urlTime);
          } else {
            const savedTime = progress.load(recordId);
            if (savedTime && savedTime < duration) {
              player.webcams.currentTime(savedTime);
              notify({
                action: {
                  label: intl.formatMessage(intlMessages.restart),
                  onClick: () => {
                    player.webcams.currentTime(0);
                    progress.clear(recordId);
                  },
                },
                duration: 8000,
                message: intl.formatMessage(intlMessages.resumed, { time: formatTime(savedTime) }),
              });
            }
          }
        });

        player.webcams.on('loadedmetadata', () => {
          renderSlideMarkers(player.webcams);
          renderBookmarkMarkers(player.webcams);
        });

        const handleBookmarks = () => renderBookmarkMarkers(player.webcams);
        document.addEventListener(EVENTS.BOOKMARKS, handleBookmarks);
        player.webcams.on('dispose', () => document.removeEventListener(EVENTS.BOOKMARKS, handleBookmarks));

        attachTimelinePreview(player.webcams, {
          slideLabel: (number) => intl.formatMessage(intlMessages.previewSlide, { number }),
        });

        setupCaptionTranslation(player.webcams, {
          label: intl.formatMessage(intlMessages.autoTranslated),
          locale: intl.locale,
          onFailed: (language) => notify({ message: intl.formatMessage(intlMessages.translateFailed, { language }) }),
          onProgress: (language, percent) => notify({
            duration: 15000,
            message: intl.formatMessage(intlMessages.downloading, { language, percent }),
          }),
          onReady: (language) => notify({
            duration: 2500,
            message: intl.formatMessage(intlMessages.ready, { language }),
          }),
          onStart: (language) => notify({ message: intl.formatMessage(intlMessages.translating, { language }) }),
        });
      });
      logger.debug(ID.WEBCAMS, 'mounted');
    });

    return () => {
      cancelled = true;
    };
    // The video.js player is created once; the locale cannot change meanwhile
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      role="region"
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
