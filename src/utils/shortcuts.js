import { shortcuts as config } from 'config';
import logger from './logger';

export default class Shortcuts {
  constructor() {
    this.enabled = config.enabled;
    this.listeners = [];

    if (!this.enabled) {
      logger.debug('shortcuts', 'disabled');
    }
  }

  add(key, action) {
    if (!this.enabled) return null;

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

    const listener = document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey) {
        if (e.key === key) action();
      }
    });

    this.listeners.push(listener);
  }

  destroy() {
    this.listeners.forEach(listener => {
      document.removeEventListener(listener);
    });
  }
}
