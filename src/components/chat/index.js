import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import { chat as config } from 'config';
import ChatMessage from './messages/chat';
import PollMessage from './messages/poll';
import {
  ID,
  getMessageType,
  getScrollTop,
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

    this.interaction = false;
  }

  componentDidMount() {
    this.handleAutoScroll();
  }

  shouldComponentUpdate(nextProps) {
    const { currentDataIndex } = this.props;

    if (currentDataIndex !== nextProps.currentDataIndex) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    this.handleAutoScroll();
  }

  handleAutoScroll() {
    if (!config.scroll || this.interaction) return;

    // Auto-scroll can start after getting the first and current nodes
    if (this.firstNode && this.currentNode) {
      const { parentNode } = this.currentNode;

      parentNode.scrollTop = getScrollTop(this.firstNode, this.currentNode, config.align);
    }
  }

  handleOnClick(timestamp) {
    const { player } = this.props;

    if (!player) return null;

    player.currentTime(timestamp);
  }

  // Set node as ref so we can manage auto-scroll
  setRef(node, index) {
    const { currentDataIndex } = this.props;

    if (index === 0) {
      this.firstNode = node;
    }

    if (index === currentDataIndex) {
      this.currentNode = node;
    }
  }

  renderChatMessage(item, index, active) {
    const {
      hyperlink,
      initials,
      message,
      name,
      timestamp,
    } = item;

    return (
      <span ref={node => this.setRef(node, index)}>
        <ChatMessage
          active={active}
          hyperlink={hyperlink}
          initials={initials}
          name={name}
          onClick={() => this.handleOnClick(timestamp)}
          text={message}
          timestamp={timestamp}
        />
      </span>
    );
  }

  renderPollMessage(item, index, active, intl) {
    const {
      answers,
      question,
      responders,
      timestamp,
      type,
    } = item;

    return (
      <span ref={node => this.setRef(node, index)}>
        <PollMessage
          active={active}
          answers={answers}
          intl={intl}
          onClick={() => this.handleOnClick(timestamp)}
          question={question}
          responders={responders}
          timestamp={timestamp}
          type={type}
        />
      </span>
    );
  }

  renderMessages(intl) {
    const {
      chat,
      currentDataIndex,
    } = this.props;

    return chat.map((item, index) => {
      const active = index <= currentDataIndex;
      const type = getMessageType(item);
      switch (type) {
        case ID.CHAT:
          return this.renderChatMessage(item, index, active);
        case ID.POLLS:
          return this.renderPollMessage(item, index, active, intl);
        default:
          return <span ref={node => this.setRef(node, index)} />;
      }
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        aria-live="polite"
        className="chat-wrapper"
        id={ID.CHAT}
        tabIndex="0"
      >
        <div className="list">
          <div
            className="message-wrapper"
            onMouseEnter={() => this.interaction = true}
            onMouseLeave={() => this.interaction = false}
          >
            {this.renderMessages(intl)}
          </div>
        </div>
      </div>
    );
  }
}
