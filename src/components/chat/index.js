import React, { Component } from 'react';
import { parseStringPromise } from 'xml2js';
import './index.scss'

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.data = [];
    this.buildData = this.buildData.bind(this);
    this.renderChat = this.renderChat.bind(this);
  }

  componentDidMount() {
    const { chat } = this.props;

    parseStringPromise(chat).then(result => {
      this.buildData(result);
    }).catch(error => console.log(error));
  }

  buildData(result) {
    const { popcorn } = result;
    if (popcorn && popcorn.chattimeline) {
      const { chattimeline } = popcorn;
      this.data = chattimeline.map(chat => {
        const attr = chat['$'];
        return {
          send: parseInt(attr.in, 10),
          clear: attr.out ? parseInt(attr.out, 10) : undefined,
          name: attr.name,
          message: attr.message
        };
      });
    }
  }

  renderChat() {
    const { time } = this.props;
    const chat = [];

    for (let i = 0; i < this.data.length; i++) {
      const { send, clear, name, message } = this.data[i];

      const sent = time > send;
      const cleared = clear && time > clear;

      if (sent && !cleared) {
        chat.push(<span>{name}: {message}<br/></span>);
      } else {
        break;
      }
    }

    return chat;
  }

  render() {
    return (
      <div className="chat-wrapper">
        {this.renderChat()}
      </div>
    );
  }
}
