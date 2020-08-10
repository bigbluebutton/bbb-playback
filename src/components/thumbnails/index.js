import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { thumbnails as config } from 'config';
import {
  ID,
  buildFileURL,
  getScrollLeft,
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

      parentNode.scrollLeft = getScrollLeft(this.firstNode, this.currentNode, config.align);
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

  renderImage(item) {
    const {
      alt,
      src,
    } = item;

    const screenshare = src === SCREENSHARE;

    if (screenshare) {
      return (
        <div className={cx('thumbnail-image', { screenshare })}>
          <span className="icon-desktop" />
        </div>
      );
    }

    return (
      <img
        alt={alt}
        className="thumbnail-image"
        src={buildFileURL(this.recordId, src)}
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
      const onClick = () => this.handleOnClick(item.timestamp);

      return (
        <div
          className={cx('thumbnail-wrapper', { active })}
          onClick={onClick}
          onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
          ref={node => this.setRef(node, index)}
          tabIndex="0"
        >
          <div className="thumbnail">
            {this.renderImage(item)}
            <div className="thumbnail-index">
              {index + 1}
            </div>
          </div>
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
        id={ID.THUMBNAILS}
        tabIndex="0"
      >
        {this.renderThumbnails()}
      </div>
    );
  }
}
