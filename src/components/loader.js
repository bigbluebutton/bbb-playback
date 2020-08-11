import React, { PureComponent } from 'react';
import {
  defineMessages,
  injectIntl,
} from 'react-intl';
import config from 'config';
import Error from './error';
import Player from './player';
import { build } from 'utils/builder';
import {
  ID,
  buildFileURL,
  getFileName,
  getFileType,
  getLayout,
  getRecordId,
  getTime,
} from 'utils/data';
import logger from 'utils/logger';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'loader.wrapper.aria',
    description: 'Aria label for the loader wrapper',
  },
});

class Loader extends PureComponent {
  constructor(props) {
    super(props);

    const {
      location,
      match,
    } = props;

    this.counter = 0;
    this.data = {};
    this.layout = getLayout(location);
    this.recordId = getRecordId(match);
    this.time = getTime(location);

    this.state = {
      error: this.recordId ? null : config.error['NOT_FOUND'],
      loaded: false,
    };
  }

  componentDidMount() {
    if (!this.recordId) return;

    const { data } = config.files;

    for (const file in data) {
      this.fetchFile(this.recordId, data[file]);
    }

    this.fetchMedia();
  }

  fetchFile(recordId, file) {
    const url = buildFileURL(recordId, file);
    fetch(url).then(response => {
      if (response.ok) {
        logger.debug(ID.LOADER, file, response);
        const fileType = getFileType(file);
        switch (fileType) {
          case 'json':
            return response.json();
          case 'text':
            return response.text();
          default:
            this.setState({ error: config.error['BAD_REQUEST'] });
            throw Error(file);
        }
      } else {
        logger.warn('loader', file, response);
        return null;
      }
    }).then(value => {
      build(file, value).then(data => {
        if (data) logger.debug(ID.LOADER, 'builded', file);
        this.data[getFileName(file)] = data;
        this.update();
      }).catch(error => this.setState({ error: config.error['BAD_REQUEST'] }));
    }).catch(error => this.setState({ error: config.error['NOT_FOUND'] }));
  }

  fetchMedia() {
    const fetches = config.medias.map(type => {
      const url = buildFileURL(this.recordId, `video/webcams.${type}`);
      return fetch(url, { method: 'HEAD' });
    });

    Promise.all(fetches).then(responses => {
      const media = [];
      responses.forEach(response => {
        const { ok, url } = response;
        if (ok) {
          logger.debug(ID.LOADER, 'media', response);
          media.push(config.medias.find(type => url.endsWith(type)));
        }
      });

      if (media.length > 0) {
        this.data.media = media;
        this.update();
      } else {
        // TODO: Handle audio medias
        this.setState({ error: config.error['NOT_FOUND'] });
      }
    });
  }

  update() {
    this.counter = this.counter + 1;
    // TODO: Better control
    if (this.counter > Object.keys(config.files.data).length) {
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
          layout={this.layout}
          time={this.time}
        />
      );
    }

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="loader-wrapper"
        id={ID.LOADER}
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
