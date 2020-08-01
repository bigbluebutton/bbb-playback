import { shortcuts as config } from 'config';
import logger from './logger';

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
