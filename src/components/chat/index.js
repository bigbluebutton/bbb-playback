import React, { Component } from 'react';
import './index.scss'

export default class Chat extends Component {
  renderChat() {
    const {
      chat,
      time,
    } = this.props;

    const result = [];
    let i = 0;
    while (i < chat.length && chat[i].timestamp < time) {
      const {
        message,
        name,
      } = chat[i];

      result.push(<span>{name}: {message}<br/></span>);
      i++;
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
