import React, { Component } from 'react';
import './index.scss'

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
    return (
      <div
        aria-label="chat"
        aria-live="polite"
        className="chat-wrapper"
        id={this.id}
      >
        {this.renderChat()}
      </div>
    );
  }
}
