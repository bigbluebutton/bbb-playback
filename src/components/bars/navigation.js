import React, { PureComponent } from 'react';
import { FormattedDate } from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

export default class NavigationBar extends PureComponent {
  renderSectionToggle() {
    const {
      section,
      toggleSection,
    } = this.props;

    return (
      <Button
        handleOnClick={toggleSection}
        icon={section ? 'minus' : 'plus'}
      />
    );
  }

  renderTitle() {
    const {
      epoch,
      name,
      recordName,
    } = this.props;

    const date = <FormattedDate value={new Date(epoch)} />;

    if (!recordName) {
    return (
      <span className="title">
        {name} - {date}
      </span>
    );
    } else {
      return (
        <span className="title">
          {recordName} - {name} - {date}
        </span>
      );
    }
  }

  render() {
    return (
      <div className="navigation-bar">
        <div className="left">
          {this.renderSectionToggle()}
        </div>
        <div className="center">
          {this.renderTitle()}
        </div>
        <div className="right" />
      </div>
    );
  }
}
