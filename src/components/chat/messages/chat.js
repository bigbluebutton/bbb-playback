import React, { Component } from 'react';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';
import Message from './message';
import './index.scss';

export default class ChatMessage extends Component {
  shouldComponentUpdate(nextProps) {
    const { active } = this.props;

    if (active !== nextProps.active) return true;

    return false;
  }

  renderHyperlink(active, text) {
    const options = {
      className: cx('linkified', { inactive: !active }),
    };

    return (
      <Linkify options={options}>
        {text}
      </Linkify>
    );
  }

  renderContent(active) {
    const {
      hyperlink,
      text,
    } = this.props;

    return hyperlink ? this.renderHyperlink(active, text) : text;
  }

  render() {
    const {
      active,
      initials,
      onClick,
      name,
      timestamp,
    } = this.props;

    return (
      <Message
        active={active}
        initials={initials}
        onClick={onClick}
        name={name}
        timestamp={timestamp}
      >
        {this.renderContent(active)}
      </Message>
    );
  }
}
