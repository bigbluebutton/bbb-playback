import React, { Component } from 'react';
import Video from './video';
import Chat from './chat';
import Whiteboard from './whiteboard';
import './player.scss';

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0
    }

    const {
      recordId,
      media,
      captions
    } = props;

    const sources = [{
        src: `/presentation/${recordId}/video/webcams.mp4`,
        type: 'video/mp4'
      }, {
        src: `/presentation/${recordId}/video/webcams.webm`,
        type: 'video/webm'
      }
    ];

    const source = sources.filter(src => {
      const { type } = src;
      return type.includes(media);
    });

    const tracks = captions.map(lang => {
      const { locale, localeName } = lang;
      const src = `/presentation/${recordId}/caption_${locale}.vtt`;
      return { kind: 'captions', src, srclang: locale, label: localeName };
    });

    this.videoJsOptions = {
      controls: true,
      sources: source,
      tracks: tracks,
      fill: true
    };

    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  shouldComponentUpdate(prevProps, prevState) {
    const { time } = this.state;
    if (time !== prevState.time) return true;
    return false;
  }

  handleTimeUpdate(value) {
    const { time } = this.state;
    const roundedValue = Math.round(value);
    if (time !== roundedValue) {
      this.setState({ time: roundedValue });
    }
  }

  render() {
    const {
      chat,
      shapes,
      panzooms,
      cursor,
      text
    } = this.props;
    const { time } = this.state;

    return (
      <div className="wrapper">
          <Chat
            time={time}
            chat={chat}
          />
          <Whiteboard
            time={time}
            shapes={shapes}
            panzooms={panzooms}
            cursor={cursor}
            text={text}
          />
          <Video
            onTimeUpdate={this.handleTimeUpdate}
            { ...this.videoJsOptions }
          />
      </div>
    );
  }
}