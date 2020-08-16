import React, { Component } from 'react';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import { thumbnails as config } from 'config';
import Button from 'components/utils/button';
import {
  ID,
  buildFileURL,
  getScrollLeft,
  isEmpty,
  isEqual,
} from 'utils/data';
import './index.scss';

const SCREENSHARE = 'deskshare';

const intlMessages = defineMessages({
  aria: {
    id: 'player.thumbnails.wrapper.aria',
    description: 'Aria label for the thumbnails wrapper',
  },
  clear: {
    id: 'button.clear.aria',
    description: 'Aria label for the clear button',
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
    const {
      currentDataIndex,
      search,
    } = this.props;

    if (currentDataIndex !== nextProps.currentDataIndex) {
      return true;
    }

    if (!isEqual(search, nextProps.search)) {
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

  isFiltered(index) {
    const {
      interactive,
      search,
    } = this.props;

    if (interactive) {
      return !isEmpty(search) && !search.includes(index);
    } else {
      return !search.includes(index);
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
          <span className="icon-screenshare" />
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

  renderThumbnail(item, index) {
    const {
      currentDataIndex,
      interactive,
    } = this.props;

    if (!interactive) {
      return (
        <div
          className="thumbnail-wrapper"
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
    }

    const active = index === currentDataIndex;
    const onClick = () => this.handleOnClick(item.timestamp);

    const styles = {
      active,
      interactive,
    };

    return (
      <div
        className={cx('thumbnail-wrapper', styles)}
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
  }

  renderThumbnails() {
    const { thumbnails } = this.props;

    return thumbnails.reduce((result, item, index) => {
      if (!this.isFiltered(index)) {
        result.push(this.renderThumbnail(item, index));
      }

      return result;
    }, []);
  }

  renderClearButton() {
    const { interactive } = this.props;
    if (!interactive) return null;

    const { search } = this.props;
    if (isEmpty(search)) return null;

    const {
      handleSearch,
      intl,
    } = this.props;

    return (
      <div className="clear-button">
        <Button
          aria={intl.formatMessage(intlMessages.clear)}
          handleOnClick={() => handleSearch ? handleSearch([]) : null}
          icon="close"
          type="solid"
        />
      </div>
    );
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
        {this.renderClearButton()}
      </div>
    );
  }
}
