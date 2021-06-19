import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { getAvatarStyle } from 'utils/data';
import './index.scss';

const propTypes = {
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
};

const renderContent = (props) => {
  const {
    icon,
    initials,
  } = props;

  if (icon) return <span className={`icon-${icon}`} />;

  return (
    <span className="initials">
      {initials}
    </span>
  );
};

const Avatar = (props) => {
  const { name } = props;

  return (
    <div className="avatar-wrapper">
      <div className={cx('avatar', getAvatarStyle(name))}>
        {renderContent(props)}
      </div>
    </div>
  );
};

Avatar.propTypes = propTypes;

export default Avatar;
