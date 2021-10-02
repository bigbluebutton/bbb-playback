import React from 'react';
import Item from './item';
import {
  CONTENT,
  ID,
} from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';

const Body = () => {

  return (
    <div className="about-body">
      <Item
        icon={ID.USERS}
        key={ID.USERS}
        value={storage.metadata.participants}
      />
      {CONTENT.map((item) => (
        <Item
          icon={item}
          key={item}
          value={storage.content[item]}
        />
      ))}
    </div>
  );
};

export default Body;
