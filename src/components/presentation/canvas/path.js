import React from 'react';

const Path = ({
  data,
  style,
}) => {

  return (
    <path
      style={style}
      d={data.d}
    />
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Path, areEqual);
