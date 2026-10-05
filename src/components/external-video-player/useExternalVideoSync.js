import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logger from 'utils/logger';
import player from 'utils/player';
import { getVideoState } from './timeline';

const SYNC_INTERVAL_MS = 250;
const DRIFT_SECONDS = 1;
const EVENT_DRIFT_SECONDS = 0.5;
const SEEK_COOLDOWN_MS = 1000;
const PLAY_START_TIMEOUT_MS = 5000;
const PRIMARY_EVENTS = ['play', 'pause', 'ended', 'seeking', 'seeked',
  'ratechange', 'volumechange', 'waiting', 'playing', 'canplay'];
const getPrimaryPlayer = () => player.primary;
const initialView = {
  video: null, playing: false, playbackRate: 1, volume: 1, muted: false,
  autoPlayBlocked: false, error: null,
};
const newPlaybackStatus = () => ({
  ready: false, buffering: false, actualPlaying: false, externalEnded: false,
  positionReady: false, initialSeekStartedAt: null,
  forceSeek: true, lastSeekAt: -Infinity, lastEventIndex: -1,
});

// React state describes the props/UI to render. Provider observations and seek
// bookkeeping stay in refs: they must be available synchronously to callbacks.
export default function useExternalVideoSync(videos, getPrimary = getPrimaryPlayer) {
  const [view, setView] = useState(initialView);
  const playerRef = useRef(null);
  const desiredView = useRef(initialView);
  const committedView = useRef(initialView);
  const playback = useRef(newPlaybackStatus());
  const connection = useRef(null);

  // A URL/key or playing/rate change must reach ReactPlayer before seekTo runs.
  // This replaces setState(..., sync), without a timer reading an old render.
  useLayoutEffect(() => {
    committedView.current = view;
    connection.current?.sync();
  }, [view]);

  useEffect(() => {
    let active = true;
    let primary = null;
    let primaryWaiting = false;
    let playTimeout = null;

    function publish(changes) {
      const current = desiredView.current;
      if (!Object.keys(changes).some(key => changes[key] !== current[key])) return;
      desiredView.current = { ...current, ...changes };
      setView(desiredView.current);
    }

    function clearPlayTimeout() {
      clearTimeout(playTimeout);
      playTimeout = null;
    }

    function detachPrimary() {
      if (primary) PRIMARY_EVENTS.forEach(event => primary.off(event, onPrimaryEvent));
      primary = null;
    }

    function connectPrimary(next) {
      if (next === primary) return;
      detachPrimary();
      primary = next;
      primaryWaiting = false;
      playback.current.forceSeek = true;
      if (primary) PRIMARY_EVENTS.forEach(event => primary.on(event, onPrimaryEvent));
    }

    function onPrimaryEvent(event) {
      if (event.type === 'waiting') primaryWaiting = true;
      if (['playing', 'canplay', 'seeked'].includes(event.type)) primaryWaiting = false;
      if (['seeking', 'seeked'].includes(event.type)) {
        playback.current.forceSeek = true;
      }
      sync();
    }

    function selectVideo(video) {
      if (video === desiredView.current.video) return;
      clearPlayTimeout();
      playback.current = newPlaybackStatus();
      publish({ video, playing: false, error: null, autoPlayBlocked: false });
    }

    function updatePlayWarning(playing) {
      const status = playback.current;
      if (!playing) {
        clearPlayTimeout();
        publish({ autoPlayBlocked: false });
      } else if (!status.actualPlaying && !status.externalEnded && !status.buffering
        && !playTimeout && !desiredView.current.autoPlayBlocked) {
        playTimeout = setTimeout(() => {
          playTimeout = null;
          const latest = playback.current;
          if (active && (desiredView.current.playing || !latest.positionReady)
            && !latest.actualPlaying && !latest.buffering) {
            publish({ autoPlayBlocked: true });
          }
        }, PLAY_START_TIMEOUT_MS);
      }
    }

    function preparePosition(target) {
      const status = playback.current;
      if (status.positionReady) return true;
      const external = playerRef.current;
      if (!status.ready || primary.seeking() || !external) return false;
      const now = Date.now();
      if (status.initialSeekStartedAt === null) status.initialSeekStartedAt = now;
      if (!status.buffering && (status.forceSeek || target.eventIndex !== status.lastEventIndex
        || now - status.lastSeekAt >= SEEK_COOLDOWN_MS)) {
        // Keep playing=false until the provider reports the requested position.
        status.forceSeek = false;
        status.lastEventIndex = target.eventIndex;
        status.lastSeekAt = now;
        external.seekTo(target.position, 'seconds', false);
      }
      const currentTime = external.getCurrentTime();
      // The recording keeps advancing while the provider seeks. Allow at most
      // one sync tick of movement when the viewer uses a high playback rate.
      const tolerance = Math.max(EVENT_DRIFT_SECONDS,
        SYNC_INTERVAL_MS / 1000 * target.rate * primary.playbackRate());
      if (Number.isFinite(currentTime) && Math.abs(currentTime - target.position) <= tolerance) {
        status.positionReady = true;
      } else if (now - status.initialSeekStartedAt >= PLAY_START_TIMEOUT_MS) {
        // Some providers cannot seek/report time until play. Do not prevent
        // autoplay or the user's manual start indefinitely in that case.
        status.positionReady = true;
        status.forceSeek = true;
      }
      return status.positionReady;
    }

    function correctPosition(target, playing) {
      const status = playback.current;
      const external = playerRef.current;
      if (!status.ready || status.buffering || primary.seeking() || !external) return;
      const eventChanged = target.eventIndex !== status.lastEventIndex;
      const currentTime = external.getCurrentTime();
      const measured = Number.isFinite(currentTime);
      const difference = measured ? Math.abs(currentTime - target.position) : Infinity;
      const eventNeedsSeek = eventChanged && difference > EVENT_DRIFT_SECONDS;
      const now = Date.now();
      const drifted = playing && status.actualPlaying && measured && difference > DRIFT_SECONDS
        && now - status.lastSeekAt >= SEEK_COOLDOWN_MS;
      // Consume small event corrections too, so the next tick does not retry.
      status.lastEventIndex = target.eventIndex;
      if (status.forceSeek || eventNeedsSeek || drifted) {
        status.forceSeek = false;
        status.lastSeekAt = now;
        external.seekTo(target.position, 'seconds', playing);
      }
    }

    function sync() {
      if (!active) return;
      const nextPrimary = getPrimary();
      connectPrimary(nextPrimary?.isDisposed?.() ? null : nextPrimary || null);
      if (!primary) return;
      const target = getVideoState(videos, primary.currentTime());
      selectVideo(target?.video || null);
      if (!target || desiredView.current.error) return;
      // Wait for the new player and its key/props to be committed, then retry.
      if (committedView.current !== desiredView.current) return;
      const wantsPlay = playback.current.ready && target.playing && !primary.paused()
        && !primary.ended() && !primary.seeking() && !primaryWaiting;
      publish({ playing: playback.current.positionReady && wantsPlay,
        playbackRate: target.rate * primary.playbackRate(),
        volume: primary.volume(), muted: primary.muted() });
      if (committedView.current !== desiredView.current) return;
      updatePlayWarning(wantsPlay);
      if (!preparePosition(target)) return;
      const playing = wantsPlay;
      publish({ playing });
      if (committedView.current !== desiredView.current) return;
      correctPosition(target, playing);
    }

    function onProviderEvent(video, type, error) {
      // Ignore callbacks from a video that has just been replaced/unmounted.
      if (!active || video !== desiredView.current.video) return;
      const status = playback.current;
      switch (type) {
        case 'ready':
          status.ready = true;
          status.forceSeek = true;
          break;
        case 'play':
          if (!status.positionReady) {
            status.positionReady = true;
            status.forceSeek = true;
          }
          status.actualPlaying = true;
          status.externalEnded = false;
          status.buffering = false;
          clearPlayTimeout();
          publish({ autoPlayBlocked: false });
          break;
        case 'pause':
          status.actualPlaying = false;
          return;
        case 'ended':
          status.actualPlaying = false;
          status.externalEnded = true;
          clearPlayTimeout();
          return;
        case 'buffer':
          status.buffering = true;
          clearPlayTimeout();
          return;
        case 'bufferEnd':
          status.buffering = false;
          break;
        case 'error': {
          clearPlayTimeout();
          const code = error?.data ?? error?.code ?? error?.message ?? error;
          logger.error('external_video: playback failed', error);
          publish({ error: String(code), playing: false });
          return;
        }
        default:
          return;
      }
      sync();
    }

    connection.current = { sync, onProviderEvent };
    sync();
    const timer = setInterval(sync, SYNC_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
      clearPlayTimeout();
      detachPrimary();
      connection.current = null;
    };
  }, [videos, getPrimary]);

  const notify = useCallback((type, error) => {
    connection.current?.onProviderEvent(view.video, type, error);
  }, [view.video]);

  return { ...view, playerRef, notify };
}
