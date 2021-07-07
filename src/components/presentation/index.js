import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import Cursor from './cursor';
import Slide from './slide';
import Canvas from './canvas';
import { ID } from 'utils/constants';
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

const getCursor = (cursors, index, viewBox) => {
  const inactive = {
    x: -1,
    y: -1,
  }

  if (index === -1) return inactive;

  const currentData = cursors[index];
  if (currentData.x === -1 && currentData.y === -1) return inactive;

  return {
    x: viewBox.x + (currentData.x * viewBox.width),
    y: viewBox.y + (currentData.y * viewBox.height),
  };
};

const getSlideId = (index, slides) => {
  const inactive = -1;
  if (index === -1) return inactive;

  const currentData = slides[index];

  return currentData.id;
};

const getViewBox = (index, panzooms) => {
  const inactive = {
    height: 0,
    x: 0,
    width: 0,
    y: 0,
  };

  if (index === -1) return inactive;

  const currentData = panzooms[index];

  return {
    height: currentData.height,
    x: currentData.x,
    width: currentData.width,
    y: currentData.y,
  };
};

const Presentation = ({
  active,
  currentCursorIndex,
  currentPanzoomIndex,
  currentSlideIndex,
  cursors,
  draws,
  drawsInterval,
  panzooms,
  recordId,
  slides,
  thumbnails,
}) => {
  const intl = useIntl();
  const slideId = getSlideId(currentSlideIndex, slides);
  const viewBox = getViewBox(currentPanzoomIndex, panzooms);
  const cursor = getCursor(cursors, currentCursorIndex, viewBox);

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
            <Slide
              id={slideId}
              recordId={recordId}
              slides={slides}
              thumbnails={thumbnails}
            />
            <Canvas
              draws={draws}
              drawsInterval={drawsInterval}
              recordId={recordId}
            />
            <Cursor
              x={cursor.x}
              y={cursor.y}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  if (prevProps.currentCursorIndex !== nextProps.currentCursorIndex) return false;

  if (prevProps.currentPanzoomIndex !== nextProps.currentPanzoomIndex) return false;

  if (!isEqual(prevProps.draws, nextProps.draws)) return false;

  if (!isEqual(prevProps.drawsInterval, nextProps.drawsInterval)) return false;

  return true;
};

export default React.memo(Presentation, areEqual);
