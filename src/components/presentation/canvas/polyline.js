import React from 'react';

const Polyline = ({
  data,
  style,
}) => {

  return (
    <polyline
      style={style}
      points={data.points}
    />
  );
};

export default Polyline;
