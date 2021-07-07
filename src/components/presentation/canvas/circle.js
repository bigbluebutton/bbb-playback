import React from 'react';

const Circle = ({
  data,
  style,
}) => {

  return (
    <circle
      style={style}
      cx={data.cx}
      cy={data.cy}
      r={data.r}
    />
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Circle, areEqual);
