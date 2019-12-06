import React, { Component } from 'react';
import videojs from 'video.js';

export default class Video extends Component {
  componentDidMount() {
    this.player = videojs(this.node, this.props, () => {
      const { onTimeUpdate } = this.props;
      if (onTimeUpdate) {
        this.player.on('timeupdate', () => {
          const time = this.player.currentTime();
          onTimeUpdate(time);
        });
      }
    });
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    return (
      <div data-vjs-player>
        <video
          ref={ node => this.node = node }
          className="video-js"
          crossOrigin="anonymous"
        />
      </div>
    );
  }
}