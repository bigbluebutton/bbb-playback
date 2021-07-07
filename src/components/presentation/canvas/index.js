import React from 'react';
import Circle from './circle';
import Line from './line';
import Path from './path';
import Poll from './poll';
import Polygon from './polygon';
import Polyline from './polyline';
import Text from './text';
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
          <Circle
            data={data}
            key={id}
            style={style}
          />
        );
        break;
      case SHAPES.LINE:
        canvas.push(
          <Line
            data={data}
            key={id}
            style={style}
          />
        );
        break;
      case SHAPES.PATH:
        canvas.push(
          <Path
            data={data}
            key={id}
            style={style}
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
          <Polygon
            data={data}
            key={id}
            style={style}
          />
        );
        break;
      case SHAPES.POLYLINE:
        canvas.push(
          <Polyline
            data={data}
            key={id}
            style={style}
          />
        );
        break;
      case SHAPES.TEXT:
        canvas.push(
          <Text
            data={data}
            key={id}
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
