import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Icon from 'components/utils/icon';
import Modal from 'components/utils/modal';
import { search as config } from 'config';
import { search as getSearch } from 'utils/actions';
import { getThumbnailItems } from 'components/thumbnails/utils';
import { ID } from 'utils/constants';
import player from 'utils/player';
import Results from './results';
import './index.scss';

const intlMessages = defineMessages({
  title: {
    id: 'player.search.modal.title',
    description: 'Label for the search modal title',
  },
  subtitle: {
    id: 'player.search.modal.subtitle',
    description: 'Label for the search modal subtitle',
  },
  placeholder: {
    id: 'player.search.modal.placeholder',
    description: 'Placeholder of the search input',
  },
  clear: {
    id: 'button.clear.aria',
    description: 'Aria label for the clear button',
  },
  hint: {
    id: 'player.search.modal.hint',
    description: 'Shown until the query is long enough',
  },
  count: {
    id: 'player.search.modal.count',
    description: 'Number of slides found',
  },
  empty: {
    id: 'player.search.modal.empty',
    description: 'Shown when no slide matches',
  },
  cancel: {
    id: 'player.search.modal.cancel',
    description: 'Label of the cancel button',
  },
  show: {
    id: 'player.search.modal.show',
    description: 'Label of the button that filters the thumbnails',
  },
});

const propTypes = {
  handleClose: PropTypes.func,
  handleSearch: PropTypes.func,
};

const defaultProps = {
  handleClose: () => {},
  handleSearch: () => {},
};

const Search = ({
  handleClose,
  handleSearch,
}) => {
  const intl = useIntl();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const valid = trimmed.length >= config.length.min;

  const items = useMemo(getThumbnailItems, []);

  // Indexes match the filmstrip, so "Show in filmstrip" keeps the right ones
  const indexes = useMemo(() => {
    if (!valid) return [];

    return getSearch(trimmed, items).filter(index => items[index].src !== ID.SCREENSHARE);
  }, [items, trimmed, valid]);

  const results = indexes.map(index => ({ index, item: items[index] }));
  const found = results.length > 0;

  const showInFilmstrip = () => {
    if (!found) return;

    handleSearch(indexes);
    handleClose();
  };

  const jumpTo = (item) => {
    if (player.primary) player.primary.currentTime(item.timestamp);
    handleClose();
  };

  let status;
  if (!valid) {
    status = intl.formatMessage(intlMessages.hint, { min: config.length.min });
  } else if (found) {
    status = intl.formatMessage(intlMessages.count, { count: results.length });
  } else {
    status = intl.formatMessage(intlMessages.empty, { query: trimmed });
  }

  return (
    <Modal
      className="search-modal"
      onClose={handleClose}
      title={(
        <>
          <span className="search-title-icon"><Icon name="search" /></span>
          {intl.formatMessage(intlMessages.title)}
        </>
      )}
    >
      <p className="search-subtitle">
        {intl.formatMessage(intlMessages.subtitle)}
      </p>
      <div className="search-field">
        <span className="search-field-icon"><Icon name="search" /></span>
        <input
          aria-label={intl.formatMessage(intlMessages.subtitle)}
          maxLength={config.length.max}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') showInFilmstrip();
          }}
          placeholder={intl.formatMessage(intlMessages.placeholder)}
          type="text"
          value={query}
        />
        {query ? (
          <button
            aria-label={intl.formatMessage(intlMessages.clear)}
            className="search-field-clear"
            onClick={() => setQuery('')}
            type="button"
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>
      <div
        aria-live="polite"
        className={found ? 'search-status found' : 'search-status'}
        role="status"
      >
        {status}
      </div>
      {found ? (
        <Results
          onSelect={jumpTo}
          query={trimmed}
          results={results}
        />
      ) : (
        <div
          aria-hidden="true"
          className="search-empty"
        >
          <span className="search-empty-icon"><Icon name="search" /></span>
        </div>
      )}
      <div className="search-footer">
        <button
          className="search-button secondary"
          onClick={handleClose}
          type="button"
        >
          {intl.formatMessage(intlMessages.cancel)}
        </button>
        <button
          className="search-button primary"
          disabled={!found}
          onClick={showInFilmstrip}
          type="button"
        >
          {intl.formatMessage(intlMessages.show)}
          {found ? <span className="search-button-count">{results.length}</span> : null}
        </button>
      </div>
    </Modal>
  );
};

Search.propTypes = propTypes;
Search.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(Search, areEqual);
