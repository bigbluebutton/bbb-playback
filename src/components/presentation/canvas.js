import React, { PureComponent } from 'react';
import './index.scss';

export default class Canvas extends PureComponent {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.url = `/presentation/${metadata.id}`;
  }

  renderPolyline(style, data) {
    return <polyline
      style={style}
      points={data.points}
    />;
  }

  renderLine(style, data) {
    return <line
      style={style}
      x1={data.x1}
      y1={data.y1}
      x2={data.x2}
      y2={data.y2}
    />;
  }

  renderPolygon(style, data) {
    return <polygon
      style={style}
      points={data.points}
    />;
  }

  renderPath(style, data) {
    return <path
      style={style}
      d={data.d}
    />;
  }

  renderCircle(style, data) {
    return <circle
      style={style}
      cx={data.cx}
      cy={data.cy}
      r={data.r}
    />;
  }

  renderText(style, data) {
    return (
      <foreignObject
        style={style}
        height={data.height}
        width={data.width}
        x={data.x}
        y={data.y}
      >
        <p xmlns="http://www.w3.org/1999/xhtml">
          {data.p.split('\r').map(p => <span>{p}<br /></span>)}
        </p>
      </foreignObject>
    );
  }

  renderPoll(style, data) {
    const {
      image,
      rect,
    } = data;

    return (
      <g style={style}>
        <rect
          fill={rect.fill}
          height={rect.height}
          stroke={rect.stroke}
          strokeWidth={rect['stroke-width']}
          width={rect.width}
          x={rect.x}
          y={rect.y}
        />
        <image
          height={image.height}
          transform={image.transform}
          width={image.width}
          x={image.x}
          href={`${this.url}/${image['xlink:href']}`}
          y={image.y}
        />
      </g>
    );
  }

  renderCanvas(firstDraw, lastDraw) {
    const { draws } = this.props;
    const canvas = [];

    for (let i = firstDraw; i <= lastDraw; i++) {
      const {
        id,
        shape,
        style,
      } = draws[i];

      const j = i + 1;
      let intermediate = false;
      if (j <= lastDraw) {
        intermediate = draws[j].id === id;
      }

      if (intermediate) continue;

      const {
        data,
        type,
      } = shape;

      switch (type) {
        case 'poll':
          canvas.push(this.renderPoll(style, data));
          break;
        case 'polyline':
          canvas.push(this.renderPolyline(style, data));
          break;
        case 'line':
          canvas.push(this.renderLine(style, data));
          break;
        case 'polygon':
          canvas.push(this.renderPolygon(style, data));
          break;
        case 'path':
          canvas.push(this.renderPath(style, data));
          break;
        case 'circle':
          canvas.push(this.renderCircle(style, data));
          break;
        case 'text':
          canvas.push(this.renderText(style, data));
          break;
        default:
      }
    }

    return canvas;
  }

  render() {
    const {
      firstDraw,
      lastDraw,
    } = this.props;

    if (firstDraw === -1 && lastDraw === -1) return null;

    return (
      <g>
        {this.renderCanvas(firstDraw, lastDraw)}
      </g>
    );
  }
}
