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

// Avoid re-render
const areEqual = () => true;

export default React.memo(Polyline, areEqual);
