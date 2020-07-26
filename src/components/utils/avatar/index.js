import React from 'react';
import { getAvatarColor } from 'utils/data';
import './index.scss';

const Avatar = (props) => {
  const {
    initials,
    name,
  } = props;

  return (
    <div className="avatar-wrapper">
      <div
        className="avatar"
        style={{ backgroundColor: getAvatarColor(name) }}
      >
        <span className="initials">
          {initials}
        </span>
      </div>
    </div>
  );
};

export default Avatar;
