import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;
    this.url = `/presentation/${metadata.id}`;
    this.index = 0;
  }

  shouldComponentUpdate(nextProps) {
    const { time } = nextProps;
    const nextIndex = this.getIndex(time);
    if (this.index !== nextIndex) {
      this.index = nextIndex;
      return true;
    }
    return false;
  }

  getIndex(time) {
    const { slides } = this.props;

    let i = 0;
    while (i < slides.length - 1 && slides[i].timestamp < time) i++;

    return i;
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
        className="slide-wrapper"
        xlinkHref={`${this.url}/${xlink}`}
        alt={this.getAlt(xlink)}
      />
    );
  }
}
