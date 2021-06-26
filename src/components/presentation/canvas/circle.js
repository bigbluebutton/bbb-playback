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

export default Circle;
