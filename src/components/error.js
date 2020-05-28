import React from 'react';
import { defineMessages } from 'react-intl';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'error.wrapper.aria',
    description: 'Aria label for the error wrapper',
  },
});

export default function Error(props) {
  const {
    code,
    intl,
  } = props;

  const id = 'error';

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="error-wrapper"
      id={id}
    >
      <div className="error-code">
        {code}
      </div>
    </div>
  );
}
