import React from 'react';

const Polygon = ({
  data,
  style,
}) => {

  return (
    <polygon
      style={style}
      points={data.points}
    />
  );
};

export default Polygon;
