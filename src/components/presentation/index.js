import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import Cursor from './cursor';
import Slide from './slide';
import Canvas from './canvas';
import { ID } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

export default class Presentation extends PureComponent {
  getSlideId() {
    const {
      currentSlideIndex,
      slides,
    } = this.props;

    const inactive = -1;
    if (currentSlideIndex === -1) return inactive;

    const currentData = slides[currentSlideIndex];

    return currentData.id;
  }

  getViewBox() {
    const {
      currentPanzoomIndex,
      panzooms,
    } = this.props;

    const inactive = {
      height: 0,
      x: 0,
      width: 0,
      y: 0,
    };

    if (currentPanzoomIndex === -1) return inactive;

    const currentData = panzooms[currentPanzoomIndex];

    return {
      height: currentData.height,
      x: currentData.x,
      width: currentData.width,
      y: currentData.y,
    };
  }

  buildViewBoxAttr(viewBox) {
    const {
      height,
      x,
      width,
      y,
    } = viewBox;

    return `${x} ${y} ${width} ${height}`;
  }

  getCursor(viewBox) {
    const {
      currentCursorIndex,
      cursor,
    } = this.props;

    const inactive = {
      x: -1,
      y: -1,
    }

    if (currentCursorIndex === -1) return inactive;

    const currentData = cursor[currentCursorIndex];
    if (currentData.x === -1 && currentData.y === -1) return inactive;

    return {
      x: viewBox.x + (currentData.x * viewBox.width),
      y: viewBox.y + (currentData.y * viewBox.height),
    };
  }

  render() {
    const {
      active,
      draws,
      drawsInterval,
      intl,
      metadata,
      slides,
      thumbnails,
    } = this.props;

    const slideId = this.getSlideId();
    const viewBox = this.getViewBox();
    const cursor = this.getCursor(viewBox);
    const canvasId = slideId;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('presentation-wrapper', { inactive: !active })}
        id={ID.PRESENTATION}
      >
        <div className="presentation">
          <svg
            viewBox={this.buildViewBoxAttr(viewBox)}
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
                metadata={metadata}
                slides={slides}
                thumbnails={thumbnails}
              />
              <Canvas
                draws={draws}
                drawsInterval={drawsInterval}
                id={canvasId}
                metadata={metadata}
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
  }
}
