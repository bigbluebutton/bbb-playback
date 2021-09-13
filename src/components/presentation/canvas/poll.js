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
          href={buildFileURL(image['xlink:href'])}
          y={image.y}
        />
      </g>
    );
  } else {
    // BigBlueButton v2.3 or higher
     return (
      <g style={style}>
        <image
          height={image.height}
          width={image.width}
          x={image.x}
          href={buildFileURL(image['xlink:href'])}
          y={image.y}
        />
      </g>
    );
  }
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Poll, areEqual);
