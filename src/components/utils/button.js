import React, { Component } from 'react';
import './index.scss';

const BORDER = '.2rem'
const DEFAULT_BACKGROUND = 'transparent';
const DEFAULT_COLOR = 'white';

export default class Button extends Component {
  getStyle() {
    const {
      color,
      ghost,
    } = this.props;

    const btnBackground = ghost ? DEFAULT_BACKGROUND : color;
    const btnColor = color ? color : DEFAULT_COLOR;

    let style = {};
    if (ghost) {
      style = {
        'background-color': btnBackground,
        'border': `${BORDER} solid ${btnColor}`,
        'color': btnColor,
      };
    } else {
      style = {
        'background-color': btnBackground,
        'border': 'none',
        'color': DEFAULT_COLOR,
      };
    }

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
