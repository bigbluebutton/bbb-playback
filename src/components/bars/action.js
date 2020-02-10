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

  render() {
    const {
      thumbnails,
      toggleSwap,
      toggleThumbnails,
    } = this.props;

    return (
      <div className="action-bar">
        <div className="left" />
        <div className="center">
          <Button
            handleOnClick={toggleSwap}
            type="refresh"
          />
        </div>
        <div className="right">
          <Button
            active={thumbnails}
            handleOnClick={toggleThumbnails}
            ghost
            type="rooms"
          />
        </div>
      </div>
    );
  }
}
