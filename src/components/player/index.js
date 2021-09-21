import React, { PureComponent } from 'react';
import cx from 'classnames';
import {
  defineMessages,
  injectIntl,
} from 'react-intl';
import { shortcuts } from 'config';
import Application from './application';
import Content from './content';
import Media from './media';
import BottomBar from 'components/bars/bottom';
import TopBar from 'components/bars/top';
import AboutModal from 'components/modals/about';
import SearchModal from 'components/modals/search';
import {
  seek,
  skip,
} from 'utils/actions';
import { ID } from 'utils/constants';
import { isEqual } from 'utils/data/validators';
import layout from 'utils/layout';
import Shortcuts from 'utils/shortcuts';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
});

class Player extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      fullscreen: false,
      modal: '',
      search: [],
      section: layout.section,
      swap: layout.swap,
    }

    this.handleSearch = this.handleSearch.bind(this);
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

  initShortcuts() {
    const { seconds } = shortcuts.seek;

    const actions = {
      fullscreen: () => this.toggleFullscreen(),
      section: () => this.toggleSection(),
      seek: {
        backward: () => seek(-seconds),
        forward: () => seek(+seconds),
      },
      skip: {
        next: () => skip(+1),
        previous: () => skip(-1),
      },
      swap: () => this.toggleSwap(),
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

  renderTopBar() {
    const { section } = this.state;

    return (
      <TopBar
        section={section}
        toggleAbout={() => this.toggleModal(ID.ABOUT)}
        toggleSearch={() => this.toggleModal(ID.SEARCH)}
        toggleSection={() => this.toggleSection()}
        toggleSwap={() => this.toggleSwap()}
      />
    );
  }

  renderMedia() {
    const {
      fullscreen,
      swap,
    } = this.state;

    return (
      <Media
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={() => this.toggleFullscreen()}
      />
    );
  }

  renderApplication() {

    return <Application />;
  }

  renderContent() {
    const {
      fullscreen,
      search,
      swap,
    } = this.state;

    return (
      <Content
        fullscreen={fullscreen}
        handleSearch={this.handleSearch}
        search={search}
        swap={swap}
        toggleFullscreen={() => this.toggleFullscreen()}
      />
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

export default injectIntl(Player);
