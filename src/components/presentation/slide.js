import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.id = 'slide';
    this.url = `/presentation/${metadata.id}`;
  }

  render() {
    const {
      id,
      slides,
    } = this.props;

    const current = slides.find(slide => id === slide.id);
    if (!current) return null;

    const {
      alt,
      src,
    } = current;

    return (
      <image
        alt={alt}
        aria-label="slide"
        className="slide-wrapper"
        id={this.id}
        xlinkHref={`${this.url}/${src}`}
      />
    );
  }
}
