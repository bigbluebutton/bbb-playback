import React, { Component } from 'react';
import Error from './error';
import Player from './player';

const METADATA = 'metadata.xml';
const SHAPES = 'shapes.svg';
const PANZOOMS = 'panzooms.xml';
const CURSOR = 'cursor.xml';
const TEXT = 'presentation_text.json';
const CHAT = 'slides_new.xml';
const SCREENSHARE = 'deskshare.xml';
const CAPTIONS = 'captions.json';

const FILES = [
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  TEXT,
  CHAT,
  SCREENSHARE,
  CAPTIONS
];

const MEDIAS = [
  'webm',
  'mp4'
];

const DATA = {
  xml: 'text',
  svg: 'text',
  json: 'json'
};

const getRecordId = match => {
  if (match) {
    const { params } = match;
    if (params && params.recordId) {
      const { recordId } = params;
      const regex = /^[a-z0-9]{40}-[0-9]{13}$/;
      if (recordId.match(regex)) {
        return recordId;
      }
    }
  }
  return null;
};

export default class Loader extends Component {
  constructor(props) {
    super(props);

    const { match } = props;
    this.recordId = getRecordId(match);

    this.state = {
      error: this.recordId ? null : 404,
      metadata: false,
      shapes: false,
      panzooms: false,
      cursor: false,
      text: false,
      chat: false,
      screenshare: false,
      captions: false,
      media: false
    };

    this.fetchFile = this.fetchFile.bind(this);
    this.fetchMedia = this.fetchMedia.bind(this);
  }

  componentDidMount() {
    if (!this.recordId) return;

    FILES.forEach(filename => this.fetchFile(this.recordId, filename));
    this.fetchMedia();
  }

  fetchFile(recordId, filename) {
    const type = DATA[filename.split('.').pop()];
    const url = `/presentation/${recordId}/${filename}`;

    fetch(url).then(response => {
      if (response.ok) {
        switch (type) {
          case 'text':
            return response.text();
          case 'json':
            return response.json();
          default:
            this.setState({ error: 400 });
            throw Error(filename);
        }
      } else {
        this.setState({ error: response.status });
        throw Error(response.statusText);
      }
    }).then(value => {
      switch (filename) {
        case METADATA:
          this.metadata = value;
          this.setState({ metadata: true });
          break;
        case SHAPES:
          this.shapes = value;
          this.setState({ shapes: true });
          break;
        case PANZOOMS:
          this.panzooms = value;
          this.setState({ panzooms: true });
          break;
        case CURSOR:
          this.cursor = value;
          this.setState({ cursor: true });
          break;
        case TEXT:
          this.text = value;
          this.setState({ text: true });
          break;
        case CHAT:
          this.chat = value;
          this.setState({ chat: true });
          break;
        case SCREENSHARE:
          this.screenshare = value;
          this.setState({ screenshare: true });
          break;
        case CAPTIONS:
          this.captions = value;
          this.setState({ captions: true });
          break;
        default:
          this.setState({ error: 400 });
          throw Error(filename);
      }
    }).catch(error => console.log(error));
  }

  fetchMedia() {
    const fetches = MEDIAS.map(type => {
      const url = `/presentation/${this.recordId}/video/webcams.${type}`;
      return fetch(url, { method: 'HEAD' });
    });

    Promise.all(fetches).then(responses => {
      let media;
      responses.forEach(response => {
        const { ok, url } = response;
        if (ok) {
          media = MEDIAS.find(type => url.endsWith(type));
        }
      });

      if (media) {
        this.media = media;
        this.setState({ media: true });
      } else {
        this.setState({ error: 404 });
      }
    });
  }

  render() {
    const {
      error,
      metadata,
      shapes,
      panzooms,
      cursor,
      text,
      chat,
      screenshare,
      media,
      captions
    } = this.state;

    if (error) {
      return <Error code={error} />;
    }

    const loaded =
      metadata &&
      shapes &&
      panzooms &&
      cursor &&
      text &&
      chat &&
      screenshare &&
      media &&
      captions;

    if (loaded) {
      return <Player
        recordId={this.recordId}
        metadata={this.metadata}
        shapes={this.shapes}
        panzooms={this.panzooms}
        cursor={this.cursor}
        text={this.text}
        chat={this.chat}
        screenshare={this.screenshare}
        media={this.media}
        captions={this.captions}
      />;
    }

    return (
      <div>
        Loading
      </div>
    );
  }
}

