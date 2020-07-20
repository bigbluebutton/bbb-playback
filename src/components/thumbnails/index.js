import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { thumbnails as config } from 'config';
import {
  buildFileURL,
  getScrollTop,
} from 'utils/data';
import './index.scss';

const SCREENSHARE = 'deskshare';

const intlMessages = defineMessages({
  aria: {
    id: 'player.thumbnails.wrapper.aria',
    description: 'Aria label for the thumbnails wrapper',
  },
});

export default class Thumbnails extends Component {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.id = 'thumbnails';
    this.recordId = metadata.id;
  }

  componentDidMount() {
    this.handleAutoScroll();
  }

  shouldComponentUpdate(nextProps) {
    const { currentDataIndex } = this.props;

    if (currentDataIndex !== nextProps.currentDataIndex) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    this.handleAutoScroll();
  }

  handleOnClick(timestamp) {
    const { player } = this.props;

    if (!player) return null;

    player.currentTime(timestamp);
  }

  handleAutoScroll() {
    if (!config.scroll) return;

    // Auto-scroll can start after getting the first and current nodes
    if (this.firstNode && this.currentNode) {
      const { parentNode } = this.currentNode;

      parentNode.scrollTop = getScrollTop(this.firstNode, this.currentNode, config.align);
    }
  }

  // Set node as ref so we can manage auto-scroll
  setRef(node, index) {
    const { currentDataIndex } = this.props;

    if (index === 0) {
      this.firstNode = node;
    }

    if (index === currentDataIndex) {
      this.currentNode = node;
    }
  }

  renderThumbnail(item, active) {
    const {
      alt,
      src,
      timestamp,
    } = item;

    const screenshare = src === SCREENSHARE;
    const onClick = () => this.handleOnClick(timestamp);

    if (screenshare) {
      return (
        <div
          className={cx('thumbnail', { active, screenshare })}
          onClick={onClick}
          onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
          tabIndex="0"
        >
          <span className="icon-desktop" />
        </div>
      );
    }

    return (
      <img
        alt={alt}
        className={cx('thumbnail', { active })}
        onClick={onClick}
        onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
        src={buildFileURL(this.recordId, src)}
        tabIndex="0"
      />
    );
  }

  renderThumbnails() {
    const {
      currentDataIndex,
      thumbnails,
    } = this.props;

    return thumbnails.map((item, index) => {
      const active = index === currentDataIndex;

      return (
        <div
          className="thumbnail-wrapper"
          ref={node => this.setRef(node, index)}
        >
          {this.renderThumbnail(item, active)}
        </div>
      );
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="thumbnails-wrapper"
        id={this.id}
        tabIndex="0"
      >
        {this.renderThumbnails()}
      </div>
    );
  }
}
