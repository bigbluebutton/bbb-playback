import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import videojs from 'video.js';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.screenshare.wrapper.aria',
    description: 'Aria label for the screenshare wrapper',
  },
});

export default class Screenshare extends PureComponent {
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

      return media.find(m => type.includes(m));
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
    const {
      active,
      intl,
    } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className={cx('screenshare-wrapper', { inactive: !active })}
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
