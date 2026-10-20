import React from 'react';
import cx from 'classnames';
import FullscreenButton from 'components/player/buttons/fullscreen';
import Minimized from 'components/player/minimized';
import Webcams from 'components/webcams';
import { LAYOUT } from 'utils/constants';
import { isEqual } from 'utils/data/validators';
import layout from 'utils/layout';
import './index.scss';

const Media = ({
  fullscreen,
  handleSearch,
  search,
  slides,
  swap,
  toggleFullscreen,
  toggleSlides,
  hidePresentation,
}) => {

  return (
    <div className={cx('media', { 'swapped-media': swap || layout.single || hidePresentation })}>
      <FullscreenButton
        content={LAYOUT.MEDIA}
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={toggleFullscreen}
      />
      <Webcams />
      {hidePresentation && !fullscreen && layout.control && !layout.single ? (
        <Minimized
          handleSearch={handleSearch}
          open={slides}
          search={search}
          toggleOpen={toggleSlides}
        />
      ) : null}
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.fullscreen !== nextProps.fullscreen) return false;

  if (prevProps.hidePresentation !== nextProps.hidePresentation) return false;

  if (prevProps.swap !== nextProps.swap) return false;

  if (prevProps.slides !== nextProps.slides) return false;

  if (!isEqual(prevProps.search, nextProps.search)) return false;

  return true;
};

export default React.memo(Media, areEqual);
