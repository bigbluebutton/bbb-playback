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
  forceSeek: true, lastSeekAt: -Infinity, lastEventIndex: -1,
});

export default function useExternalVideoSync(videos, getPrimary = getPrimaryPlayer) {
  const [view, setView] = useState(initialView);
  const playerRef = useRef(null);
  const desiredView = useRef(initialView);
  const committedView = useRef(initialView);
  const playback = useRef(newPlaybackStatus());
  const connection = useRef(null);

  // To avoid a small skip by seekTo just after a playing rate change.
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
          if (active && desiredView.current.playing && !latest.actualPlaying && !latest.buffering) {
            publish({ autoPlayBlocked: true });
          }
        }, PLAY_START_TIMEOUT_MS);
      }
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
      // Small event corrections are consumed without retrying on the next tick.
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
      const target = getVideoState(videos, primary.currentTime(), primary.duration?.());
      selectVideo(target?.video || null);
      if (!target || desiredView.current.error) return;
      // Wait for the new player and its key/props to be committed, then retry.
      if (committedView.current !== desiredView.current) return;
      const playing = playback.current.ready && target.playing && !primary.paused()
        && !primary.ended() && !primary.seeking() && !primaryWaiting;
      publish({ playing, playbackRate: target.rate * primary.playbackRate(),
        volume: primary.volume(), muted: primary.muted() });
      if (committedView.current !== desiredView.current) return;
      updatePlayWarning(playing);
      correctPosition(target, playing);
    }

    function onProviderEvent(video, type, error) {
      // Ignore callbacks from a video that has just been replaced/unmounted.
      if (!active || video !== desiredView.current.video) return;
      const status = playback.current;
      switch (type) {
        case 'ready':
          status.ready = true;
          break;
        case 'play':
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
