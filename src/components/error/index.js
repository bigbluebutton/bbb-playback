import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import {
  ERROR,
  ID,
} from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'error.wrapper.aria',
    description: 'Aria label for the error wrapper',
  },
  badRequestTitle: {
    id: 'error.badRequest.title',
    description: 'Title for an invalid recording link',
  },
  badRequestDescription: {
    id: 'error.badRequest.description',
    description: 'Description for an invalid recording link',
  },
  notFoundTitle: {
    id: 'error.notFound.title',
    description: 'Title for a missing recording',
  },
  notFoundDescription: {
    id: 'error.notFound.description',
    description: 'Description for a missing recording',
  },
  defaultTitle: {
    id: 'error.default.title',
    description: 'Title for an unexpected error',
  },
  defaultDescription: {
    id: 'error.default.description',
    description: 'Description for an unexpected error',
  },
  retry: {
    id: 'error.retry',
    description: 'Label for the retry button',
  },
});

const getMessages = (code) => {
  switch (code) {
    case ERROR.BAD_REQUEST:
      return {
        title: intlMessages.badRequestTitle,
        description: intlMessages.badRequestDescription,
        retry: false,
      };
    case ERROR.NOT_FOUND:
      return {
        title: intlMessages.notFoundTitle,
        description: intlMessages.notFoundDescription,
        retry: true,
      };
    default:
      return {
        title: intlMessages.defaultTitle,
        description: intlMessages.defaultDescription,
        retry: true,
      };
  }
};

const Error = ({ code }) => {
  const intl = useIntl();
  const {
    title,
    description,
    retry,
  } = getMessages(code);

  return (
    <main
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="error-wrapper"
      id={ID.ERROR}
    >
      <div
        className="error-content"
        role="alert"
      >
        <div className="error-code">
          {code}
        </div>
        <h1 className="error-title">
          {intl.formatMessage(title)}
        </h1>
        <p className="error-description">
          {intl.formatMessage(description)}
        </p>
        {retry ? (
          <button
            className="error-retry"
            onClick={() => window.location.reload()}
            type="button"
          >
            {intl.formatMessage(intlMessages.retry)}
          </button>
        ) : null}
      </div>
    </main>
  );
};

export default Error;
