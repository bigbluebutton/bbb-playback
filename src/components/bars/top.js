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
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

export default class TopBar extends PureComponent {
  renderAboutButton() {
    const {
      intl,
      toggleAbout,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.about)}
        handleOnClick={toggleAbout}
        icon="arrow-down"
      />
    );
  }

  renderSearchButton() {
    const {
      intl,
      toggleSearch,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.search)}
        handleOnClick={toggleSearch}
        icon="search"
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
        icon={section ? 'arrow-left' : 'arrow-right'}
      />
    );
  }

  renderSwapButton() {
    const {
      intl,
      toggleSwap,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.swap)}
        handleOnClick={toggleSwap}
        icon="swap"
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
    const {
      content,
      control,
    } = this.props;

    const {
      about,
      search,
      section,
      swap,
    } = config;

    const {
      presentation,
      screenshare,
    } = content;

    const single = !presentation && !screenshare;

    return (
      <div className="top-bar">
        <div className="left">
          {control && section ? this.renderSectionButton() : null}
        </div>
        <div className="center">
          {this.renderTitle()}
          {control && about ? this.renderAboutButton() : null}
        </div>
        <div className="right">
          {control && search && !single ? this.renderSearchButton() : null}
          {control && swap && !single ? this.renderSwapButton() : null}
        </div>
      </div>
    );
  }
}
