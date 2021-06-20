import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { ID } from 'utils/data';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const Search = ({ enabled, toggleSearch }) => {
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

export default Search;
