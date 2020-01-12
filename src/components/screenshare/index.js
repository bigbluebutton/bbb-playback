import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import videojs from 'video.js';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.screenshare.wrapper.aria',
    description: 'Aria label for the screenshare wrapper',
  },
});

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
      fill: true,
      sources,
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
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
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
