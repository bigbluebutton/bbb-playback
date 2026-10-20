import React from 'react';
import cx from 'classnames';
import Presentation from 'components/presentation';
import TldrawPresentation from 'components/tldraw';
import TldrawPresentationV2 from 'components/tldraw_v2';
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
      <div className="top-content">
        {presentation}
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
