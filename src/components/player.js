import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { shortcuts } from 'config';
import Chat from './chat';
import Notes from './notes';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Thumbnails from './thumbnails';
import Video from './video';
import BottomBar from './bars/bottom';
import TopBar from './bars/top';
import AboutModal from './modals/about';
import SearchModal from './modals/search';
import Button from './utils/button';
import {
  seek,
  skip,
} from 'utils/actions';
import {
  addAlternatesToThumbnails,
  mergeChatContent,
} from 'utils/builder';
import {
  ID,
  LAYOUT,
} from 'utils/constants';
import {
  getActiveContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getData,
  getDraws,
} from 'utils/data';
import { isEqual } from 'utils/data/validators';
import Layout from 'utils/layout';
import logger from 'utils/logger';
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

    this.layout = new Layout(data, layout);

    this.state = {
      application: ID.CHAT,
      control: this.layout.initControl(),
      fullscreen: false,
      modal: '',
      search: [],
      section: this.layout.initSection(),
      swap: this.layout.initSwap(),
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
    this.chat = mergeChatContent(
      getData(data, ID.CHAT),
      getData(data, ID.POLLS),
      getData(data, ID.QUESTIONS),
      getData(data, ID.EXTERNAL_VIDEOS),
    );
    this.cursor = getData(data, ID.CURSOR);
    this.metadata = getData(data, ID.METADATA);
    this.notes = getData(data, ID.NOTES);
    this.panzooms = getData(data, ID.PANZOOMS);
    this.screenshare = getData(data, ID.SCREENSHARE);
    this.shapes = getData(data, ID.SHAPES);

    this.canvases = this.shapes.canvases;
    this.slides = this.shapes.slides;
    this.thumbnails = addAlternatesToThumbnails(this.shapes.thumbnails, this.alternates);

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

    if (!isEqual(search, value)) {
      this.setState({ search: value });
    }
  }

  handleTimeUpdate(value) {
    const { time } = this.state;

    if (time !== value) {
      this.setState({ time: value });
    }
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
    if (!this.layout.hasFullscreenButton(layout, this.state)) return null;

    const { intl } = this.props;
    const { fullscreen } = this.state;

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

    const content = this.layout.getContent();

    switch (modal) {
      case ID.ABOUT:
        return (
          <AboutModal
            content={content}
            metadata={this.metadata}
            toggleModal={() => this.toggleModal(ID.ABOUT)}
          />
        );
      case ID.SEARCH:
        return (
          <SearchModal
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

  renderThumbnails() {
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
        player={video}
        recordId={this.metadata.id}
        search={search}
        thumbnails={this.thumbnails}
      />
    );
  }

  renderTopBar() {
    const {
      control,
      section,
    } = this.state;

    const {
      name,
      start,
    } = this.metadata;

    const single = this.layout.isSingle();

    return (
      <TopBar
        control={control}
        name={name}
        section={section}
        single={single}
        start={start}
        toggleAbout={() => this.toggleModal(ID.ABOUT)}
        toggleSearch={() => this.toggleModal(ID.SEARCH)}
        toggleSection={() => this.toggleSection()}
        toggleSwap={() => this.toggleSwap()}
      />
    );
  }

  renderMedia() {
    const {
      data,
      time,
    } = this.props;

    const { media } = data;

    return (
      <div className={cx('media', this.layout.getMediaStyle(this.state))}>
        {this.renderFullscreenButton(LAYOUT.MEDIA)}
        <Video
          captions={this.captions}
          key={ID.VIDEO}
          media={media}
          onPlayerReady={this.handlePlayerReady}
          onTimeUpdate={this.handleTimeUpdate}
          recordId={this.metadata.id}
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
            player={video}
          />
        );
      case ID.NOTES:
        return (
          <Notes notes={this.notes} />
        );
      default:
        return null;
    }
  }

  renderApplicationControl() {
    const { control } = this.state;

    if (!control) return null;

    return (
      <div className="application-control">
        {this.renderApplicationIcon(ID.CHAT)}
        {this.renderApplicationIcon(ID.NOTES)}
      </div>
    );
  }

  renderApplication() {
    return (
      <div className="application">
        {this.renderApplicationControl()}
        {this.renderApplicationContent()}
      </div>
    );
  }

  renderPresentation(active) {
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
        cursors={this.cursor}
        draws={draws}
        drawsInterval={currentDrawsInterval}
        panzooms={this.panzooms}
        recordId={this.metadata.id}
        slides={this.slides}
        thumbnails={this.thumbnails}
      />
    )
  }

  renderScreenshare(active) {
    if (!this.layout.hasScreenshare()) return null;

    const { data } = this.props;

    const { media } = data;

    return (
      <Screenshare
        active={active}
        key={ID.SCREENSHARE}
        media={media}
        onPlayerReady={this.handlePlayerReady}
        recordId={this.metadata.id}
      />
    );
  }

  renderContent() {
    if (this.layout.isSingle()) return null;

    const { time } = this.state;
    const content = getActiveContent(this.screenshare, time);

    return (
      <div className={cx('content', this.layout.getContentStyle(this.state))}>
        {this.renderFullscreenButton(LAYOUT.CONTENT)}
        <div className="top-content">
          {this.renderPresentation(content === ID.PRESENTATION)}
          {this.renderScreenshare(content === ID.SCREENSHARE)}
        </div>
        <div className={cx('bottom-content', this.layout.getBottomContentStyle(this.state))}>
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

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('player-wrapper', this.layout.getPlayerStyle(this.state))}
        id={ID.PLAYER}
      >
        {this.renderTopBar()}
        {this.renderMedia()}
        {this.renderApplication()}
        {this.renderContent()}
        {this.renderBottomBar()}
        {this.renderModal()}
      </div>
    );
  }
}
