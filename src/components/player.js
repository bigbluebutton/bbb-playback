import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import {
  controls,
  files,
  shortcuts,
} from 'config';
import About from './about';
import Chat from './chat';
import Notes from './notes';
import Presentation from './presentation';
import Search from './search';
import Screenshare from './screenshare';
import Talkers from './talkers';
import Thumbnails from './thumbnails';
import Video from './video';
import ActionBar from './bars/action';
import NavigationBar from './bars/navigation';
import Button from './utils/button';
import { addAlternatesToThumbnails } from 'utils/builder';
import {
  ID,
  LAYOUT,
  getActiveContent,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getDraws,
  getFileName,
  getSectionFromLayout,
  getSwapFromLayout,
  hasPresentation,
  isContentVisible,
  isEmpty,
  seek,
  skip,
} from 'utils/data';
import logger from 'utils/logger';
import Monitor from 'utils/monitor';
import Shortcuts from 'utils/shortcuts';
import Synchronizer from 'utils/synchronizer';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
  fullscreen: {
    id: 'button.fullscreen.aria',
    description: 'Aria label for the fullscreen button',
  },
  restore: {
    id: 'button.restore.aria',
    description: 'Aria label for the restore button',
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
      application: ID.CHAT,
      control: getControlFromLayout(layout),
      fullscreen: false,
      modal: '',
      section: getSectionFromLayout(layout),
      swap: getSwapFromLayout(layout),
      thumbnails: false,
      time: 0,
    }

    this.player = {
      video: null,
      screenshare: null,
    };

    this.alternates = data[getFileName(files.data.alternates)];
    this.captions = data[getFileName(files.data.captions)];
    this.chat = data[getFileName(files.data.chat)];
    this.cursor = data[getFileName(files.data.cursor)];
    this.metadata = data[getFileName(files.data.metadata)];
    this.notes = data[getFileName(files.data.notes)];
    this.panzooms = data[getFileName(files.data.panzooms)];
    this.screenshare = data[getFileName(files.data.screenshare)];
    this.shapes = data[getFileName(files.data.shapes)];
    this.talkers = data[getFileName(files.data.talkers)];

    this.canvases = this.shapes.canvases;
    this.slides = this.shapes.slides;
    this.thumbnails = addAlternatesToThumbnails(this.shapes.thumbnails, this.alternates);

    this.content = {
      captions: !isEmpty(this.captions),
      chat: !isEmpty(this.chat),
      notes: !isEmpty(this.notes),
      presentation: hasPresentation(this.slides),
      screenshare: !isEmpty(this.screenshare),
    };

    this.handlePlayerReady = this.handlePlayerReady.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);

    logger.debug(ID.PLAYER, data);
  }

  componentDidMount() {
    this.initMonitor();
    this.initShortcuts();
  }

  componentWillUnmount() {
    if (this.shortcuts) {
      this.shortcuts.destroy();
    }
  }

  handlePlayerReady(media, player) {
    switch (media) {
      case ID.VIDEO:
        logger.debug(ID.PLAYER, 'ready', ID.VIDEO);
        this.player.video = player;
        break;
      case ID.SCREENSHARE:
        logger.debug(ID.PLAYER, 'ready', ID.SCREENSHARE);
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

  initMonitor() {
    this.monitor = new Monitor(this.metadata.id);
    this.monitor.collect(() => {
      const { video } = this.player;
      if (!video) return {};

      const time = video.currentTime();
      return { time };
    });
  }

  initShortcuts() {
    const { seconds } = shortcuts.video;

    const actions = {
      fullscreen: () => this.toggleFullscreen(),
      section: () => this.toggleSection(),
      swap: () => this.toggleSwap(),
      thumbnails: () => this.toggleThumbnails(),
      slides: {
        next: () => skip(this.player, this.slides, +1),
        previous: () => skip(this.player, this.slides, -1),
      },
      video: {
        backward: () => seek(this.player, -seconds),
        forward: () => seek(this.player, +seconds),
      },
    };

    this.shortcuts = new Shortcuts(actions);
  }

  toggleApplication(type) {
    const { application } = this.state;

    if (application === type) return null;

    this.setState({ application: type });
  }

  toggleFullscreen() {
    const { fullscreen } = this.state;

    this.setState({ fullscreen: !fullscreen });
  }

  toggleModal(type) {
    const { modal } = this.state;
    const open = modal.length > 0;

    this.setState({ modal: open ? '' : type });
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

    if (!control || !controls.fullscreen) return null;

    if (!isContentVisible(layout, swap)) return null;

    const { intl } = this.props;

    const aria = fullscreen
      ? intl.formatMessage(intlMessages.restore)
      : intl.formatMessage(intlMessages.fullscreen)
    ;

    const icon = fullscreen ? 'restore' : 'fullscreen';

    return (
      <div className="fullscreen-button">
        <Button
          aria={aria}
          handleOnClick={() => this.toggleFullscreen()}
          icon={icon}
          type="solid"
        />
      </div>
    );
  }

  renderModal() {
    const { modal } = this.state;
    const open = modal.length > 0;

    if (!open) return null;

    const { intl } = this.props;

    switch (modal) {
      case ID.ABOUT:
        return (
          <About
            content={this.content}
            intl={intl}
            metadata={this.metadata}
            toggleModal={() => this.toggleModal(ID.ABOUT)}
          />
        );
      case ID.SEARCH:
        const data = { thumbnails: this.thumbnails };
        const { video } = this.player;

        if (!video) return null;

        return (
          <Search
            data={data}
            intl={intl}
            toggleModal={() => this.toggleModal(ID.SEARCH)}
            video={video}
          />
        );
      default:
        return null;
    }
  }

  renderTalkers(layout) {
    const { intl } = this.props;
    const { swap } = this.state;

    if (!isContentVisible(layout, swap)) return null;

    return (
      <Talkers
        intl={intl}
        talkers={this.talkers}
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
    const { intl } = this.props;

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
        intl={intl}
        name={name}
        section={section}
        start={start}
        toggleAbout={() => this.toggleModal(ID.ABOUT)}
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
        {this.renderTalkers(LAYOUT.MEDIA)}
        {this.renderFullscreenButton(LAYOUT.MEDIA)}
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

  renderApplicationIcon(type) {
    const { application } = this.state;
    const active = application === type;

    return (
      <div
        className={cx('application-icon', { inactive: !active })}
        onClick={() => active ? null : this.toggleApplication(type)}
      >
        <span className={`icon-${type}`} />
      </div>
    );
  }

  renderApplicationContent() {
    const { intl } = this.props;
    const { application } = this.state;

    switch (application) {
      case ID.CHAT:
        const { time } = this.state;
        const { video } = this.player;
        const currentChatIndex = getCurrentDataIndex(this.chat, time);

        return (
          <Chat
            chat={this.chat}
            currentDataIndex={currentChatIndex}
            intl={intl}
            player={video}
          />
        );
      case ID.NOTES:
        return (
          <Notes
            notes={this.notes}
            intl={intl}
          />
        );
      default:
        return null;
    }
  }

  renderApplication() {
    return (
      <div className="application">
        <div className="application-control">
          {this.renderApplicationIcon(ID.CHAT)}
        </div>
        {this.renderApplicationContent()}
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
    const { screenshare } = this.content;

    if (!screenshare) return null;

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
        {this.renderTalkers(LAYOUT.CONTENT)}
        {this.renderFullscreenButton(LAYOUT.CONTENT)}
        {this.renderPresentation(content === ID.PRESENTATION)}
        {this.renderScreenshare(content === ID.SCREENSHARE)}
      </div>
    );
  }

  renderActionBar() {
    const { intl } = this.props;
    const { control } = this.state;

    return (
      <ActionBar
        content={this.content}
        control={control}
        intl={intl}
        toggleSearch={() => this.toggleModal(ID.SEARCH)}
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
        id={ID.PLAYER}
      >
        {this.renderNavigationBar()}
        {this.renderMedia()}
        {this.renderApplication()}
        {this.renderContent()}
        {this.renderActionBar()}
        {this.renderThumbnails()}
        {this.renderModal()}
      </div>
    );
  }
}
