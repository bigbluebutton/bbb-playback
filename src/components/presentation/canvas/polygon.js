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

// Avoid re-render
const areEqual = () => true;

export default React.memo(Polygon, areEqual);
