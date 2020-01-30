import React, { Component } from 'react';
import {
  FormattedDate,
  defineMessages,
} from 'react-intl';
import { files as config } from 'config';
import Chat from './chat';
import Presentation from './presentation';
import Screenshare from './screenshare';
import Thumbnails from './thumbnails';
import Video from './video';
import Button from 'components/utils/button';
import {
  addAlternatesToSlides,
  addAlternatesToThumbnails,
} from 'utils/builder';
import {
  getCurrentDataIndex,
  getFileName,
  isEnabled,
} from 'utils/data';
import Synchronizer from 'utils/synchronizer';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.wrapper.aria',
    description: 'Aria label for the player wrapper',
  },
});

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 0,
      thumbnails: false,
    }

    const {
      data,
    } = props;

    this.player = {
      video: null,
      screenshare: null,
    };

    this.id = 'player';

    this.alternates = data[getFileName(config.data.alternates)];
    this.captions = data[getFileName(config.data.captions)];
    this.chat = data[getFileName(config.data.chat)];
    this.cursor = data[getFileName(config.data.cursor)];
    this.metadata = data[getFileName(config.data.metadata)];
    this.panzooms = data[getFileName(config.data.panzooms)];
    this.screenshare = data[getFileName(config.data.screenshare)];
    this.shapes = data[getFileName(config.data.shapes)];

    this.canvases = this.shapes.canvases;
    this.slides = addAlternatesToSlides(this.shapes.slides, this.alternates);
    this.thumbnails = addAlternatesToThumbnails(this.shapes.thumbnails, this.alternates);

    this.handlePlayerReady = this.handlePlayerReady.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);

    // Uncomment for post-processed data details
    // console.log(data);
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

    if (time !== value) {
      this.setState({ time: value });
    }
  }

  getActiveMain() {
    const { time } = this.state;

    const screenshare = isEnabled(this.screenshare, time);

    return {
      presentation: !screenshare,
      screenshare,
    };
  }

  toggleThumbnails() {
    const { thumbnails } = this.state;

    this.setState({ thumbnails: !thumbnails });
  }

  renderThumbnails() {
    const {
      time,
      thumbnails,
    } = this.state;

    if (!thumbnails) return null;

    const { intl } = this.props;
    const { video } = this.player;

    const currentDataIndex = getCurrentDataIndex(this.thumbnails, time);

    return (
      <Thumbnails
        currentDataIndex={currentDataIndex}
        intl={intl}
        metadata={this.metadata}
        player={video}
        thumbnails={this.thumbnails}
      />
    );
  }

  renderTitle() {
    const {
      epoch,
      name,
    } = this.metadata;

    const date = <FormattedDate value={new Date(epoch)} />;

    return (
      <span className="title">
        {name} - {date}
      </span>
    );
  }

  renderHeader() {
    return (
      <header>
        <div className="left" />
        <div className="center">
          {this.renderTitle()}
        </div>
        <div className="right" />
      </header>
    );
  }

  renderVideo() {
    const {
      data,
      intl,
    } = this.props;

    const { media } = data;

    return (
      <Video
        captions={this.captions}
        intl={intl}
        media={media}
        metadata={this.metadata}
        onPlayerReady={this.handlePlayerReady}
        onTimeUpdate={this.handleTimeUpdate}
      />
    );
  }

  renderChat() {
    const { intl } = this.props;
    const { time } = this.state;
    const { video } = this.player;

    const currentDataIndex = getCurrentDataIndex(this.chat, time);

    return (
      <Chat
        chat={this.chat}
        currentDataIndex={currentDataIndex}
        intl={intl}
        player={video}
      />
    );
  }

  renderSection() {
    return (
      <section>
        <div className="top">
          {this.renderVideo()}
        </div>
        <div className="bottom">
          {this.renderChat()}
       </div>
      </section>
    );
  }

  renderPresentation(active) {
    const { intl } = this.props;
    const { time } = this.state;

    return (
      <Presentation
        active={active}
        canvases={this.canvases}
        cursor={this.cursor}
        intl={intl}
        metadata={this.metadata}
        panzooms={this.panzooms}
        slides={this.slides}
        time={time}
      />
    )
  }


  renderScreenshare(active) {
    // When there is no screenshare
    if (this.screenshare.length === 0) return null;

    const {
      intl,
      data,
    } = this.props;

    const { media } = data;

    return (
      <Screenshare
        active={active}
        intl={intl}
        media={media}
        metadata={this.metadata}
        onPlayerReady={this.handlePlayerReady}
      />
    );
  }

  renderMain() {
    const {
      presentation,
      screenshare,
    } = this.getActiveMain();

    return (
      <main>
        <div className="content">
          {this.renderPresentation(presentation)}
          {this.renderScreenshare(screenshare)}
       </div>
      </main>
    );
  }

  renderFooter() {
    const { thumbnails } = this.state;

    return (
      <footer>
        <div className="left" />
        <div className="center" />
        <div className="right">
          <Button
            active={thumbnails}
            handleOnClick={() => this.toggleThumbnails()}
            ghost
            type="presentation"
          />
        </div>
      </footer>
    );
  }

  render() {
    const { intl } = this.props

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="player-wrapper"
        id={this.id}
      >
        {this.renderHeader()}
        {this.renderSection()}
        {this.renderMain()}
        {this.renderFooter()}
        {this.renderThumbnails()}
      </div>
    );
  }
}
