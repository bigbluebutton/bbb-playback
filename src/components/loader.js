import React, { Component } from 'react';
import Error from './error';
import Player from './player';

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
      media: false,
      captions: false
    };

    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.fetchShapes = this.fetchShapes.bind(this);
    this.fetchPanzooms = this.fetchPanzooms.bind(this);
    this.fetchCursor = this.fetchCursor.bind(this);
    this.fetchScreenshare = this.fetchScreenshare.bind(this);
    this.fetchChat = this.fetchChat.bind(this);
    this.fetchCaptions = this.fetchCaptions.bind(this);
    this.fetchText = this.fetchText.bind(this);
    this.fetchMedia = this.fetchMedia.bind(this);
  }

  componentDidMount() {
    if (!this.recordId) return;
    // TODO: Refactor this nonsense
    this.fetchMetadata();
    this.fetchShapes();
    this.fetchPanzooms();
    this.fetchCursor();
    this.fetchScreenshare();
    this.fetchChat();
    this.fetchCaptions();
    this.fetchText();
    this.fetchMedia();
  }

  fetchMetadata() {
    const url = `/presentation/${this.recordId}/metadata.xml`;
    fetch(url).then(response => {
      if (response.ok) {
        this.metadata = response.text();
        this.setState({ metadata: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchShapes() {
    const url = `/presentation/${this.recordId}/shapes.svg`;
    fetch(url).then(response => {
      if (response.ok) {
        this.shapes = response.text();
        this.setState({ shapes: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchPanzooms() {
    const url = `/presentation/${this.recordId}/panzooms.xml`;
    fetch(url).then(response => {
      if (response.ok) {
        this.panzooms = response.text();
        this.setState({ panzooms: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchCursor() {
    const url = `/presentation/${this.recordId}/cursor.xml`;
    fetch(url).then(response => {
      if (response.ok) {
        this.cursor = response.text();
        this.setState({ cursor: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchScreenshare() {
    const url = `/presentation/${this.recordId}/deskshare.xml`;
    fetch(url).then(response => {
      if (response.ok) {
        this.screenshare = response.text();
        this.setState({ screenshare: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchChat() {
    const url = `/presentation/${this.recordId}/slides_new.xml`;
    fetch(url).then(response => {
      if (response.ok) {
        this.chat = response.text();
        this.setState({ chat: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchCaptions() {
    const url = `/presentation/${this.recordId}/captions.json`;
    fetch(url).then(response => {
      if (response.ok) {
        this.captions = response.json();
        this.setState({ captions: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchText() {
    const url = `/presentation/${this.recordId}/presentation_text.json`;
    fetch(url).then(response => {
      if (response.ok) {
        this.text = response.json();
        this.setState({ text: true });
      } else {
        this.setState({ error: response.status });
      }
    });
  }

  fetchMedia() {
    const medias = ['webm', 'mp4'];

    const fetches = medias.map(type => {
      const url = `/presentation/${this.recordId}/video/webcams.${type}`;
      return fetch(url, { method: 'HEAD' });
    });

    Promise.all(fetches).then(responses => {
      let media;
      responses.forEach(response => {
        const { ok, url } = response;
        if (ok) {
          media = medias.find(type => url.endsWith(type));
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

    if (error) return <Error code={error} />;

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

    if (loaded) return <Player />;

    return (
      <div>
        Loading
      </div>
    );
  }
}

