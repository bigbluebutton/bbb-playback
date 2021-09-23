import React from 'react';
import Poll from './poll';
import { useCurrentInterval } from 'components/utils/hooks';
import { SHAPES } from 'utils/constants';
import storage from 'utils/data/storage';
import { isEmpty } from 'utils/data/validators';
import logger from 'utils/logger';

const getCanvasData = (index) => storage.canvases[index].data;

const Canvas = () => {
  const {
    index,
    interval,
  }= useCurrentInterval(storage.canvases);

  if (index === -1) return null;

  if (isEmpty(interval)) return null;

  const canvas = [];
  for (let i = 0; i < interval.length; i++) {
    if (!interval[i]) continue;

    const canvasData = getCanvasData(index);

    const {
      id,
      shape,
      style,
    } = canvasData[i];

    const j = i + 1;
    let intermediate = false;
    if (j < interval.length) {
      intermediate = canvasData[j].id === id;
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
