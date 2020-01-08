import React, { Component } from 'react';
import videojs from 'video.js';
import './index.scss';

export default class Video extends Component {
  constructor(props) {
    super(props);

    const {
      captions,
      media,
      metadata,
    } = props;

    const playbackRates = [0.5, 1, 1.5, 2];
    const url = `/presentation/${metadata.id}`;

    const sources = [
      {
        src: `${url}/video/webcams.mp4`,
        type: 'video/mp4',
      }, {
        src: `${url}/video/webcams.webm`,
        type: 'video/webm',
      },
    ].filter(src => {
      const { type } = src;

      return type.includes(media);
    });

    const tracks = captions.map(lang => {
      const {
        locale,
        localeName,
      } = lang;

      const src = `/presentation/${metadata.id}/caption_${locale}.vtt`;

      return {
        kind: 'captions',
        src,
        srclang: locale,
        label: localeName,
      };
    });

    this.id = 'video';
    this.options = {
      controls: true,
      sources,
      tracks,
      playbackRates,
      fill: true,
    };
  }

  componentDidMount() {
    this.player = videojs(this.node, this.options, () => {
      const {
        onPlayerReady,
        onTimeUpdate,
      } = this.props;

      if (onTimeUpdate) {
        this.player.on('timeupdate', () => {
          const time = this.player.currentTime();
          onTimeUpdate(time);
        });
      }

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
        aria-label="video"
        className="video-wrapper"
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
