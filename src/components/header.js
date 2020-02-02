import React, { PureComponent } from 'react';
import { FormattedDate } from 'react-intl';
import './index.scss';

export default class Footer extends PureComponent {
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
      <header>
        <div className="left" />
        <div className="center">
          {this.renderTitle()}
        </div>
        <div className="right" />
      </header>
    );
  }
}
