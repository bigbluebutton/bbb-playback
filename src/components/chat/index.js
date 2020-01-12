import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
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
      } = chat[i];

      if (clear === -1 || clear >= time) {
        result.push(
          <span className="chat">
            {name}: {message}<br/>
          </span>
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
