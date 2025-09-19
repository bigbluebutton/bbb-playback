import React from 'react';
import cx from 'classnames';
import Presentation from 'components/presentation';
import TldrawPresentation from 'components/tldraw';
import TldrawPresentationV2 from 'components/tldraw_v2';
import { getTldrawBbbVersion } from 'utils/tldraw';
import { useCurrentInterval } from 'components/utils/hooks';
import Screenshare from 'components/screenshare';
import Thumbnails from 'components/thumbnails';
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
}) => {
  const {
    index,
  } = useCurrentInterval(storage.tldraw);

  if (layout.single) return null;

  const isTldrawWhiteboard = storage.tldraw.length ||
                             storage.panzooms.tldraw ||
                             storage.cursor.tldraw;

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

  return (
    <div className={cx('content', { 'swapped-content': swap })}>
      <FullscreenButton
        content={LAYOUT.CONTENT}
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={toggleFullscreen}
      />
      <div className="top-content">
        {presentation}
        {layout.screenshare ? <Screenshare /> : null}
      </div>
      <div className={cx('bottom-content', { 'inactive': fullscreen })}>
        <Thumbnails
          handleSearch={handleSearch}
          interactive
          search={search}
        />
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.fullscreen !== nextProps.fullscreen) return false;

  if (prevProps.swap !== nextProps.swap) return false;

  if (!isEqual(prevProps.search, nextProps.search)) return false;

  return true;
};

export default React.memo(Content, areEqual);
