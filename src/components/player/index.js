import React, { PureComponent } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { shortcuts } from 'config';
import Application from './application';
import Presentation from 'components/presentation';
import Screenshare from 'components/screenshare';
import Thumbnails from 'components/thumbnails';
import Webcams from 'components/webcams';
import BottomBar from 'components/bars/bottom';
import TopBar from 'components/bars/top';
import AboutModal from 'components/modals/about';
import SearchModal from 'components/modals/search';
import Button from 'components/utils/button';
import {
  seek,
  skip,
} from 'utils/actions';
import {
  ID,
  LAYOUT,
} from 'utils/constants';
import {
  getActiveContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getDraws,
} from 'utils/data';
import storage from 'utils/data/storage';
import { isEqual } from 'utils/data/validators';
import layout from 'utils/layout';
import Shortcuts from 'utils/shortcuts';
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

    this.state = {
      control: layout.control,
      fullscreen: false,
      modal: '',
      search: [],
      section: layout.section,
      swap: layout.swap,
      thumbnails: true,
      time: 0,
    }

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
    const { seconds } = shortcuts.player;

    const actions = {
      fullscreen: () => this.toggleFullscreen(),
      section: () => this.toggleSection(),
      swap: () => this.toggleSwap(),
      thumbnails: () => this.toggleThumbnails(),
      slides: {
        next: () => skip(+1),
        previous: () => skip(-1),
      },
      player: {
        backward: () => seek(-seconds),
        forward: () => seek(+seconds),
      },
    };

    this.shortcuts = new Shortcuts(actions);
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

  renderFullscreenButton(content) {
    if (!layout.hasFullscreenButton(content, this.state)) return null;

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

    switch (modal) {
      case ID.ABOUT:
        return (
          <AboutModal toggleModal={() => this.toggleModal(ID.ABOUT)} />
        );
      case ID.SEARCH:
        return (
          <SearchModal
            handleSearch={this.handleSearch}
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

    const currentDataIndex = getCurrentDataIndex(storage.thumbnails, time);

    return (
      <Thumbnails
        currentDataIndex={currentDataIndex}
        handleSearch={this.handleSearch}
        interactive
        search={search}
      />
    );
  }

  renderTopBar() {
    const {
      control,
      section,
    } = this.state;

    return (
      <TopBar
        control={control}
        section={section}
        toggleAbout={() => this.toggleModal(ID.ABOUT)}
        toggleSearch={() => this.toggleModal(ID.SEARCH)}
        toggleSection={() => this.toggleSection()}
        toggleSwap={() => this.toggleSwap()}
      />
    );
  }

  renderMedia() {
    const { time } = this.props;

    return (
      <div className={cx('media', layout.getMediaStyle(this.state))}>
        {this.renderFullscreenButton(LAYOUT.MEDIA)}
        <Webcams
          key={ID.WEBCAMS}
          onTimeUpdate={this.handleTimeUpdate}
          time={time}
        />
      </div>
    );
  }

  renderApplication() {
    const {
      control,
      time,
    } = this.state;

    const currentChatIndex = getCurrentDataIndex(storage.messages, time);

    return (
      <Application
        control={control}
        currentChatIndex={currentChatIndex}
      />
    );
  }

  renderPresentation(active) {
    const { time } = this.state;

    const currentSlideIndex = getCurrentDataIndex(storage.shapes.slides, time);
    const currentPanzoomIndex = getCurrentDataIndex(storage.panzooms, time);
    const currentCursorIndex = getCurrentDataIndex(storage.cursor, time);
    const draws = getDraws(currentSlideIndex, storage.shapes.slides, storage.shapes.canvases);
    const currentDrawsInterval = getCurrentDataInterval(draws, time);

    return (
      <Presentation
        active={active}
        currentCursorIndex={currentCursorIndex}
        currentPanzoomIndex={currentPanzoomIndex}
        currentSlideIndex={currentSlideIndex}
        draws={draws}
        drawsInterval={currentDrawsInterval}
      />
    )
  }

  renderScreenshare(active) {
    if (!layout.screenshare) return null;

    return (
      <Screenshare
        active={active}
        key={ID.SCREENSHARE}
      />
    );
  }

  renderContent() {
    if (layout.single) return null;

    const { time } = this.state;
    const content = getActiveContent(storage.screenshare, time);

    return (
      <div className={cx('content', layout.getContentStyle(this.state))}>
        {this.renderFullscreenButton(LAYOUT.CONTENT)}
        <div className="top-content">
          {this.renderPresentation(content === ID.PRESENTATION)}
          {this.renderScreenshare(content === ID.SCREENSHARE)}
        </div>
        <div className={cx('bottom-content', layout.getBottomContentStyle(this.state))}>
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
        className={cx('player-wrapper', layout.getPlayerStyle(this.state))}
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
