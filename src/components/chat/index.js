import React, { Component } from 'react';
import './index.scss'

export default class Chat extends Component {
  renderChat() {
    const {
      chat,
      time
    } = this.props;

    const result = [];

    for (let i = 0; i < chat.length; i++) {
      const {
        message,
        name,
        timestamp
      } = chat[i];

      const visible = time > timestamp;
      if (visible) {
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
