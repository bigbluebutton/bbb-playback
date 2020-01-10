import React, { Component } from 'react';
import './index.scss';

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
        src,
        timestamp,
      } = thumbnail;

      // TODO: Add alternate
      return (
        <img
          alt="thumbnail"
          className="thumbnail"
          onClick={() => this.handleOnClick(timestamp)}
          src={`${this.url}/${src}`}
        />
      );
    });
  }

  render() {
    return (
      <div
        aria-label="thumbnails"
        className="thumbnails-wrapper"
        id={this.id}
      >
        {this.renderThumbnails()}
      </div>
    );
  }
}
