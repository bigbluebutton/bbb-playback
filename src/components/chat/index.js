import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import {
  getTimeAsString,
  getUserColor,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.chat.wrapper.aria',
    description: 'Aria label for the chat wrapper',
  },
});

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.id = 'chat';
  }

  handleOnClick(timestamp) {
    const { player } = this.props;

    if (!player) return null;

    player.currentTime(timestamp);
  }

  renderChat() {
    const {
      chat,
      time,
    } = this.props;

    return chat.map(item => {
      const {
        clear,
        message,
        name,
        timestamp,
      } = item;

      const cleared = clear !== -1 && clear < time;
      const inactive = timestamp >= time || cleared;

      const color = {
        'background-color': inactive ? getUserColor() : getUserColor(name),
      };

      return (
        <div className="chat">
          <div className="avatar-wrapper">
            <div
              className="avatar"
              style={color}
            >
              <span className="initials">
                {name.slice(0, 2).toLowerCase()}
              </span>
            </div>
          </div>
          <div className="content">
            <div className="info">
              <div className={cx('name', { inactive })}>
                {name}
              </div>
              <div
                className={cx('time', { inactive })}
                onClick={() => this.handleOnClick(timestamp)}
              >
                {getTimeAsString(timestamp)}
              </div>
            </div>
            <div className={cx('message', { inactive })}>
              {message}
            </div>
          </div>
        </div>
      );
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        aria-live="polite"
        className="chat-wrapper"
        id={this.id}
      >
        {this.renderChat()}
      </div>
    );
  }
}
