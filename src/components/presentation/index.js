import React, { Component } from 'react';
import Slide from './slide.js';
import { getCurrentIndex } from '../../utils/data';
import './index.scss';

export default class Presentation extends Component {
  // TODO: Optimize this storing indexes
  getViewBox() {
    const {
      panzooms,
      time
    } = this.props;

    const index = getCurrentIndex(panzooms, time);

    const {
      height,
      width,
      x,
      y
    } = panzooms[index];

    return `${x} ${y} ${width} ${height}`;
  }

  render() {
    const {
      alternates,
      metadata,
      shapes,
      time
    } = this.props;

    const { slides } = shapes;

    return (
      <div className="presentation-wrapper">
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
      </div>
    );
  }
}
