import React from 'react';
import cx from 'classnames';
import FullscreenButton from 'components/player/buttons/fullscreen';
import Webcams from 'components/webcams';
import { LAYOUT } from 'utils/constants';
import layout from 'utils/layout';
import './index.scss';

const Media = ({
  fullscreen,
  swap,
  toggleFullscreen,
}) => {

  return (
    <div className={cx('media', { 'swapped-media': swap || layout.single })}>
      <FullscreenButton
        content={LAYOUT.MEDIA}
        fullscreen={fullscreen}
        swap={swap}
        toggleFullscreen={toggleFullscreen}
      />
      <Webcams />
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.fullscreen !== nextProps.fullscreen) return false;

  if (prevProps.swap !== nextProps.swap) return false;

  return true;
};

export default React.memo(Media, areEqual);
