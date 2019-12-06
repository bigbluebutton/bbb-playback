import React, { Component } from 'react';
import { parseStringPromise } from 'xml2js';
import Message from './message';

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.data = [];
    this.buildData = this.buildData.bind(this);
    this.buildChat = this.buildChat.bind(this);

    parseStringPromise(props.chat).then(result => {
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
          in: parseInt(attr.in, 10),
          out: attr.out ? parseInt(attr.out, 10) : undefined,
          name: attr.name,
          message: attr.message
        };
      });
    }
  }

  buildChat() {
    const { time } = this.props;
    const chat = [];

    for (let i = 0; i < this.data.length; i++) {
      const sent = this.data[i].in > time;
      const cleared = this.data[i].out && this.data[i].out > time;

      if (!sent) break;

      if (sent && !cleared) {
        chat.push(
          <Message
            name={this.data[i].name}
            message={this.data[i].message}
          />
        );
      }
    }

    console.log(chat)

    return chat;
  }

  render() {
    if (this.data.length > 0) return null;

    return (
      <div>
        {this.buildChat()}
      </div>
    );
  }
}