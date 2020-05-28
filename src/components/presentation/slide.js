import React, { PureComponent } from 'react';
import './index.scss';

export default class Slide extends PureComponent {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.url = `/presentation/${metadata.id}`;
  }

  getProxy(id, height, width) {
    const { thumbnails } = this.props;

    const thumbnail = thumbnails.find(thumbnails => id === thumbnails.id);
    if (!thumbnail) return null;

    return (
      <foreignObject
        height={height}
        x={0}
        width={width}
        y={0}
      >
        <img
          alt={thumbnail.alt}
          className="proxy"
          src={`${this.url}/${thumbnail.src}`}
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
          href={`${this.url}/${src}`}
          x={0}
          width={width}
          y={0}
        />
      </g>
    );
  }
}
