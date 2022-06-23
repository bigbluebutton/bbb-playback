import React from 'react';
import { buildFileURL } from 'utils/data';

const Poll = ({
  data,
  style,
}) => {
  const {
    image,
    rect,
  } = data;

  // TODO: Better adapt for old versions
  if (rect) {
    // BigBlueButton v2.2 or lower
    return (
      <g style={style}>
        <rect
          fill={rect._fill}
          height={rect._height}
          stroke={rect._stroke}
          strokeWidth={rect['_stroke-width']}
          width={rect._width}
          x={rect._x}
          y={rect._y}
        />
        <image
          height={image._height}
          transform={image._transform}
          width={image._width}
          x={image._x}
          href={buildFileURL(image['_xlink:href'])}
          y={image._y}
        />
      </g>
    );
  } else {
    // BigBlueButton v2.3 or higher
     return (
      <g style={style}>
        <image
          height={image._height}
          width={image._width}
          x={image._x}
          href={buildFileURL(image['_xlink:href'])}
          y={image._y}
        />
      </g>
    );
  }
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Poll, areEqual);
