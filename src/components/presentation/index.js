import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import Slide from './slide';
import Whiteboard from './whiteboard';
import { getCurrentDataIndex } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

export default class Presentation extends Component {
  constructor(props) {
    super(props);

    this.id = 'presentation';
  }

  getSlideId() {
    const {
      slides,
      time,
    } = this.props;

    const currentDataIndex = getCurrentDataIndex(slides, time);
    if (currentDataIndex === -1) return -1;

    const { id } = slides[currentDataIndex];

    return id;
  }

  // TODO: Optimize this storing indexes
  getViewBox() {
    const {
      panzooms,
      time,
    } = this.props;

    const currentDataIndex = getCurrentDataIndex(panzooms, time);
    if (currentDataIndex === -1) return '';

    const {
      height,
      width,
      x,
      y,
    } = panzooms[currentDataIndex];

    return {
      height,
      x,
      width,
      y,
    };
  }

  render() {
    const {
      active,
      canvases,
      intl,
      metadata,
      slides,
      time,
    } = this.props;

    const id = this.getSlideId();
    const {
      height,
      x,
      width,
      y,
    } = this.getViewBox();

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('presentation-wrapper', { inactive: !active })}
        id={this.id}
      >
        <div className="presentation">
          <svg
            viewBox={`${x} ${y} ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <defs>
              <clipPath id="clip">
                <rect
                  height={height}
                  x={x}
                  width={width}
                  y={y}
                />
              </clipPath>
            </defs>
            <g className="area">
              <Slide
                id={id}
                intl={intl}
                metadata={metadata}
                slides={slides}
              />
              <Whiteboard
                canvases={canvases}
                id={id}
                metadata={metadata}
                time={time}
              />
            </g>
          </svg>
        </div>
      </div>
    );
  }
}
