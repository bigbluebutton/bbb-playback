import React from 'react';
import PropTypes from 'prop-types';
import Item from './item';
import { ID } from 'utils/constants';
import './index.scss';

const CONTENT = [
  ID.USERS,
  ID.PRESENTATION,
  ID.CHAT,
  ID.POLLS,
  ID.QUESTIONS,
  ID.EXTERNAL_VIDEOS,
  ID.NOTES,
  ID.SCREENSHARE,
  ID.CAPTIONS,
];

const propTypes = {
  content: PropTypes.object,
  users: PropTypes.number,
};

const defaultProps = {
  content: {},
  users: 0,
};

const Body = ({
  content,
  users,
}) => {
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

Body.propTypes = propTypes;
Body.defaultProps = defaultProps;

export default Body;
