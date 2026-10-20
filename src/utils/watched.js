import { EVENTS } from './constants';
import logger from './logger';

const STORAGE_KEY = 'bbb-playback-watched';
const SAVE_INTERVAL = 5000;

// Watched time is kept as sorted, merged [start, end) ranges in seconds

const addRange = (ranges, start, end) => {
  if (!(end > start)) return ranges;

  const result = [];
  let merged = [start, end];
  let placed = false;

  ranges.forEach(([s, e]) => {
    if (e < merged[0]) {
      result.push([s, e]);
    } else if (s > merged[1]) {
      if (!placed) {
        result.push(merged);
        placed = true;
      }
      result.push([s, e]);
    } else {
      merged = [Math.min(s, merged[0]), Math.max(e, merged[1])];
    }
  });

  if (!placed) result.push(merged);

  return result;
};

// Seconds of [start, end) covered by the ranges
const coverage = (ranges, start, end) => {
  if (!(end > start)) return 0;

  return ranges.reduce((total, [s, e]) => {
    const overlap = Math.min(e, end) - Math.max(s, start);

    return overlap > 0 ? total + overlap : total;
  }, 0);
};

const readAll = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    return {};
  }
};

const isRange = (range) => Array.isArray(range) && range.length === 2 && range.every(Number.isFinite);

// Allowed drift between media time and wall time, in seconds
const TOLERANCE = 1.5;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

let state = {
  lastClock: 0,
  lastSaved: 0,
  lastTime: null,
  ranges: [],
  recordId: null,
};

const load = (recordId) => {
  const stored = readAll()[recordId];
  const ranges = Array.isArray(stored) ? stored.filter(isRange) : [];

  state = {
    lastClock: 0,
    lastSaved: Date.now(),
    lastTime: null,
    ranges: ranges.reduce((all, [s, e]) => addRange(all, s, e), []),
    recordId,
  };

  // Lets the progress shown so far catch up with earlier visits
  document.dispatchEvent(new CustomEvent(EVENTS.WATCHED));

  return state.ranges;
};

const save = () => {
  if (!state.recordId) return;

  try {
    const all = readAll();
    all[state.recordId] = state.ranges.map(([s, e]) => [Math.round(s * 10) / 10, Math.round(e * 10) / 10]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    state.lastSaved = Date.now();
  } catch (error) {
    logger.warn('watched', 'failed to save', error);
  }
};

// Counts the time between two consecutive updates as watched, as long as
// playback moved forward about as much as the clock and speed allow. Slow
// timers (background tabs) and fast speeds still count; a jump does not
const track = (time, rate = 1) => {
  const { lastClock, lastTime } = state;
  const clock = now();
  state.lastTime = time;
  state.lastClock = clock;

  if (lastTime === null || !state.recordId) return;

  const step = time - lastTime;
  const elapsed = (clock - lastClock) / 1000;
  const expected = elapsed * Math.max(rate || 1, 0.1);
  if (step <= 0 || step > expected + TOLERANCE) return;

  state.ranges = addRange(state.ranges, lastTime, time);
  document.dispatchEvent(new CustomEvent(EVENTS.WATCHED));

  if (Date.now() - state.lastSaved >= SAVE_INTERVAL) save();
};

// Playback stopped or jumped: the next update starts a new range
const interrupt = () => {
  state.lastTime = null;
  save();
};

const getRanges = () => state.ranges;

const isLoaded = () => state.recordId !== null;

// Keeps what was watched when the viewer leaves the page
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => save());

const watched = {
  coverage,
  getRanges,
  interrupt,
  isLoaded,
  load,
  save,
  track,
};

export {
  addRange,
  coverage,
};

export default watched;
