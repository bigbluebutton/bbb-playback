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

export default Path;
