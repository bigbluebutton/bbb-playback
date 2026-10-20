import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import {
  isBlank,
  parseVTT,
  toPlainText,
} from 'utils/captions/vtt';
import { EVENTS, ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';
import {
  buildTranscriptText,
  downloadFile,
  toFileName,
} from 'utils/export';
import { formatTime } from 'utils/format';
import logger from 'utils/logger';
import player from 'utils/player';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.transcript.wrapper.aria',
    description: 'Aria label for the transcript panel',
  },
  search: {
    id: 'player.transcript.search',
    description: 'Placeholder of the transcript search',
  },
  language: {
    id: 'player.transcript.language',
    description: 'Label of the transcript language picker',
  },
  loading: {
    id: 'player.transcript.loading',
    description: 'Shown while the transcript loads',
  },
  failed: {
    id: 'player.transcript.failed',
    description: 'Shown when the transcript could not be loaded',
  },
  empty: {
    id: 'player.transcript.empty',
    description: 'Shown when no line matches the search',
  },
  download: {
    id: 'player.transcript.download',
    description: 'Button that downloads the transcript',
  },
});

// The viewer's language when available, otherwise the first one
const getInitialLocale = (captions, locale) => {
  const language = (locale || '').split('-')[0];
  const match = captions.find(caption => caption.locale.split(/[-_]/)[0] === language);

  return (match || captions[0]).locale;
};

// After the viewer scrolls the list, it waits this long before following
// playback again
const FOLLOW_PAUSE = 5000;

const findActive = (cues, time) => {
  for (let index = cues.length - 1; index >= 0; index--) {
    if (cues[index].start <= time) return time <= cues[index].end + 1 ? index : -1;
  }

  return -1;
};

const Highlight = ({ query, text }) => {
  if (!query) return text;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

const Transcript = () => {
  const intl = useIntl();
  const captions = storage.captions || [];
  const [locale, setLocale] = useState(() => getInitialLocale(captions, intl.locale));
  const [cues, setCues] = useState(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const list = useRef();
  // The viewer reading: pointer over the list, or a scroll, swipe or key
  // press in it in the last few seconds (touch screens have no hover)
  const hovering = useRef(false);
  const lastTouched = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setCues(null);
    setFailed(false);

    fetch(buildFileURL(`caption_${locale}.vtt`))
      .then(response => {
        if (!response.ok) throw new Error(`transcript ${response.status}`);

        return response.text();
      })
      .then(text => {
        // Words only: captions can carry word timings and styles
        if (!cancelled) {
          setCues(parseVTT(text)
            .map(cue => ({ ...cue, text: toPlainText(cue.text) }))
            .filter(cue => !isBlank(cue.text)));
        }
      })
      .catch(error => {
        logger.warn('transcript', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!cues) return undefined;

    const update = (time) => setActive(findActive(cues, time));
    if (player.primary) update(player.primary.currentTime());

    const handleTimeUpdate = (event) => update(event.detail.time);
    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);

    return () => document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
  }, [cues]);

  // Follows playback unless the viewer is reading elsewhere in the list
  useEffect(() => {
    const reading = hovering.current || Date.now() - lastTouched.current < FOLLOW_PAUSE;
    if (query || reading || active === -1 || !list.current) return;

    // Scrolls the list only, never the page around it
    const node = list.current.querySelector(`[data-index="${active}"]`);
    if (node) {
      const top = node.offsetTop - (list.current.clientHeight - node.offsetHeight) / 2;
      list.current.scrollTo({ behavior: 'smooth', top: Math.max(0, top) });
    }
  }, [active, query]);

  const lines = useMemo(() => {
    if (!cues) return [];

    const all = cues.map((cue, index) => ({ ...cue, index }));
    const trimmed = query.trim().toLowerCase();

    return trimmed ? all.filter(cue => cue.text.toLowerCase().includes(trimmed)) : all;
  }, [cues, query]);

  const touched = () => {
    lastTouched.current = Date.now();
  };

  const jump = (time) => {
    if (player.primary) player.primary.currentTime(time);
  };

  const download = () => {
    const { name } = storage.metadata || {};
    const language = (captions.find(caption => caption.locale === locale) || {}).locale || locale;

    downloadFile(
      toFileName(`${name || 'transcript'} (${language})`, 'txt'),
      buildTranscriptText({ cues, title: name || '' }),
    );
  };

  let body;
  if (failed) {
    body = <p className="transcript-message">{intl.formatMessage(intlMessages.failed)}</p>;
  } else if (!cues) {
    body = <p className="transcript-message">{intl.formatMessage(intlMessages.loading)}</p>;
  } else if (lines.length === 0) {
    body = <p className="transcript-message">{intl.formatMessage(intlMessages.empty, { query: query.trim() })}</p>;
  } else {
    body = (
      <ol
        className="transcript-lines"
        onKeyDown={touched}
        onMouseEnter={() => { hovering.current = true; }}
        onMouseLeave={() => { hovering.current = false; }}
        onTouchStart={touched}
        onWheel={touched}
        ref={list}
      >
        {lines.map(cue => (
          <li key={cue.index}>
            <button
              aria-current={cue.index === active ? 'true' : undefined}
              className={cx('transcript-line', { active: cue.index === active })}
              data-index={cue.index}
              onClick={() => jump(cue.start)}
              type="button"
            >
              <bdi className="transcript-time">{formatTime(cue.start)}</bdi>
              <span className="transcript-text" dir="auto">
                <Highlight query={query.trim()} text={cue.text} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      role="region"
      className="transcript-wrapper"
      id={ID.TRANSCRIPT}
    >
      <div className="transcript-tools">
        <div className="transcript-search">
          <Icon name="search" />
          <input
            aria-label={intl.formatMessage(intlMessages.search)}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={intl.formatMessage(intlMessages.search)}
            type="search"
            value={query}
          />
        </div>
        {captions.length > 1 ? (
          <select
            aria-label={intl.formatMessage(intlMessages.language)}
            className="transcript-language"
            onChange={(event) => setLocale(event.target.value)}
            value={locale}
          >
            {captions.map(caption => (
              <option key={caption.locale} value={caption.locale}>{caption.localeName}</option>
            ))}
          </select>
        ) : null}
        {cues && cues.length > 0 ? (
          <button
            aria-label={intl.formatMessage(intlMessages.download)}
            className="transcript-download"
            onClick={download}
            title={intl.formatMessage(intlMessages.download)}
            type="button"
          >
            <Icon name="download" />
          </button>
        ) : null}
      </div>
      {body}
    </div>
  );
};

export default Transcript;
