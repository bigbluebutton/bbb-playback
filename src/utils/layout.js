import { controls } from 'config';
import {
  getContentFromData,
  getControlFromLayout,
  getSectionFromLayout,
  getSwapFromLayout,
  isContentVisible,
} from 'utils/data';

export default class Layout {
  constructor(data, layout) {
    this.content = getContentFromData(data);
    this.layout = layout;
  }

  getContent() {
    return this.content;
  }

  initControl() {
    return getControlFromLayout(this.layout);
  }

  initSection() {
    return getSectionFromLayout(this.layout);
  }

  initSwap() {
    return getSwapFromLayout(this.layout);
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

  hasTalkers(layout, state) {
    const { swap } = state;
    const single = this.isSingle();

    if (!isContentVisible(layout, swap || single)) return false;

    return true;
  }

  isSingle() {
    const {
      presentation,
      screenshare,
    } = this.content;

    return !presentation && !screenshare;
  }
}
