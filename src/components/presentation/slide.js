import React, { Component } from 'react';
import { getCurrentIndex } from '../../utils/data';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const {
      metadata,
      slides,
      time
    } = props;

    this.url = `/presentation/${metadata.id}`;
    this.index = getCurrentIndex(slides, time);
  }

  shouldComponentUpdate(nextProps) {
    const {
      slides,
      time
    } = nextProps;

    const nextIndex = getCurrentIndex(slides, time);
    if (this.index !== nextIndex) {
      this.index = nextIndex;

      return true;
    }

    return false;
  }

  getAlt(xlink) {
    const { alternates } = this.props;

    let result = '';
    const found = alternates.find(alt => xlink === alt.xlink);
    if (found) result = found.text;

    return result;
  }

  render() {
    const { slides } = this.props;
    const { xlink } = slides[this.index];

    return (
      <image
        alt={this.getAlt(xlink)}
        className="slide-wrapper"
        xlinkHref={`${this.url}/${xlink}`}
      />
    );
  }
}
