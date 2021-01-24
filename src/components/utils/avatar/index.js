import React from 'react';
import cx from 'classnames';
import { getAvatarStyle } from 'utils/data';
import './index.scss';

const Avatar = (props) => {
  const {
    initials,
    name,
  } = props;

  return (
    <div className="avatar-wrapper">
      <div className={cx('avatar', getAvatarStyle(name))}>
        <span className="initials">
          {initials}
        </span>
      </div>
    </div>
  );
};

export default Avatar;
