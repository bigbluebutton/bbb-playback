import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import Cursor from './cursor';
import Slide from './slide';
import Canvas from './canvas';
import { useCurrentIndex } from 'components/utils/hooks';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import { isEqual } from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

const buildViewBoxAttr = (viewBox) => {
  const {
    height,
    x,
    width,
    y,
  } = viewBox;

  return `${x} ${y} ${width} ${height}`;
};

const getSlideId = (index) => {
  const inactive = -1;
  if (index === -1) return inactive;

  const currentData = storage.slides[index];

  return currentData.id;
};

const getViewBox = (index) => {
  const inactive = {
    height: 0,
    x: 0,
    width: 0,
    y: 0,
  };

  if (index === -1) return inactive;

  const currentData = storage.panzooms[index];

  return {
    height: currentData.height,
    x: currentData.x,
    width: currentData.width,
    y: currentData.y,
  };
};

const Presentation = ({
  active,
  currentSlideIndex,
  draws,
  drawsInterval,
}) => {
  const intl = useIntl();
  const currentPanzoomIndex = useCurrentIndex(storage.panzooms);
  const slideId = getSlideId(currentSlideIndex);
  const viewBox = getViewBox(currentPanzoomIndex);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('presentation-wrapper', { inactive: !active })}
      id={ID.PRESENTATION}
    >
      <div className="presentation">
        <svg
          viewBox={buildViewBoxAttr(viewBox)}
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <clipPath id="viewBox">
              <rect
                height={viewBox.height}
                x={viewBox.x}
                width={viewBox.width}
                y={viewBox.y}
              />
            </clipPath>
          </defs>
          <g clipPath="url(#viewBox)">
            <Slide id={slideId} />
            <Canvas
              draws={draws}
              drawsInterval={drawsInterval}
            />
            <Cursor viewBox={viewBox} />
          </g>
        </svg>
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  if (prevProps.currentSlideIndex !== nextProps.currentSlideIndex) return false;

  if (!isEqual(prevProps.draws, nextProps.draws)) return false;

  if (!isEqual(prevProps.drawsInterval, nextProps.drawsInterval)) return false;

  return true;
};

export default React.memo(Presentation, areEqual);
