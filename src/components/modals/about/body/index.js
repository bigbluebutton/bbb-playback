import React from 'react';
import Data from './data';
import Shortcuts from './shortcuts';
import './index.scss';

const Body = () => {

  return (
    <div className="about-body">
      <Data />
      <Shortcuts />
    </div>
  );
};

export default Body;
