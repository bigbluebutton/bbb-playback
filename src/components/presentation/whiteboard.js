import React, { Component } from 'react';
import './index.scss';

export default class Whiteboard extends Component {
  renderWhiteboard(draws, time) {
    const whiteboard = draws.map(draw => {
      const {
        shape,
        style,
        timestamp,
      } = draw;

      const visible = timestamp < time;
      if (!visible) return null;

      const {
        data,
        type,
      } = shape;

      switch (type) {
        case 'polyline':
          return <polyline
            style={style}
            points={data.points}
          />;
        case 'line':
          return <line
            style={style}
            x1={data.x1}
            y1={data.y1}
            x2={data.x2}
            y2={data.y2}
          />;
        case 'polygon':
          return <polygon
            style={style}
            points={data.points}
          />;
        default:
          return null;
      }
    });

    return whiteboard;
  }

  render() {
    const {
      canvases,
      id,
      time,
    } = this.props;

    const current = canvases.find(canvas => id === canvas.id);
    if (!current) return null;

    const { draws } = current;

    return (
      <g>
        {this.renderWhiteboard(draws, time)}
      </g>
    );
  }
}
