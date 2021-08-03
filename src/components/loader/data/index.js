import React from 'react';
import Item from './item';
import { CONTENT } from 'utils/constants';
import './index.scss';

const Data = ({ data }) => {

  return (
    <div className="data-wrapper">
       {CONTENT.map((item) => (
        <Item
          icon={item}
          key={item}
          value={data[item]}
        />
      ))}
    </div>
  );
};

export default Data;
