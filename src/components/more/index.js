import React, { PureComponent } from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import cx from 'classnames';
import Button from 'components/utils/button';
import './index.scss';

const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;

export default class More extends PureComponent {
  renderDate(metadata) {
    const date = <FormattedDate
      value={new Date(metadata.start)}
      day="numeric"
      month="long"
      year="numeric"
    />;

    const start = <FormattedTime value={new Date(metadata.start)} />
    const end = <FormattedTime value={new Date(metadata.end)} />

    return (
      <div className="date">
        <div className="item">
          {date}
        </div>
        <div className="item">
          {start}
        </div>
        <div className="item">
          -
        </div>
        <div className="item">
          {end}
        </div>
      </div>
    );
  }

  renderItem(key, value) {
    let element;
    if (typeof value === 'boolean') {
      const icon = value ? 'icon-checkmark' : 'icon-close';
      element = <div className={cx(icon, { green: value, red: !value})} />;
    } else {
      element = value;
    }

    return (
      <div className="item">
        <div className="key">
          <div className={`icon-${key}`} />
        </div>
        <div className="value">
          {element}
        </div>
      </div>
    );
  }

  renderBody(metadata) {
    const {
      captions,
      chat,
      screenshare,
    } = this.props;

    return (
      <div className="body">
        {this.renderItem('user', metadata.participants)}
        {this.renderItem('group-chat', chat)}
        {this.renderItem('desktop', screenshare)}
        {this.renderItem('closed-caption', captions)}
      </div>
    );
  }

  render() {
    const {
      metadata,
      toggleMore,
    } = this.props;

    return (
      <div className="more-wrapper">
        <div className="more">
          <div className="control">
            <Button
              handleOnClick={toggleMore}
              icon="close"
            />
          </div>
          <div className="header">
            <div className="name">
              {metadata.name}
            </div>
            {this.renderDate(metadata)}
          </div>
          {this.renderBody(metadata)}
          <div className="footer">
            {this.renderItem('settings', BUILD)}
          </div>
        </div>
      </div>
    );
  }
}
