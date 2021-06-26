import React from 'react';
import Circle from './circle';
import Line from './line';
import Path from './path';
import Poll from './poll';
import Polygon from './polygon';
import Polyline from './polyline';
import Text from './text';
import logger from 'utils/logger';
import { isEmpty } from 'utils/data';

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
      case 'circle':
        canvas.push(
          <Circle
            data={data}
            style={style}
          />
        );
        break;
      case 'line':
        canvas.push(
          <Line
            data={data}
            style={style}
          />
        );
        break;
      case 'path':
        canvas.push(
          <Path
            data={data}
            style={style}
          />
        );
        break;
      case 'polygon':
        canvas.push(
          <Polygon
            data={data}
            style={style}
          />
        );
        break;
      case 'poll':
        canvas.push(
          <Poll
            data={data}
            recordId={recordId}
            style={style}
          />
        );
        break;
      case 'polyline':
        canvas.push(
          <Polyline
            data={data}
            style={style}
          />
        );
        break;
      case 'text':
        canvas.push(
          <Text
            data={data}
            style={style}
          />
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
