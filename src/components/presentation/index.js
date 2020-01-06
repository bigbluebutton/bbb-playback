import React, { Component } from 'react';
import Slide from './slide.js';
import { getCurrentDataIndex } from '../../utils/data';
import './index.scss';

export default class Presentation extends Component {
  constructor(props) {
    super(props);

    this.presentationRef = React.createRef();
  }

  getCursorStyle() {
    const {
      cursor,
      time,
    } = this.props;

    const currentDataIndex = getCurrentDataIndex(cursor, time);

    const {
      x,
      y,
    } = cursor[currentDataIndex];

    if (!this.presentationRef.current || (x === -1 && y === -1)) {
      return {
        display: 'none',
      };
    }

    const {
      offsetHeight,
      offsetWidth,
    } = this.presentationRef.current;

    return {
      top: `${x * offsetHeight}px`,
      left: `${y * offsetWidth}px`,
    };
  }

  // TODO: Optimize this storing indexes
  getViewBox() {
    const {
      panzooms,
      time,
    } = this.props;

    const currentDataIndex = getCurrentDataIndex(panzooms, time);

    const {
      height,
      width,
      x,
      y,
    } = panzooms[currentDataIndex];

    return `${x} ${y} ${width} ${height}`;
  }

  render() {
    const {
      alternates,
      metadata,
      shapes,
      time,
    } = this.props;

    const { slides } = shapes;

    return (
      <div className="presentation-wrapper">
        <div
          className="presentation"
          ref={this.presentationRef}
        >
          <svg
            viewBox={this.getViewBox()}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <Slide
              alternates={alternates}
              metadata={metadata}
              slides={slides}
              time={time}
            />
          </svg>
          <div
            className="cursor"
            style={this.getCursorStyle()}
          />
        </div>
      </div>
    );
  }
}
