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

  render() {
    const {
      id,
      intl,
      slides,
      thumbnails,
    } = this.props;

    const current = slides.find(slide => id === slide.id);
    if (!current) return null;

    const thumbnail = thumbnails.find(thumbnails => id === thumbnails.id);

    const {
      alt,
      src,
    } = current;

    return (
      <g>
        <image
          href={`${this.url}/${thumbnail.src}`}
          className="thumbnail"
        />
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
