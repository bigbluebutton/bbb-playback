import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import { controls as config } from 'config';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

export default class ActionBar extends PureComponent {
  renderSearchButton() {
    const {
      intl,
      toggleSearch,
    } = this.props;

    return (
      <Button
        aria={intl.formatMessage(intlMessages.search)}
        handleOnClick={toggleSearch}
        icon="promote"
        type="solid"
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
        icon="refresh"
        type="solid"
      />
    );
  }

  render() {
    const {
      content,
      control,
    } = this.props;

    const {
      search,
      swap,
    } = config;

    const { presentation } = content;

    return (
      <div className="action-bar">
        <div className="left">
          {control && swap ? this.renderSwapButton() : null}
        </div>
        <div className="center">
          {control && search && presentation ? this.renderSearchButton() : null}
        </div>
        <div className="right" />
      </div>
    );
  }
}
