import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { files as config } from 'config';
import Chat from './chat';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Thumbnails from './thumbnails';
import Video from './video';
import ActionBar from './bars/action';
import NavigationBar from './bars/navigation';
import Button from './utils/button';
import { addAlternatesToThumbnails } from 'utils/builder';
import {
  getCurrentDataIndex,
  getCurrentDataInterval,
  getFileName,
  getSectionFromLayout,
  getSwapFromLayout,
  isEnabled,
} from 'utils/data';
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
      fullscreen: false,
      time: 0,
      section: getSectionFromLayout(layout),
      swap: getSwapFromLayout(layout),
      thumbnails: false,
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

    // Uncomment for post-processed data details
    // console.log(data);
  }

  handlePlayerReady(media, player) {
    switch (media) {
      case 'video':
        this.player.video = player;
        break;
      case 'screenshare':
        this.player.screenshare = player;
        break;
      default:
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

  getFullscreenButton() {
    const { fullscreen } = this.state;

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
    const { section } = this.state;
    const {
      epoch,
      name,
    } = this.metadata;

    return (
      <NavigationBar
        epoch={epoch}
        name={name}
        section={section}
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

    let fullscreenButton;
    if (swap) fullscreenButton = this.getFullscreenButton();

    return (
      <div className={cx('media', { 'swapped-media': swap })}>
        {fullscreenButton}
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

  getDraws(slideIndex) {
    if (slideIndex === -1) return null;

    const slide = this.slides[slideIndex];
    const canvas = this.canvases.find(canvas => slide.id === canvas.id);

    if (!canvas) return null;

    const { draws } = canvas;

    return draws;
  }

  renderPresentation(active) {
    const { intl } = this.props;
    const { time } = this.state;

    const currentSlideIndex = getCurrentDataIndex(this.slides, time);
    const currentPanzoomIndex = getCurrentDataIndex(this.panzooms, time);
    const currentCursorIndex = getCurrentDataIndex(this.cursor, time);
    const draws = this.getDraws(currentSlideIndex);
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

  getActiveContent() {
    const { time } = this.state;

    const screenshare = isEnabled(this.screenshare, time);

    return {
      presentation: !screenshare,
      screenshare,
    };
  }

  renderContent() {
    const {
      presentation,
      screenshare,
    } = this.getActiveContent();

    const { swap } = this.state;

    let fullscreenButton;
    if (!swap) fullscreenButton = this.getFullscreenButton();

    return (
      <div className={cx('content', { 'swapped-content': swap })}>
        {fullscreenButton}
        {this.renderPresentation(presentation)}
        {this.renderScreenshare(screenshare)}
      </div>
    );
  }

  renderActionBar() {
    const { thumbnails } = this.state;

    return (
      <ActionBar
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
      </div>
    );
  }
}
