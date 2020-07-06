import React, { PureComponent } from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

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

  renderItem(type, value) {
    let element;
    if (typeof value === 'boolean') {
      element = <div className={value ? 'icon-checkmark' : 'icon-close'} />;
    } else {
      element = value;
    }

    return (
      <div className="item">
        <div className={`icon-${type}`} />
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
            {this.renderItem('settings', 'ddfgsdfg')}
          </div>
        </div>
      </div>
    );
  }
}
