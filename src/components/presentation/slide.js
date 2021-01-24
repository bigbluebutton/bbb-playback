import React, { PureComponent } from 'react';
import cx from 'classnames';
import { buildFileURL } from 'utils/data';
import './index.scss';

const SCREENSHARE = 'deskshare';

export default class Slide extends PureComponent {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.recordId = metadata.id;
  }

  getProxy(id, height, width) {
    const { thumbnails } = this.props;

    const thumbnail = thumbnails.find(thumbnails => id === thumbnails.id);
    if (!thumbnail) return null;

    const {
      alt,
      src,
    } = thumbnail;

    if (src === SCREENSHARE) return null;

    const logo = src.includes('logo');

    return (
      <foreignObject
        height={height}
        x={0}
        width={width}
        y={0}
      >
        <img
          alt={alt}
          className={cx('proxy', { logo })}
          src={buildFileURL(this.recordId, src)}
        />
      </foreignObject>
    );
  }

  render() {
    const {
      id,
      slides,
    } = this.props;

    const current = slides.find(slide => id === slide.id);
    if (!current) return null;

    const {
      height,
      src,
      width,
    } = current;

    return (
      <g>
        {this.getProxy(id, height, width)}
        <image
          height={height}
          href={buildFileURL(this.recordId, src)}
          x={0}
          width={width}
          y={0}
        />
      </g>
    );
  }
}
