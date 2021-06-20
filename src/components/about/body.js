import React from 'react';
import Item from './item';
import { ID } from 'utils/data';
import './index.scss';

const CONTENT = [
  ID.USERS,
  ID.PRESENTATION,
  ID.CHAT,
  ID.POLLS,
  ID.NOTES,
  ID.SCREENSHARE,
  ID.CAPTIONS,
];

const Body = ({ content, users }) => {
  const data = {
    ...content,
    users,
  };

  return (
    <div className="about-body">
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

export default Body;
