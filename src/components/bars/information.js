import React, { PureComponent } from 'react';
import { FormattedDate } from 'react-intl';
import './index.scss';

export default class InformationBar extends PureComponent {
  renderTitle() {
    const {
      epoch,
      name,
    } = this.props;

    const date = <FormattedDate value={new Date(epoch)} />;

    return (
      <span className="title">
        {name} - {date}
      </span>
    );
  }

  render() {
    return (
      <div className="information-bar">
        <div className="left" />
        <div className="center">
          {this.renderTitle()}
        </div>
        <div className="right" />
      </div>
    );
  }
}
