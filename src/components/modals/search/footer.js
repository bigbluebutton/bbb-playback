import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const Footer = ({ disabled, handleOnClick }) => {
  const intl = useIntl();

  return (
    <div className="search-footer">
      <Button
        aria={intl.formatMessage(intlMessages.search)}
        disabled={disabled}
        handleOnClick={(event) => handleOnClick(event)}
        icon="search"
        type="solid"
      />
    </div>
  );
};

export default Footer;
