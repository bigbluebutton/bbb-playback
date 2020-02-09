import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import videojs from 'video.js';
import { video as config } from 'config';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.video.wrapper.aria',
    description: 'Aria label for the video wrapper',
  },
});

export default class Video extends PureComponent {
  constructor(props) {
    super(props);

    const {
      captions,
      media,
      metadata,
    } = props;

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
      controlBar: {
        fullscreenToggle: false,
        pictureInPictureToggle: false,
        volumePanel: {
          inline: false,
          vertical: true,
        },
      },
      controls: true,
      fill: true,
      inactivityTimeout: 0,
      playbackRates: config.rates,
      sources,
      tracks,
    };
  }

  componentDidMount() {
    this.player = videojs(this.node, this.options, () => {
      const {
        onPlayerReady,
        onTimeUpdate,
      } = this.props;

      if (onTimeUpdate) {
        this.player.on('play', () => {
          setInterval(() => {
            const time = this.player.currentTime();
            onTimeUpdate(time);
          }, 1000 / config.fps);
        });

        this.player.on('pause', () => clearInterval());
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
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="video-wrapper"
        id={this.id}
      >
        <div data-vjs-player>
          <video
            className="video-js"
            crossOrigin="anonymous"
            playsInline
            preload="auto"
            ref={node => this.node = node}
          />
        </div>
      </div>
    );
  }
}
