import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
  answer: {
    id: 'player.chat.message.question.answer',
    description: 'Label for the question message answer',
  },
});

const propTypes = { answer: PropTypes.string };

const defaultProps = { answer: '' };

const Answer = ({ answer }) => {
  const intl = useIntl();

  if (isEmpty(answer)) return null;

  return (
    <div className="question-answer">
      <div className="question-label">
        {intl.formatMessage(intlMessages.answer)}
      </div>
      {answer}
    </div>
  );
};

Answer.propTypes = propTypes;
Answer.defaultProps = defaultProps;

export default Answer;
