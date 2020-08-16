import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import {
  controls,
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
import BottomBar from './bars/bottom';
import TopBar from './bars/top';
import Button from './utils/button';
import { addAlternatesToThumbnails } from 'utils/builder';
import {
  ID,
  LAYOUT,
  getActiveContent,
  getControlFromLayout,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getData,
  getDraws,
  getSectionFromLayout,
  getSwapFromLayout,
  hasPresentation,
  isContentVisible,
  isEmpty,
  isEqual,
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
      search: [],
      section: getSectionFromLayout(layout),
      swap: getSwapFromLayout(layout),
      thumbnails: true,
      time: 0,
    }

    this.player = {
      video: null,
      screenshare: null,
    };

    this.initData(data);

    this.handlePlayerReady = this.handlePlayerReady.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
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

  initData(data) {
    this.alternates = getData(data, ID.ALTERNATES);
    this.captions = getData(data, ID.CAPTIONS);
    this.chat = getData(data, ID.CHAT);
    this.cursor = getData(data, ID.CURSOR);
    this.metadata = getData(data, ID.METADATA);
    this.notes = getData(data, ID.NOTES);
    this.panzooms = getData(data, ID.PANZOOMS);
    this.screenshare = getData(data, ID.SCREENSHARE);
    this.shapes = getData(data, ID.SHAPES);
    this.talkers = getData(data, ID.TALKERS);

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

    logger.debug(ID.PLAYER, data);
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

  handleSearch(value) {
    const { search } = this.state;

    if (!isEqual(search, value, 'array')) {
      this.setState({ search: value });
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

    const {
      presentation,
      screenshare,
    } = this.content;

    const single = !presentation && !screenshare;

    if (!isContentVisible(layout, swap || single)) return null;

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
        return (
          <Search
            intl={intl}
            handleSearch={this.handleSearch}
            metadata={this.metadata}
            thumbnails={this.thumbnails}
            toggleModal={() => this.toggleModal(ID.SEARCH)}
          />
        );
      default:
        return null;
    }
  }

  renderTalkers(layout) {
    const { intl } = this.props;
    const { swap } = this.state;

    const {
      presentation,
      screenshare,
    } = this.content;

    const single = !presentation && !screenshare;

    if (!isContentVisible(layout, swap || single)) return null;

    return (
      <Talkers
        intl={intl}
        talkers={this.talkers}
      />
    );
  }

  renderThumbnails() {
    const { intl } = this.props;

    const {
      search,
      time,
    } = this.state;

    const { video } = this.player;

    const currentDataIndex = getCurrentDataIndex(this.thumbnails, time);

    return (
      <Thumbnails
        currentDataIndex={currentDataIndex}
        handleSearch={this.handleSearch}
        interactive={true}
        intl={intl}
        metadata={this.metadata}
        player={video}
        search={search}
        thumbnails={this.thumbnails}
      />
    );
  }

  renderTopBar() {
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
      <TopBar
        content={this.content}
        control={control}
        intl={intl}
        name={name}
        section={section}
        start={start}
        toggleAbout={() => this.toggleModal(ID.ABOUT)}
        toggleSearch={() => this.toggleModal(ID.SEARCH)}
        toggleSection={() => this.toggleSection()}
        toggleSwap={() => this.toggleSwap()}
      />
    );
  }

  renderMedia(single) {
    const {
      data,
      intl,
      time,
    } = this.props;

    const { swap } = this.state;
    const { media } = data;

    return (
      <div className={cx('media', { 'swapped-media': swap || single })}>
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

  renderContent(single) {
    if (single) return null;

    const {
      fullscreen,
      search,
      swap,
      thumbnails,
      time,
    } = this.state;

    const content = getActiveContent(this.screenshare, time);
    const bottom = thumbnails && !fullscreen && (!swap || !isEmpty(search));

    return (
      <div className={cx('content', { 'swapped-content': swap })}>
        {this.renderTalkers(LAYOUT.CONTENT)}
        {this.renderFullscreenButton(LAYOUT.CONTENT)}
        <div className="top-content">
          {this.renderPresentation(content === ID.PRESENTATION)}
          {this.renderScreenshare(content === ID.SCREENSHARE)}
        </div>
        <div className={cx('bottom-content', { inactive: !bottom })}>
          {this.renderThumbnails()}
        </div>
      </div>
    );
  }

  renderBottomBar() {
    return <BottomBar />;
  }

  render() {
    const { intl } = this.props;

    const {
      fullscreen,
      section,
    } = this.state;

    const {
      presentation,
      screenshare,
    } = this.content;

    const single = !presentation && !screenshare;

    const styles = {
      'fullscreen-content': fullscreen,
      'hidden-section': !section,
      'single-content': single,
    };

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('player-wrapper', styles)}
        id={ID.PLAYER}
      >
        {this.renderTopBar()}
        {this.renderMedia(single)}
        {this.renderApplication()}
        {this.renderContent(single)}
        {this.renderBottomBar()}
        {this.renderModal()}
      </div>
    );
  }
}
