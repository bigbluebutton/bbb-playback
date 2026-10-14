import { shortcuts as config } from 'config';
import logger from './logger';

const EDITABLE = ['INPUT', 'SELECT', 'TEXTAREA'];

const isEditable = (target) => {
  if (!target) return false;

  return EDITABLE.includes(target.tagName) || target.isContentEditable === true;
};

// With Alt pressed some layouts (e.g. macOS) report a different character
// in event.key, so the physical key in event.code is checked as well
const matches = (event, key) => {
  if (event.key === key) return true;

  if (key.length === 1) {
    if (typeof event.key === 'string' && event.key.toUpperCase() === key.toUpperCase()) return true;

    return event.code === `Key${key.toUpperCase()}` || event.code === `Digit${key}`;
  }

  return event.code === key;
};

export default class Shortcuts {
  constructor(actions) {
    this.enabled = config.enabled;
    this.listeners = [];

    if (!this.enabled) {
      logger.debug('shortcuts', 'disabled');
    } else {
      this.init(actions);
    }
  }

  init(actions) {
    for (let prop in actions) {
      const value = actions[prop];
      if (typeof value === 'function') {
        const key = config[prop];
        this.add(key, value);
      } else {
        for (let p in value) {
          const k = config[prop][p];
          const v = value[p];
          this.add(k, v);
        }
      }
    }
  }

  add(key, action) {
    if (!key || typeof key !== 'string') {
      logger.warn('shortcuts', 'invalid', 'key');
      return null;
    } else if (key.length === 0) {
      return null;
    }

    if (!action || typeof action !== 'function') {
      logger.warn('shortcuts', 'invalid', 'action');
      return null;
    }

    const handler = (e) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;

      if (isEditable(e.target)) return;

      if (matches(e, key)) {
        e.preventDefault();
        action();
      }
    };

    document.addEventListener('keydown', handler);
    this.listeners.push(handler);
  }

  destroy() {
    this.listeners.forEach(listener => {
      document.removeEventListener('keydown', listener);
    });
    this.listeners = [];
  }
}

// Single key controls, like most video sites. Letters are matched by the
// character typed or, on other keyboard layouts (Arabic, Russian…), by the
// key's place on the keyboard, so K is K whatever the layout
const PLAIN_KEYS = {
  ' ': 'play',
  k: 'play',
  j: 'backward',
  arrowleft: 'backward',
  l: 'forward',
  arrowright: 'forward',
  f: 'fullscreen',
  m: 'mute',
  b: 'bookmark',
  // Typed with Shift on most layouts
  '<': 'slower',
  '>': 'faster',
  '?': 'help',
  '؟': 'help',
};

const PLAIN_CODES = {
  Space: 'play',
  KeyK: 'play',
  KeyJ: 'backward',
  ArrowLeft: 'backward',
  KeyL: 'forward',
  ArrowRight: 'forward',
  KeyF: 'fullscreen',
  KeyM: 'mute',
  KeyB: 'bookmark',
};

const SHIFTED_KEYS = ['<', '>', '?', '؟'];

const SHIFTED_CODES = {
  Comma: 'slower',
  Period: 'faster',
  Slash: 'help',
};

// What a focused element does with a key itself, so the shortcut keeps out:
// buttons and links take Space; sliders, menus, tabs and scrolling lists
// take the arrows (and Space scrolls a list). Any other key works anywhere
// but in text fields
const ACTIVATES = 'a, button, [role="button"], [role^="menuitem"], [role="tab"], [role="option"], summary';
const ARROWS = '[role="slider"], [role="menu"], [role^="menuitem"], [role="tablist"], [role="tab"], [role="listbox"], [role="radiogroup"], .vjs-menu';

const isScrollingList = (target) => {
  const list = target.closest('[tabindex]');

  return !!list && !list.closest('.video-js') && list !== document.body;
};

const keepsKey = (target, key) => {
  if (!target || target === document.body || target === document.documentElement) return false;
  if (isEditable(target)) return true;
  if (typeof target.closest !== 'function') return false;

  if (key === ' ') return !!target.closest(ACTIVATES) || isScrollingList(target);
  if (key === 'ArrowLeft' || key === 'ArrowRight') return !!target.closest(ARROWS) || isScrollingList(target);

  return false;
};

const findPlainAction = (event) => {
  const key = event.key.toLowerCase();
  if (event.shiftKey) {
    return (SHIFTED_KEYS.includes(event.key) && PLAIN_KEYS[event.key]) || SHIFTED_CODES[event.code] || null;
  }

  return PLAIN_KEYS[key] || PLAIN_CODES[event.code] || null;
};

const getPlainAction = (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return null;
  if (typeof event.key !== 'string') return null;

  const name = findPlainAction(event);
  if (!name) return null;

  // The key the element itself would see: Space or an arrow, by key or place
  const physical = event.code === 'Space' ? ' ' : event.code;
  const key = [' ', 'ArrowLeft', 'ArrowRight'].includes(event.key) ? event.key : physical;
  if (keepsKey(event.target, key)) return null;

  return name;
};

const addPlainShortcuts = (actions) => {
  if (!config.enabled || config.plain === false) return () => {};

  const handler = (event) => {
    const name = getPlainAction(event);
    if (!name || typeof actions[name] !== 'function') return;

    event.preventDefault();
    actions[name]();
  };

  document.addEventListener('keydown', handler);

  return () => document.removeEventListener('keydown', handler);
};

export {
  addPlainShortcuts,
  getPlainAction,
  matches,
};
