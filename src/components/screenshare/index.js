import React, { Component } from 'react';
import videojs from 'video.js';
import './index.scss';

export default class Screenshare extends Component {
  constructor(props) {
    super(props);

    const {
      media,
      metadata,
    } = props;

    const url = `/presentation/${metadata.id}`;

    const sources = [
      {
        src: `${url}/deskshare/deskshare.mp4`,
        type: `video/mp4`,
      }, {
        src: `${url}/deskshare/deskshare.webm`,
        type: `video/webm`,
      },
    ].filter(src => {
      const { type } = src;

      return type.includes(media);
    });

    this.id = 'screenshare';
    this.options = {
      controls: false,
      sources,
      fill: true,
    };
  }

  componentDidMount() {
    this.player = videojs(this.node, this.options, () => {
      const { onPlayerReady } = this.props;

      if (onPlayerReady) onPlayerReady(this.id, this.player);
    });
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  render() {
    return (
      <div
        aria-label="screenshare"
        className="screenshare-wrapper"
        id={this.id}
      >
        <div data-vjs-player>
          <video
            className="video-js"
            crossOrigin="anonymous"
            playsInline
            preload="auto"
            ref={ node => this.node = node }
          />
        </div>
      </div>
    );
  }
}
