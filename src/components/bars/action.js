import React, { Component } from 'react';
import Button from 'components/utils/button';
import './index.scss';

export default class ActionBar extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      swap,
      thumbnails,
    } = this.props;

    if (swap !== nextProps.swap) return true;
    if (thumbnails !== nextProps.thumbnails) return true;

    return false;
  }

  render() {
    const {
      swap,
      thumbnails,
      toggleSwap,
      toggleThumbnails,
    } = this.props;

    return (
      <div className="action-bar">
        <div className="left">
          <Button
            handleOnClick={toggleSwap}
            type={swap ? 'presentation' : 'video'}
          />
        </div>
        <div className="center" />
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
