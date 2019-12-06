import React, { Component } from 'react';
import Video from './video';

export default class Player extends Component {
  constructor(props) {
    super(props);

    const {
      recordId,
      media,
      captions
    } = props;

    const sources = [{
        src: `/presentation/${recordId}/video/webcams.mp4`,
        type: 'video/mp4'
      }, {
        src: `/presentation/${recordId}/video/webcams.webm`,
        type: 'video/webm'
      }
    ];

    const source = sources.filter(src => {
      const { type } = src;
      return type.includes(media);
    });

    const tracks = captions.map(lang => {
      const { locale, localeName } = lang;
      const src = `/presentation/${recordId}/caption_${locale}.vtt`;
      return { kind: 'captions', src, srclang: locale, label: localeName };
    });

    this.videoJsOptions = {
      controls: true,
      sources: source,
      tracks: tracks,
      fluid: true
    };

    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  handleTimeUpdate(time) {
    console.log(time);
  }

  render() {
    return (
      <div>
        <Video
          onTimeUpdate={this.handleTimeUpdate}
          { ...this.videoJsOptions }
        />
      </div>
    );
  }
}