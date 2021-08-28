import { controls } from 'config';
import { LAYOUT } from './constants';
import { getContentFromData } from './data';
import { isContentVisible } from './data/validators';

export default class Layout {
  constructor(data) {
    this.content = getContentFromData(data);
  }

  getContent() {
    return this.content;
  }

  getControl(layout) {
    const { DISABLED } = LAYOUT;

    let control = true;
    switch (layout) {
      case DISABLED:
        control = false;
        break;
      default:
    }

    return control;
  }

  getSection(layout) {
    const {
      CONTENT,
      MEDIA,
    } = LAYOUT;

    let section = true;
    switch (layout) {
      case CONTENT:
        section = false;
        break;
      case MEDIA:
        section = false;
        break;
      default:
    }

    return section;
  }

  getSwap(layout) {
    const {
      CONTENT,
      MEDIA,
      SWAPPED,
    } = LAYOUT;

    let swap = false;
    switch (layout) {
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
  }

  getBottomContentStyle(state) {
    const {
      fullscreen,
      thumbnails,
    } = state;

    const bottom = thumbnails && !fullscreen;
    const style = { 'inactive': !bottom };

    return style;
  }

  getContentStyle(state) {
    const { swap } = state;
    const style = { 'swapped-content': swap };

    return style;
  }

  getMediaStyle(state) {
    const { swap } = state;
    const single = this.isSingle();
    const style = { 'swapped-media': swap || single };

    return style;
  }

  getPlayerStyle(state) {
    const {
      fullscreen,
      section,
    } = state;

    const single = this.isSingle();

    const style = {
      'fullscreen-content': fullscreen,
      'hidden-section': !section,
      'single-content': single,
    };

    return style;
  }

  hasFullscreenButton(layout, state) {
    const {
      control,
      swap,
    } = state;

    if (!control || !controls.fullscreen) return false;

    const single = this.isSingle();
    if (!isContentVisible(layout, swap || single)) return false;

    return true;
  }

  hasScreenshare() {
    const { screenshare } = this.content;

    return screenshare;
  }

  isSingle() {
    const {
      presentation,
      screenshare,
    } = this.content;

    return !presentation && !screenshare;
  }
}
