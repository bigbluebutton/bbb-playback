import React from 'react';
import './index.scss';

const Cursor = ({
  x,
  y,
}) => {

  if (x === -1 || y === -1) return null;

  return (
    <circle
      className="cursor"
      style={{ cx: x, cy: y }}
    />
  );
};

export default Cursor;
