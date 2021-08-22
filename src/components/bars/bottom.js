import React from 'react';
import './index.scss';

const Bottom = () => {
  return <div className="bottom-bar" />;
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Bottom, areEqual);
