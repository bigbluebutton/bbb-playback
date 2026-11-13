import React, { Suspense, lazy, useEffect, useRef } from 'react';
import cx from 'classnames';
import Presentation from 'components/presentation';
import { getTldrawBbbVersion, isTldrawWhiteboard as isTldraw } from 'utils/tldraw';
import { useCurrentInterval, useLayoutSwap } from 'components/utils/hooks';
import Screenshare from 'components/screenshare';
import Bottom from 'components/player/bottom';
import FullscreenButton from 'components/player/buttons/fullscreen';
import { LAYOUT } from 'utils/constants';
import { isEqual } from 'utils/data/validators';
import layout from 'utils/layout';
import storage from 'utils/data/storage';
import './index.scss';
import { gte as semverGte } from 'semver';

// The whiteboard renderers are heavy and a recording only ever needs one of
// them, so each is split into its own chunk and fetched on demand
const TldrawPresentation = lazy(() => import('components/tldraw'));
const TldrawPresentationV2 = lazy(() => import('components/tldraw_v2'));

// The video's play button sits in the middle of the slides (see the webcams
// styles), which move with the layout: side section, fullscreen, swap,
// right-to-left, window size
const STAGE_X = '--stage-center-x';
const STAGE_Y = '--stage-center-y';

const useStageCenter = (element) => {
  useEffect(() => {
    const node = element.current;
    if (!node) return undefined;

    const { style } = document.documentElement;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        style.removeProperty(STAGE_X);
        style.removeProperty(STAGE_Y);
        return;
      }

      style.setProperty(STAGE_X, `${rect.left + rect.width / 2}px`);
      style.setProperty(STAGE_Y, `${rect.top + rect.height / 2}px`);
    };

    update();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    if (observer) observer.observe(node);
    window.addEventListener('resize', update);
    // Grid changes (side section, fullscreen) can move it without a resize
    const frame = { id: null };
    const settle = () => {
      cancelAnimationFrame(frame.id);
      frame.id = requestAnimationFrame(update);
    };
    document.addEventListener('transitionend', settle, true);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', update);
      document.removeEventListener('transitionend', settle, true);
      cancelAnimationFrame(frame.id);
      style.removeProperty(STAGE_X);
      style.removeProperty(STAGE_Y);
    };
  });
};

const PresentationFallback = () => (
  <div className="presentation-wrapper">
    <div className={cx('presentation', 'logo')} />
  </div>
);

const Content = ({
  fullscreen,
  handleSearch,
  search,
  swap,
  toggleFullscreen,
  hidePresentation,
}) => {
  const {
    index,
  } = useCurrentInterval(storage.tldraw);

  const { showScreenshare } = useLayoutSwap();
  const topContent = useRef();
  useStageCenter(topContent);

  if (layout.single) return null;

  const isTldrawWhiteboard = isTldraw();

  let presentation;

  if (isTldrawWhiteboard) {
    const bbbVersion = getTldrawBbbVersion(index);

    if (bbbVersion && semverGte(bbbVersion, '3.0.0')) {
      presentation = <TldrawPresentationV2 />;
    }
    else {
      presentation = <TldrawPresentation />;
    }
  }
  else {
    presentation = <Presentation />;
  }

  // Hidden rather than unmounted while the presentation is minimized:
  // remounting would start a new screenshare player out of sync
  return (
    <div className={cx('content', { 'swapped-content': swap, 'hidden-content': hidePresentation })}>
      <FullscreenButton
        content={LAYOUT.CONTENT}
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={toggleFullscreen}
      />
      <div className="top-content" ref={topContent}>
        <Suspense fallback={<PresentationFallback />}>
          {presentation}
        </Suspense>
        {layout.screenshare ? (
          // video-js doesn't mount properly when not mounted in time
          <span style={!showScreenshare ? {
            display: 'none',
            width: '100%',
            height: '100%'
          } : {
            width: '100%',
            height: '100%',
          }}>
            <Screenshare />
          </span>
        ) : null}
      </div>
      {hidePresentation ? null : (
        <Bottom
          fullscreen={fullscreen}
          handleSearch={handleSearch}
          search={search}
        />
      )}
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.fullscreen !== nextProps.fullscreen) return false;

  if (prevProps.swap !== nextProps.swap) return false;

  if (prevProps.hidePresentation !== nextProps.hidePresentation) return false;

  if (!isEqual(prevProps.search, nextProps.search)) return false;

  return true;
};

export default React.memo(Content, areEqual);
