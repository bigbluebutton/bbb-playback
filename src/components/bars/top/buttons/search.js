import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { ID } from 'utils/constants';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const propTypes = {
  enabled: PropTypes.bool,
  toggleSearch: PropTypes.func,
};

const defaultProps = {
  enabled: false,
  toggleSearch: () => {},
};

const Search = ({
  enabled,
  toggleSearch,
}) => {
  const intl = useIntl();

  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.search)}
      circle
      handleOnClick={toggleSearch}
      icon={ID.SEARCH}
    />
  );
};

Search.propTypes = propTypes;
Search.defaultProps = defaultProps;

export default Search;
