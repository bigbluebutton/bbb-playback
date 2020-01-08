import React, { Component } from 'react';
import Slide from './slide';
import Whiteboard from './whiteboard';
import { getCurrentDataIndex } from '../../utils/data';
import './index.scss';

export default class Presentation extends Component {
  constructor(props) {
    super(props);

    this.id = 'presentation';
  }

  getSlideId() {
    const {
      shapes,
      time,
    } = this.props;

    const { slides } = shapes;
    const currentDataIndex = getCurrentDataIndex(slides, time);
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

    const {
      canvases,
      slides,
    } = shapes;

    const id = this.getSlideId();

    return (
      <div
        aria-label="presentation"
        className="presentation-wrapper"
        id={this.id}
      >
        <div className="presentation">
          <svg
            viewBox={this.getViewBox()}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <Slide
              alternates={alternates}
              id={id}
              metadata={metadata}
              slides={slides}
            />
            <Whiteboard
              canvases={canvases}
              id={id}
              time={time}
            />
          </svg>
        </div>
      </div>
    );
  }
}
