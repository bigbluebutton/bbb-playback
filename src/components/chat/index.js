import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { chat as config } from 'config';
import {
  getAvatarColor,
  getScrollTop,
  getTimeAsString,
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
    if (!config.scroll) return;

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

  getStyle(active, name) {
    const style = {
      'background-color': active ? getAvatarColor(name) : getAvatarColor(),
    };

    return style;
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

  renderAvatar(active, name, timestamp) {
    const style = this.getStyle(active, name);

    return (
      <div className="avatar-wrapper">
        <div
          className="avatar"
          onClick={() => this.handleOnClick(timestamp)}
          style={style}
        >
          <span className="initials">
            {name.slice(0, 2).toLowerCase()}
          </span>
        </div>
      </div>
    );
  }

  renderContent(active, name, timestamp, message) {
    return (
      <div className="content">
        <div className="info">
          <div className={cx('name', { inactive: !active })}>
            {name}
          </div>
          <div className={cx('time', { inactive: !active })}>
            {getTimeAsString(timestamp)}
          </div>
        </div>
        <div className={cx('message', { inactive: !active })}>
          {message}
        </div>
      </div>
    );
  }

  renderChat() {
    const {
      chat,
      currentDataIndex,
    } = this.props;

    return chat.map((item, index) => {
      const {
        message,
        name,
        timestamp,
      } = item;

      const active = index <= currentDataIndex;

      return (
        <div
          className="chat"
          ref={ node => this.setRef(node, index)}
        >
          {this.renderAvatar(active, name, timestamp)}
          {this.renderContent(active, name, timestamp, message)}
       </div>
      );
    });
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
