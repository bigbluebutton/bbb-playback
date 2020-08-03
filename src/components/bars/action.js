import React, { Component } from 'react';
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
  thumbnails: {
    id: 'button.thumbnails.aria',
    description: 'Aria label for the thumbnails button',
  },
});

export default class ActionBar extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      thumbnails,
    } = this.props;

    if (thumbnails !== nextProps.thumbnails) return true;

    return false;
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

  renderThumbnailsButton() {
    const {
      intl,
      thumbnails,
      toggleThumbnails,
    } = this.props;

    return (
      <Button
        active={thumbnails}
        aria={intl.formatMessage(intlMessages.thumbnails)}
        handleOnClick={toggleThumbnails}
        icon="rooms"
        type="ghost"
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
      thumbnails,
    } = config;

    const { presentation } = content;

    return (
      <div className="action-bar">
        <div className="left">
          {control && search && presentation ? this.renderSearchButton() : null}
        </div>
        <div className="center">
          {control && swap ? this.renderSwapButton() : null}
        </div>
        <div className="right">
          {control && thumbnails && presentation ? this.renderThumbnailsButton(): null}
        </div>
      </div>
    );
  }
}
