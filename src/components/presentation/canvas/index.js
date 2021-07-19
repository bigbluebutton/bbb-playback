import React from 'react';
import Poll from './poll';
import { SHAPES } from 'utils/constants';
import { isEmpty } from 'utils/data/validators';
import logger from 'utils/logger';

const Canvas = ({
  draws,
  drawsInterval,
  recordId,
}) => {
  if (isEmpty(drawsInterval)) return null;

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
      case SHAPES.CIRCLE:
        canvas.push(
          <circle
            style={style}
            cx={data.cx}
            cy={data.cy}
            r={data.r}
          />
        );
        break;
      case SHAPES.LINE:
        canvas.push(
          <line
            style={style}
            x1={data.x1}
            y1={data.y1}
            x2={data.x2}
            y2={data.y2}
          />
        );
        break;
      case SHAPES.PATH:
        canvas.push(
          <path
            style={style}
            d={data.d}
          />
        );
        break;
      case SHAPES.POLL:
        canvas.push(
          <Poll
            data={data}
            key={id}
            recordId={recordId}
            style={style}
          />
        );
        break;
      case SHAPES.POLYGON:
        canvas.push(
          <polygon
            style={style}
            points={data.points}
          />
        );
        break;
      case SHAPES.POLYLINE:
        canvas.push(
          <polyline
            style={style}
            points={data.points}
          />
        );
        break;
      case SHAPES.TEXT:
        canvas.push(
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
        break;
      default:
        logger.debug('unhandled', type);
    }
  }

  return (
    <g>
      {canvas}
    </g>
  );
};

export default Canvas;
