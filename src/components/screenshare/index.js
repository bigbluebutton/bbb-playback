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

    const sources = [
      {
        src: `/presentation/${metadata.id}/deskshare/deskshare.mp4`,
        type: `video/mp4`,
      }, {
        src: `/presentation/${metadata.id}/deskshare/deskshare.webm`,
        type: `video/webm`,
      },
    ].filter(src => {
      const { type } = src;

      return type.includes(media);
    });

    this.options = {
      controls: false,
      sources,
      fill: true,
    };
  }

  componentDidMount() {
    this.player = videojs(this.node, this.options, () => {});
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
        id="screenshare"
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
