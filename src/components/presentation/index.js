import React, { Component } from 'react';
import './index.scss';

export default class Presentation extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="presentation-wrapper">
        <span>{this.props.time}</span>
      </div>
    );
  }
}
