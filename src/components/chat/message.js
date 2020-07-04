import React, { Component } from 'react';
import { FormattedTime } from 'react-intl';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';
import {
  getAvatarColor,
  getTimestampAsMilliseconds,
} from 'utils/data';
import './index.scss';

export default class Message extends Component {
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
          onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
          style={{ backgroundColor: getAvatarColor(name) }}
          tabIndex="0"
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

    return (
      <div className="data">
        <div className="info">
          <div className={cx('name', { inactive: !active })}>
            {name}
          </div>
          <div className={cx('time', { inactive: !active })}>
            <FormattedTime
              hourCycle="h23"
              hour="numeric"
              minute="numeric"
              second="numeric"
              timeZone="UTC"
              value={milliseconds}
            />
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
