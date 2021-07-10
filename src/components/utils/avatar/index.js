import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { getAvatarStyle } from 'utils/data';
import './index.scss';

const propTypes = {
  circle: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
};

const defaultProps = {
  circle: false,
  icon: '',
  initials: '',
  name: '',
};

const Avatar = ({
  circle,
  icon,
  initials,
  name,
}) => {

  return (
    <div className="avatar-wrapper">
      <div className={cx('avatar', { circle }, getAvatarStyle(name))}>
        {icon ? (
          <span className={`icon-${icon}`} />
        ) : (
          <span className="initials">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
};

Avatar.propTypes = propTypes;
Avatar.defaultProps = defaultProps;

export default Avatar;
