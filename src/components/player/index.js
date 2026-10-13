import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { shortcuts as config } from 'config';
import Application from './application';
import Content from './content';
import Media from './media';
import Modal from './modal';
import BottomBar from 'components/bars/bottom';
import TopBar from 'components/bars/top';
import Toast from 'components/toast';
import useTapGestures from './gestures';
import { addBookmarkNow } from 'components/bookmarks/actions';
import {
  getNextRate,
  play,
  seek,
  skip,
} from 'utils/actions';
import { player as playerConfig } from 'config';
import { ID } from 'utils/constants';
import notify from 'utils/toast';
import layout from 'utils/layout';
import player from 'utils/player';
import Shortcuts, { addPlainShortcuts } from 'utils/shortcuts';
import { useLayoutSwap } from 'components/utils/hooks';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
  speed: {
    id: 'player.speed.changed',
    description: 'Message shown when the playback speed changes',
  },
});

const TAP = {
  backward: () => seek(-config.seek.seconds),
  forward: () => seek(+config.seek.seconds),
  isPaused: () => (player.primary ? player.primary.paused() : null),
  seconds: config.seek.seconds,
  toggle: () => play(),
};

const Player = () => {
  const intl = useIntl();

  const [fullscreen, setFullscreen] = useState(false);
  const [modal, setModal] = useState('');
  const [search, setSearch] = useState([]);
  const [section, setSection] = useState(layout.section);
  const [swap, setSwap] = useState(layout.swap);

  const shortcuts = useRef();

  useTapGestures(TAP);

  const { showPresentation } = useLayoutSwap();
  const hidePresentation = showPresentation === false;

  useEffect(() => {
    if (showPresentation === false) {
      setSwap(true);
    } else {
      setSwap(false);
    }
  }, [showPresentation]);

  useEffect(() => {
    const { seconds } = config.seek;

    const actions = {
      fullscreen: () => setFullscreen(prevFullscreen => !prevFullscreen),
      play: () => play(),
      section: () => setSection(prevSection => !prevSection),
      seek: {
        backward: () => seek(-seconds),
        forward: () => seek(+seconds),
      },
      skip: {
        next: () => skip(+1),
        previous: () => skip(-1),
      },
      swap: () => setSwap(prevSwap => !prevSwap),
    };

    shortcuts.current = new Shortcuts(actions);

    const changeSpeed = (direction) => {
      if (!player.primary) return;

      const rate = getNextRate(playerConfig.rates, player.primary.playbackRate(), direction);
      player.primary.playbackRate(rate);
      notify({ duration: 1500, message: intl.formatMessage(intlMessages.speed, { rate }) });
    };

    const removePlainShortcuts = addPlainShortcuts({
      backward: actions.seek.backward,
      forward: actions.seek.forward,
      fullscreen: actions.fullscreen,
      mute: () => {
        if (player.primary) player.primary.muted(!player.primary.muted());
      },
      play: actions.play,
      bookmark: () => addBookmarkNow(intl),
      faster: () => changeSpeed(+1),
      slower: () => changeSpeed(-1),
      help: () => setModal(ID.ABOUT),
    });

    return () => {
      if (shortcuts.current) shortcuts.current.destroy();
      removePlainShortcuts();
    };
    // Shortcuts are bound once; intl does not change while playing
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = {
    'fullscreen-content': fullscreen,
    'hidden-section': !section,
    'single-content': layout.single || hidePresentation,
  };

  return (
    <main
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('player-wrapper', style)}
      id={ID.PLAYER}
    >
      <TopBar
        openModal={(type) => setModal(type)}
        section={section}
        toggleSection={() => setSection(prevSection => !prevSection)}
        toggleSwap={() => setSwap(prevSwap => !prevSwap)}
        hidePresentation={hidePresentation}
      />
      <Media
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={() => setFullscreen(prevFullscreen => !prevFullscreen)}
        hidePresentation={hidePresentation}
      />
      <Application />
      <Content
        fullscreen={fullscreen}
        handleSearch={(value) => setSearch(value)}
        search={search}
        swap={swap}
        toggleFullscreen={() => setFullscreen(prevFullscreen => !prevFullscreen)}
        hidePresentation={hidePresentation}
      />
      <BottomBar />
      <Modal
        handleClose={() => setModal('')}
        handleSearch={(value) => setSearch(value)}
        modal={modal}
      />
      <Toast />
    </main>
  );
};

export default Player;
