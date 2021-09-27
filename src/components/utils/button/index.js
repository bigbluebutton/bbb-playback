import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import './index.scss';

const DEFAULT = 'default';
const SOLID = 'solid';

const propTypes = {
  active: PropTypes.bool,
  aria: PropTypes.string,
  circle: PropTypes.bool,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  handleOnClick: PropTypes.func,
  icon: PropTypes.string,
  type: PropTypes.string,
};

const defaultProps = {
  active: false,
  aria: '',
  circle: false,
  color: '',
  disabled: false,
  handleOnClick: () => {},
  icon: '',
  type: DEFAULT,
};

const Button = ({
  active,
  aria,
  circle,
  color,
  disabled,
  handleOnClick,
  icon,
  type,
}) => {
  const solid = type === SOLID;

  const classNames = {
    default: !solid && !disabled,
    solid: (solid || active) && !disabled,
    circle,
    disabled,
  };

  const style = {};
  if (color.length > 0) {
    if (solid) {
      style['background-color'] = color;
    } else {
      style['color'] = color;
    }
  }

  return (
    <div className="button-wrapper">
      <button
        aria-label={aria}
        className={cx('button', classNames)}
        disabled={disabled}
        onClick={() => handleOnClick()}
        style={style}
      >
        <Icon name={icon} />
      </button>
    </div>
  );
};

Button.propTypes = propTypes;
Button.defaultProps = defaultProps;

export default Button;
