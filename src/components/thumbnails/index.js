import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import { thumbnails as config } from 'config';
import { getScrollTop } from 'utils/data';
import './index.scss';

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
    this.url = `/presentation/${metadata.id}`;
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

  renderThumbnails() {
    const { thumbnails } = this.props;

    return thumbnails.map((item, index) => {
      const {
        alt,
        src,
        timestamp,
      } = item;

      return (
        <img
          alt={alt}
          className="thumbnail"
          onClick={() => this.handleOnClick(timestamp)}
          ref={ node => this.setRef(node, index)}
          src={`${this.url}/${src}`}
        />
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
      >
        {this.renderThumbnails()}
      </div>
    );
  }
}
