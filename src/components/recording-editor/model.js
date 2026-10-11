// The editor uses full meeting time. Published playback removes record-off gaps.
export const formatTime = (ms = 0) => {
  const value = Math.max(0, Math.round(ms));
  const seconds = Math.floor(value / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.${String(value % 1000).padStart(3, '0')}`;
};

export const parseTime = (text) => {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(text.trim());
  if (!match || Number(match[2]) >= 60 || Number(match[3]) >= 60) return null;
  return Number(match[1] || 0) * 3600000 + Number(match[2]) * 60000
    + Number(match[3]) * 1000 + Number((match[4] || '').padEnd(3, '0'));
};

export const normalizeRanges = (ranges, duration) => ranges
  .map(r => ({ start_ms: Math.max(0, Math.round(r.start_ms)), end_ms: Math.min(duration, Math.round(r.end_ms)) }))
  .filter(r => r.end_ms > r.start_ms)
  .sort((a, b) => a.start_ms - b.start_ms)
  .reduce((all, range) => {
    const last = all[all.length - 1];
    if (last && last.end_ms >= range.start_ms) last.end_ms = Math.max(last.end_ms, range.end_ms);
    else all.push({ ...range });
    return all;
  }, []);

export const removeRange = (ranges, selection, duration) => normalizeRanges(ranges.flatMap(r => {
  if (selection.end_ms <= r.start_ms || selection.start_ms >= r.end_ms) return [r];
  return [
    { start_ms: r.start_ms, end_ms: Math.min(selection.start_ms, r.end_ms) },
    { start_ms: Math.max(selection.end_ms, r.start_ms), end_ms: r.end_ms },
  ];
}), duration);

export const externalVideos = (events, duration) => {
  const videos = [];
  let current;
  events.forEach(event => {
    const timestamp = event.time_ms / 1000;
    if (event.type === 'StartExternalVideoRecordEvent') {
      if (current) current.clear = timestamp;
      current = { timestamp, clear: duration / 1000, url: event.url, events: [] };
      videos.push(current);
    } else if (event.type === 'StopExternalVideoRecordEvent') {
      if (current) current.clear = timestamp;
      current = null;
    } else if (event.type === 'UpdateExternalVideoRecordEvent' && current) {
      current.events.push({ timestamp, type: event.status, time: event.position,
        rate: event.rate, playing: Number(event.state) !== 0 });
    }
  });
  return videos;
};

const merge = (old, patch) => {
  const result = { ...old };
  Object.keys(patch).forEach(key => {
    // Raw events are untrusted. Never merge prototype-related keys.
    if (['__proto__', 'constructor', 'prototype'].includes(key)) return;
    const value = patch[key];
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(old?.[key] || {}, value) : value;
  });
  return result;
};

export const slideState = (events, time) => {
  let presentation = null;
  let page = 1;
  let camera = null;
  const pages = new Map();
  const lastPages = new Map();
  events.forEach(event => {
    if (event.time_ms > time) return;
    if (event.type === 'SharePresentationEvent') {
      presentation = event.presentation;
      page = lastPages.get(presentation) || event.page || 1;
      camera = null;
    } else if (event.type === 'GotoSlideEvent') {
      presentation = event.presentation || presentation;
      page = event.page;
      lastPages.set(presentation, page);
      camera = null;
    } else if (event.type === 'ResizeAndMoveSlideEvent') camera = event.camera;
    const key = `${event.presentation || presentation}:${event.page || page}`;
    if (event.type === 'AddTldrawShapeEvent') {
      const shapes = pages.get(key) || new Map();
      const id = event.shape_id || event.shape?.id;
      if (id && event.shape) shapes.set(id, merge(shapes.get(id) || {}, event.shape));
      pages.set(key, shapes);
    } else if (['DeleteTldrawShapeEvent', 'UndoShapeEvent', 'UndoAnnotationEvent'].includes(event.type)) {
      pages.get(key)?.delete(event.shape_id);
    } else if (['ClearPageEvent', 'ClearWhiteboardEvent'].includes(event.type)) pages.delete(key);
  });
  return { presentation, page, camera, shapes: [...(pages.get(`${presentation}:${page}`)?.values() || [])] };
};

export const audioAdapter = (audio, duration) => ({
  on: (name, callback) => audio.addEventListener(name, callback),
  off: (name, callback) => audio.removeEventListener(name, callback),
  currentTime: () => audio.currentTime,
  duration: () => duration / 1000,
  paused: () => audio.paused,
  ended: () => audio.ended,
  seeking: () => audio.seeking,
  playbackRate: () => audio.playbackRate,
  volume: () => audio.volume,
  muted: () => audio.muted,
  isDisposed: () => false,
});
