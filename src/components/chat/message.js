import React, { Component } from 'react';
import cx from 'classnames';
import {
  getAvatarColor,
  getTimeAsString,
} from 'utils/data';
import './index.scss';

export default class Message extends Component {
  shouldComponentUpdate(nextProps) {
    const { active } = this.props;

    if (active !== nextProps.active) return true;

    return false;
  }

  renderAvatar(active, name, onClick) {
    return (
      <div className="avatar-wrapper">
        <div
          className={cx('avatar', { inactive: !active })}
          onClick={onClick}
          style={{ backgroundColor: getAvatarColor(name) }}
        >
          <span className="initials">
            {name.slice(0, 2).toLowerCase()}
          </span>
        </div>
      </div>
    );
  }

  renderContent(active, name, timestamp, text) {
    return (
      <div className="data">
        <div className="info">
          <div className={cx('name', { inactive: !active })}>
            {name}
          </div>
          <div className={cx('time', { inactive: !active })}>
            {getTimeAsString(timestamp)}
          </div>
        </div>
        <div className={cx('text', { inactive: !active })}>
          {text}
        </div>
      </div>
    );
  }

  render() {
    const {
      active,
      name,
      onClick,
      text,
      timestamp,
    } = this.props;

    return (
      <div className="message">
        {this.renderAvatar(active, name, onClick)}
        {this.renderContent(active, name, timestamp, text)}
      </div>
    );
  }
}
