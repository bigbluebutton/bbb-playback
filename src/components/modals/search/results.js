import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { buildFileURL } from 'utils/data';
import { formatTime } from 'utils/format';
import getExcerpt from './excerpt';

const intlMessages = defineMessages({
  slide: {
    id: 'player.search.modal.slide',
    description: 'Label of a slide in the search results',
  },
});

const Results = ({
  onSelect,
  query,
  results,
}) => {
  const intl = useIntl();

  return (
    <ul className="search-results">
      {results.map(({ index, item }) => {
        const excerpt = getExcerpt(item.alt, query);

        return (
          <li key={`${index}-${item.timestamp}`}>
            <button
              className="search-result"
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="search-result-image">
                <img
                  alt=""
                  decoding="async"
                  loading="lazy"
                  src={buildFileURL(item.src)}
                />
              </span>
              <span className="search-result-meta">
                <span className="search-result-slide">
                  {intl.formatMessage(intlMessages.slide, { number: index + 1 })}
                </span>
                <bdi className="search-result-time">{formatTime(item.timestamp)}</bdi>
              </span>
              {excerpt ? (
                <span
                  className="search-result-text"
                  dir="auto"
                >
                  {excerpt.before}
                  <mark>{excerpt.match}</mark>
                  {excerpt.after}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default Results;
