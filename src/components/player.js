import React, { Component } from 'react';
import Video from './video';
import Chat from './chat';
import Presentation from './presentation';
import {
  ALTERNATES,
  CAPTIONS,
  CHAT,
  CURSOR,
  METADATA,
  PANZOOMS,
  SHAPES,
  getFile
} from '../utils/data';
import './index.scss';

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0
    }

    const { data } = props;

    const metadata = data[getFile(METADATA)];
    const captions = data[getFile(CAPTIONS)];

    const { media } = data;

    const sources = [{
        src: `/presentation/${metadata.id}/video/webcams.mp4`,
        type: 'video/mp4'
      }, {
        src: `/presentation/${metadata.id}/video/webcams.webm`,
        type: 'video/webm'
      }
    ].filter(src => {
      const { type } = src;

      return type.includes(media);
    });

    const tracks = captions.map(lang => {
      const { locale, localeName } = lang;
      const src = `/presentation/${metadata.id}/caption_${locale}.vtt`;

      return { kind: 'captions', src, srclang: locale, label: localeName };
    });

    this.videoJsOptions = {
      controls: true,
      sources: sources,
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
    const { data } = this.props
    const { time } = this.state;

    return (
      <div className="player-wrapper">
        <Chat
          chat={data[getFile(CHAT)]}
          time={time}
        />
        <Presentation
          alternates={data[getFile(ALTERNATES)]}
          cursor={data[getFile(CURSOR)]}
          metadata={data[getFile(METADATA)]}
          panzooms={data[getFile(PANZOOMS)]}
          shapes={data[getFile(SHAPES)]}
          time={time}
        />
        <Video
          onTimeUpdate={this.handleTimeUpdate}
          { ...this.videoJsOptions }
        />
      </div>
    );
  }
}
