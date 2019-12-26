import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="slide-wrapper">
        <span>SLIDE</span>
      </div>
    );
  }
}
