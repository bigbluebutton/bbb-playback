import React, { PureComponent } from 'react';
import { FormattedTime } from 'react-intl';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import { getTimestampAsMilliseconds } from 'utils/data';
import './index.scss';

export default class Message extends PureComponent {
  renderAvatar(active, name) {
    const {
      icon,
      initials,
      onClick,
    } = this.props;

    return (
      <div
        className={cx('interactive', { inactive: !active })}
        onClick={onClick}
        onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
        tabIndex="0"
      >
        <Avatar
          active={active}
          icon={icon}
          initials={initials}
          name={name}
        />
      </div>
    );
  }

  renderInfo(active, name) {
    const {
      timestamp,
    } = this.props;

    const milliseconds = getTimestampAsMilliseconds(timestamp);

    return (
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
    );
  }

  render() {
    const {
      active,
      children,
      name,
    } = this.props;

    return (
      <div className="message">
        {this.renderAvatar(active, name)}
        <div className="data">
          {this.renderInfo(active, name)}
          <div className={cx('text', { inactive: !active })}>
            {children}
          </div>
        </div>
      </div>
    );
  }
}
