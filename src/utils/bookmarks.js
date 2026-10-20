import { EVENTS } from './constants';
import logger from './logger';

const STORAGE_KEY = 'bbb-playback-bookmarks';
const MAX_NOTE = 280;

const readAll = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    return {};
  }
};

const writeAll = (all) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    logger.warn('bookmarks', 'failed to save', error);
  }
};

const notify = (recordId) => {
  document.dispatchEvent(new CustomEvent(EVENTS.BOOKMARKS, { detail: { recordId } }));
};

const isBookmark = (item) => item && typeof item.id === 'string' && Number.isFinite(item.time);

// Bookmarks of a recording, oldest moment first
const list = (recordId) => {
  const items = readAll()[recordId];
  if (!Array.isArray(items)) return [];

  return items.filter(isBookmark).sort((a, b) => a.time - b.time);
};

const save = (recordId, items) => {
  const all = readAll();
  if (items.length > 0) {
    all[recordId] = items;
  } else {
    delete all[recordId];
  }
  writeAll(all);
  notify(recordId);
};

// Moments closer than a second are the same bookmark
const add = (recordId, time, note = '') => {
  if (!recordId || !Number.isFinite(time)) return null;

  const items = list(recordId);
  const existing = items.find(item => Math.abs(item.time - time) < 1);
  if (existing) return existing;

  const bookmark = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    note: note.slice(0, MAX_NOTE),
    time: Math.max(0, time),
  };
  save(recordId, [...items, bookmark]);

  return bookmark;
};

const update = (recordId, id, note) => {
  const items = list(recordId).map(item => (
    item.id === id ? { ...item, note: (note || '').slice(0, MAX_NOTE) } : item
  ));
  save(recordId, items);
};

const remove = (recordId, id) => {
  save(recordId, list(recordId).filter(item => item.id !== id));
};

const bookmarks = {
  add,
  list,
  remove,
  update,
};

export default bookmarks;
