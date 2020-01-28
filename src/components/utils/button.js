import React, { Component } from 'react';
import cx from 'classnames';
import './index.scss';

export default class Button extends Component {
  render() {
    const {
      active,
      ghost,
      handleOnClick,
      type,
    } = this.props;

    if (!handleOnClick) return null;

    return (
      <div className="button-wrapper">
        <button
          className={cx('button', { ghost: ghost && !active })}
          onClick={() => handleOnClick()}
        >
          <span className={`icon-${type}`} />
        </button>
      </div>
    );
  };
}
