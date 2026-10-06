import { useEffect, useState } from 'react';
import { externalVideos as config } from 'config';
import player from 'utils/player';
import { getUpcomingVideo, getVideoState } from './timeline';

const PRIMARY_EVENTS = ['seeking', 'seeked', 'loadedmetadata', 'durationchange'];

// Keep the active player and at most one upcoming player mounted. Stable keys
// let the upcoming instance become active without losing its SDK/readiness.
export default function useExternalVideoSlots(videos) {
  const [slots, setSlots] = useState([]);
  useEffect(() => {
    let active = true;
    let primary = null;
    function detach() {
      if (primary) PRIMARY_EVENTS.forEach(event => primary.off(event, refresh));
    }
    function refresh() {
      if (!active) return;
      const candidate = player.primary;
      const next = candidate?.isDisposed?.() ? null : candidate || null;
      if (next !== primary) {
        detach();
        primary = next;
        if (primary) PRIMARY_EVENTS.forEach(event => primary.on(event, refresh));
      }
      let selected = [];
      if (primary) {
        const time = primary.currentTime();
        const duration = primary.duration?.();
        const current = getVideoState(videos, time, duration)?.video;
        const upcoming = getUpcomingVideo(videos, time, duration, config.preloadSeconds);
        selected = [current, upcoming].filter(Boolean);
      }
      setSlots(current => current.length === selected.length
        && current.every((video, index) => video === selected[index]) ? current : selected);
    }
    refresh();
    const timer = setInterval(refresh, 250);
    return () => { active = false; clearInterval(timer); detach(); };
  }, [videos]);
  return slots;
}
