import React, { Component } from 'react';
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

  renderChat() {
    const {
      chat,
      time,
    } = this.props;

    const result = [];
    let i = 0;
    while (i < chat.length && chat[i].timestamp < time) {
      const {
        clear,
        message,
        name,
        timestamp,
      } = chat[i];

      if (clear === -1 || clear >= time) {
        result.push(
          <div className="chat">
            <div className="avatar-wrapper">
              <div
                className="avatar"
                style={{ 'background-color': getUserColor(name) }}
              >
                <span className="initials">
                  {name.slice(0, 2).toLowerCase()}
                </span>
              </div>
            </div>
            <div className="content">
              <div className="info">
                <div className="name">
                  {name}
                </div>
                <div className="time">
                  {getTimeAsString(timestamp)}
                </div>
              </div>
              <div className="message">
                {message}
              </div>
            </div>
          </div>
        );
      }

      i++;
    }

    return result;
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
