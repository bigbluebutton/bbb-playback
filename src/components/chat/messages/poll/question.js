import React from 'react';
import { defineMessages } from 'react-intl';
import './index.scss';

const intlMessages = defineMessages({
  question: {
    id: 'player.chat.message.poll.question',
    description: 'Label for the poll message question',
  },
});

const Question = ({ intl, question }) => {
  if (question.length === 0) return null;

  return (
    <div className="poll-question">
      <div className="poll-label">
        {intl.formatMessage(intlMessages.question)}
      </div>
      {question}
    </div>
  );
};

export default Question;
