import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './index.scss';

const DEFAULT = 'default';
const GHOST = 'ghost';
const SOLID = 'solid';

const propTypes = {
  active: PropTypes.bool,
  aria: PropTypes.string,
  circle: PropTypes.bool,
  disabled: PropTypes.bool,
  handleOnClick: PropTypes.func,
  icon: PropTypes.string,
  type: PropTypes.string,
};

const defaultProps = {
  active: false,
  aria: '',
  circle: false,
  disabled: false,
  handleOnClick: () => {},
  icon: '',
  type: DEFAULT,
};

const Button = ({
  active,
  aria,
  circle,
  disabled,
  handleOnClick,
  icon,
  type,
}) => {
  const ghost = type === GHOST;
  const solid = type === SOLID;

  const style = {
    default: !ghost && !solid && !disabled,
    ghost: ghost && !active && !disabled,
    solid: (solid || active) && !disabled,
    circle,
    disabled,
  };

  return (
    <div className="button-wrapper">
      <button
        aria-label={aria}
        className={cx('button', style)}
        disabled={disabled}
        onClick={() => handleOnClick()}
      >
        <span className={`icon-${icon}`} />
      </button>
    </div>
  );
};

Button.propTypes = propTypes;
Button.defaultProps = defaultProps;

export default Button;
