import React, { PureComponent } from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import cx from 'classnames';
import Modal from 'components/utils/modal';
import './index.scss';

const BUILD = process.env.REACT_APP_BBB_PLAYBACK_BUILD;

export default class About extends PureComponent {
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
      notes,
      screenshare,
    } = this.props;

    return (
      <div className="about-body">
        {this.renderItem('user', metadata.participants)}
        {this.renderItem('chat', chat)}
        {this.renderItem('notes', notes)}
        {this.renderItem('desktop', screenshare)}
        {this.renderItem('closed-caption', captions)}
      </div>
    );
  }

  renderHeader(metadata) {
    const {
      end,
      name,
      start,
    } = metadata;

    const subtitle = [];
    subtitle.push(
      <FormattedDate
        value={new Date(start)}
        day="numeric"
        month="long"
        year="numeric"
      />
    );

    subtitle.push(<FormattedTime value={new Date(start)} />);
    subtitle.push(<FormattedTime value={new Date(end)} />);

    return (
      <div className="about-header">
        <div className="title">
          {name}
        </div>
        <div className="subtitle">
          {subtitle.map(s => <div className="item">{s}</div>)}
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className="about-footer">
        {this.renderItem('settings', BUILD)}
      </div>
    );
  }

  render() {
    const {
      metadata,
      toggleModal,
    } = this.props;

    return (
      <Modal onClose={toggleModal}>
        {this.renderHeader(metadata)}
        {this.renderBody(metadata)}
        {this.renderFooter()}
      </Modal>
    );
  }
}
