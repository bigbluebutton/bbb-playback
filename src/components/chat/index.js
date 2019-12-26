import React, { Component } from 'react';
import './index.scss'

export default class Chat extends Component {
  renderChat() {
    const { time, chat } = this.props;
    const result = [];

    for (let i = 0; i < chat.length; i++) {
      const { send, clear, name, message } = chat[i];

      const sent = time > send;
      const cleared = clear && time > clear;

      if (sent && !cleared) {
        result.push(<span>{name}: {message}<br/></span>);
      } else {
        break;
      }
    }

    return result;
  }

  render() {
    return (
      <div className="chat-wrapper">
        {this.renderChat()}
      </div>
    );
  }
}
