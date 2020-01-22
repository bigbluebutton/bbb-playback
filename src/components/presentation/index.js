import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
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
      canvases,
      intl,
      metadata,
      slides,
      time,
    } = this.props;

    const id = this.getSlideId();

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
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
              id={id}
              intl={intl}
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