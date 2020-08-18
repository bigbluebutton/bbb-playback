import React, { PureComponent } from 'react';
import {
  defineMessages,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import { controls as config } from 'config';
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
  renderSearchButton(enabled) {
    if (!enabled) return null;

    const {
      intl,
      toggleSearch,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.search)}
        circle
        handleOnClick={toggleSearch}
        icon="search"
      />
    );
  }

  renderSectionButton(enabled) {
    if (!enabled) return null;

    const {
      intl,
      section,
      toggleSection,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.section)}
        circle
        handleOnClick={toggleSection}
        icon={section ? 'arrow-left' : 'arrow-right'}
      />
    );
  }

  renderSwapButton(enabled) {
    if (!enabled) return null;

    const {
      intl,
      toggleSwap,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.swap)}
        circle
        handleOnClick={toggleSwap}
        icon="swap"
      />
    );
  }

  renderTitle(interactive) {
    const {
      name,
      start,
    } = this.props;

    const date = <FormattedDate value={new Date(start)} />;

    if (interactive) {
      const {
        intl,
        toggleAbout,
      } = this.props;

      return (
        <span
          aria={intl.formatMessage(intlMessages.about)}
          className={cx('title', { interactive })}
          onClick={toggleAbout}
          onKeyPress={(e) => e.key === 'Enter' ? toggleAbout() : null}
          tabIndex="0"
        >
          {name} - {date}
        </span>
      );
    }

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
          {this.renderSectionButton(control && section)}
        </div>
        <div className="center">
          {this.renderTitle(control && about)}
        </div>
        <div className="right">
          {this.renderSearchButton(control && search && !single)}
          {this.renderSwapButton(control && swap && !single)}
        </div>
      </div>
    );
  }
}
