import React, { PureComponent } from 'react';
import './index.scss';

export default class Cursor extends PureComponent {
  render() {
    const {
      x,
      y,
    } = this.props;

    if (x === -1 || y === -1) return null;

    return (
      <circle
        className="cursor"
        style={{ cx: x, cy: y }}
      />
    );
  }
}
