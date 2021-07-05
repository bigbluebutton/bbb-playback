import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import { handleOnEnterPress } from 'utils/data/handlers';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
};

const defaultProps = {
  active: false,
  icon: '',
  initials: '',
  name: '',
  onClick: () => {},
};

const Margin = ({
  active,
  icon,
  initials,
  name,
  onClick,
}) => {

  return (
    <div
      className={cx('interactive', { inactive: !active })}
      onClick={onClick}
      onKeyPress={event => handleOnEnterPress(event, onClick)}
      tabIndex="0"
    >
      <Avatar
        active={active}
        icon={icon}
        initials={initials}
        name={name}
      />
    </div>
  );
};

Margin.propTypes = propTypes;
Margin.defaultProps = defaultProps;

export default Margin;
