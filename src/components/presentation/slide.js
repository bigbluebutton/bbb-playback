import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.slide.wrapper.aria',
    description: 'Aria label for the slide wrapper',
  },
});

export default class Slide extends PureComponent {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.id = 'slide';
    this.url = `/presentation/${metadata.id}`;
  }

  getProxy(id) {
    const { thumbnails } = this.props;

    const thumbnail = thumbnails.find(thumbnails => id === thumbnails.id);
    if (!thumbnail) return null;

    return (
      <image
        href={`${this.url}/${thumbnail.src}`}
        className="proxy"
      />
    );
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
      <g>
        {this.getProxy(id)}
        <image
          alt={alt}
          aria-label={intl.formatMessage(intlMessages.aria)}
          id={this.id}
          href={`${this.url}/${src}`}
        />
      </g>
    );
  }
}
