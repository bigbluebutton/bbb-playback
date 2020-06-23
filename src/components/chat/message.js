import React, { Component } from 'react';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';
import {
  getAvatarColor,
  getTimestampAsMilliseconds,
} from 'utils/data';
import './index.scss';

export default class Message extends Component {
  constructor(props) {
    super(props);

    const options = {
      hourCycle: 'h23',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'UTC',
    };

    // TODO: As soon as react-int fixes FormattedTime
    // this should come back as it were before
    this.timeFormatter = new Intl.DateTimeFormat('default', options);
  }

  shouldComponentUpdate(nextProps) {
    const { active } = this.props;

    if (active !== nextProps.active) return true;

    return false;
  }

  renderAvatar(active, name) {
    const {
      initials,
      onClick,
    } = this.props;

    return (
      <div className="avatar-wrapper">
        <div
          className={cx('avatar', { inactive: !active })}
          onClick={onClick}
          style={{ backgroundColor: getAvatarColor(name) }}
        >
          <span className="initials">
            {initials}
          </span>
        </div>
      </div>
    );
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

  renderContent(active, name) {
    const {
      hyperlink,
      text,
      timestamp,
    } = this.props;

    const milliseconds = getTimestampAsMilliseconds(timestamp);
    const time = this.timeFormatter.format(milliseconds);

    return (
      <div className="data">
        <div className="info">
          <div className={cx('name', { inactive: !active })}>
            {name}
          </div>
          <div className={cx('time', { inactive: !active })}>
            {time}
          </div>
        </div>
        <div className={cx('text', { inactive: !active })}>
          {hyperlink ? this.renderHyperlink(active, text) : text}
        </div>
      </div>
    );
  }

  render() {
    const {
      active,
      name,
    } = this.props;

    return (
      <div className="message">
        {this.renderAvatar(active, name)}
        {this.renderContent(active, name)}
      </div>
    );
  }
}
