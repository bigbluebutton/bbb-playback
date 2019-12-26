import React, { Component } from 'react';
import Error from './error';
import Player from './player';
import { build } from '../util/builder';
import {
  METADATA,
  SHAPES,
  PANZOOMS,
  CURSOR,
  TEXT,
  CHAT,
  SCREENSHARE,
  CAPTIONS,
  MEDIAS,
  getType
} from '../util/data';
import './index.scss';


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
    this.data = {};
    this.counter = 0;

    this.state = {
      error: this.recordId ? null : 404,
      loaded: false
    };
  }

  componentDidMount() {
    if (!this.recordId) return;

    FILES.forEach(filename => this.fetchFile(this.recordId, filename));
    this.fetchMedia();
  }

  fetchFile(recordId, filename) {
    const type = getType(filename);
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
      build(filename, value).then(data => {
        switch (filename) {
          case METADATA:
            this.data.metadata = data;
            break;
          case SHAPES:
            this.data.shapes = data;
            break;
          case PANZOOMS:
            this.data.panzooms = data;
            break;
          case CURSOR:
            this.data.cursor = data;
            break;
          case TEXT:
            this.data.text = data;
            break;
          case CHAT:
            this.data.chat = data;
            break;
          case SCREENSHARE:
            this.data.screenshare = data;
            break;
          case CAPTIONS:
            this.data.captions = data;
            break;
          default:
            this.setState({ error: 400 });
            throw Error(filename);
        }
        this.update();
      }).catch(error => console.log(error));
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

      // TODO: Work with more than one media
      if (media) {
        this.data.media = media;
        this.update();
      } else {
        this.setState({ error: 404 });
      }
    });
  }

  update() {
    this.counter = this.counter + 1;
    if (this.counter === FILES.length + 1) {
      this.setState({ loaded: true });
    }
  }

  render() {
    const {
      error,
      loaded
    } = this.state;

    if (error) return <Error code={error} />;

    if (loaded) return <Player data={this.data} />;

    return (
      <div className="loader-wrapper">
        Loading
      </div>
    );
  }
}
