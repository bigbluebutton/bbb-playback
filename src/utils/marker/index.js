import videojs from 'video.js';
import { isValid } from 'utils/data';
import './index.scss';

const Plugin = videojs.getPlugin('plugin');

const defaults = {};

const getSeekBarElement = player => {
  let seekBarElement;

  if (player && player.controlBar) {
    const { progressControl } = player.controlBar;

    if (progressControl && progressControl.seekBar) {
      seekBarElement = progressControl.seekBar.el();
    }
  }

  return seekBarElement;
};

const getStyle = (time, duration) => {
  if (duration === 0 || time > duration) return '';

  const position = (time / duration) * 100;

  return `left: ${position}%`;
};

class Marker extends Plugin {
  constructor(player, options) {
    super(player);

    this.options = videojs.mergeOptions(defaults, options);
    this.duration = 0;
    this.marker = null;

    this.player.ready(() => {
      const properties = { className: 'vjs-marker' };
      this.duration = this.player.duration();
      this.marker = videojs.dom.createEl('div', properties);
      const seekBarElement = getSeekBarElement(this.player);
      seekBarElement.appendChild(this.marker);
    });
  }

  add(data) {
    if (!isValid('array', data)) return null;

    if (!this.marker) return null;

    data.forEach((time, index) => {
      const properties = {
        key: index,
        className: 'vjs-marker-item',
        style: getStyle(time, this.duration),
      };
      const item = videojs.dom.createEl('div', properties);
      this.marker.appendChild(item);
    });
  }

  clear() {
    if (!this.marker) return null;

    while (this.marker.firstChild) {
      this.marker.removeChild(this.marker.lastChild);
    }
  }
}

Marker.defaultState = {};

Marker.VERSION = '1.0.0';

videojs.registerPlugin('marker', Marker);

export default Marker;
