import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'error.wrapper.aria',
    description: 'Aria label for the error wrapper',
  },
});

const Error = ({ code }) => {
  const intl = useIntl();

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="error-wrapper"
      id={ID.ERROR}
    >
      <div className="error-code">
        {code}
      </div>
    </div>
  );
};

export default Error;
