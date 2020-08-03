import React, { PureComponent } from 'react';
import cx from 'classnames';
import './index.scss';

const GHOST = 'ghost';
const SOLID = 'solid';

export default class Button extends PureComponent {
  render() {
    const {
      active,
      aria,
      disabled,
      handleOnClick,
      icon,
      type,
    } = this.props;

    if (!handleOnClick) return null;

    const ghost = type === GHOST;
    const solid = type === SOLID;

    const style = {
      default: !ghost && !solid && !disabled,
      ghost: ghost && !active && !disabled,
      solid: (solid || active) && !disabled,
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
}
