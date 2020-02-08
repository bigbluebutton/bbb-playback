import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import Cursor from './cursor';
import Slide from './slide';
import Whiteboard from './whiteboard';
import {
  getCurrentDataIndex,
  isActive,
} from 'utils/data';
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

    const inactive = -1;
    const currentDataIndex = getCurrentDataIndex(slides, time);
    if (currentDataIndex === -1) return inactive;

    const currentData = slides[currentDataIndex];

    return currentData.id;
  }

  getViewBox() {
    const {
      panzooms,
      time,
    } = this.props;

    const inactive = {
      height: 0,
      x: 0,
      width: 0,
      y: 0,
    };

    const currentDataIndex = getCurrentDataIndex(panzooms, time);
    if (currentDataIndex === -1) return inactive;

    const currentData = panzooms[currentDataIndex];

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
      cursor,
      time,
    } = this.props;

    const inactive = {
      x: -1,
      y: -1,
    }

    const currentDataIndex = getCurrentDataIndex(cursor, time);
    if (currentDataIndex === -1) return inactive;

    const currentData = cursor[currentDataIndex];
    if (currentData.x === -1 && currentData.y === -1) return inactive;

    return {
      x: viewBox.x + (currentData.x * viewBox.width),
      y: viewBox.y + (currentData.y * viewBox.height),
    };
  }

  getAnnotations(id) {
    const {
      canvases,
      time,
    } = this.props;

    let first = -1;
    let last = -1;

    const canvas = canvases.find(canvas => id === canvas.id);
    if (!canvas) {
      return {
        draws: null,
        first,
        last,
      };
    }

    const { draws } = canvas;

    for (let i = 0; i < draws.length; i++) {
      const {
        clear,
        id,
        timestamp,
      } = draws[i];

      const active = isActive(time, timestamp, clear);
      if (!active) {
        if (last !== -1) break;
        continue;
      }

      if (first === -1) first = i;

      const j = i + 1;
      let intermediate = false;
      if (j < draws.length && isActive(time, draws[j].timestamp)) {
        intermediate = draws[j].id === id;
      }

      if (intermediate) continue;

      last = i;
    }

    return {
      draws,
      first,
      last,
    }
  }


  render() {
    const {
      active,
      intl,
      metadata,
      slides,
      thumbnails,
    } = this.props;

    const id = this.getSlideId();
    const annotations = this.getAnnotations(id);
    const viewBox = this.getViewBox();
    const cursor = this.getCursor(viewBox);

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('presentation-wrapper', { inactive: !active })}
        id={this.id}
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
                id={id}
                intl={intl}
                metadata={metadata}
                slides={slides}
                thumbnails={thumbnails}
              />
              <Whiteboard
                draws={annotations.draws}
                first={annotations.first}
                id={id}
                last={annotations.last}
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
