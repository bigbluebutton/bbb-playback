import { controls } from 'config';
import { LAYOUT } from 'utils/constants';
import storage from 'utils/data/storage';
import { isContentVisible } from 'utils/data/validators';

let MODE = null;

const layout = {
  get content() {
    return storage.content;
  },
  get mode() {
    return MODE;
  },
  set mode(value) {
    MODE = value;
  },
  get control() {
    const { DISABLED } = LAYOUT;

    let control = true;
    switch (this.mode) {
      case DISABLED:
        control = false;
        break;
      default:
    }

    return control;
  },
  get section() {
    const {
      CONTENT,
      MEDIA,
    } = LAYOUT;

    let section = true;
    switch (this.mode) {
      case CONTENT:
        section = false;
        break;
      case MEDIA:
        section = false;
        break;
      default:
    }

    return section;
  },
  get swap() {
    const {
      CONTENT,
      MEDIA,
      SWAPPED,
    } = LAYOUT;

    let swap = false;
    switch (this.mode) {
      case CONTENT:
        swap = false;
        break;
      case MEDIA:
      case SWAPPED:
        swap = true;
        break;
      default:
    }

    return swap;
  },
  get screenshare() {
    return this.content.screenshare;
  },
  get single() {
    return !this.content.presentation && !this.content.screenshare;
  },
  getBottomContentStyle: function ({ fullscreen, thumbnails }) {
    const bottom = thumbnails && !fullscreen;
    const style = { 'inactive': !bottom };

    return style;
  },
  getContentStyle: function ({ swap }) {
    const style = { 'swapped-content': swap };

    return style;
  },
  getMediaStyle: function ({ swap }) {
    const style = { 'swapped-media': swap || this.single };

    return style;
  },
  getPlayerStyle: function ({ fullscreen, section }) {
    const style = {
      'fullscreen-content': fullscreen,
      'hidden-section': !section,
      'single-content': this.single,
    };

    return style;
  },
  hasFullscreenButton: function (content, { control, swap }) {
    if (!control || !controls.fullscreen) return false;

    if (!isContentVisible(content, swap || this.single)) return false;

    return true;
  },
};

export default layout;
