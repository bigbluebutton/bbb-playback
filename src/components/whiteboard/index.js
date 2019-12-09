import React, { Component } from 'react';
import './index.scss';

export default class Whiteboard extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="whiteboard-wrapper">
        <span>{this.props.time}</span>
      </div>
    );
  }
}