import logger from './logger';

const STORAGE_KEY = 'bbb-playback-progress';

// Minimum seconds before saving (avoid saving at the very start)
const MIN_TIME = 5;

// Milliseconds between periodic saves during playback
const SAVE_INTERVAL = 5000;

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
 */
const save = (recordId, time) => {
  if (!recordId || time < MIN_TIME) return;

  try {
    const entries = getAll();
    entries[recordId] = time;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    logger.debug('progress: saved', recordId, time.toFixed(1));
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
    const time = entries[recordId];
    if (time > MIN_TIME) {
      logger.debug('progress: restored', recordId, time.toFixed(1));
      return time;
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

const progress = { save, load, clear, SAVE_INTERVAL };

export default progress;
