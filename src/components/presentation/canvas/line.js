import React from 'react';

const Line = ({
  data,
  style,
}) => {

  return (
    <line
      style={style}
      x1={data.x1}
      y1={data.y1}
      x2={data.x2}
      y2={data.y2}
    />
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Line, areEqual);
