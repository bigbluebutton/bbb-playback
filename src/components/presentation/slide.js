import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.slide.wrapper.aria',
    description: 'Aria label for the slide wrapper',
  },
});

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
      intl,
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
        aria-label={intl.formatMessage(intlMessages.aria)}
        id={this.id}
        xlinkHref={`${this.url}/${src}`}
      />
    );
  }
}
