import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import { getAvatarStyle } from 'utils/data';
import './index.scss';

const propTypes = {
  circle: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
  emphasised: PropTypes.bool
};

const defaultProps = {
  circle: false,
  icon: '',
  initials: '',
  name: '',
  emphasised: false,
};

const Avatar = ({
  circle,
  icon,
  initials,
  name,
  emphasised,
}) => {
  const style = circle || emphasised ? getAvatarStyle(name) : 'avatar-default';

  return (
    <div className="avatar-wrapper">
      <div className={cx('avatar', { circle }, style)}>
        {icon ? (
          <Icon name={icon} />
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
