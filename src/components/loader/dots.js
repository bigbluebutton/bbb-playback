import React from 'react';
import './index.scss';

const Dots = () => {

  return (
    <div className="dots-wrapper">
      <div className="first" />
      <div className="second" />
      <div className="third" />
    </div>
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Dots, areEqual);
