import React, { Component } from 'react';
import Button from 'components/utils/button';
import './index.scss';

export default class Footer extends Component {
  shouldComponentUpdate(nextProps) {
    const { thumbnails } = this.props;

    if (thumbnails !== nextProps.thumbnails) return true;

    return false;
  }

  render() {
    const {
      thumbnails,
      toggleThumbnails,
    } = this.props;

    return (
      <footer>
        <div className="left" />
        <div className="center" />
        <div className="right">
          <Button
            active={thumbnails}
            handleOnClick={toggleThumbnails}
            ghost
            type="presentation"
          />
        </div>
      </footer>
    );
  }
}
