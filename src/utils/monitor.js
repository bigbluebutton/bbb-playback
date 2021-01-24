import { monitor as config } from 'config';
import logger from './logger';

export default class Monitor {
  constructor(id) {
    this.enabled = config.enabled;
    this.id = id;
    this.interval = config.interval * 1000;
    this.url = config.url;
  }

  buildBody(message) {
    return JSON.stringify(
      Object.assign(
        { id: this.id },
        message,
      )
    );
  }

  collect(request) {
    if (!this.enabled) return null;

    setInterval(() => {
      const message = request();
      logger.debug('monitor', message);
      this.send(message);
    }, this.interval);
  }

  send(message) {
    fetch(this.url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: this.buildBody(message),
    });
  }
}
