import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.thumbnails.wrapper.aria',
    description: 'Aria label for the thumbnails wrapper',
  },
});

export default class Thumbnails extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.id = 'thumbnails';
    this.url = `/presentation/${metadata.id}`;
  }

  handleOnClick(timestamp) {
    const { player } = this.props;

    if (!player) return null;

    player.currentTime(timestamp);
  }

  renderThumbnails() {
    const { thumbnails } = this.props;

    return thumbnails.map(thumbnail => {
      const {
        alt,
        src,
        timestamp,
      } = thumbnail;

      return (
        <img
          alt={alt}
          className="thumbnail"
          onClick={() => this.handleOnClick(timestamp)}
          src={`${this.url}/${src}`}
        />
      );
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="thumbnails-wrapper"
        id={this.id}
      >
        {this.renderThumbnails()}
      </div>
    );
  }
}
