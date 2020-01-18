import React, { Component } from 'react';
import './index.scss';

export default class Button extends Component {
  render() {
    const {
      color,
      type,
    } = this.props;

    const button = {
      'background-color': color,
    };

    return (
      <div className="button-wrapper">
        <div
          className="button"
          style={button}
        >
          <span className={`icon-${type}`} />
        </div>
      </div>
    );
  };
}
