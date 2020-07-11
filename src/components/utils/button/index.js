import React, { PureComponent } from 'react';
import cx from 'classnames';
import './index.scss';

const GHOST = 'ghost';
const SOLID = 'solid';

export default class Button extends PureComponent {
  render() {
    const {
      active,
      handleOnClick,
      icon,
      type,
    } = this.props;

    if (!handleOnClick) return null;

    const ghost = type === GHOST;
    const solid = type === SOLID;

    const style = {
      default: !ghost && !solid,
      ghost: ghost && !active,
      solid: solid || active,
    };

    return (
      <div className="button-wrapper">
        <button
          className={cx('button', style)}
          onClick={() => handleOnClick()}
        >
          <span className={`icon-${icon}`} />
        </button>
      </div>
    );
  };
}
