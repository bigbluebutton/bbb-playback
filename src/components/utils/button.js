import React, { Component } from 'react';
import { colors as config } from 'config';
import './index.scss';

const BORDER = '.2rem';

export default class Button extends Component {
  getGhost() {
    const { active } = this.props;
    const { button } = config;

    return {
      'background-color': active ? button.default : button.transparent,
      'border': active ? 'none' : `${BORDER} solid ${button.content}`,
      'color': button.content,
    };
  }

  getSolid() {
    const { color } = this.props;
    const { button } = config;

    return {
      'background-color': color ? color : button.transparent,
      'border': 'none',
      'color': button.content,
    };
  }

  getStyle() {
    const { ghost } = this.props;

    const style = ghost ? this.getGhost() : this.getSolid();

    return style;
  }

  render() {
    const {
      handleOnClick,
      type,
    } = this.props;

    if (!handleOnClick) return null;

    return (
      <div className="button-wrapper">
        <button
          className="button"
          onClick={() => handleOnClick()}
          style={this.getStyle()}
        >
          <span className={`icon-${type}`} />
        </button>
      </div>
    );
  };
}
