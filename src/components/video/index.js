import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import videojs from 'video.js/core.es.js';
import { video as config } from 'config';
import {
  ID,
  buildFileURL,
} from 'utils/data';
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

    const sources = [
      {
        src: buildFileURL(metadata.id, 'video/webcams.mp4'),
        type: 'video/mp4',
      }, {
        src: buildFileURL(metadata.id, 'video/webcams.webm'),
        type: 'video/webm',
      },
    ].filter(src => {
      const { type } = src;

      return media.find(m => type.includes(m));
    });

    const tracks = captions.map(lang => {
      const {
        locale,
        localeName,
      } = lang;

      return {
        kind: 'captions',
        src: buildFileURL(metadata.id, `caption_${locale}.vtt`),
        srclang: locale,
        label: localeName,
      };
    });

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
        time,
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

      if (time) {
        this.player.on('loadedmetadata', () => {
          const duration = this.player.duration();
          if (time < duration) {
            this.player.currentTime(time);
          }
        });
      }

      if (onPlayerReady) onPlayerReady(ID.VIDEO, this.player);
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
        id={ID.VIDEO}
      >
        <div data-vjs-player>
          <video
            className="video-js"
            playsInline
            preload="auto"
            ref={node => this.node = node}
          />
        </div>
      </div>
    );
  }
}
