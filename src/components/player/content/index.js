import React from 'react';
import cx from 'classnames';
import Presentation from 'components/presentation';
import Screenshare from 'components/screenshare';
import Thumbnails from 'components/thumbnails';
import FullscreenButton from 'components/player/buttons/fullscreen';
import { LAYOUT } from 'utils/constants';
import { isEqual } from 'utils/data/validators';
import layout from 'utils/layout';
import './index.scss';

const Content = ({
  fullscreen,
  handleSearch,
  search,
  swap,
  toggleFullscreen,
}) => {
  if (layout.single) return null;

  return (
    <div className={cx('content', { 'swapped-content': swap })}>
      <FullscreenButton
        content={LAYOUT.CONTENT}
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={toggleFullscreen}
      />
      <div className="top-content">
        <Presentation />
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
