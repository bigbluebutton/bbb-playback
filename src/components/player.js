import React, { Component } from 'react';
import {
  defineMessages,
  injectIntl,
} from 'react-intl';
import Chat from './chat';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Thumbnails from './thumbnails';
import Video from './video';
import {
  addAlternatesToSlides,
  addAlternatesToThumbnails,
} from 'utils/builder';
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
} from 'utils/data';
import Synchronizer from 'utils/synchronizer';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
});

class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0,
    }

    const {
      data,
    } = props;

    this.player = {
      video: null,
      screenshare: null,
    };

    this.id = 'player';

    this.alternates = data[getFileIndex(ALTERNATES)];
    this.captions = data[getFileIndex(CAPTIONS)];
    this.chat = data[getFileIndex(CHAT)];
    this.cursor = data[getFileIndex(CURSOR)];
    this.metadata = data[getFileIndex(METADATA)];
    this.panzooms = data[getFileIndex(PANZOOMS)];
    this.screenshare = data[getFileIndex(SCREENSHARE)];
    this.shapes = data[getFileIndex(SHAPES)];

    this.canvases = this.shapes.canvases;
    this.slides = addAlternatesToSlides(this.shapes.slides, this.alternates);
    this.thumbnails = addAlternatesToThumbnails(this.shapes.thumbnails, this.alternates);

    this.handlePlayerReady = this.handlePlayerReady.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);

    // Uncomment for post-processed data details
    // console.log(data);
  }

  shouldComponentUpdate(prevProps, prevState) {
    const { time } = this.state;
    if (time !== prevState.time) return true;

    return false;
  }

  handlePlayerReady(media, player) {
    switch (media) {
      case 'video':
        this.player.video = player;
        break;
      case 'screenshare':
        this.player.screenshare = player;
        break;
      default:
    }

    if (this.player.video && this.player.screenshare) {
      this.synchronizer = new Synchronizer(this.player.video, this.player.screenshare);
    }
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
      intl,
      data,
    } = this.props

    const { time } = this.state;
    const { video } = this.player;
    const { media } = data;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="player-wrapper"
        id={this.id}
      >
        <Thumbnails
          intl={intl}
          metadata={this.metadata}
          player={video}
          thumbnails={this.thumbnails}
        />
        <Chat
          chat={this.chat}
          intl={intl}
          time={time}
        />
        <Presentation
          canvases={this.canvases}
          cursor={this.cursor}
          intl={intl}
          metadata={this.metadata}
          panzooms={this.panzooms}
          slides={this.slides}
          time={time}
        />
        <Video
          captions={this.captions}
          intl={intl}
          media={media}
          metadata={this.metadata}
          onPlayerReady={this.handlePlayerReady}
          onTimeUpdate={this.handleTimeUpdate}
        />
        { this.screenshare.length > 0 ?
          (
            <Screenshare
              intl={intl}
              media={media}
              metadata={this.metadata}
              onPlayerReady={this.handlePlayerReady}
            />
          ) : null
        }
      </div>
    );
  }
}

export default injectIntl(Player);
