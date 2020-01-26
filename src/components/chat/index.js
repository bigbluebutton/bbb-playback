import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import {
  AUTO_SCROLL,
  getScrollTop,
  getTimeAsString,
  getUserColor,
  isActive,
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

  shouldComponentUpdate(nextProps) {
    const {
      currentDataIndex,
      clear,
    } = this.props;

    // New message
    if (currentDataIndex !== nextProps.currentDataIndex) {
      return true;
    }

    // Cleared messages
    if (!clear && nextProps.clear) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    if (!AUTO_SCROLL) return;

    // Auto-scroll can start after getting the first and current nodes
    if (this.firstNode && this.currentNode) {
      const { parentNode } = this.currentNode;

      parentNode.scrollTop = getScrollTop(this.firstNode, this.currentNode, 'bottom');
    }
  }

  getStyle(active, name) {
    const style = {
      'background-color': active ? getUserColor(name) : getUserColor(),
    };

    return style;
  }

  handleOnClick(timestamp) {
    const { player } = this.props;

    if (!player) return null;

    player.currentTime(timestamp);
  }

  // Set node as ref so we can manage auto-scroll
  setRef(node, index) {
    const { currentDataIndex } = this.props;

    // Set first node only once
    if (!this.firstNode && index === 0) {
      this.firstNode = node;
    }

    if (index === currentDataIndex) {
      this.currentNode = node;
    }
  }

  renderChat() {
    const {
      chat,
      currentDataIndex,
      time,
    } = this.props;

    return chat.map((item, index) => {
      const {
        clear,
        message,
        name,
        timestamp,
      } = item;

      // Taking advantage of short-circuit
      const active = index <= currentDataIndex && isActive(time, timestamp, clear);
      const style = this.getStyle(active, name);

      return (
        <div
          className="chat"
          ref={ node => this.setRef(node, index)}
        >
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
