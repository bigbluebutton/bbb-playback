import React, { Component } from 'react';
import './index.scss';

export default class Slide extends Component {
  constructor(props) {
    super(props);

    const { metadata, slides } = props;
    this.url = `/presentation/${metadata.id}`;
    this.xlink = slides[0].xlink;
  }

  getAlt(xlink) {
    const { alternates } = this.props;

    let result = '';
    const found = alternates.find(alt => xlink === alt.xlink);
    if (found) result = found.text;

    return result;
  }

  render() {
    return (
      <image
        className="slide-wrapper"
        xlinkHref={`${this.url}/${this.xlink}`}
        alt={this.getAlt(this.xlink)}
      />
    );
  }
}
