import React, { PureComponent } from 'react';
import cx from 'classnames';
import './index.scss';

export default class Button extends PureComponent {
  render() {
    const {
      active,
      ghost,
      handleOnClick,
      type,
    } = this.props;

    if (!handleOnClick) return null;

    const style = {
      ghost: ghost && !active,
      solid: !ghost || active,
    };

    return (
      <div className="button-wrapper">
        <button
          className={cx('button', style)}
          onClick={() => handleOnClick()}
        >
          <span className={`icon-${type}`} />
        </button>
      </div>
    );
  };
}
