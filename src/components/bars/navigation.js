import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import { controls as config } from 'config';
import { FormattedDate } from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
  section: {
    id: 'button.section.aria',
    description: 'Aria label for the section button',
  },
});

export default class NavigationBar extends PureComponent {
  renderAboutButton() {
    const {
      intl,
      toggleAbout,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.about)}
        handleOnClick={toggleAbout}
        icon="vertical-more"
      />
    );
  }

  renderSectionButton() {
    const {
      intl,
      section,
      toggleSection,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.section)}
        handleOnClick={toggleSection}
        icon={section ? 'left-arrow' : 'right-arrow'}
      />
    );
  }

  renderTitle() {
    const {
      name,
      start,
    } = this.props;

    const date = <FormattedDate value={new Date(start)} />;

    return (
      <span className="title">
        {name} - {date}
      </span>
    );
  }

  render() {
    const { control } = this.props;

    const {
      about,
      section,
    } = config;

    return (
      <div className="navigation-bar">
        <div className="left">
          {control && section ? this.renderSectionButton() : null}
        </div>
        <div className="center">
          {this.renderTitle()}
        </div>
        <div className="right">
          {control && about ? this.renderAboutButton() : null}
        </div>
      </div>
    );
  }
}
