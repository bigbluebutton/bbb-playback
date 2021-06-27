import React from 'react';

const Text = ({
  data,
  style,
}) => {

  return (
    <foreignObject
      style={style}
      height={data.height}
      width={data.width}
      x={data.x}
      y={data.y}
    >
      <div xmlns="http://www.w3.org/1999/xhtml">
        {data.text.split('\r').map(line => <span>{line}<br /></span>)}
      </div>
    </foreignObject>
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Text, areEqual);
