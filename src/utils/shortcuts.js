import { shortcuts as config } from 'config';
import logger from './logger';

const LETTER = /^[a-z]$/i;

const EDITABLE = ['INPUT', 'SELECT', 'TEXTAREA'];

const isEditable = (target) => EDITABLE.includes(target.tagName) || target.isContentEditable;

// Letters are matched by the character typed. With Alt held, macOS types a
// different character (Option+Shift+K types the Apple logo, U+F8FF), and
// non-Latin layouts type their own letters (Л on a Russian layout): match the
// key's position instead
const matches = (event, key) => {
  if (!LETTER.test(key)) return event.key === key;

  if (LETTER.test(event.key)) return event.key.toUpperCase() === key.toUpperCase();

  return event.code === `Key${key.toUpperCase()}`;
};

export default class Shortcuts {
  constructor(actions) {
    this.enabled = config.enabled;

    if (!this.enabled) {
      logger.debug('shortcuts', 'disabled');
    } else {
      this.init(actions);
    }
  }

  init(actions) {
    this.listeners = [];

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
      // Text fields keep their own Alt+Shift keys (word selection on macOS)
      if (isEditable(e.target)) return;

      if (e.altKey && e.shiftKey && matches(e, key)) {
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
  }
}
