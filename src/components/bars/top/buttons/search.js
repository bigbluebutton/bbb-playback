import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { controls as config } from 'config';
import { ID } from 'utils/constants';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const propTypes = { openSearch: PropTypes.func };

const defaultProps = { openSearch: () => {} };

const Search = ({ openSearch }) => {
  const intl = useIntl();

  if (!layout.control || !config.search || layout.single) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.search)}
      circle
      handleOnClick={openSearch}
      icon={ID.SEARCH}
    />
  );
};

Search.propTypes = propTypes;
Search.defaultProps = defaultProps;

export default Search;
