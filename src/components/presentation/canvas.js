import React, { PureComponent } from 'react';
import { buildFileURL } from 'utils/data';
import './index.scss';

export default class Canvas extends PureComponent {
  constructor(props) {
    super(props);

    const { metadata } = props;

    this.recordId = metadata.id;
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
        <div xmlns="http://www.w3.org/1999/xhtml">
          {data.text.split('\r').map(line => <span>{line}<br /></span>)}
        </div>
      </foreignObject>
    );
  }

  renderMarker(style, data) {
    const {
      path,
      pathStyle,
      mask,
      maskPath,
      maskPathStyle,
      use,
    } = data;

    return (
      <g>
        <path
          d={path.d}
          style={pathStyle}
        />
        <mask
          id={mask.id}
        >
          <path
            d={maskPath.d}
            style={maskPathStyle}
          />
        </mask>
        <use
          mask={use['mask']}
          xlinkHref={use['xlink:href']}
        />
      </g>
    );
  }

  renderEraser(style, data) {
    const {
      clipPath,
      path,
      use,
    } = data;

    return (
      <g style={style}>
        <clipPath
          id={clipPath.id}
        >
          <path
            d={path.d}
          />
        </clipPath>
        <use
          clip-path={use['clip-path']}
          xlinkHref={use['xlink:href']}
        />
      </g>
    );
  }

  renderPoll(style, data) {
    const {
      image,
      rect,
    } = data;

    // TODO: Better adapt for old versions
    // Versions prior to 2.3 included a rect structure along with an image
    if (rect) {
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
            href={buildFileURL(this.recordId, image['xlink:href'])}
            y={image.y}
          />
        </g>
      );
    } else {
       return (
        <g style={style}>
          <image
            height={image.height}
            width={image.width}
            x={image.x}
            href={buildFileURL(this.recordId, image['xlink:href'])}
            y={image.y}
          />
        </g>
      );
    }
  }

  renderCanvas(drawsInterval) {
    const { draws } = this.props;
    const canvas = [];

    for (let i = 0; i < drawsInterval.length; i++) {
      if (!drawsInterval[i]) continue;

      const {
        id,
        shape,
        style,
      } = draws[i];

      const j = i + 1;
      let intermediate = false;
      if (j < drawsInterval.length) {
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
        case 'marker':
          canvas.push(this.renderMarker(style, data));
          break;
        case 'eraser':
          canvas.push(this.renderEraser(style, data));
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
    const { drawsInterval } = this.props;

    if (drawsInterval.length === 0) return null;

    return (
      <g>
        {this.renderCanvas(drawsInterval)}
      </g>
    );
  }
}
