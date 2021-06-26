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

const defaultProps = {
  icon: '',
  initials: '',
  name: '',
};

const Avatar = ({
  icon,
  initials,
  name,
}) => {

  return (
    <div className="avatar-wrapper">
      <div className={cx('avatar', getAvatarStyle(name))}>
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
