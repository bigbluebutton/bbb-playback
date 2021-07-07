import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
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
});

const Header = () => {
  const intl = useIntl();

  return (
    <div className="search-header">
      <div className="title">
        {intl.formatMessage(intlMessages.title)}
      </div>
      <div className="subtitle">
        {intl.formatMessage(intlMessages.subtitle)}
      </div>
    </div>
  );
};

export default Header;
