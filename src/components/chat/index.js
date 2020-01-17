import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import {
  getTimeAsString,
  getUserColor,
  isActive,
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

      const active = isActive(time, timestamp, clear);

      const avatar = {
        'background-color': active ? getUserColor(name) : getUserColor(),
      };

      return (
        <div className="chat">
          <div className="avatar-wrapper">
            <div
              className="avatar"
              onClick={() => this.handleOnClick(timestamp)}
              style={avatar}
            >
              <span className="initials">
                {name.slice(0, 2).toLowerCase()}
              </span>
            </div>
          </div>
          <div className="content">
            <div className="info">
              <div className={cx('name', { inactive: !active })}>
                {name}
              </div>
              <div className={cx('time', { inactive: !active })}>
                {getTimeAsString(timestamp)}
              </div>
            </div>
            <div className={cx('message', { inactive: !active })}>
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
