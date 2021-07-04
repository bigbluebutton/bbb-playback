import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
  question: {
    id: 'player.chat.message.poll.question',
    description: 'Label for the poll message question',
  },
});

const propTypes = { question: PropTypes.string };

const defaultProps = { question: '' };

const Question = ({ question }) => {
  const intl = useIntl();

  if (isEmpty(question)) return null;

  return (
    <div className="poll-question">
      <div className="poll-label">
        {intl.formatMessage(intlMessages.question)}
      </div>
      {question}
    </div>
  );
};

Question.propTypes = propTypes;
Question.defaultProps = defaultProps;

export default Question;
