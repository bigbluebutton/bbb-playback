import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;
    this.url = `/presentation/${metadata.id}`;
  }

  render() {
    const { slides, text } = this.props;
    const s = slides[0];
    return (
      <image
        className="slide-wrapper"
        xlinkHref={`${this.url}/${s.xlink}`}
      />
    );
  }
}
