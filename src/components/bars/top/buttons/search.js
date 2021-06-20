import React from 'react';
import { defineMessages } from 'react-intl';
import Button from 'components/utils/button';
import { ID } from 'utils/data';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const Search = ({ intl, enabled, toggleSearch }) => {
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

export default Search;
