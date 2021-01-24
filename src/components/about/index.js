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
      const icon = value ? 'icon-check' : 'icon-close';
      element = <div className={cx(icon, { green: value, red: !value})} />;
    } else {
      element = value;
    }

    return (
      <div className="item">
        <div className={`icon-${key}`} />
        <div className="value">
          {element}
        </div>
      </div>
    );
  }

  renderBody(metadata) {
    const { content } = this.props;

    const {
      captions,
      chat,
      notes,
      presentation,
      screenshare,
    } = content;

    return (
      <div className="about-body">
        {this.renderItem('users', metadata.participants)}
        {this.renderItem('presentation', presentation)}
        {this.renderItem('chat', chat)}
        {this.renderItem('notes', notes)}
        {this.renderItem('screenshare', screenshare)}
        {this.renderItem('captions', captions)}
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
        {BUILD ? this.renderItem('settings', BUILD) : null}
      </div>
    );
  }

  render() {
    const {
      intl,
      metadata,
      toggleModal,
    } = this.props;

    return (
      <Modal
        intl={intl}
        onClose={toggleModal}
      >
        {this.renderHeader(metadata)}
        {this.renderBody(metadata)}
        {this.renderFooter()}
      </Modal>
    );
  }
}
