import React, { Component } from 'react';
import Slide from './slide.js';
import './index.scss';

export default class Presentation extends Component {
  // TODO: Optimize this storing indexes
  getViewBox() {
    const {
      time,
      panzooms
    } = this.props;

    let i = 0;
    while (i < panzooms.length - 1 && panzooms[i].timestamp < time) i++;

    const pz = panzooms[i];
    return `${pz.x} ${pz.y} ${pz.width} ${pz.height}`;
  }

  render() {
    const {
      time,
      metadata,
      shapes,
      text,
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
            time={time}
            metadata={metadata}
            slides={slides}
            text={text}
          />
        </svg>
      </div>
    );
  }
}
