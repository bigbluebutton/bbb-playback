import React, { Component } from 'react';
import './index.scss'

export default class Chat extends Component {
  renderChat() {
    const { time, chat } = this.props;
    const result = [];

    for (let i = 0; i < chat.length; i++) {
      const { timestamp, name, message } = chat[i];

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
