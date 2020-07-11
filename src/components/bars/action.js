import React, { Component } from 'react';
import Button from 'components/utils/button';
import './index.scss';

export default class ActionBar extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      thumbnails,
    } = this.props;

    if (thumbnails !== nextProps.thumbnails) return true;

    return false;
  }

  renderSearchButton() {
    const { toggleSearch } = this.props;

    return (
      <Button
        handleOnClick={toggleSearch}
        icon="promote"
        type="ghost"
      />
    );
  }

  renderSwapButton() {
    const { toggleSwap } = this.props;

    return (
      <Button
        handleOnClick={toggleSwap}
        icon="refresh"
        type="solid"
      />
    );
  }

  renderThumbnailsButton() {
    const {
      thumbnails,
      toggleThumbnails,
    } = this.props;

    return (
      <Button
        active={thumbnails}
        handleOnClick={toggleThumbnails}
        icon="rooms"
        type="ghost"
      />
    );
  }

  render() {
    const { control } = this.props;

    return (
      <div className="action-bar">
        <div className="left">
          {control ? this.renderSearchButton() : null}
        </div>
        <div className="center">
          {control ? this.renderSwapButton() : null}
        </div>
        <div className="right">
          {control ? this.renderThumbnailsButton(): null}
        </div>
      </div>
    );
  }
}
