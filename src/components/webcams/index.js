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
        return [{ src: buildFileURL('audio/audio.webm'), type: 'audio/webm' }];
    }
    return [
        { src: buildFileURL('video/webcams.mp4'),  type: 'video/mp4'  },
        { src: buildFileURL('video/webcams.webm'), type: 'video/webm' },
    ].filter(source => storage.media.find(m => source.type.includes(m)));
};

const buildOptions = () => ({
    autoplay: true,
    controlBar: {
        fullscreenToggle: false,
        pictureInPictureToggle: false,
        volumePanel: { inline: false, vertical: true },
    },
    controls: true,
    fill: true,
    inactivityTimeout: 0,
    playbackRates: config.rates,
    html5: { nativeTextTracks: true }, // let browser parse VTT; we'll render externally
});

const dispatchTimeUpdate = (time) => {
    const event = new CustomEvent(EVENTS.TIME_UPDATE, { detail: { time }});
    document.dispatchEvent(event);
}

/** External subtitles: render active cue into container; handle lang switch & Off. */
function bindExternalSubs(playerInstance, containerEl) {
    if (!playerInstance || !containerEl) return () => {};

    let currentTrack = null;
    let currentLang = null;
    let pollTimer = null;

    const clear = () => { containerEl.innerHTML = ''; };

    const attach = (track) => {
        if (!track) return;
        const onCueChange = () => {
            const cues = track.activeCues;
            if (cues && cues.length) {
                const html = cues[0].text.replace(/\n/g, '<br>');
                containerEl.innerHTML = `<span>${html}</span>`;
            } else {
                clear();
            }
        };
        track.addEventListener('cuechange', onCueChange);
        track._off = () => track.removeEventListener('cuechange', onCueChange);
        // fire once in case cue already active
        onCueChange();
    };

    const detach = () => {
        if (currentTrack && currentTrack._off) currentTrack._off();
        currentTrack = null;
        currentLang = null;
        clear();
    };

    const getActiveTrack = () => {
        const list = playerInstance.textTracks();
        if (!list) return null;
        // 'Off' means no track with mode === 'showing'
        for (let i = 0; i < list.length; i++) {
            const t = list[i];
            if (t && (t.kind === 'subtitles' || t.kind === 'captions') && t.mode === 'showing') {
                return t;
            }
        }
        return null;
    };

    const rebindIfChanged = () => {
        const active = getActiveTrack();
        if (!active) {
            if (currentTrack) detach(); // turned Off
            return;
        }
        const lang = (active.language || '').toLowerCase();
        if (currentTrack !== active || currentLang !== lang) {
            // switch
            detach();
            currentTrack = active;
            currentLang = lang;
            currentTrack.mode = 'showing';
            attach(currentTrack);
        }
    };

    // Initial bind
    rebindIfChanged();

    // Listen to Video.js track toggles
    const onChange = () => {
        // Wait to end of frame so mode flags are final
        (window.requestAnimationFrame || setTimeout)(rebindIfChanged, 0);
    };
    playerInstance.on('texttrackchange', onChange);

    // Some browsers are quirky; add a light poll as a safety net
    pollTimer = setInterval(rebindIfChanged, 250);

    return () => {
        playerInstance.off('texttrackchange', onChange);
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        detach();
    };
}

const Webcams = () => {
    const intl = useIntl();

    const sources        = useRef(buildSources());
    const tracks         = useRef(storage.captions || []); // [{ localeName, locale, default }]
    const element        = useRef(null);
    const interval       = useRef(null);
    const textTracks     = useRef(null);
    const trackHandler   = useRef(null);
    const screenSubsRef  = useRef(null);

    useEffect(() => {
        if (player.webcams) return;

        const video = element.current;
        if (!video) return;

        // Remove legacy <track> tags then add fresh ones (with src set immediately)
        video.querySelectorAll('track').forEach(t => t.remove());

        tracks.current.forEach(({ locale, localeName, default: isDefault }) => {
            const lang = (locale || '').replace(/_/g, '-').toLowerCase();
            const el = document.createElement('track');
            el.kind    = 'captions';
            el.label   = localeName;
            el.srclang = lang;
            if (isDefault) el.default = true;
            el.src = buildFileURL(`caption_${locale}.vtt`); // EAGER load (robust switching)
            video.appendChild(el);
        });

        // Create player
        player.webcams = videojs(video, buildOptions(), () => {
            player.webcams.play();

            player.webcams.on('play', () => {
                const frequency = getFrequency();
                interval.current = setInterval(() => {
                    dispatchTimeUpdate(player.webcams.currentTime());
                }, 1000 / (frequency || config.rps));
            });

            player.webcams.on('pause', () => clearInterval(interval.current));
            player.webcams.on('seeked', () => dispatchTimeUpdate(player.webcams.currentTime()));

            const time = getTime();
            if (time) {
                player.webcams.on('loadedmetadata', () => {
                    const duration = player.webcams.duration();
                    if (time < duration) player.webcams.currentTime(time);
                });
            }

            // Get TextTracks list
            textTracks.current = player.webcams.textTracks();

            // Ensure a sensible default: prefer server default, then UI/browser, else first track
            const selectPreferred = () => {
                const serverDefault = (tracks.current.find(t => t.default)?.locale || '').toLowerCase();
                const preferredLang = (serverDefault || storage?.locale || navigator.language || 'en')
                    .split('-')[0].toLowerCase();

                // Pick by language code; fall back to first
                const list = textTracks.current;
                let picked = null;
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        const tt = list[i];
                        const lang = (tt.language || '').toLowerCase();
                        if (tt.kind === 'captions' || tt.kind === 'subtitles') {
                            if (lang === preferredLang || lang.startsWith(preferredLang + '-')) {
                                picked = tt; break;
                            }
                            if (!picked) picked = tt; // first
                        }
                    }
                }
                // Activate (or keep Off if none wanted)
                if (picked) picked.mode = 'showing';
            };

            // Call a few times to win races in some browsers
            selectPreferred();
            setTimeout(selectPreferred, 80);
            setTimeout(selectPreferred, 300);

            // Bind the external subtitles overlay (handles language changes & Off)
            const cleanupSubs = bindExternalSubs(player.webcams, screenSubsRef.current);
            player._cleanupSubs = cleanupSubs;
        });

        logger.debug(ID.WEBCAMS, 'mounted');

        return () => {
            if (player.webcams) {
                if (player._cleanupSubs) { player._cleanupSubs(); player._cleanupSubs = null; }
                clearInterval(interval.current);
                player.webcams.dispose();
                player.webcams = null;
            }
            logger.debug(ID.WEBCAMS, 'unmounted');
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
                    id="player"
                    className="video-js"
                    playsInline
                    preload="auto"
                    autoPlay
                    muted
                    crossOrigin="anonymous"
                    ref={element}
                >
                    <source src={buildFileURL('video/webcams.mp4')}  type="video/mp4" />
                    <source src={buildFileURL('video/webcams.webm')} type="video/webm" />
                </video>
            </div>

            {/* External subtitle bar OUTSIDE the video element */}
            <div id="screen-subs" className="screen-subs" aria-live="polite" dir="auto" ref={screenSubsRef} />
        </div>
    );
};

// Avoid re-render
const areEqual = () => true;
export default React.memo(Webcams, areEqual);