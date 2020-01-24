import React, { Component } from 'react';
import './index.scss';

const BORDER = '.2rem'
const BLUE = '#0f70d7';
const TRANSPARENT = 'transparent';
const WHITE = 'white';

export default class Button extends Component {
  getGhost() {
    const { active } = this.props;

    return {
      'background-color': active ? BLUE : TRANSPARENT,
      'border': active ? 'none' : `${BORDER} solid ${WHITE}`,
      'color': WHITE,
    };
  }

  getSolid() {
    const { color } = this.props;
    return {
      'background-color': color ? color : TRANSPARENT,
      'border': 'none',
      'color': WHITE,
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
