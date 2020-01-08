import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;
    this.url = `/presentation/${metadata.id}`;
  }

  getAlt(xlink) {
    const { alternates } = this.props;

    let result = '';
    const found = alternates.find(alt => xlink === alt.xlink);
    if (found) result = found.text;

    return result;
  }

  render() {
    const {
      id,
      slides,
    } = this.props;

    const current = slides.find(slide => id === slide.id);
    if (!current) return null;

    const { xlink } = current;

    return (
      <image
        alt={this.getAlt(xlink)}
        aria-label="slide"
        className="slide-wrapper"
        id="slide"
        xlinkHref={`${this.url}/${xlink}`}
      />
    );
  }
}
