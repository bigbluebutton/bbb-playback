import React, { Component } from 'react';
import {
  defineMessages,
  injectIntl,
} from 'react-intl';
import Error from './error';
import Player from './player';
import { build } from 'utils/builder';
import {
  ERROR,
  FILES,
  MEDIAS,
  getFileIndex,
  getFileType,
  getRecordId,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'loader.wrapper.aria',
    description: 'Aria label for the loader wrapper',
  },
});

class Loader extends Component {
  constructor(props) {
    super(props);

    const { match } = props;

    this.id = 'loader';
    this.counter = 0;
    this.data = {};
    this.recordId = getRecordId(match);

    this.state = {
      error: this.recordId ? null : ERROR['NOT_FOUND'],
      loaded: false,
    };
  }

  componentDidMount() {
    if (!this.recordId) return;

    FILES.forEach(filename => this.fetchFile(this.recordId, filename));
    this.fetchMedia();
  }

  fetchFile(recordId, filename) {
    const url = `/presentation/${recordId}/${filename}`;
    fetch(url).then(response => {
      if (response.ok) {
        const fileType = getFileType(filename);
        switch (fileType) {
          case 'json':
            return response.json();
          case 'text':
            return response.text();
          default:
            this.setState({ error: ERROR['BAD_REQUEST'] });
            throw Error(filename);
        }
      } else {
        this.setState({ error: response.status });
        throw Error(response.statusText);
      }
    }).then(value => {
      build(filename, value).then(data => {
        this.data[getFileIndex(filename)] = data;
        this.update();
      }).catch(error => this.setState({ error: ERROR['BAD_REQUEST'] }));
    }).catch(error => this.setState({ error: ERROR['NOT_FOUND'] }));
  }

  fetchMedia() {
    const fetches = MEDIAS.map(type => {
      const url = `/presentation/${this.recordId}/video/webcams.${type}`;
      return fetch(url, { method: 'HEAD' });
    });

    Promise.all(fetches).then(responses => {
      const media = [];
      responses.forEach(response => {
        const { ok, url } = response;
        if (ok) {
          media.push(MEDIAS.find(type => url.endsWith(type)));
        }
      });

      if (media.length > 0) {
        this.data.media = media;
        this.update();
      } else {
        // TODO: Handle audio medias
        this.setState({ error: ERROR['NOT_FOUND'] });
      }
    });
  }

  update() {
    this.counter = this.counter + 1;
    // FILES + MEDIAS
    if (this.counter > FILES.length) {
      const { loaded } = this.state;
      if (!loaded) this.setState({ loaded: true });
    }
  }

  render() {
    const { intl } = this.props;

    const {
      error,
      loaded,
    } = this.state;

    if (error) {
      return (
        <Error
          code={error}
          intl={intl}
        />
      );
    }

    if (loaded) {
      return (
        <Player
          data={this.data}
          intl={intl}
        />
      );
    }

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="loader-wrapper"
        id={this.id}
      >
        <div className="loading-dots">
          <div className="first" />
          <div className="second" />
          <div className="third" />
        </div>
      </div>
    );
  }
}

export default injectIntl(Loader);
