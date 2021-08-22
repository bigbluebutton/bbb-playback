import React from 'react';
import PropTypes from 'prop-types';
import Item from './item';
import {
  CONTENT,
  ID,
} from 'utils/constants';
import './index.scss';

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

  return (
    <div className="about-body">
      <Item
        icon={ID.USERS}
        key={ID.USERS}
        value={users}
      />
      {CONTENT.map((item) => (
        <Item
          icon={item}
          key={item}
          value={content[item]}
        />
      ))}
    </div>
  );
};

Body.propTypes = propTypes;
Body.defaultProps = defaultProps;

export default Body;
