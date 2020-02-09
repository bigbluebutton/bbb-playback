import React, { Component } from 'react';
import Button from 'components/utils/button';
import './index.scss';

export default class Footer extends Component {
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
      <footer>
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
      </footer>
    );
  }
}
