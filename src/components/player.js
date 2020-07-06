import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { files as config } from 'config';
import Chat from './chat';
import More from './more';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Thumbnails from './thumbnails';
import Video from './video';
import ActionBar from './bars/action';
import NavigationBar from './bars/navigation';
import Button from './utils/button';
import { addAlternatesToThumbnails } from 'utils/builder';
import {
  getActiveContent,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getDraws,
  getFileName,
  getSectionFromLayout,
  getSwapFromLayout,
  isEmpty,
} from 'utils/data';
import logger from 'utils/logger';
import Monitor from 'utils/monitor';
import Synchronizer from 'utils/synchronizer';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
});

export default class Player extends PureComponent {
  constructor(props) {
    super(props);

    const {
      data,
      layout,
    } = props;

    this.state = {
      control: getControlFromLayout(layout),
      fullscreen: false,
      more: false,
      section: getSectionFromLayout(layout),
      swap: getSwapFromLayout(layout),
      thumbnails: false,
      time: 0,
    }

    this.player = {
      video: null,
      screenshare: null,
    };

    this.id = 'player';

    this.alternates = data[getFileName(config.data.alternates)];
    this.captions = data[getFileName(config.data.captions)];
    this.chat = data[getFileName(config.data.chat)];
    this.cursor = data[getFileName(config.data.cursor)];
    this.metadata = data[getFileName(config.data.metadata)];
    this.panzooms = data[getFileName(config.data.panzooms)];
    this.screenshare = data[getFileName(config.data.screenshare)];
    this.shapes = data[getFileName(config.data.shapes)];

    this.canvases = this.shapes.canvases;
    this.slides = this.shapes.slides;
    this.thumbnails = addAlternatesToThumbnails(this.shapes.thumbnails, this.alternates);

    this.handlePlayerReady = this.handlePlayerReady.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);

    this.initMonitor(this.metadata.id);

    logger.debug('player', data);
  }

  handlePlayerReady(media, player) {
    switch (media) {
      case 'video':
        logger.debug('player', 'ready', 'video');
        this.player.video = player;
        break;
      case 'screenshare':
        logger.debug('player', 'ready', 'screenshare');
        this.player.screenshare = player;
        break;
      default:
        logger.debug('unhandled', media);
    }

    if (this.player.video && this.player.screenshare) {
      this.synchronizer = new Synchronizer(this.player.video, this.player.screenshare);
    }
  }

  handleTimeUpdate(value) {
    const { time } = this.state;

    if (time !== value) {
      this.setState({ time: value });
    }
  }

  initMonitor(id) {
    this.monitor = new Monitor(id);
    this.monitor.collect(() => {
      const { video } = this.player;
      if (!video) return {};

      const time = video.currentTime();
      return { time };
    });
  }

  toggleFullscreen() {
    const { fullscreen } = this.state;

    this.setState({ fullscreen: !fullscreen });
  }

  toggleMore() {
    const { more } = this.state;

    this.setState({ more: !more });
  }

  toggleSection() {
    const { section } = this.state;

    this.setState({ section: !section });
  }

  toggleSwap() {
    const { swap } = this.state;

    this.setState({ swap: !swap });
  }

  toggleThumbnails() {
    const { thumbnails } = this.state;

    this.setState({ thumbnails: !thumbnails });
  }

  renderFullscreenButton(layout) {
    const {
      control,
      fullscreen,
      swap,
    } = this.state;

    if (!control) return null;

    let visible;
    switch (layout) {
      case 'content':
        visible = !swap;
        break;
      case 'media':
        visible = swap;
        break;
      default:
        visible = false;
    }

    if (!visible) return null;

    return (
      <div className="fullscreen-button">
        <Button
          handleOnClick={() => this.toggleFullscreen()}
          icon={fullscreen ? 'exit-fullscreen' : 'fullscreen'}
          type="solid"
        />
      </div>
    );
  }

  renderMore() {
    const { more } = this.state;

    if (!more) return null;

    return (
      <More
        captions={!isEmpty(this.captions)}
        chat={!isEmpty(this.chat)}
        metadata={this.metadata}
        screenshare={!isEmpty(this.screenshare)}
        toggleMore={() => this.toggleMore()}
      />
    );
  }

  renderThumbnails() {
    const {
      time,
      thumbnails,
    } = this.state;

    if (!thumbnails) return null;

    const { intl } = this.props;
    const { video } = this.player;

    const currentDataIndex = getCurrentDataIndex(this.thumbnails, time);

    return (
      <Thumbnails
        currentDataIndex={currentDataIndex}
        intl={intl}
        metadata={this.metadata}
        player={video}
        thumbnails={this.thumbnails}
      />
    );
  }

  renderNavigationBar() {
    const {
      control,
      section,
    } = this.state;

    const {
      name,
      start,
    } = this.metadata;

    return (
      <NavigationBar
        control={control}
        start={start}
        name={name}
        section={section}
        toggleMore={() => this.toggleMore()}
        toggleSection={() => this.toggleSection()}
      />
    );
  }

  renderMedia() {
    const {
      data,
      intl,
      time,
    } = this.props;

    const { swap } = this.state;
    const { media } = data;

    return (
      <div className={cx('media', { 'swapped-media': swap })}>
        {this.renderFullscreenButton('media')}
        <Video
          captions={this.captions}
          intl={intl}
          media={media}
          metadata={this.metadata}
          onPlayerReady={this.handlePlayerReady}
          onTimeUpdate={this.handleTimeUpdate}
          time={time}
        />
      </div>
    );
  }

  renderApplication() {
    const { intl } = this.props;
    const { time } = this.state;
    const { video } = this.player;

    const currentChatIndex = getCurrentDataIndex(this.chat, time);

    return (
      <div className="application">
        <Chat
          chat={this.chat}
          currentDataIndex={currentChatIndex}
          intl={intl}
          player={video}
        />
      </div>
    );
  }

  renderPresentation(active) {
    const { intl } = this.props;
    const { time } = this.state;

    const currentSlideIndex = getCurrentDataIndex(this.slides, time);
    const currentPanzoomIndex = getCurrentDataIndex(this.panzooms, time);
    const currentCursorIndex = getCurrentDataIndex(this.cursor, time);
    const draws = getDraws(currentSlideIndex, this.slides, this.canvases);
    const currentDrawsInterval = getCurrentDataInterval(draws, time);

    return (
      <Presentation
        active={active}
        currentCursorIndex={currentCursorIndex}
        currentPanzoomIndex={currentPanzoomIndex}
        currentSlideIndex={currentSlideIndex}
        cursor={this.cursor}
        draws={draws}
        drawsInterval={currentDrawsInterval}
        intl={intl}
        metadata={this.metadata}
        panzooms={this.panzooms}
        slides={this.slides}
        thumbnails={this.thumbnails}
      />
    )
  }


  renderScreenshare(active) {
    // When there is no screenshare
    if (this.screenshare.length === 0) return null;

    const {
      intl,
      data,
    } = this.props;

    const { media } = data;

    return (
      <Screenshare
        active={active}
        intl={intl}
        media={media}
        metadata={this.metadata}
        onPlayerReady={this.handlePlayerReady}
      />
    );
  }

  renderContent() {
    const {
      swap,
      time,
    } = this.state;

    const content = getActiveContent(this.screenshare, time);

    return (
      <div className={cx('content', { 'swapped-content': swap })}>
        {this.renderFullscreenButton('content')}
        {this.renderPresentation(content === 'presentation')}
        {this.renderScreenshare(content === 'screenshare')}
      </div>
    );
  }

  renderActionBar() {
    const {
      control,
      thumbnails,
    } = this.state;

    return (
      <ActionBar
        control={control}
        thumbnails={thumbnails}
        toggleSwap={() => this.toggleSwap()}
        toggleThumbnails={() => this.toggleThumbnails()}
      />
    );
  }

  render() {
    const { intl } = this.props;

    const {
      fullscreen,
      section,
    } = this.state;

    const styles = {
      'fullscreen-content': fullscreen,
      'hidden-section': !section,
    };

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('player-wrapper', styles)}
        id={this.id}
      >
        {this.renderNavigationBar()}
        {this.renderMedia()}
        {this.renderApplication()}
        {this.renderContent()}
        {this.renderActionBar()}
        {this.renderThumbnails()}
        {this.renderMore()}
      </div>
    );
  }
}
