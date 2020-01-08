import React, { Component } from 'react';
import Chat from './chat';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Video from './video';
import {
  ALTERNATES,
  CAPTIONS,
  CHAT,
  CURSOR,
  METADATA,
  PANZOOMS,
  SCREENSHARE,
  SHAPES,
  getFileIndex,
} from '../utils/data';
import './index.scss';

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0,
    }

    const {
      data,
    } = props;

    this.alternates = data[getFileIndex(ALTERNATES)];
    this.captions = data[getFileIndex(CAPTIONS)];
    this.chat = data[getFileIndex(CHAT)];
    this.cursor = data[getFileIndex(CURSOR)];
    this.metadata = data[getFileIndex(METADATA)];
    this.panzooms = data[getFileIndex(PANZOOMS)];
    this.screenshare = data[getFileIndex(SCREENSHARE)];
    this.shapes = data[getFileIndex(SHAPES)];

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
    const { media } = data;

    return (
      <div
        aria-label="player"
        className="player-wrapper"
        id="player"
      >
        <Chat
          chat={this.chat}
          time={time}
        />
        <Presentation
          alternates={this.alternates}
          cursor={this.cursor}
          metadata={this.metadata}
          panzooms={this.panzooms}
          shapes={this.shapes}
          time={time}
        />
        <Video
          captions={this.captions}
          media={media}
          metadata={this.metadata}
          onTimeUpdate={this.handleTimeUpdate}
        />
        { this.screenshare.length > 0 ?
          (
            <Screenshare
              media={media}
              metadata={this.metadata}
            />
          ) : null
        }
      </div>
    );
  }
}
