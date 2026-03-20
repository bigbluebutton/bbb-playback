import logger from './logger';

const STORAGE_KEY = 'bbb-playback-progress';

// Minimum seconds before saving (avoid saving at the very start)
const MIN_TIME = 5;

// Save interval throttle — save at most every N seconds
const SAVE_INTERVAL = 5;

let lastSaveTime = 0;

/**
 * Get all saved progress entries from localStorage.
 */
const getAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    logger.warn('progress: failed to read localStorage', e);
    return {};
  }
};

/**
 * Save the current playback time for a given recording.
 * Throttled to avoid excessive writes.
 */
const save = (recordId, currentTime, duration) => {
  if (!recordId || currentTime < MIN_TIME) return;

  const now = Date.now();
  if (now - lastSaveTime < SAVE_INTERVAL * 1000) return;
  lastSaveTime = now;

  try {
    const entries = getAll();
    entries[recordId] = {
      time: currentTime,
      duration,
      updatedAt: now,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    logger.debug('progress: saved', recordId, currentTime.toFixed(1));
  } catch (e) {
    logger.warn('progress: failed to save', e);
  }
};

/**
 * Load the saved playback time for a given recording.
 * Returns the saved time in seconds, or 0 if none found.
 */
const load = (recordId) => {
  if (!recordId) return 0;

  try {
    const entries = getAll();
    const entry = entries[recordId];
    if (entry && entry.time > MIN_TIME) {
      logger.debug('progress: restored', recordId, entry.time.toFixed(1));
      return entry.time;
    }
  } catch (e) {
    logger.warn('progress: failed to load', e);
  }

  return 0;
};

/**
 * Clear the saved progress for a given recording.
 */
const clear = (recordId) => {
  try {
    const entries = getAll();
    delete entries[recordId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    logger.warn('progress: failed to clear', e);
  }
};

export default { save, load, clear };
